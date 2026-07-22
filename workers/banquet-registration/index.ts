/// <reference path="./worker-configuration.d.ts" />

import type Stripe from 'stripe';
import { BoardAccessError, verifyBoardAccess } from './access';
import { checkCheckoutRateLimit } from './abuse';
import { buildBoardExport, parsePaidOnly, type BoardExportType } from './export';
import {
  attachCheckoutSession,
  CapacityUnavailableError,
  createPendingReservation,
  DuplicateWebhookError,
  getEventConfig,
  getReservation,
  getReservationByPaymentIntent,
  getStoredWebhookIdentity,
  markCheckoutFailed,
  recordCanceledPaymentWebhook,
  recordDisputeWebhook,
  recordExpiredWebhook,
  recordFailedPaymentWebhook,
  recordIgnoredWebhook,
  recordPaidWebhook,
  recordRefundWebhook,
  recordWebhookReview,
} from './repository';
import { stripeDependencies } from './stripe';
import type { BanquetEnv, ReservationRow, WorkerDependencies } from './types';
import {
  readBoundedJson,
  readBoundedText,
  readEventId,
  RequestValidationError,
  validateRegistration,
} from './validation';

const CHECKOUT_PATH = '/api/banquet/checkout';
const WEBHOOK_PATH = '/api/webhooks/stripe';
const BOARD_EXPORT_PATHS = new Map<string, BoardExportType>([
  ['/api/banquet/exports/registrations.csv', 'registrations'],
  ['/api/banquet/exports/seating-plan.csv', 'seating-plan'],
]);
const MAX_WEBHOOK_BYTES = 65_536;

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

const json = (body: Record<string, unknown>, status = 200, headers?: HeadersInit) => Response.json(body, {
  status,
  headers: { ...responseHeaders, ...headers },
});

const workerDependencies: WorkerDependencies = {
  ...stripeDependencies,
  checkCheckoutRateLimit,
  verifyBoardAccess,
};

interface RequestContext {
  requestId: string;
  path: string;
  startedAt: number;
}

type LogFields = Record<string, string | number | boolean | null>;

const logEvent = (
  level: 'info' | 'warn' | 'error',
  event: string,
  context: RequestContext,
  fields: LogFields = {},
) => {
  const entry = {
    service: 'banquet-registration-preview',
    event,
    requestId: context.requestId,
    path: context.path,
    ...fields,
  };
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
};

