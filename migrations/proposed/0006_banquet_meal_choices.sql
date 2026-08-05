-- PROPOSED / PREVIEW-ONLY MEAL CHOICE UPDATE
-- The board confirmed Chicken and Steak as the two entree choices. Preparation,
-- sides, and menu descriptions remain pending and are intentionally null.

UPDATE banquet_events
SET meals_json = '[{"id":"chicken","name":"Chicken","description":null,"available":true,"accommodationNote":"Preparation and sides remain pending final board and caterer approval."},{"id":"steak","name":"Steak","description":null,"available":true,"accommodationNote":"Preparation and sides remain pending final board and caterer approval."}]',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'banquet-2027';
