-- PROPOSED / PREVIEW-ONLY TICKET PRICE UPDATE
-- TJ identified $70 per seat as the current board-review candidate. This does
-- not change configuration_status, approve the price, or authorize live sales.
-- Existing reservation rows retain their original price snapshots.

UPDATE banquet_events
SET ticket_unit_amount_cents = 7000,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'banquet-2027'
  AND configuration_status = 'preview_unapproved';
