import { env } from 'cloudflare:workers';
import { applyD1Migrations, type D1Migration } from 'cloudflare:test';
import { beforeAll, beforeEach } from 'vitest';

type TestEnv = Env & { TEST_MIGRATIONS: D1Migration[] };
const testEnv = env as TestEnv;

beforeAll(async () => {
  await applyD1Migrations(testEnv.BANQUET_DB, testEnv.TEST_MIGRATIONS);
});

beforeEach(async () => {
  await testEnv.BANQUET_DB.batch([
    testEnv.BANQUET_DB.prepare('DELETE FROM banquet_payment_alerts'),
    testEnv.BANQUET_DB.prepare('DELETE FROM banquet_webhook_events'),
    testEnv.BANQUET_DB.prepare('DELETE FROM banquet_attendees'),
    testEnv.BANQUET_DB.prepare('DELETE FROM banquet_reservations'),
    testEnv.BANQUET_DB.prepare(`
      UPDATE banquet_events
      SET registration_open = 1,
          capacity = 300,
          ticket_unit_amount_cents = 8500,
          donation_min_cents = 0,
          donation_max_cents = 1000000,
          currency = 'usd',
          checkout_ttl_seconds = 3600
      WHERE id = 'banquet-2027'
    `),
  ]);
});
