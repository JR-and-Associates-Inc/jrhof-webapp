/// <reference path="./worker-configuration.d.ts" />

import type Stripe from 'stripe';
import {
  attachCheckoutSession,
  CapacityUnavailableError,
  createPendingReservation,
  DuplicateWebhookError,
  getEventConfig,
  getReservation,
  markCheckoutFailed,
  recordExpiredWebhook,
  recordIgnoredWebhook,
  recordPaidWebhook,
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
const MAX_WEBHOOK_BYTES = 262_144;

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, {
  status,
  headers: responseHeaders,
});

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

async function handleCheckout(
  request: Request,
  env: BanquetEnv,
  dependencies: WorkerDependencies,
): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  assertPreviewRuntime(env);
  assertCheckoutOrigin(request, env);

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
    return json({ reservationId: reservation.id, checkoutUrl: session.url }, 201);
  } catch (error) {
    await markCheckoutFailed(env.BANQUET_DB, reservation.id);
    console.error(JSON.stringify({
      message: 'banquet checkout session creation failed',
      reservationId: reservation.id,
      error: error instanceof Error ? error.message : 'unknown_error',
    }));
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
  return json({ received: true, paymentReview: true });
}

async function handleCheckoutSessionEvent(
  env: BanquetEnv,
  stripeEvent: Stripe.Event,
  payloadSha256: string,
  session: Stripe.Checkout.Session,
): Promise<Response> {
  if (session.livemode) return json({ error: 'stripe_livemode_not_allowed' }, 400);

  const reservationId = reservationIdFromSession(session);
  const reservation = reservationId
    ? await getReservation(env.BANQUET_DB, reservationId)
    : null;

  if (!reservation) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, null, 'unknown_reservation');
  }

  if (
    session.client_reference_id !== reservation.id
    || reservationId !== reservation.id
    || eventIdFromSession(session) !== reservation.event_id
    || session.id !== reservation.stripe_checkout_session_id
  ) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'identity_mismatch');
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
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'amount_mismatch');
  }
  if (session.currency !== reservation.currency) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'currency_mismatch');
  }
  if (session.payment_status !== 'paid' || session.status !== 'complete') {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'payment_status_mismatch');
  }
  const intentId = paymentIntentId(session);
  if (!intentId) {
    return reviewMismatch(env, stripeEvent, payloadSha256, session, reservation, 'identity_mismatch');
  }

  await recordPaidWebhook(
    env.BANQUET_DB,
    { ...recordBase, outcome: 'applied' },
    reservation,
    session.id,
    intentId,
    session.amount_total,
  );
  return json({ received: true });
}

async function handleWebhook(
  request: Request,
  env: BanquetEnv,
  dependencies: WorkerDependencies,
): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  assertPreviewRuntime(env);
  const signature = request.headers.get('stripe-signature');
  if (!signature) return json({ error: 'stripe_signature_required' }, 400);

  const rawBody = await readBoundedText(request, MAX_WEBHOOK_BYTES);
  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = await dependencies.verifyWebhook(env, rawBody, signature);
  } catch {
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
      );
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
      return json({ received: true, duplicate: true });
    }
    throw error;
  }
}

export async function handleBanquetRequest(
  request: Request,
  env: BanquetEnv,
  dependencies: WorkerDependencies = stripeDependencies,
): Promise<Response> {
  const path = new URL(request.url).pathname;
  try {
    if (path === CHECKOUT_PATH) return await handleCheckout(request, env, dependencies);
    if (path === WEBHOOK_PATH) return await handleWebhook(request, env, dependencies);
    return await env.ASSETS.fetch(request);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return json({ error: error.code }, error.status);
    }
    console.error(JSON.stringify({
      message: 'unhandled banquet worker error',
      path,
      error: error instanceof Error ? error.message : 'unknown_error',
    }));
    return json({ error: 'internal_error' }, 500);
  }
}

export default {
  fetch(request, env) {
    return handleBanquetRequest(request, env);
  },
} satisfies ExportedHandler<BanquetEnv>;
