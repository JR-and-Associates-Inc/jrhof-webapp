-- PROPOSED / UNAPPLIED PHASE 1 MIGRATION
-- Attendee IDs and reservation IDs must be generated server-side with Web Crypto.

CREATE TABLE banquet_attendees (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL
    REFERENCES banquet_reservations(id) ON DELETE CASCADE,
  attendee_position INTEGER NOT NULL CHECK (attendee_position BETWEEN 1 AND 8),
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 2 AND 100),
  meal_choice TEXT NOT NULL CHECK (meal_choice IN ('chicken', 'steak')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (reservation_id, attendee_position)
) STRICT;

CREATE INDEX idx_banquet_attendees_reservation
  ON banquet_attendees (reservation_id);
