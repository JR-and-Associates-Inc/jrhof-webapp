import { env } from 'cloudflare:workers';
import type Stripe from 'stripe';
import StripeClient from 'stripe';
import { describe, expect, it } from 'vitest';
import { BoardAccessError } from './access';
import { handleBanquetRequest } from './index';
import { verifyWebhook as verifyStripeWebhook } from './stripe';
import { assertProductionLaunchReady } from './validation';
import type {
  BanquetEnv,
  CheckoutSessionResult,
  PendingReservation,
  WorkerDependencies,
} from './types';

const testEnv = env as BanquetEnv;
const checkoutUrl = 'https://checkout.stripe.com/c/pay/cs_test_preview';

const fakeDependencies: WorkerDependencies = {
  async checkCheckoutRateLimit() {
    return true;
  },
  async createCheckoutSession(
    _env,
    _event,
    reservation: PendingReservation,
  ): Promise<CheckoutSessionResult> {
    return {
      id: `cs_test_${reservation.id}`,
      url: checkoutUrl,
      expiresAt: Math.floor(new Date(reservation.checkoutExpiresAt).getTime() / 1000),
      livemode: false,
      amountTotal: reservation.expectedTotalCents,
      currency: reservation.currency,
    };
  },
  async verifyWebhook(_env, rawBody): Promise<Stripe.Event> {
    return JSON.parse(rawBody) as Stripe.Event;
  },
  async verifyBoardAccess() {
    return { email: 'board@example.invalid', subject: 'board-test-subject' };
  },
};

const attendee = (index: number, mealId = 'preview-option-a') => ({
  fullName: `Preview Attendee ${index}`,
  mealId,
  dietaryNotes: null,
});

const registrationPayload = (attendeeCount = 1) => ({
  eventId: 'banquet-2027',
  contact: {
    name: 'Preview Purchaser',
    email: 'preview@example.com',
    phone: '303-555-0100',
  },
  attendees: Array.from({ length: attendeeCount }, (_, index) => attendee(index + 1)),
  seatingNotes: null,
  donationAmountCents: 0,
  acknowledgements: {
    terms: true,
    privacy: true,
    informationAccuracy: true,
    refundPolicy: true,
  },
});

const checkoutRequest = (body: unknown) => new Request('https://preview.invalid/api/banquet/checkout', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: 'http://127.0.0.1:8787',
  },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const postCheckout = (body: unknown) => handleBanquetRequest(
  checkoutRequest(body),
  testEnv,
  fakeDependencies,
);

const readJson = async (response: Response) => response.json<Record<string, unknown>>();

interface CreatedReservation {
  id: string;
  event_id: string;
  expected_total_cents: number;
  currency: string;
  stripe_checkout_session_id: string;
  status: string;
}

const createReservation = async (): Promise<CreatedReservation> => {
  const response = await postCheckout(registrationPayload());
  expect(response.status).toBe(201);
  const body = await readJson(response);
  const reservationId = String(body.reservationId);
  const reservation = await testEnv.BANQUET_DB.prepare(`
    SELECT id, event_id, expected_total_cents, currency, stripe_checkout_session_id, status
    FROM banquet_reservations
    WHERE id = ?
  `).bind(reservationId).first<CreatedReservation>();
  if (!reservation) throw new Error('test reservation missing');
  return reservation;
};

const checkoutEvent = (
  reservation: CreatedReservation,
  overrides: Partial<Stripe.Checkout.Session> = {},
  eventOverrides: Partial<Stripe.Event> = {},
  type: 'checkout.session.completed' | 'checkout.session.expired' = 'checkout.session.completed',
): Stripe.Event => ({
  id: 'evt_test_webhook_1',
  object: 'event',
  api_version: '2026-06-24.dahlia',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: reservation.stripe_checkout_session_id,
      object: 'checkout.session',
      amount_total: reservation.expected_total_cents,
      client_reference_id: reservation.id,
      currency: reservation.currency,
      livemode: false,
      metadata: {
        event_id: reservation.event_id,
        reservation_id: reservation.id,
      },
      payment_intent: 'pi_test_verified',
      payment_status: type === 'checkout.session.completed' ? 'paid' : 'unpaid',
      status: type === 'checkout.session.completed' ? 'complete' : 'expired',
      ...overrides,
    } as Stripe.Checkout.Session,
  },
  livemode: false,
  pending_webhooks: 1,
  request: null,
  type,
  ...eventOverrides,
} as Stripe.Event);

