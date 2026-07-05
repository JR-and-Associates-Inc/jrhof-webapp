import assert from 'node:assert/strict';
import {
  BANQUET_PREVIEW_BRANCH,
  BANQUET_PREVIEW_TICKET_PRICE_CENTS,
  resolveBuildEnvironment,
} from './build-site.mjs';

const defaultBuild = resolveBuildEnvironment({});
assert.equal(defaultBuild.environment.BANQUET_REGISTRATION_PREVIEW, undefined);
assert.equal(defaultBuild.environment.BANQUET_PREVIEW_TICKET_PRICE_CENTS, undefined);

const explicitLocalPreview = resolveBuildEnvironment({
  BANQUET_REGISTRATION_PREVIEW: 'true',
  BANQUET_PREVIEW_TICKET_PRICE_CENTS: '9000',
});
assert.equal(explicitLocalPreview.environment.BANQUET_REGISTRATION_PREVIEW, 'true');
assert.equal(explicitLocalPreview.environment.BANQUET_PREVIEW_TICKET_PRICE_CENTS, '9000');

const protectedFeaturePreview = resolveBuildEnvironment({
  WORKERS_CI: '1',
  WORKERS_CI_BRANCH: BANQUET_PREVIEW_BRANCH,
  BANQUET_REGISTRATION_PREVIEW: 'false',
  BANQUET_PREVIEW_TICKET_PRICE_CENTS: '1',
});
assert.equal(protectedFeaturePreview.environment.BANQUET_REGISTRATION_PREVIEW, 'true');
assert.equal(
  protectedFeaturePreview.environment.BANQUET_PREVIEW_TICKET_PRICE_CENTS,
  BANQUET_PREVIEW_TICKET_PRICE_CENTS,
);

for (const branch of ['main', 'another-preview-branch', '']) {
  const nonFeatureCloudflareBuild = resolveBuildEnvironment({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: branch,
    BANQUET_REGISTRATION_PREVIEW: 'true',
    BANQUET_PREVIEW_TICKET_PRICE_CENTS: '8500',
  });
  assert.equal(nonFeatureCloudflareBuild.environment.BANQUET_REGISTRATION_PREVIEW, undefined);
  assert.equal(nonFeatureCloudflareBuild.environment.BANQUET_PREVIEW_TICKET_PRICE_CENTS, undefined);
}

console.log('Validated the banquet preview build boundary.');
