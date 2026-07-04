-- PROPOSED / UNAPPLIED PHASE 1 MIGRATION
-- Review and promote into the active D1 migration sequence only after the
-- preview database, event configuration, retention policy, and Worker API are approved.

CREATE TABLE banquet_reservations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'paid',
      'expired',
      'canceled',
      'partially_refunded',
      'refunded',
      'payment_review'
    )),
  contact_name TEXT NOT NULL CHECK (length(trim(contact_name)) BETWEEN 2 AND 100),
  contact_email TEXT NOT NULL CHECK (length(trim(contact_email)) BETWEEN 3 AND 254),
  contact_phone TEXT NOT NULL CHECK (length(trim(contact_phone)) BETWEEN 7 AND 30),
  attendee_count INTEGER NOT NULL CHECK (attendee_count BETWEEN 1 AND 8),
  seating_notes TEXT CHECK (seating_notes IS NULL OR length(seating_notes) <= 500),
  ticket_unit_amount_cents INTEGER NOT NULL CHECK (ticket_unit_amount_cents >= 0),
  ticket_subtotal_cents INTEGER NOT NULL CHECK (ticket_subtotal_cents >= 0),
  donation_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (donation_amount_cents >= 0),
  expected_total_cents INTEGER NOT NULL CHECK (expected_total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_last_event_id TEXT,
  checkout_expires_at TEXT,
  payment_verified_at TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (ticket_subtotal_cents = ticket_unit_amount_cents * attendee_count),
  CHECK (expected_total_cents = ticket_subtotal_cents + donation_amount_cents),
  CHECK (status != 'paid' OR payment_verified_at IS NOT NULL)
);

CREATE INDEX idx_banquet_reservations_event_status
  ON banquet_reservations (event_id, status);

CREATE INDEX idx_banquet_reservations_created_at
  ON banquet_reservations (created_at);

