import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const enabled = process.argv.includes('--enabled');
const eventFile = path.resolve('dist', 'events', 'induction-banquet', '2027-hall-of-fame-induction-banquet', 'index.html');
const registrationFile = path.resolve('dist', 'events', 'induction-banquet', '2027-hall-of-fame-induction-banquet', 'register', 'index.html');

assert(fs.existsSync(eventFile), 'Built 2027 banquet event page is missing.');
assert(fs.existsSync(registrationFile), 'Built dedicated registration route is missing.');

const eventHtml = fs.readFileSync(eventFile, 'utf8');
const registrationHtml = fs.readFileSync(registrationFile, 'utf8');

assert(!/<form\b/i.test(eventHtml), 'The inductee-centered event page must never embed the registration form.');
assert(registrationHtml.includes('<meta name="robots" content="noindex, follow">'), 'The feature-only registration route must be noindex.');
assert(registrationHtml.includes('Registration and payment are not open.'), 'The registration route must clearly state that registration is closed.');

if (enabled) {
  assert(eventHtml.includes('/2027-hall-of-fame-induction-banquet/register/'), 'Enabled preview event page must link to the dedicated registration route.');
  assert(registrationHtml.includes('data-banquet-registration-preview'), 'Enabled preview route must render the guarded registration component.');
  assert(/<form\b/i.test(registrationHtml), 'Enabled preview route must contain the draft form.');
} else {
  assert(!eventHtml.includes('Review draft registration'), 'Default event page must not expose the draft registration action.');
  assert(!/<form\b/i.test(registrationHtml), 'Default registration route must fail closed without a form.');
  assert(registrationHtml.includes('Registration preview unavailable'), 'Default registration route must explain that the preview is unavailable.');
}

console.log(`Validated the dedicated registration route (${enabled ? 'preview enabled' : 'preview disabled'}).`);
