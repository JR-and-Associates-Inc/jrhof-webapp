import assert from 'node:assert/strict';
import {
  attributionFromSearch,
  BANQUET_ATTRIBUTION_STORAGE_KEY,
  buildBanquetCampaignUrl,
  captureFirstTouchAttribution,
  emptyAttribution,
  resolveBanquetRegistrationOrigin,
} from '../src/scripts/banquet-attribution.mjs';

const parsed = attributionFromSearch('?utm_source=JRHOF%20Email&utm_medium=email&utm_campaign=banquet_2027&utm_content=save_the_date&gclid=not-stored');
assert.deepEqual(parsed, {
  source: 'JRHOF Email',
  medium: 'email',
  campaign: 'banquet_2027',
  content: 'save_the_date',
  term: null,
});
assert(!JSON.stringify(parsed).includes('gclid'));

const values = new Map();
const storage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { values.set(key, value); },
};
const first = captureFirstTouchAttribution('?utm_source=first&utm_medium=email', storage);
const second = captureFirstTouchAttribution('?utm_source=second&utm_medium=qr', storage);
assert.deepEqual(first, second, 'Session attribution must remain first-touch.');
assert.equal(JSON.parse(values.get(BANQUET_ATTRIBUTION_STORAGE_KEY)).source, 'first');

values.set(BANQUET_ATTRIBUTION_STORAGE_KEY, '{broken');
assert.deepEqual(captureFirstTouchAttribution('', storage), emptyAttribution());

values.set(BANQUET_ATTRIBUTION_STORAGE_KEY, JSON.stringify({
  source: 'email\u0000injected',
  medium: 'email',
  campaign: null,
  content: null,
  term: null,
}));
assert.deepEqual(
  captureFirstTouchAttribution('?utm_source=safe', storage),
  { ...emptyAttribution(), source: 'safe' },
  'Corrupt stored attribution must be discarded.',
);

const url = buildBanquetCampaignUrl('https://preview.example', {
  source: 'Board Member',
  medium: 'QR',
  campaign: 'Banquet 2027',
  content: 'Table Card',
  term: '',
});
assert.equal(
  url.href,
  'https://preview.example/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/?utm_source=board_member&utm_medium=qr&utm_campaign=banquet_2027&utm_content=table_card',
);

assert.equal(
  resolveBanquetRegistrationOrigin('https://jrhof-banquet-registration-board-preview.jr-and-associates-inc.workers.dev'),
  'https://jrhof-banquet-registration-remote-preview.jr-and-associates-inc.workers.dev',
  'Protected board links must resolve to the public guest preview.',
);
assert.equal(
  resolveBanquetRegistrationOrigin('https://jrhof.org'),
  'https://jrhof.org',
  'Same-origin production registration must remain native.',
);
assert.equal(resolveBanquetRegistrationOrigin('http://127.0.0.1:4321'), 'http://127.0.0.1:4321');

console.log('Validated first-touch banquet attribution and campaign URL generation.');
