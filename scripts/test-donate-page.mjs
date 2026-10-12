// Acceptance tests for /donate/ on Zeffy (ADR-019). Run after `npm run build`; reads dist/.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
assert.ok(fs.existsSync(dist), 'Run npm run build before the donate page tests.');

const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (/\.(html|js|css|txt|xml|json|webmanifest)$|^_headers$|^_redirects$/.test(entry.name)) files.push(filename);
  }
};
walk(dist);

// Stripe and Eventbrite are gone from everything the site ships.
for (const filename of files) {
  const text = fs.readFileSync(filename, 'utf8').toLowerCase();
  const relative = path.relative(dist, filename);
  assert.ok(!text.includes('stripe.com'), `${relative}: contains a stripe.com URL`);
  assert.ok(!text.includes('eventbrite.com'), `${relative}: contains an eventbrite.com URL`);
  assert.ok(!/[?&]cs=|donation_return|cs_live_/.test(text), `${relative}: still contains the retired Stripe return logic`);
}

const html = fs.readFileSync(path.join(dist, 'donate/index.html'), 'utf8');
const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';

// The page embeds the Zeffy donation form and counts donation_complete.
const wrappers = [...main.matchAll(/<div\b[^>]*\bdata-zeffy-wrapper\b[^>]*>/g)].map(([tag]) => tag);
assert.equal(wrappers.length, 1, 'The donate page must embed exactly one Zeffy form.');
assert.match(wrappers[0], /data-zeffy-conversion="donation_complete"/);
assert.match(main, /data-form-url="\/embed\/donation-form\/help-preserve-colorados-umpiring-legacy"/, 'The donate page must embed the JRHOF donation form.');
assert.ok(html.includes('https://www.zeffy.com/embed/v2/zeffy-embed.js'), 'The Zeffy v2 embed script must be referenced.');

// No link-outs: Ad Grants visitors give on jrhof.org, never on zeffy.com.
for (const [tag] of main.matchAll(/<a\b[^>]*>/g)) {
  assert.ok(!/href="https?:\/\/(?:www\.)?zeffy\.com/i.test(tag), `The donate page links out to Zeffy: ${tag}`);
  assert.ok(!/target="_blank"/.test(tag), `Unexpected new-tab link on the donate page: ${tag}`);
}

// The page keeps its own indexable copy: why give, what gifts preserve, organization and EIN.
for (const phrase of ['Why Giving Matters', 'What Support Helps Preserve', 'The Inductee Record', 'Organization Information', 'EIN:', '33-1883765', '501(c)(3)']) {
  assert.ok(main.includes(phrase), `The donate page lost its copy: ${phrase}`);
}
assert.match(main, /optional contribution to Zeffy, which you can change to \$0/, 'The fine print must explain Zeffy\'s optional contribution.');
assert.ok(!/noindex/i.test(html.match(/<meta name="robots"[^>]*>/)?.[0] ?? ''), 'The donate page must stay indexable.');
assert.ok(fs.readFileSync(path.join(dist, 'sitemap-0.xml'), 'utf8').includes('<loc>https://jrhof.org/donate/</loc>'), 'The donate page must stay in the sitemap.');

// The retired Stripe return pages redirect to /donate/ and are not built.
const redirects = fs.readFileSync(path.join(root, 'public/_redirects'), 'utf8');
for (const retired of ['/donate/thank-you/', '/donate/return/']) {
  assert.ok(redirects.includes(`${retired} /donate/ 301`), `${retired} must redirect to /donate/`);
  assert.ok(!fs.existsSync(path.join(dist, retired, 'index.html')), `${retired} must not be built`);
}

// Edge headers: only pages with a Zeffy form may load Zeffy; no Stripe or Eventbrite anywhere.
const headers = fs.readFileSync(path.join(root, 'public/_headers'), 'utf8');
const policyFor = (matcher) => headers.split(/\n(?=\S)/).find((block) => block.startsWith(`${matcher}\n`))?.match(/Content-Security-Policy: (.+)/)?.[1] ?? '';
const donatePolicy = policyFor('/donate/');
assert.ok(donatePolicy, '/donate/ needs its own Content-Security-Policy');
for (const directive of ['script-src', 'frame-src']) {
  const sources = donatePolicy.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${directive} `)) ?? '';
  assert.ok(sources.split(/\s+/).includes('https://www.zeffy.com'), `/donate/ ${directive} must allow https://www.zeffy.com`);
}
const sitePolicy = policyFor('/*');
assert.ok(sitePolicy && !sitePolicy.includes('zeffy.com'), 'The site-wide CSP must not allow Zeffy.');
assert.ok(!/stripe\.com|eventbrite\.com/i.test(headers), '_headers still allows Stripe or Eventbrite.');
assert.match(sitePolicy, /form-action 'self';/, 'The site-wide form-action must be self only.');

// Past golf tournaments say they have ended and offer nothing to buy.
for (const slug of ['2024-umpires-cup-ii', '2025-umpires-cup-iii', '2026-umpires-cup-iv']) {
  const golf = fs.readFileSync(path.join(dist, 'events/golf', slug, 'index.html'), 'utf8');
  assert.ok(golf.includes('This tournament has ended, and registration is closed.'), `${slug}: missing the "has ended" wording`);
  assert.ok(!/golf_register_click|event_register_click|raffle|mulligan/i.test(golf), `${slug}: still offers a purchase`);
}

console.log(`Donate page tests passed: Zeffy donation embed, no link-outs, indexable copy, retired Stripe pages redirect, CSP, and no Stripe or Eventbrite URL in ${files.length} built files.`);
