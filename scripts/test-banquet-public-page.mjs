import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const eventFile = path.join(dist, 'events', 'induction-banquet', '2027-hall-of-fame-induction-banquet', 'index.html');
const privacyFile = path.join(dist, 'privacy-policy', 'index.html');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(fs.existsSync(eventFile), 'Built 2027 banquet page is missing. Run npm run build first.');
assert(fs.existsSync(privacyFile), 'Built Privacy Policy is missing. Run npm run build first.');

const eventHtml = fs.readFileSync(eventFile, 'utf8');
const privacyHtml = fs.readFileSync(privacyFile, 'utf8');
const seatingPolicy = 'Seating is open except for reserved seating for inductees and their invited guests. We will make reasonable efforts to accommodate group seating requests, but specific tables cannot be guaranteed.';

for (const expected of [
  'Saturday, February 6, 2027',
  'Holiday Inn Denver–Lakewood',
  '7390 W. Hampden Ave., Lakewood, CO 80227',
  'Registration opens soon',
  '2027 inductees will be announced soon.',
  'To be announced',
  seatingPolicy,
  'Get directions in Google Maps',
]) {
  assert(eventHtml.includes(expected), `2027 banquet page is missing: ${expected}`);
}

assert(!/<form\b/i.test(eventHtml), 'Public banquet page must not contain a registration or payment form.');
assert(!/checkout\.stripe\.com|\/api\/banquet|registrations\.csv/i.test(eventHtml), 'Public banquet page contains transactional implementation details.');
assert(!/<iframe[^>]+(?:google\.com\/maps|maps\.google)/i.test(eventHtml), 'No Maps Embed key is approved, so the public page must not ship a map iframe.');
assert(!/maps\/embed\/v1/i.test(eventHtml), 'Public page must not contain a Maps Embed request without a restricted key.');
assert(/https:\/\/www\.google\.com\/maps\/dir\/\?api=1&amp;destination=/i.test(eventHtml), 'Keyless Google Maps directions link is missing.');
assert(privacyHtml.includes('The site does not request your device location or contact Google Maps merely because you view the event page.'), 'Privacy Policy must disclose the optional Google Maps request.');

const jsonLdBlocks = [...eventHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const eventSchemas = jsonLdBlocks
  .flatMap((block) => block?.['@graph'] || (Array.isArray(block) ? block : [block]))
  .filter((entry) => entry?.['@type'] === 'Event');
assert(eventSchemas.length === 1, `Expected one Event schema, found ${eventSchemas.length}.`);
const eventSchema = eventSchemas[0];
assert(eventSchema.location?.['@type'] === 'Place', 'Event location must be a Place.');
assert(eventSchema.location?.address?.['@type'] === 'PostalAddress', 'Event address must be a PostalAddress.');
assert(eventSchema.location?.address?.streetAddress === '7390 W. Hampden Ave.', 'Event street address is incorrect.');
assert(!Object.hasOwn(eventSchema, 'offers'), 'Event schema must not include offers before registration and price approval.');

console.log('Validated the public 2027 banquet page, keyless directions fallback, privacy disclosure, and Event schema.');
