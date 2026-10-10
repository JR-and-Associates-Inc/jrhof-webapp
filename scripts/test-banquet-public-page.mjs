import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const eventFile = path.join(dist, 'events', 'induction-banquet', '2027-hall-of-fame-induction-banquet', 'index.html');
const privacyFile = path.join(dist, 'privacy-policy', 'index.html');
const registerFile = path.join(dist, 'events', 'induction-banquet', '2027-hall-of-fame-induction-banquet', 'register', 'index.html');
const confirmationFile = path.join(dist, 'registration', 'confirmed', 'index.html');
const registerPath = '/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/';
const headersFile = path.resolve('public', '_headers');
const mapComponentFile = path.resolve('src', 'components', 'VenueLocation.astro');
const heroAssetFile = path.resolve('public', 'images', 'events', 'banquet-2027-hero.jpg');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(fs.existsSync(eventFile), 'Built 2027 banquet page is missing. Run npm run build first.');
assert(fs.existsSync(privacyFile), 'Built Privacy Policy is missing. Run npm run build first.');
assert(fs.existsSync(registerFile), 'Built 2027 banquet registration page is missing.');
assert(fs.existsSync(confirmationFile), 'Built registration confirmation page is missing.');
assert(fs.existsSync(heroAssetFile), 'Dedicated 2027 banquet hero artwork is missing.');

const eventHtml = fs.readFileSync(eventFile, 'utf8');
const privacyHtml = fs.readFileSync(privacyFile, 'utf8');
const registerHtml = fs.readFileSync(registerFile, 'utf8');
const confirmationHtml = fs.readFileSync(confirmationFile, 'utf8');
// Launch day flips src/data/events.ts to registration 'open'; this test follows.
const registrationOpen = eventHtml.includes('>Register now</a>');
// The seat price is public only after the board approves it (src/data/registrations.ts).
const registrationsSource = fs.readFileSync(path.resolve('src', 'data', 'registrations.ts'), 'utf8');
const banquetConfig = registrationsSource.slice(registrationsSource.indexOf("id: 'banquet-2027'"));
const banquetSettings = banquetConfig.slice(0, banquetConfig.indexOf('refundPolicy'));
const priceApproved = /priceApproved:\s*true/.test(banquetSettings);
const seatPriceCents = Number(banquetSettings.match(/seatPriceCents:\s*(\d+)/)?.[1]);
assert(Number.isInteger(seatPriceCents) && seatPriceCents > 0, 'Unable to read seatPriceCents from src/data/registrations.ts');
const seatPrice = `$${seatPriceCents % 100 ? (seatPriceCents / 100).toFixed(2) : (seatPriceCents / 100).toLocaleString('en-US')}`;
const headers = fs.readFileSync(headersFile, 'utf8');
const mapComponent = fs.readFileSync(mapComponentFile, 'utf8');
const seatingPolicy = 'Seating is open except for reserved seating for inductees and their invited guests. We will make reasonable efforts to accommodate group seating requests, but specific tables cannot be guaranteed.';

for (const expected of [
  'Saturday, February 6, 2027',
  'Holiday Inn Denver–Lakewood',
  '7390 W. Hampden Ave., Lakewood, CO 80227',
  registrationOpen ? 'Registration is open' : 'Registration opens Monday, November 16, 2026',
  'Chicken or Steak',
  'One registration covers up to 8 guests, a full table.',
  '2027 inductees will be announced soon.',
  'To be announced',
  seatingPolicy,
  'Get directions in Google Maps',
  'Visit the hotel website',
  '/images/events/banquet-2027-hero.jpg',
  'A banquet built around the inductees.',
  'Show up for the people who gave so much to the game.',
]) {
  assert(eventHtml.includes(expected), `2027 banquet page is missing: ${expected}`);
}