const postWebhook = (event: Stripe.Event, dependencies = fakeDependencies) => handleBanquetRequest(
  new Request('https://preview.invalid/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': 'test-signature',
    },
    body: JSON.stringify(event),
  }),
  testEnv,
  dependencies,
);

const confirmationRequest = (reference: string, method = 'GET') => new Request(
  `http://127.0.0.1:8787/api/banquet/confirmation?reference=${encodeURIComponent(reference)}`,
  { method },
);

const getConfirmation = (reference: string) => handleBanquetRequest(
  confirmationRequest(reference),
  testEnv,
  fakeDependencies,
);

const lifecycleEvent = (
  type: 'payment_intent.payment_failed' | 'payment_intent.canceled' | 'charge.refunded' | 'charge.dispute.created',
  object: Stripe.PaymentIntent | Stripe.Charge | Stripe.Dispute,
  id: string,
) => ({
  id,
  object: 'event',
  api_version: '2026-06-24.dahlia',
  created: Math.floor(Date.now() / 1000),
  data: { object },
  livemode: false,
  pending_webhooks: 1,
  request: null,
  type,
} as Stripe.Event);

const markReservationPaid = async () => {
  const reservation = await createReservation();
  expect((await postWebhook(checkoutEvent(reservation))).status).toBe(200);
  return reservation;
};

