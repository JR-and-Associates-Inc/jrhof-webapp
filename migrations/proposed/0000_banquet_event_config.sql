-- PROPOSED / LOCAL-PREVIEW-ONLY PHASE 2 MIGRATION
-- The seeded price, capacity, registration state, and retention-independent
-- values are illustrative test fixtures, not board-approved production data.

PRAGMA foreign_keys = ON;

CREATE TABLE banquet_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 160),
  configuration_status TEXT NOT NULL
    CHECK (configuration_status = 'preview_unapproved'),
  registration_open INTEGER NOT NULL DEFAULT 0
    CHECK (registration_open IN (0, 1)),
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 1000),
  ticket_unit_amount_cents INTEGER NOT NULL
    CHECK (ticket_unit_amount_cents BETWEEN 0 AND 1000000),
  donation_min_cents INTEGER NOT NULL DEFAULT 0
    CHECK (donation_min_cents >= 0),
  donation_max_cents INTEGER NOT NULL
    CHECK (donation_max_cents >= donation_min_cents),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  checkout_ttl_seconds INTEGER NOT NULL DEFAULT 3600
    CHECK (checkout_ttl_seconds BETWEEN 1800 AND 86400),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

INSERT INTO banquet_events (
  id,
  title,
  configuration_status,
  registration_open,
  capacity,
  ticket_unit_amount_cents,
  donation_min_cents,
  donation_max_cents,
  currency,
  checkout_ttl_seconds
) VALUES (
  'banquet-2027',
  '2027 Hall of Fame Induction Banquet — Preview Only',
  'preview_unapproved',
  1,
  300,
  8500,
  0,
  1000000,
  'usd',
  3600
);
