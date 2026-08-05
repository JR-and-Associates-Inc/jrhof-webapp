-- PROPOSED / PREVIEW-ONLY BOARD OPERATIONS MIGRATION
-- Do not apply to production. This adds launch-window controls, first-touch
-- campaign attribution, and privacy-safe audit records for the board dashboard.
-- Existing price, capacity, menu, and policy values remain unapproved fixtures.

ALTER TABLE banquet_events
  ADD COLUMN registration_opens_at TEXT;

ALTER TABLE banquet_events
  ADD COLUMN registration_closes_at TEXT;

ALTER TABLE banquet_events
  ADD COLUMN max_attendees_per_registration INTEGER NOT NULL DEFAULT 8
    CHECK (max_attendees_per_registration BETWEEN 1 AND 8);

ALTER TABLE banquet_reservations
  ADD COLUMN utm_source TEXT
    CHECK (utm_source IS NULL OR length(trim(utm_source)) BETWEEN 1 AND 100);

ALTER TABLE banquet_reservations
  ADD COLUMN utm_medium TEXT
    CHECK (utm_medium IS NULL OR length(trim(utm_medium)) BETWEEN 1 AND 100);

ALTER TABLE banquet_reservations
  ADD COLUMN utm_campaign TEXT
    CHECK (utm_campaign IS NULL OR length(trim(utm_campaign)) BETWEEN 1 AND 160);

ALTER TABLE banquet_reservations
  ADD COLUMN utm_content TEXT
    CHECK (utm_content IS NULL OR length(trim(utm_content)) BETWEEN 1 AND 160);

ALTER TABLE banquet_reservations
  ADD COLUMN utm_term TEXT
    CHECK (utm_term IS NULL OR length(trim(utm_term)) BETWEEN 1 AND 160);

CREATE INDEX idx_banquet_reservations_event_created
  ON banquet_reservations (event_id, created_at);

CREATE INDEX idx_banquet_reservations_event_source
  ON banquet_reservations (event_id, utm_source, utm_medium);

CREATE TABLE banquet_board_access_audit (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES banquet_events(id),
  access_type TEXT NOT NULL CHECK (access_type = 'dashboard'),
  actor_subject_sha256 TEXT NOT NULL CHECK (length(actor_subject_sha256) = 64),
  accessed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX idx_banquet_board_access_audit_accessed_at
  ON banquet_board_access_audit (accessed_at);