describe('banquet checkout validation and capacity', () => {
  it('blocks production launch when meal descriptions or approvals are missing', () => {
    expect(() => assertProductionLaunchReady({
      id: 'banquet-2027',
      title: 'Preview banquet',
      configurationStatus: 'production_approved',
      registrationOpen: true,
      capacity: 300,
      ticketUnitAmountCents: 8500,
      donationMinCents: 0,
      donationMaxCents: 1000000,
      currency: 'usd',
      checkoutTtlSeconds: 3600,
      refundPolicyVersion: 'unapproved-preview',
      meals: [{
        id: 'preview-option-a',
        name: 'Preview option A',
        description: null,
        available: true,
        accommodationNote: null,
      }],
    })).toThrowError(/invalid_meal_configuration/u);
  });

  it('rejects checkout request bodies larger than 16 KiB before parsing', async () => {
    const request = checkoutRequest('{}');
    request.headers.set('content-length', '16385');
    const response = await handleBanquetRequest(request, testEnv, fakeDependencies);
    expect(response.status).toBe(413);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'request_too_large' });
  });

  it('returns a retryable response when the preview checkout limiter denies a request', async () => {
    const response = await handleBanquetRequest(
      checkoutRequest(registrationPayload()),
      testEnv,
      { ...fakeDependencies, checkCheckoutRateLimit: async () => false },
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    await expect(readJson(response)).resolves.toMatchObject({ error: 'rate_limited' });
    const count = await testEnv.BANQUET_DB.prepare(
      'SELECT COUNT(*) AS count FROM banquet_reservations',
    ).first<number>('count');
    expect(count).toBe(0);
  });

  it('rejects malformed JSON', async () => {
    const response = await postCheckout('{');
    expect(response.status).toBe(400);
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(readJson(response)).resolves.toMatchObject({ error: 'invalid_json' });
  });

  it('returns a safe method response with an explicit Allow header', async () => {
    const response = await handleBanquetRequest(
      new Request('https://preview.invalid/api/banquet/checkout'),
      testEnv,
      fakeDependencies,
    );
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    await expect(readJson(response)).resolves.toEqual({ error: 'method_not_allowed' });
  });

  it.each([1, 8])('accepts %i attendee(s)', async (attendeeCount) => {
    const response = await postCheckout(registrationPayload(attendeeCount));
    expect(response.status).toBe(201);
    const reservationId = String((await readJson(response)).reservationId);
    const storedCount = await testEnv.BANQUET_DB.prepare(
      'SELECT COUNT(*) AS count FROM banquet_attendees WHERE reservation_id = ?',
    ).bind(reservationId).first<number>('count');
    expect(storedCount).toBe(attendeeCount);
  });

  it.each([0, 9])('rejects an attendee count of %i', async (attendeeCount) => {
    const response = await postCheckout(registrationPayload(attendeeCount));
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'invalid_attendee_count' });
  });

  it('rejects a meal choice outside the server allowlist', async () => {
    const payload = registrationPayload();
    payload.attendees[0] = { ...payload.attendees[0], mealId: 'fish' };
    const response = await postCheckout(payload);
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'invalid_meal_choice' });
  });

  it('requires all acknowledgements and never trusts omitted consent', async () => {
    const payload = registrationPayload();
    payload.acknowledgements.privacy = false as true;
    const response = await postCheckout(payload);
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'acknowledgements_required' });
  });

  it('normalizes plain-text dietary notes and rejects control characters', async () => {
    const payload = registrationPayload();
    payload.attendees[0] = { ...payload.attendees[0], dietaryNotes: '  Gluten   allergy  ' };
    const response = await postCheckout(payload);
    expect(response.status).toBe(201);
    const reservationId = String((await readJson(response)).reservationId);
    const stored = await testEnv.BANQUET_DB.prepare(
      'SELECT dietary_notes FROM banquet_attendees WHERE reservation_id = ?',
    ).bind(reservationId).first<string>('dietary_notes');
    expect(stored).toBe('Gluten allergy');

    const invalid = registrationPayload();
    invalid.attendees[0] = { ...invalid.attendees[0], dietaryNotes: 'allergy\u0000note' };
    const rejected = await postCheckout(invalid);
    expect(rejected.status).toBe(400);
    await expect(readJson(rejected)).resolves.toMatchObject({ error: 'invalid_dietary_notes' });
  });

  it('rejects unavailable meal objects', async () => {
    await testEnv.BANQUET_DB.prepare(`
      UPDATE banquet_events
      SET meals_json = '[{"id":"preview-option-a","name":"Preview option A","description":null,"available":false,"accommodationNote":null},{"id":"preview-option-b","name":"Preview option B","description":null,"available":true,"accommodationNote":null}]'
      WHERE id = 'banquet-2027'
    `).run();
    const response = await postCheckout(registrationPayload());
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'invalid_meal_choice' });
  });

  it.each([-1, 1000001])('rejects a donation amount of %i cents', async (donationAmountCents) => {
    const response = await postCheckout({ ...registrationPayload(), donationAmountCents });
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'invalid_donation_amount' });
  });

  it('rejects client total tampering and unknown fields', async () => {
    const response = await postCheckout({
      ...registrationPayload(),
      ticketSubtotalCents: 1,
      totalCents: 1,
    });
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'invalid_request_shape' });
    const count = await testEnv.BANQUET_DB.prepare('SELECT COUNT(*) AS count FROM banquet_reservations').first<number>('count');
    expect(count).toBe(0);
  });

  it('reserves capacity with pending, unexpired registrations', async () => {
    await testEnv.BANQUET_DB.prepare(
      "UPDATE banquet_events SET capacity = 1 WHERE id = 'banquet-2027'",
    ).run();
    expect((await postCheckout(registrationPayload())).status).toBe(201);
    const second = await postCheckout(registrationPayload());
    expect(second.status).toBe(409);
    await expect(readJson(second)).resolves.toMatchObject({ error: 'capacity_unavailable' });
  });
});