assert(!/<form\b/i.test(eventHtml), 'The event page links to the registration form; it must not contain one.');
assert(!/checkout\.stripe\.com|\/api\/|\/board\/|attendees\.csv/i.test(eventHtml), 'Public banquet page contains transactional implementation details.');
assert(eventHtml.includes(`href="${registerPath}"`) === registrationOpen, 'The Register button must appear exactly when registration is open.');
assert(!eventHtml.includes('Registration coming soon'), 'Registration coming soon copy should be replaced by the opening date.');
assert(!/<iframe[^>]+(?:google\.com\/maps|maps\.google)/i.test(eventHtml), 'Google Maps iframe must not exist before the venue approaches the viewport.');
assert(!/maps\/embed\/v1|AIza[A-Za-z0-9_-]{30,}/i.test(eventHtml), 'Public page must not contain a Maps Embed API request or API key.');
assert(/data-map-src="https:\/\/www\.google\.com\/maps\?q=[^"]+&amp;output=embed"/i.test(eventHtml), 'Keyless deferred Google Maps source is missing.');
assert(/https:\/\/www\.google\.com\/maps\/dir\/\?api=1&amp;destination=/i.test(eventHtml), 'Keyless Google Maps directions link is missing.');
const venueWebsiteHref = eventHtml.match(/<a\b[^>]*href="([^"]+)"[^>]*>Visit the hotel website<\/a>/i)?.[1];
assert(venueWebsiteHref, 'Official Holiday Inn venue link is missing.');
const venueWebsiteUrl = new URL(venueWebsiteHref.replaceAll('&amp;', '&'));
assert(venueWebsiteUrl.protocol === 'https:', 'Venue website must use HTTPS.');
assert(venueWebsiteUrl.hostname === 'www.ihg.com', 'Venue website must use the official IHG hostname.');
assert(venueWebsiteUrl.pathname === '/holidayinn/hotels/us/en/lakewood/denlw/hoteldetail', 'Venue website path is incorrect.');
assert((eventHtml.match(/data-ga-event="external_partner_click"/g) || []).length >= 3, 'Venue and directions links must use the approved external-partner analytics event.');
assert(eventHtml.includes('data-ga-event="contact_click"'), 'Banquet contact link must use the approved contact analytics event.');
assert(!eventHtml.includes('The hotel is the banquet venue'), 'Visible venue copy must not include the removed business-address disclaimer.');
assert(privacyHtml.includes('the embedded map loads when the venue section approaches the visitor’s screen'), 'Privacy Policy must disclose the viewport-triggered Google Maps request.');
assert(!eventHtml.includes('2026-hall-of-fame-induction-banquet/hero.webp'), 'The 2027 page must not reuse the 2026 banquet hero image.');
const mainHtml = eventHtml.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
assert(!/>Donate</i.test(mainHtml), 'The 2027 event body must not repeat the site Donate call to action.');
assert(!mainHtml.includes('Support the Hall of Fame'), 'The 2027 event body must not repeat a generic support panel.');
assert(fs.statSync(heroAssetFile).size < 450 * 1024, 'The 2027 hero asset must remain below 450 KB.');
assert(!mapComponent.includes('PUBLIC_GOOGLE_MAPS_EMBED_API_KEY'), 'Keyless map must not depend on a Google Cloud API key.');
assert(mapComponent.includes('&output=embed'), 'Map component must use the standard keyless Google Maps sharing embed.');
assert(mapComponent.includes("new IntersectionObserver"), 'Google Maps iframe must be deferred until the venue approaches the viewport.');
assert(mapComponent.includes("{ rootMargin: '320px 0px' }"), 'Google Maps viewport preload margin is missing.');
assert(mapComponent.includes("iframe.referrerPolicy = 'strict-origin-when-cross-origin'"), 'Map iframe must use the required referrer policy.');
assert(/frame-src[^;]*https:\/\/www\.google\.com/.test(headers), 'CSP must allow only the required Google Maps frame origin.');

