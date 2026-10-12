// Acceptance tests for the lazy "Stay in the loop" newsletter sign-up (ADR-019).
// Run after `npm run build`; reads dist/.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
assert.ok(fs.existsSync(dist), 'Run npm run build before the newsletter tests.');
const read = (relative) => fs.readFileSync(path.join(dist, relative), 'utf8');

const consent = 'We’ll email news about inductions and events. Unsubscribe anytime.';
const pages = [
  ['index.html', 'home'],
  ['events/index.html', 'events_hub'],
  ['events/golf/index.html', 'golf_index'],
  ['events/induction-banquet/index.html', 'banquet_index'],
  ['events/archive/index.html', 'events_archive'],
  ['events/golf/2026-umpires-cup-iv/index.html', 'golf-2026'],
  ['events/induction-banquet/2026-hall-of-fame-induction-banquet/index.html', 'banquet-2026'],
  ['donate/index.html', 'donate'],
];

for (const [relative, context] of pages) {
  const html = read(relative);
  const sections = [...html.matchAll(/<section class="newsletter-signup"[\s\S]*?<\/section>/g)].map(([section]) => section);
  assert.equal(sections.length, 1, `${relative}: expected one newsletter sign-up`);
  const section = sections[0];
  const wrapper = section.match(/<div\b[^>]*\bdata-zeffy-wrapper\b[^>]*>/)?.[0] ?? '';
  assert.match(wrapper, /data-zeffy-conversion="newsletter_signup"/, `${relative}: the sign-up must count newsletter_signup`);
  assert.match(wrapper, /data-zeffy-lazy="true"/, `${relative}: the sign-up must load lazily`);
  assert.match(wrapper, /data-zeffy-form-url="\/en-US\/embed\/newsletter-form\/stay-in-the-loop-16"/, `${relative}: wrong newsletter form`);
  assert.ok(wrapper.replaceAll('&quot;', '"').includes(`"cta_location":"${context}"`), `${relative}: cta_location must be ${context}`);

  // Lazy: nothing from Zeffy loads with the page. The embed element, the iframe
  // source and the script tag appear only after scroll or click.
  assert.ok(!/<[a-z]+\b[^>]*\sdata-zeffy-embed[\s>=]/.test(section), `${relative}: the newsletter embed must not be in the initial HTML`);
  assert.ok(!/<iframe\b[^>]*\ssrc="https:\/\/www\.zeffy\.com/.test(section), `${relative}: the newsletter iframe must not load with the page`);
  assert.match(section, /<button type="button"[^>]*data-zeffy-load[^>]*>Sign up for email news<\/button>/, `${relative}: the click-to-load button is missing`);
  if (relative !== 'donate/index.html') {
    assert.ok(!/<script\b[^>]*src="https:\/\/www\.zeffy\.com/.test(html), `${relative}: Zeffy's script must not load with the page`);
    assert.ok(!/<[a-z]+\b[^>]*\sdata-zeffy-embed[\s>=]/.test(html), `${relative}: no Zeffy form may load with the page`);
  }

  // Consent line and privacy link sit next to the form.
  assert.ok(section.includes(consent), `${relative}: consent line is missing`);
  assert.match(section, /<a href="\/privacy-policy\/#newsletter"[^>]*>Privacy Policy<\/a>/, `${relative}: privacy link is missing`);
  assert.ok(!/href="https?:\/\/(?:www\.)?zeffy\.com/.test(section), `${relative}: the sign-up must not link out to Zeffy`);
}

// The 2027 banquet page keeps one primary call to action (no sign-up there).
assert.ok(!read('events/induction-banquet/2027-hall-of-fame-induction-banquet/index.html').includes('<section class="newsletter-signup"'), 'The 2027 banquet page must not carry the sign-up.');

// The privacy policy explains sign-ups at the linked anchor.
const privacy = read('privacy-policy/index.html');
assert.match(privacy, /<h2 id="newsletter"[^>]*>Email news sign-up<\/h2>/);
assert.ok(privacy.includes('first name, last name, and email address'), 'The privacy policy must say what the sign-up collects.');

// Every page may load Zeffy's script and iframe (the sign-up); payment stays scoped.
const headers = fs.readFileSync(path.join(root, 'public/_headers'), 'utf8');
const blocks = headers.split(/\n(?=\S)/);
const sitePolicy = blocks.find((block) => block.startsWith('/*\n'))?.match(/Content-Security-Policy: (.+)/)?.[1] ?? '';
for (const directive of ['script-src', 'frame-src']) {
  const sources = sitePolicy.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${directive} `)) ?? '';
  assert.ok(new Set(sources.split(/\s+/)).has('https://www.zeffy.com'), `Site-wide ${directive} must allow https://www.zeffy.com for the sign-up`);
}
assert.match(blocks.find((block) => block.startsWith('/*\n')) ?? '', /payment=\(\)/, 'The site-wide Permissions-Policy must keep payment off.');

console.log(`Newsletter tests passed on ${pages.length} pages: lazy Zeffy embed, newsletter_signup, consent line and privacy link, CSP.`);