const finalizeApiResponse = (response: Response, request: Request, context: RequestContext) => {
  const headers = new Headers(response.headers);
  headers.set('X-Request-ID', context.requestId);
  const durationMs = Math.max(0, Math.round(performance.now() - context.startedAt));
  const fields = {
    method: request.method,
    status: response.status,
    durationMs,
  };
  const level = response.status >= 500 ? 'error' : response.status >= 400 ? 'warn' : 'info';
  logEvent(level, 'api_request_complete', context, fields);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const methodNotAllowed = (allow = 'POST') => json({ error: 'method_not_allowed' }, 405, { Allow: allow });

const assertPreviewRuntime = (env: BanquetEnv) => {
  if (
    env.ENVIRONMENT !== 'local-preview'
    || typeof env.STRIPE_SECRET_KEY !== 'string'
    || !env.STRIPE_SECRET_KEY.startsWith('sk_test_')
    || typeof env.STRIPE_WEBHOOK_SECRET !== 'string'
    || !env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')
  ) {
    throw new RequestValidationError('preview_runtime_not_configured', 503);
  }
};

const assertCheckoutOrigin = (request: Request, env: BanquetEnv) => {
  const origin = request.headers.get('origin');
  const allowedOrigins: readonly string[] = env.BANQUET_ALLOWED_ORIGINS;
  if (!origin || !allowedOrigins.includes(origin)) {
    throw new RequestValidationError('origin_not_allowed');
  }
};

async function handleBoardExport(
  request: Request,
  env: BanquetEnv,
  dependencies: WorkerDependencies,
  exportType: BoardExportType,
  context: RequestContext,
): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed('GET');
  if (env.ENVIRONMENT !== 'local-preview') {
    throw new RequestValidationError('preview_runtime_not_configured', 503);
  }

  const identity = await dependencies.verifyBoardAccess(request, env);
  let paidOnly: boolean;
  try {
    paidOnly = parsePaidOnly(new URL(request.url));
  } catch {
    throw new RequestValidationError('invalid_export_filter');
  }
  const { csv, rowCount } = await buildBoardExport(
    env.BANQUET_DB,
    identity,
    exportType,
    paidOnly,
  );
  logEvent('info', 'board_export_created', context, { exportType, paidOnly, rowCount });
  const filename = exportType === 'registrations' ? 'registrations.csv' : 'seating-plan.csv';
  return new Response(csv, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

async function handleCheckout(
  request: Request,
  env: BanquetEnv,
  dependencies: WorkerDependencies,
  context: RequestContext,
): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed();
  assertPreviewRuntime(env);
  assertCheckoutOrigin(request, env);
  if (!await dependencies.checkCheckoutRateLimit(env, request)) {
    logEvent('warn', 'checkout_rate_limited', context);
    return json({ error: 'rate_limited' }, 429, { 'Retry-After': '60' });
  }

  const rawPayload = await readBoundedJson(request);
  const eventId = readEventId(rawPayload);
  const event = await getEventConfig(env.BANQUET_DB, eventId);
  if (!event) throw new RequestValidationError('invalid_event_id');
  const registration = validateRegistration(rawPayload, event);

  let reservation;
  try {
    reservation = await createPendingReservation(env.BANQUET_DB, event, registration);
  } catch (error) {
    if (error instanceof CapacityUnavailableError) {
      return json({ error: 'capacity_unavailable' }, 409);
    }
    throw error;
  }

  try {
    const session = await dependencies.createCheckoutSession(env, event, reservation);
    await attachCheckoutSession(env.BANQUET_DB, reservation.id, session.id, session.expiresAt);
    logEvent('info', 'checkout_session_created', context, {
      eventId: event.id,
      reservationId: reservation.id,
      attendeeCount: reservation.attendeeCount,
    });
    return json({ reservationId: reservation.id, checkoutUrl: session.url }, 201);
  } catch (error) {
    await markCheckoutFailed(env.BANQUET_DB, reservation.id);
    logEvent('error', 'checkout_session_failed', context, {
      reservationId: reservation.id,
      errorType: error instanceof Error ? error.name : 'NonError',
    });
    return json({ error: 'checkout_unavailable' }, 502);
  }
}

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const paymentIntentId = (session: Stripe.Checkout.Session) => {
  if (typeof session.payment_intent === 'string') return session.payment_intent;
  return session.payment_intent?.id ?? null;
};

const reservationIdFromSession = (session: Stripe.Checkout.Session) => (
  session.metadata?.reservation_id ?? null
);

const eventIdFromSession = (session: Stripe.Checkout.Session) => (
  session.metadata?.event_id ?? null
);

async function reviewMismatch(
  env: BanquetEnv,
  stripeEvent: Stripe.Event,
  payloadSha256: string,
  session: Stripe.Checkout.Session,
  reservation: ReservationRow | null,
  reason: 'amount_mismatch' | 'currency_mismatch' | 'identity_mismatch' | 'payment_status_mismatch' | 'unknown_reservation',
  context: RequestContext,
): Promise<Response> {
  const record = {
    stripeEventId: stripeEvent.id,
    eventType: stripeEvent.type,
    reservationId: reservation?.id ?? null,
    payloadSha256,
    outcome: 'payment_review' as const,
    errorCode: reason,
  };
  await recordWebhookReview(
    env.BANQUET_DB,
    record,
    reason,
    reservation,
    reservation?.expected_total_cents ?? null,
    session.amount_total,
  );
  logEvent('warn', 'webhook_payment_review', context, {
    stripeEventId: stripeEvent.id,
    stripeEventType: stripeEvent.type,
    reservationId: reservation?.id ?? null,
    reason,
  });
  return json({ received: true, paymentReview: true });
}

async function reviewLifecycleMismatch(
  env: BanquetEnv,
  stripeEvent: Stripe.Event,
  payloadSha256: string,
  reservation: ReservationRow | null,
  reason: 'amount_mismatch' | 'currency_mismatch' | 'identity_mismatch' | 'unknown_reservation',
  actualAmountCents: number | null,
  context: RequestContext,
): Promise<Response> {
  await recordWebhookReview(
    env.BANQUET_DB,
    {
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      reservationId: reservation?.id ?? null,
      payloadSha256,
      outcome: 'payment_review',
      errorCode: reason,
    },
    reason,
    reservation,
    reservation?.amount_paid_cents ?? reservation?.expected_total_cents ?? null,
    actualAmountCents,
  );
  logEvent('warn', 'webhook_payment_lifecycle_review', context, {
    stripeEventId: stripeEvent.id,
    stripeEventType: stripeEvent.type,
    reservationId: reservation?.id ?? null,
    reason,
  });
  return json({ received: true, paymentReview: true });
}

async function handleCheckoutSessionEvent(
  env: BanquetEnv,
  stripeEvent: Stripe.Event,
  payloadSha256: string,
  session: Stripe.Checkout.Session,
  context: RequestContext,
): Promise<Response> {
  if (session.livemode) return json({ error: 'stripe_livemode_not_allowed' }, 400);

  const reservationId = reservationIdFromSession(session);
  const reservation = reservationId
    ? await getReservation(env.BANQUET_DB, reservationId)
    : null;

  if (!reservation) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, null, 'unknown_reservation', context);
  }

  if (
    session.client_reference_id !== reservation.id
    || reservationId !== reservation.id
    || eventIdFromSession(session) !== reservation.event_id
    || session.id !== reservation.stripe_checkout_session_id
  ) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'identity_mismatch', context);
  }

  const recordBase = {
    stripeEventId: stripeEvent.id,
    eventType: stripeEvent.type,
    reservationId: reservation.id,
    payloadSha256,
    errorCode: null,
  };

  if (stripeEvent.type === 'checkout.session.expired') {
    await recordExpiredWebhook(env.BANQUET_DB, { ...recordBase, outcome: 'applied' }, reservation, session.id);
    return json({ received: true });
  }

  if (session.amount_total !== reservation.expected_total_cents) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'amount_mismatch', context);
  }
  if (session.currency !== reservation.currency) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'currency_mismatch', context);
  }
  if (session.payment_status !== 'paid' || session.status !== 'complete') {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'payment_status_mismatch', context);
  }
  const intentId = paymentIntentId(session);
  if (!intentId) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'identity_mismatch', context);
  }

  await recordPaidWebhook(
    env.BANQUET_DB,
    { ...recordBase, outcome: 'applied' },
    reservation,
    session.id,
    intentId,
    session.amount_total,
  );
  logEvent('info', 'webhook_payment_applied', context, {
    stripeEventId: stripeEvent.id,
    stripeEventType: stripeEvent.type,
    reservationId: reservation.id,
  });
  return json({ received: true });
}

