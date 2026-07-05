import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

const migrations = await readD1Migrations('./migrations/proposed');

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: './workers/banquet-registration/index.ts',
      wrangler: { configPath: './wrangler.banquet-preview.jsonc' },
      miniflare: {
        bindings: {
          STRIPE_SECRET_KEY: 'sk_test_unit_test_only',
          STRIPE_WEBHOOK_SECRET: 'whsec_unit_test_only',
          TEST_MIGRATIONS: migrations,
        },
      },
    }),
  ],
  test: {
    include: ['./workers/banquet-registration/**/*.test.ts'],
    setupFiles: ['./workers/banquet-registration/test/setup.ts'],
  },
});
