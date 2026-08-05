import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const enabled = process.argv.includes('--enabled');
const eventFile = path.resolve('dist', 'events', 'induction-banquet', '2027-hall-of-fame-induction-banquet', 'index.html');
const registrationFile = path.resolve('dist', 'events', 'induction-banquet', '2027-hall-of-fame-induction-banquet', 'register', 'index.html');
const boardFile = path.resolve('dist', 'board', 'banquet', 'index.html');
const previewComponentFile = path.resolve('src', 'components', 'BanquetRegistrationPreview.astro');

assert(fs.existsSync(eventFile), 'Built 2027 banquet event page is missing.');
assert(fs.existsSync(registrationFile), 'Built dedicated registration route is missing.');
assert(fs.existsSync(boardFile), 'Built board reporting route is missing.');

const eventHtml = fs.readFileSync(eventFile, 'utf8');
const registrationHtml = fs.readFileSync(registrationFile, 'utf8');
const boardHtml = fs.readFileSync(boardFile, 'utf8');
const previewComponent = fs.readFileSync(previewComponentFile, 'utf8');
const boardAssets = [...boardHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)]
  .map(([, source]) => source)
  .filter((source) => source.startsWith('/_astro/'))
  .map((source) => fs.readFileSync(path.resolve('dist', source.slice(1)), 'utf8'));
const emittedBoardPage = [boardHtml, ...boardAssets].join('\n');

for (const analyticsMarker of [
  'googletagmanager.com',
  'clarity.ms/tag',
  'window.dataLayer',
  'jrhofTrack',
]) {
  assert(!emittedBoardPage.includes(analyticsMarker), `Board route must exclude private analytics marker: ${analyticsMarker}`);
}

assert(!/<form\b/i.test(eventHtml), 'The inductee-centered event page must never embed the registration form.');
assert(registrationHtml.includes('<meta name="robots" content="noindex, follow">'), 'The feature-only registration route must be noindex.');
assert(boardHtml.includes('<meta name="robots" content="noindex, follow">'), 'The board reporting route must be noindex.');
assert(registrationHtml.includes('Preview only. Stripe test mode is enforced.'), 'The registration route must clearly identify the test-only payment boundary.');

if (enabled) {
  assert(eventHtml.includes('/2027-hall-of-fame-induction-banquet/register/'), 'Enabled preview event page must link to the dedicated registration route.');
  assert(registrationHtml.includes('data-banquet-registration-preview'), 'Enabled preview route must render the guarded registration component.');
  assert(/<form\b/i.test(registrationHtml), 'Enabled preview route must contain the draft form.');
  assert(previewComponent.includes('/api/banquet/confirmation?reference='), 'Enabled preview must verify the return against the server confirmation endpoint.');
  assert(previewComponent.includes("fetch('/api/banquet/config'"), 'Enabled preview must load server-authoritative price, meals, and capacity.');
  assert(previewComponent.includes('captureFirstTouchAttribution'), 'Enabled preview must carry first-touch UTM attribution into checkout.');
  assert(previewComponent.includes("jrhofTrack?.('registration_complete'"), 'Enabled preview must emit the completion signal only after server confirmation.');
  assert(!previewComponent.includes('CHECKOUT_SESSION_ID'), 'The browser route must not expose a Stripe Checkout Session ID.');
  assert(boardHtml.includes('data-banquet-dashboard'), 'Enabled preview must render the private board dashboard shell.');
  assert(emittedBoardPage.includes('/api/banquet/dashboard'), 'Enabled board preview must read the Access-protected aggregate endpoint.');
} else {
  assert(!eventHtml.includes('Review draft registration'), 'Default event page must not expose the draft registration action.');
  assert(!/<form\b/i.test(registrationHtml), 'Default registration route must fail closed without a form.');
  assert(registrationHtml.includes('Registration preview unavailable'), 'Default registration route must explain that the preview is unavailable.');
  assert(!boardHtml.includes('data-banquet-dashboard'), 'Default build must not render the board dashboard client.');
  assert(boardHtml.includes('Board preview unavailable'), 'Default board route must fail closed.');
}

console.log(`Validated the dedicated registration route (${enabled ? 'preview enabled' : 'preview disabled'}).`);