const objectId = (value: string | { id: string } | null) => (
  typeof value === 'string' ? value : value?.id ?? null
);

async function handlePaymentIntentEvent(
  env: BanquetEnv,
  stripeEvent: Stripe.Event,
  payloadSha256: string,
  paymentIntent: Stripe.PaymentIntent,
  context: RequestContext,
): Promise<Response> {
  if (paymentIntent.livemode) return json({ error: 'stripe_livemode_not_allowed' }, 400);
  const metadataReservationId = paymentIntent.metadata?.reservation_id ?? null;
  const reservation = await getReservationByPaymentIntent(env.BANQUET_DB, paymentIntent.id)
    ?? (metadataReservationId ? await getReservation(env.BANQUET_DB, metadataReservationId) : null);
  if (!reservation) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, null, 'unknown_reservation', paymentIntent.amount, context);
  }
  if (
    metadataReservationId !== reservation.id
    || paymentIntent.metadata?.event_id !== reservation.event_id
    || (reservation.stripe_payment_intent_id && reservation.stripe_payment_intent_id !== paymentIntent.id)
  ) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, reservation, 'identity_mismatch', paymentIntent.amount, context);
  }
  if (paymentIntent.currency !== reservation.currency) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, reservation, 'currency_mismatch', paymentIntent.amount, context);
  }
  if (paymentIntent.amount !== reservation.expected_total_cents) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, reservation, 'amount_mismatch', paymentIntent.amount, context);
  }

  const record = {
    stripeEventId: stripeEvent.id,
    eventType: stripeEvent.type,
    reservationId: reservation.id,
    payloadSha256,
    outcome: 'applied' as const,
    errorCode: null,
  };
  if (stripeEvent.type === 'payment_intent.payment_failed') {
    await recordFailedPaymentWebhook(env.BANQUET_DB, record, reservation, paymentIntent.id);
  } else {
    await recordCanceledPaymentWebhook(env.BANQUET_DB, record, reservation, paymentIntent.id);
  }
  return json({ received: true });
}