describe('server-confirmed purchaser return', () => {
  it('stays processing until the verified paid webhook and then returns only safe conversion fields', async () => {
    const reservation = await createReservation();

    const processing = await getConfirmation(reservation.id);
    expect(processing.status).toBe(200);
    expect(processing.headers.get('cache-control')).toBe('no-store');
    expect(processing.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    await expect(readJson(processing)).resolves.toEqual({ status: 'processing' });

    expect((await postWebhook(checkoutEvent(reservation))).status).toBe(200);
    const confirmed = await getConfirmation(reservation.id);
    expect(confirmed.status).toBe(200);
    const confirmedBody = await readJson(confirmed);
    expect(confirmedBody).toEqual({
      status: 'confirmed',
      transactionId: reservation.id,
      totalCents: reservation.expected_total_cents,
      currency: reservation.currency,
    });
    expect(JSON.stringify(confirmedBody)).not.toMatch(/preview@example|Preview Purchaser|cs_test_|pi_test_/u);
  });

  it('fails closed for malformed, unknown, and non-GET confirmation requests', async () => {
    const malformed = await getConfirmation('not-a-reference');
    expect(malformed.status).toBe(400);
    await expect(readJson(malformed)).resolves.toEqual({ error: 'invalid_registration_reference' });

    const unknown = await getConfirmation('11111111-1111-4111-8111-111111111111');
    expect(unknown.status).toBe(404);
    await expect(readJson(unknown)).resolves.toEqual({ status: 'not_found' });

    const wrongMethod = await handleBanquetRequest(
      confirmationRequest('11111111-1111-4111-8111-111111111111', 'POST'),
      testEnv,
      fakeDependencies,
    );
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get('allow')).toBe('GET');
  });

  it('never confirms an expired checkout', async () => {
    const reservation = await createReservation();
    expect((await postWebhook(checkoutEvent(reservation, {}, {}, 'checkout.session.expired'))).status).toBe(200);
    const response = await getConfirmation(reservation.id);
    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ status: 'not_completed' });
  });
});

