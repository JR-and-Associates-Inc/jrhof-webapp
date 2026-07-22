import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const BANQUET_PREVIEW_BRANCH = 'feature/banquet-registration-checkout';
// The branch preview must never imply an unapproved ticket price. Operators may
// supply an explicit test-only value for a local full-stack review.
export const BANQUET_PREVIEW_TICKET_PRICE_CENTS = '0';

export function resolveBuildEnvironment(sourceEnvironment) {
  const environment = { ...sourceEnvironment };
  const isWorkersBuild = sourceEnvironment.WORKERS_CI === '1';
  const workersBranch = sourceEnvironment.WORKERS_CI_BRANCH || '';

  if (isWorkersBuild && workersBranch === BANQUET_PREVIEW_BRANCH) {
    environment.BANQUET_REGISTRATION_PREVIEW = 'true';
    environment.BANQUET_PREVIEW_TICKET_PRICE_CENTS = BANQUET_PREVIEW_TICKET_PRICE_CENTS;

    return {
      environment,
      message: '[build] Banquet draft enabled for the feature preview build.',
    };
  }

  if (isWorkersBuild) {
    delete environment.BANQUET_REGISTRATION_PREVIEW;
    delete environment.BANQUET_PREVIEW_TICKET_PRICE_CENTS;

    return {
      environment,
      message: '[build] Banquet draft disabled for this Cloudflare build.',
    };
  }

  return {
    environment,
    message: environment.BANQUET_REGISTRATION_PREVIEW === 'true'
      ? '[build] Banquet draft enabled by an explicit local preview flag.'
      : '[build] Banquet draft disabled for the default local build.',
  };
}

function run() {
  const { environment, message } = resolveBuildEnvironment(process.env);
  const astroCli = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
  console.log(message);

  const result = spawnSync(process.execPath, [astroCli, 'build', ...process.argv.slice(2)], {
    env: environment,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
