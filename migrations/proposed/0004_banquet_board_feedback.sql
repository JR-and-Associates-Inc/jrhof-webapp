-- PROPOSED / PREVIEW-ONLY BOARD FEEDBACK MIGRATION
-- Do not apply to production. The meal rows below are explicit test fixtures,
-- not approved menu items, and intentionally have no descriptions.

ALTER TABLE banquet_events
  ADD COLUMN meals_json TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(meals_json) AND json_type(meals_json) = 'array');

ALTER TABLE banquet_events
  ADD COLUMN refund_policy_version TEXT
    CHECK (refund_policy_version IS NULL OR length(trim(refund_policy_version)) BETWEEN 1 AND 80);

UPDATE banquet_events
SET meals_json = '[{"id":"preview-option-a","name":"Preview option A","description":null,"available":true,"accommodationNote":"Test-only placeholder; the board has not approved meal details."},{"id":"preview-option-b","name":"Preview option B","description":null,"available":true,"accommodationNote":"Test-only placeholder; the board has not approved meal details."}]',
    refund_policy_version = NULL
WHERE id = 'banquet-2027';

ALTER TABLE banquet_reservations
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'canceled', 'disputed', 'partially_refunded', 'refunded'));

ALTER TABLE banquet_reservations
  ADD COLUMN refund_status TEXT NOT NULL DEFAULT 'not_refunded'
    CHECK (refund_status IN ('not_refunded', 'partially_refunded', 'refunded'));

ALTER TABLE banquet_reservations
  ADD COLUMN amount_refunded_cents INTEGER
    CHECK (amount_refunded_cents IS NULL OR amount_refunded_cents >= 0);

ALTER TABLE banquet_reservations ADD COLUMN refunded_at TEXT;
ALTER TABLE banquet_reservations ADD COLUMN terms_acknowledged_at TEXT;
ALTER TABLE banquet_reservations ADD COLUMN privacy_acknowledged_at TEXT;
ALTER TABLE banquet_reservations ADD COLUMN accuracy_acknowledged_at TEXT;
ALTER TABLE banquet_reservations ADD COLUMN refund_policy_acknowledged_at TEXT;

CREATE TABLE banquet_attendees_v2 (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL
    REFERENCES banquet_reservations(id) ON DELETE CASCADE,
  attendee_position INTEGER NOT NULL CHECK (attendee_position BETWEEN 1 AND 8),
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 2 AND 100),
  meal_id TEXT NOT NULL CHECK (length(trim(meal_id)) BETWEEN 1 AND 64),
  meal_name_snapshot TEXT CHECK (meal_name_snapshot IS NULL OR length(trim(meal_name_snapshot)) BETWEEN 2 AND 80),
  dietary_notes TEXT CHECK (dietary_notes IS NULL OR length(dietary_notes) <= 300),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (reservation_id, attendee_position)
) STRICT;

INSERT INTO banquet_attendees_v2 (
  id,
  reservation_id,
  attendee_position,
  full_name,
  meal_id,
  meal_name_snapshot,
  dietary_notes,
  created_at,
  updated_at
)
SELECT
  id,
  reservation_id,
  attendee_position,
  full_name,
  'legacy-' || meal_choice || '-preview',
  'Legacy preview choice (' || meal_choice || ')',
  NULL,
  created_at,
  updated_at
FROM banquet_attendees;

DROP TABLE banquet_attendees;
ALTER TABLE banquet_attendees_v2 RENAME TO banquet_attendees;

CREATE INDEX idx_banquet_attendees_reservation
  ON banquet_attendees (reservation_id);

CREATE TABLE banquet_export_audit (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES banquet_events(id),
  export_type TEXT NOT NULL CHECK (export_type IN ('registrations', 'seating-plan')),
  paid_only INTEGER NOT NULL CHECK (paid_only IN (0, 1)),
  row_count INTEGER NOT NULL CHECK (row_count >= 0),
  actor_subject_sha256 TEXT NOT NULL CHECK (length(actor_subject_sha256) = 64),
  accessed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX idx_banquet_export_audit_accessed_at
  ON banquet_export_audit (accessed_at);
