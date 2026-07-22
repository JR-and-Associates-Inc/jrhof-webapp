import Stripe from 'stripe';
import type {
  BanquetEnv,
  BanquetEventConfig,
  CheckoutSessionResult,
  PendingReservation,
  WorkerDependencies,
} from './types';

const STRIPE_API_VERSION = '2026-06-24.dahlia' as const;

const createStripeClient = (secretKey: string) => new Stripe(secretKey, {
  apiVersion: STRIPE_API_VERSION,
  httpClient: Stripe.createFetchHttpClient(),
});

const randomIntegrationIdentifier = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((byte) => String.fromCharCode(97 + (byte % 26))).join('');
};

export async function createCheckoutSession(
  env: BanquetEnv,
  event: BanquetEventConfig,
  reservation: PendingReservation,
): Promise<CheckoutSessionResult> {
  const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
  const metadata = {
    event_id: event.id,
    reservation_id: reservation.id,
  };
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
    quantity: reservation.attendeeCount,
    price_data: {
      currency: reservation.currency,
      unit_amount: reservation.ticketUnitAmountCents,
      product_data: { name: '2027 Hall of Fame Induction Banquet seat — Test Mode' },
    },
  }];

  if (reservation.donationAmountCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: reservation.currency,
        unit_amount: reservation.donationAmountCents,
        product_data: { name: 'Optional banquet support — Test Mode' },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    integration_identifier: randomIntegrationIdentifier(),
    success_url: env.BANQUET_SUCCESS_URL,
    cancel_url: env.BANQUET_CANCEL_URL,
    client_reference_id: reservation.id,
    expires_at: Math.floor(new Date(reservation.checkoutExpiresAt).getTime() / 1000),
    line_items: lineItems,
    metadata,
    payment_intent_data: { metadata },
  }, {
    idempotencyKey: `banquet-checkout-${reservation.id}`,
  });

  if (
    session.livemode
    || !session.id.startsWith('cs_test_')
    || !session.url
    || !session.url.startsWith('https://checkout.stripe.com/')
    || session.amount_total !== reservation.expectedTotalCents
    || session.currency !== reservation.currency
  ) {
    throw new Error('stripe_test_session_verification_failed');
  }

  return {
    id: session.id,
    url: session.url,
    expiresAt: session.expires_at,
    livemode: false,
    amountTotal: session.amount_total,
    currency: reservation.currency,
  };
}

export async function verifyWebhook(
  env: BanquetEnv,
  rawBody: string,
  signature: string,
): Promise<Stripe.Event> {
  const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
  return stripe.webhooks.constructEventAsync(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
    300,
    Stripe.createSubtleCryptoProvider(),
  );
}

export const stripeDependencies: Pick<
  WorkerDependencies,
  'createCheckoutSession' | 'verifyWebhook'
> = {
  createCheckoutSession,
  verifyWebhook,
};