const jsonLdBlocks = [...eventHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const eventSchemas = jsonLdBlocks
  .flatMap((block) => block?.['@graph'] || (Array.isArray(block) ? block : [block]))
  .filter((entry) => entry?.['@type'] === 'Event');
assert(eventSchemas.length === 1, `Expected one Event schema, found ${eventSchemas.length}.`);
const eventSchema = eventSchemas[0];
assert(eventSchema.location?.['@type'] === 'Place', 'Event location must be a Place.');
assert(eventSchema.location?.address?.['@type'] === 'PostalAddress', 'Event address must be a PostalAddress.');
assert(eventSchema.location?.address?.streetAddress === '7390 W. Hampden Ave.', 'Event street address is incorrect.');
assert(eventSchema.location?.url === 'https://www.ihg.com/holidayinn/hotels/us/en/lakewood/denlw/hoteldetail', 'Event Place must link to the official venue page.');
assert(eventSchema.image?.[0] === 'https://jrhof.org/images/events/banquet-2027-hero.jpg', 'Event schema must use the dedicated absolute 2027 hero image URL.');
if (priceApproved) {
  assert(eventHtml.includes(`${seatPrice} per seat`), 'The approved seat price must appear on the event page.');
} else {
  assert(!eventHtml.includes(seatPrice), 'The seat price must not be published before the board approves it.');
}

if (registrationOpen && priceApproved) {
  assert(eventSchema.offers?.price === (seatPriceCents / 100).toFixed(2) && eventSchema.offers?.priceCurrency === 'USD', 'Open registration must publish the seat price Offer.');
  assert(eventSchema.offers?.url === `https://jrhof.org${registerPath}`, 'The Offer must link to the registration form.');
} else {
  assert(!Object.hasOwn(eventSchema, 'offers'), 'Event schema must not include offers before registration opens with an approved price.');
}

// Registration form: plain HTML post to the Worker, priced and validated server-side.
for (const expected of [
  'action="/api/registration/checkout"',
  'name="event_id" value="banquet-2027"',
  'name="purchaser_name"', 'name="purchaser_email"', 'name="purchaser_phone"',
  'name="guest_8_name"', 'name="guest_8_dietary"',
  'name="seating_request"', 'name="donation"', 'name="agree" value="yes"',
  'data-clarity-mask="true"',
  'data-guest1-hint',
  'data-donation-presets',
  'Add another guest',
  'Full refunds are available until registration closes on Friday, January 29, 2027.',
  'Continue to secure payment',
]) {
  assert(registerHtml.includes(expected), `Registration page is missing: ${expected}`);
}
assert(!registerHtml.includes('name="guest_9_name"'), 'Registration must allow at most 8 guests.');
assert((registerHtml.match(/name="guest_1_meal" value="(chicken|steak)"/g) || []).length === 2, 'Each guest must choose Chicken or Steak.');
assert(/<meta name="robots" content="noindex/i.test(registerHtml), 'The registration form must be noindex.');
assert(!/sk_(test|live)_|rk_(test|live)_|BOARD_PASSWORD/.test(registerHtml + confirmationHtml), 'Secrets must never reach the static site.');
assert(!/name="(price|amount|total)/i.test(registerHtml), 'Prices are set by the Worker, never by the form.');

// Confirmation: registration_complete only after the Worker confirms payment with Stripe.
assert(/<meta name="robots" content="noindex/i.test(confirmationHtml), 'The registration confirmation must be noindex.');
const confirmationScripts = [...confirmationHtml.matchAll(/<script\b[^>]*src="([^"]+)"/g)]
  .map((match) => fs.readFileSync(path.join(dist, match[1]), 'utf8'))
  .join('\n') + confirmationHtml;
for (const marker of ['/api/registration/confirm', 'registration_complete', 'registration_complete_test', 'transaction_id', 'jrhof:registration_complete:']) {
  assert(confirmationScripts.includes(marker), `Confirmation page is missing ${marker}`);
}
assert(privacyHtml.includes('each guest’s name, meal choice, and any dietary note'), 'Privacy Policy must describe event registration data.');

console.log(`Validated the public 2027 banquet page (registration ${registrationOpen ? 'open' : 'not yet open'}, price ${priceApproved ? 'approved' : 'not yet approved'}), registration form, confirmation page, keyless viewport-loaded map, directions fallback, privacy disclosure, and Event schema.`);
