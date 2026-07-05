import { env } from 'cloudflare:workers';
import type Stripe from 'stripe';
import StripeClient from 'stripe';
import { describe, expect, it } from 'vitest';
import { handleBanquetRequest } from './index';
import { verifyWebhook as verifyStripeWebhook } from './stripe';
import type {
  BanquetEnv,
  CheckoutSessionResult,
  PendingReservation,
  WorkerDependencies,
} from './types';

const testEnv = env as BanquetEnv;
const checkoutUrl = 'https://checkout.stripe.com/c/pay/cs_test_preview';

const fakeDependencies: WorkerDependencies = {
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
};

const attendee = (index: number, mealChoice: 'chicken' | 'steak' = 'chicken') => ({
  fullName: `Preview Attendee ${index}`,
  mealChoice,
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
});

const checkoutRequest = (body: unknown) => new Request('https://preview.invalid/api/banquet/checkout', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: 'http://127.0.0.1:4321',
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

describe('banquet checkout validation and capacity', () => {
  it('rejects malformed JSON', async () => {
    const response = await postCheckout('{');
    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toMatchObject({ error: 'invalid_json' });
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
    payload.attendees[0] = { ...payload.attendees[0], mealChoice: 'fish' as 'chicken' };
    const response = await postCheckout(payload);
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

describe('Stripe webhook verification and state transitions', () => {
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