async function handleRefundEvent(
  env: BanquetEnv,
  stripeEvent: Stripe.Event,
  payloadSha256: string,
  charge: Stripe.Charge,
  context: RequestContext,
): Promise<Response> {
  if (charge.livemode) return json({ error: 'stripe_livemode_not_allowed' }, 400);
  const intentId = objectId(charge.payment_intent);
  const reservation = intentId ? await getReservationByPaymentIntent(env.BANQUET_DB, intentId) : null;
  if (!reservation) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, null, 'unknown_reservation', charge.amount_refunded, context);
  }
  if (!intentId || reservation.stripe_payment_intent_id !== intentId) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, reservation, 'identity_mismatch', charge.amount_refunded, context);
  }
  if (charge.currency !== reservation.currency) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, reservation, 'currency_mismatch', charge.amount_refunded, context);
  }
  if (
    reservation.amount_paid_cents === null
    || charge.amount_refunded <= 0
    || charge.amount_refunded > reservation.amount_paid_cents
  ) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, reservation, 'amount_mismatch', charge.amount_refunded, context);
  }
  await recordRefundWebhook(env.BANQUET_DB, {
    stripeEventId: stripeEvent.id,
    eventType: stripeEvent.type,
    reservationId: reservation.id,
    payloadSha256,
    outcome: 'applied',
    errorCode: null,
  }, reservation, charge.amount_refunded);
  return json({ received: true });
}

async function handleDisputeEvent(
  env: BanquetEnv,
  stripeEvent: Stripe.Event,
  payloadSha256: string,
  dispute: Stripe.Dispute,
  context: RequestContext,
): Promise<Response> {
  if (dispute.livemode) return json({ error: 'stripe_livemode_not_allowed' }, 400);
  const intentId = objectId(dispute.payment_intent);
  const reservation = intentId ? await getReservationByPaymentIntent(env.BANQUET_DB, intentId) : null;
  if (!reservation) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, null, 'unknown_reservation', dispute.amount, context);
  }
  if (!intentId || reservation.stripe_payment_intent_id !== intentId) {
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, reservation, 'identity_mismatch', dispute.amount, context);
  }
  if (dispute.currency !== reservation.currency || dispute.amount !== reservation.amount_paid_cents) {
    const reason = dispute.currency !== reservation.currency ? 'currency_mismatch' : 'amount_mismatch';
    return reviewLifecycleMismatch(env, stripeEvent, payloadSha256, reservation, reason, dispute.amount, context);
  }
  await recordDisputeWebhook(env.BANQUET_DB, {
    stripeEventId: stripeEvent.id,
    eventType: stripeEvent.type,
    reservationId: reservation.id,
    payloadSha256,
    outcome: 'applied',
    errorCode: null,
  }, reservation);
  return json({ received: true });
}