describe('Stripe webhook verification and state transitions', () => {
  it('rejects webhook request bodies larger than 64 KiB before verification', async () => {
    const request = new Request('https://preview.invalid/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '65537',
        'stripe-signature': 'test-signature',
      },
      body: '{}',
    });
    const response = await handleBanquetRequest(request, testEnv, fakeDependencies);
    expect(response.status).toBe(413);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'request_too_large' });
  });

  it('verifies a real Stripe test signature against the unchanged raw body', async () => {
    const payload = JSON.stringify({ id: 'evt_signature_test', object: 'event', livemode: false, type: 'ping' });
    const stripe = new StripeClient(testEnv.STRIPE_SECRET_KEY, {
      apiVersion: '2026-06-24.dahlia',
      httpClient: StripeClient.createFetchHttpClient(),
    });
    const signature = await stripe.webhooks.generateTestHeaderStringAsync({
      payload,
      secret: testEnv.STRIPE_WEBHOOK_SECRET,
      cryptoProvider: StripeClient.createSubtleCryptoProvider(),
    });
    const event = await verifyStripeWebhook(testEnv, payload, signature);
    expect(event.id).toBe('evt_signature_test');
  });

  it('marks a matching completed session paid using server values', async () => {
    const reservation = await createReservation();
    const response = await postWebhook(checkoutEvent(reservation));
    expect(response.status).toBe(200);
    const stored = await testEnv.BANQUET_DB.prepare(
      'SELECT status, amount_paid_cents, payment_verified_at FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<{ status: string; amount_paid_cents: number; payment_verified_at: string | null }>();
    expect(stored?.status).toBe('paid');
    expect(stored?.amount_paid_cents).toBe(reservation.expected_total_cents);
    expect(stored?.payment_verified_at).toBeTruthy();
  });

  it('processes a repeated Stripe event id only once', async () => {
    const reservation = await createReservation();
    const event = checkoutEvent(reservation);
    expect((await postWebhook(event)).status).toBe(200);
    const duplicate = await postWebhook(event);
    expect(duplicate.status).toBe(200);
    await expect(readJson(duplicate)).resolves.toMatchObject({ duplicate: true });
    const count = await testEnv.BANQUET_DB.prepare(
      'SELECT COUNT(*) AS count FROM banquet_webhook_events WHERE stripe_event_id = ?',
    ).bind(event.id).first<number>('count');
    expect(count).toBe(1);
  });

  it('rejects an event id replayed with altered payload content', async () => {
    const reservation = await createReservation();
    const event = checkoutEvent(reservation);
    expect((await postWebhook(event)).status).toBe(200);

    const alteredEvent = checkoutEvent(reservation, {
      amount_total: reservation.expected_total_cents + 1,
    });
    const replay = await postWebhook(alteredEvent);
    expect(replay.status).toBe(409);
    await expect(readJson(replay)).resolves.toEqual({ error: 'webhook_replay_conflict' });

    const status = await testEnv.BANQUET_DB.prepare(
      'SELECT status FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<string>('status');
    const webhookCount = await testEnv.BANQUET_DB.prepare(
      'SELECT COUNT(*) AS count FROM banquet_webhook_events WHERE stripe_event_id = ?',
    ).bind(event.id).first<number>('count');
    const alertCount = await testEnv.BANQUET_DB.prepare(
      'SELECT COUNT(*) AS count FROM banquet_payment_alerts',
    ).first<number>('count');
    expect(status).toBe('paid');
    expect(webhookCount).toBe(1);
    expect(alertCount).toBe(0);
  });

  it('routes an amount mismatch to payment review instead of paid', async () => {
    const reservation = await createReservation();
    const event = checkoutEvent(reservation, { amount_total: reservation.expected_total_cents + 1 });
    const response = await postWebhook(event);
    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({ paymentReview: true });
    const status = await testEnv.BANQUET_DB.prepare(
      'SELECT status FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<string>('status');
    const reason = await testEnv.BANQUET_DB.prepare(
      'SELECT reason FROM banquet_payment_alerts WHERE reservation_id = ?',
    ).bind(reservation.id).first<string>('reason');
    expect(status).toBe('payment_review');
    expect(reason).toBe('amount_mismatch');
  });

  it('marks an expired Checkout Session expired without marking it paid', async () => {
    const reservation = await createReservation();
    const response = await postWebhook(checkoutEvent(reservation, {}, {}, 'checkout.session.expired'));
    expect(response.status).toBe(200);
    const status = await testEnv.BANQUET_DB.prepare(
      'SELECT status FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<string>('status');
    expect(status).toBe('expired');
  });

  it('routes an unpaid completed session to payment review', async () => {
    const reservation = await createReservation();
    const response = await postWebhook(checkoutEvent(reservation, { payment_status: 'unpaid' }));
    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toMatchObject({ paymentReview: true });
    const state = await testEnv.BANQUET_DB.prepare(
      'SELECT status, payment_status FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<{ status: string; payment_status: string }>();
    expect(state).toMatchObject({ status: 'payment_review', payment_status: 'unpaid' });
  });

  it.each([
    ['payment_intent.payment_failed', 'checkout_failed', 'failed'],
    ['payment_intent.canceled', 'canceled', 'canceled'],
  ] as const)('applies %s without treating it as paid', async (type, status, paymentStatus) => {
    const reservation = await createReservation();
    const paymentIntent = {
      id: 'pi_test_lifecycle',
      object: 'payment_intent',
      amount: reservation.expected_total_cents,
      currency: reservation.currency,
      livemode: false,
      metadata: { event_id: reservation.event_id, reservation_id: reservation.id },
    } as Stripe.PaymentIntent;
    const response = await postWebhook(lifecycleEvent(type, paymentIntent, `evt_${paymentStatus}`));
    expect(response.status).toBe(200);
    const stored = await testEnv.BANQUET_DB.prepare(
      'SELECT status, payment_status, amount_paid_cents FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<{ status: string; payment_status: string; amount_paid_cents: number | null }>();
    expect(stored).toMatchObject({ status, payment_status: paymentStatus, amount_paid_cents: null });
  });

  it('records a disputed paid payment for manual review', async () => {
    const reservation = await markReservationPaid();
    const dispute = {
      id: 'dp_test_preview',
      object: 'dispute',
      amount: reservation.expected_total_cents,
      currency: reservation.currency,
      livemode: false,
      payment_intent: 'pi_test_verified',
    } as Stripe.Dispute;
    const response = await postWebhook(lifecycleEvent('charge.dispute.created', dispute, 'evt_disputed'));
    expect(response.status).toBe(200);
    const stored = await testEnv.BANQUET_DB.prepare(
      'SELECT status, payment_status FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<{ status: string; payment_status: string }>();
    expect(stored).toMatchObject({ status: 'payment_review', payment_status: 'disputed' });
  });

  it.each([
    [1000, 'partially_refunded', 'partially_refunded'],
    [8500, 'refunded', 'refunded'],
  ] as const)('records a %i-cent refund', async (amountRefunded, status, refundStatus) => {
    const reservation = await markReservationPaid();
    const charge = {
      id: 'ch_test_preview',
      object: 'charge',
      amount: reservation.expected_total_cents,
      amount_refunded: amountRefunded,
      currency: reservation.currency,
      livemode: false,
      payment_intent: 'pi_test_verified',
    } as Stripe.Charge;
    const response = await postWebhook(lifecycleEvent('charge.refunded', charge, `evt_refund_${amountRefunded}`));
    expect(response.status).toBe(200);
    const stored = await testEnv.BANQUET_DB.prepare(
      'SELECT status, refund_status, amount_refunded_cents FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<{ status: string; refund_status: string; amount_refunded_cents: number }>();
    expect(stored).toMatchObject({ status, refund_status: refundStatus, amount_refunded_cents: amountRefunded });
  });

  it('rejects livemode events before any payment-state write', async () => {
    const reservation = await createReservation();
    const event = checkoutEvent(reservation, { livemode: true }, { livemode: true });
    const response = await postWebhook(event);
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'stripe_livemode_not_allowed' });
    const status = await testEnv.BANQUET_DB.prepare(
      'SELECT status FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<string>('status');
    const webhookCount = await testEnv.BANQUET_DB.prepare(
      'SELECT COUNT(*) AS count FROM banquet_webhook_events',
    ).first<number>('count');
    expect(status).toBe('pending');
    expect(webhookCount).toBe(0);
  });

  it('rejects a livemode Checkout Session even when the event envelope is test mode', async () => {
    const reservation = await createReservation();
    const event = checkoutEvent(reservation, { livemode: true });
    const response = await postWebhook(event);
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'stripe_livemode_not_allowed' });
    const status = await testEnv.BANQUET_DB.prepare(
      'SELECT status FROM banquet_reservations WHERE id = ?',
    ).bind(reservation.id).first<string>('status');
    expect(status).toBe('pending');
  });
});

describe('protected board CSV exports', () => {
  const exportRequest = (path = '/api/banquet/exports/registrations.csv') => new Request(
    `https://preview.invalid${path}`,
  );

  it('fails closed when Cloudflare Access authentication is absent', async () => {
    const response = await handleBanquetRequest(exportRequest(), testEnv, {
      ...fakeDependencies,
      async verifyBoardAccess() {
        throw new BoardAccessError('access_jwt_required', 401);
      },
    });
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(readJson(response)).resolves.toEqual({ error: 'access_jwt_required' });
  });

  it('downloads Excel-compatible formula-safe registration CSV with privacy headers', async () => {
    const payload = registrationPayload();
    payload.contact.name = '=2+2';
    expect((await postCheckout(payload)).status).toBe(201);
    const response = await handleBanquetRequest(exportRequest(), testEnv, fakeDependencies);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="registrations.csv"');
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const csv = new TextDecoder().decode(bytes);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv).toContain('"\'=2+2"');
    expect(csv).not.toContain('cs_test_');
    expect(csv).not.toContain('pi_test_');
    const auditCount = await testEnv.BANQUET_DB.prepare(
      'SELECT COUNT(*) AS count FROM banquet_export_audit',
    ).first<number>('count');
    expect(auditCount).toBe(1);
  });

  it('supports authorized paid-only seating exports and defaults to all statuses', async () => {
    await createReservation();
    await markReservationPaid();
    const all = await handleBanquetRequest(exportRequest('/api/banquet/exports/seating-plan.csv'), testEnv, fakeDependencies);
    const paid = await handleBanquetRequest(
      exportRequest('/api/banquet/exports/seating-plan.csv?paid-only=true'),
      testEnv,
      fakeDependencies,
    );
    expect((await all.text()).split('\r\n').filter(Boolean)).toHaveLength(3);
    expect((await paid.text()).split('\r\n').filter(Boolean)).toHaveLength(2);
  });

  it('rejects unrecognized export filters', async () => {
    const response = await handleBanquetRequest(
      exportRequest('/api/banquet/exports/registrations.csv?status=paid'),
      testEnv,
      fakeDependencies,
    );
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: 'invalid_export_filter' });
  });
});
