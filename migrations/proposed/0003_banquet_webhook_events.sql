-- PROPOSED / LOCAL-PREVIEW-ONLY PHASE 2 MIGRATION
-- Stores Stripe event identity and a payload digest for idempotency/auditability.
-- The raw webhook payload is intentionally not persisted.

CREATE TABLE banquet_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  livemode INTEGER NOT NULL CHECK (livemode IN (0, 1)),
  reservation_id TEXT REFERENCES banquet_reservations(id),
  payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
  outcome TEXT NOT NULL
    CHECK (outcome IN ('applied', 'ignored', 'payment_review')),
  error_code TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX idx_banquet_webhook_events_reservation
  ON banquet_webhook_events (reservation_id, received_at);

CREATE TABLE banquet_payment_alerts (
  id TEXT PRIMARY KEY,
  reservation_id TEXT REFERENCES banquet_reservations(id),
  stripe_event_id TEXT NOT NULL REFERENCES banquet_webhook_events(stripe_event_id),
  reason TEXT NOT NULL
    CHECK (reason IN (
      'amount_mismatch',
      'currency_mismatch',
      'identity_mismatch',
      'payment_status_mismatch',
      'unknown_reservation'
    )),
  expected_amount_cents INTEGER,
  actual_amount_cents INTEGER,
  resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_at TEXT
) STRICT;

CREATE INDEX idx_banquet_payment_alerts_unresolved
  ON banquet_payment_alerts (resolved, created_at);