async function handleWebhook(
  request: Request,
  env: BanquetEnv,
  dependencies: WorkerDependencies,
  context: RequestContext,
): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed();
  assertPreviewRuntime(env);
  const signature = request.headers.get('stripe-signature');
  if (!signature) return json({ error: 'stripe_signature_required' }, 400);

  const rawBody = await readBoundedText(request, MAX_WEBHOOK_BYTES);
  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = await dependencies.verifyWebhook(env, rawBody, signature);
  } catch {
    logEvent('warn', 'webhook_signature_rejected', context);
    return json({ error: 'invalid_stripe_signature' }, 400);
  }
  if (stripeEvent.livemode) return json({ error: 'stripe_livemode_not_allowed' }, 400);

  const payloadSha256 = await sha256Hex(rawBody);
  try {
    if (
      stripeEvent.type === 'checkout.session.completed'
      || stripeEvent.type === 'checkout.session.async_payment_succeeded'
      || stripeEvent.type === 'checkout.session.expired'
    ) {
      return await handleCheckoutSessionEvent(
        env,
        stripeEvent,
        payloadSha256,
        stripeEvent.data.object,
        context,
      );
    }

    if (
      stripeEvent.type === 'payment_intent.payment_failed'
      || stripeEvent.type === 'payment_intent.canceled'
    ) {
      return await handlePaymentIntentEvent(
        env,
        stripeEvent,
        payloadSha256,
        stripeEvent.data.object,
        context,
      );
    }

    if (stripeEvent.type === 'charge.refunded') {
      return await handleRefundEvent(env, stripeEvent, payloadSha256, stripeEvent.data.object, context);
    }

    if (stripeEvent.type === 'charge.dispute.created') {
      return await handleDisputeEvent(env, stripeEvent, payloadSha256, stripeEvent.data.object, context);
    }

    await recordIgnoredWebhook(env.BANQUET_DB, {
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      reservationId: null,
      payloadSha256,
      outcome: 'ignored',
      errorCode: null,
    });
    return json({ received: true, ignored: true });
  } catch (error) {
    if (error instanceof DuplicateWebhookError) {
      const stored = await getStoredWebhookIdentity(env.BANQUET_DB, stripeEvent.id);
      if (
        stored
        && stored.event_type === stripeEvent.type
        && stored.payload_sha256 === payloadSha256
      ) {
        logEvent('info', 'webhook_duplicate_accepted', context, {
          stripeEventId: stripeEvent.id,
          stripeEventType: stripeEvent.type,
        });
        return json({ received: true, duplicate: true });
      }
      logEvent('error', 'webhook_replay_conflict', context, {
        stripeEventId: stripeEvent.id,
        stripeEventType: stripeEvent.type,
      });
      return json({ error: 'webhook_replay_conflict' }, 409);
    }
    throw error;
  }
}

export async function handleBanquetRequest(
  request: Request,
  env: BanquetEnv,
  dependencies: WorkerDependencies = workerDependencies,
): Promise<Response> {
  const path = new URL(request.url).pathname;
  const exportType = BOARD_EXPORT_PATHS.get(path);
  if (path !== CHECKOUT_PATH && path !== WEBHOOK_PATH && !exportType) return env.ASSETS.fetch(request);

  const context: RequestContext = {
    requestId: crypto.randomUUID(),
    path,
    startedAt: performance.now(),
  };
  let response: Response;
  try {
    response = exportType
      ? await handleBoardExport(request, env, dependencies, exportType, context)
      : path === CHECKOUT_PATH
        ? await handleCheckout(request, env, dependencies, context)
        : await handleWebhook(request, env, dependencies, context);
  } catch (error) {
    if (error instanceof BoardAccessError) {
      response = json({ error: error.code }, error.status);
    } else if (error instanceof RequestValidationError) {
      response = json({ error: error.code }, error.status);
    } else {
      logEvent('error', 'unhandled_worker_error', context, {
        errorType: error instanceof Error ? error.name : 'NonError',
      });
      response = json({ error: 'internal_error' }, 500);
    }
  }
  return finalizeApiResponse(response, request, context);
}

export default {
  fetch(request, env) {
    return handleBanquetRequest(request, env);
  },
} satisfies ExportedHandler<BanquetEnv>;
