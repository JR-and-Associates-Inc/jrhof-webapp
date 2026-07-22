import type Stripe from 'stripe';

export type BanquetEnv = Env & {
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly ACCESS_TEAM_DOMAIN: string;
  readonly ACCESS_AUD: string;
  readonly BOARD_EXPORT_ALLOWED_EMAILS: string;
};

export interface MealOption {
  id: string;
  name: string;
  description: string | null;
  available: boolean;
  accommodationNote: string | null;
}

export interface BanquetEventConfig {
  id: string;
  title: string;
  configurationStatus: 'preview_unapproved' | 'production_approved';
  registrationOpen: boolean;
  capacity: number;
  ticketUnitAmountCents: number;
  donationMinCents: number;
  donationMaxCents: number;
  currency: 'usd';
  checkoutTtlSeconds: number;
  meals: MealOption[];
  refundPolicyVersion: string | null;
}

export interface ValidatedAttendee {
  fullName: string;
  mealId: string;
  mealName: string;
  dietaryNotes: string | null;
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
  acknowledgements: {
    terms: true;
    privacy: true;
    informationAccuracy: true;
    refundPolicy: true;
  };
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
  stripe_payment_intent_id: string | null;
  payment_status: string;
  refund_status: string;
  amount_paid_cents: number | null;
  amount_refunded_cents: number | null;
}

export interface BoardAccessIdentity {
  email: string;
  subject: string;
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
  checkCheckoutRateLimit(env: BanquetEnv, request: Request): Promise<boolean>;
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
  verifyBoardAccess(request: Request, env: BanquetEnv): Promise<BoardAccessIdentity>;
}
