import type Stripe from 'stripe';

export type BanquetEnv = Env & {
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
};

export interface BanquetEventConfig {
  id: string;
  title: string;
  configurationStatus: 'preview_unapproved';
  registrationOpen: boolean;
  capacity: number;
  ticketUnitAmountCents: number;
  donationMinCents: number;
  donationMaxCents: number;
  currency: 'usd';
  checkoutTtlSeconds: number;
}

export interface ValidatedAttendee {
  fullName: string;
  mealChoice: 'chicken' | 'steak';
}

export interface ValidatedRegistration {
  eventId: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  attendees: ValidatedAttendee[];
  seatingNotes: string | null;
  donationAmountCents: number;
}

export interface PendingReservation {
  id: string;
  eventId: string;
  attendeeCount: number;
  ticketUnitAmountCents: number;
  ticketSubtotalCents: number;
  donationAmountCents: number;
  expectedTotalCents: number;
  currency: 'usd';
  checkoutExpiresAt: string;
}

export interface ReservationRow {
  id: string;
  event_id: string;
  status: string;
  expected_total_cents: number;
  currency: string;
  stripe_checkout_session_id: string | null;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
  expiresAt: number;
  livemode: false;
  amountTotal: number;
  currency: 'usd';
}

export interface WorkerDependencies {
  createCheckoutSession(
    env: BanquetEnv,
    event: BanquetEventConfig,
    reservation: PendingReservation,
  ): Promise<CheckoutSessionResult>;
  verifyWebhook(
    env: BanquetEnv,
    rawBody: string,
    signature: string,
  ): Promise<Stripe.Event>;
}
