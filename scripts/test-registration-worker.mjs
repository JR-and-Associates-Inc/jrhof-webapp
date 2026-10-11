// Runtime tests for the registration Worker (worker/). Runs the real handler
// against an in-memory fake of the four Stripe endpoints it uses.
// Run with: node scripts/test-registration-worker.mjs (Node 22.18+ strips TS types).

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { campaignLabel, campaignUrl, firstTaggedTouch, readAttribution, UTM_FIELDS } from '../src/lib/registration-attribution.ts';
import { createHandler, registrationState } from '../worker/index.ts';
import { csvCell, needsAttention, registrationsCsv, toOrder } from '../worker/orders.ts';
import { findRegistration, seatPriceAt } from '../src/data/registrations.ts';

const event = findRegistration('banquet-2027');
const configuredEarlyBird = event.earlyBird;
delete event.earlyBird;
// Fix the seat price for these tests so the expected totals below don't change
// whenever the proposed price in src/data/registrations.ts does.
event.seatPriceCents = 7000;
const ORIGIN = 'https://jrhof.org';
const OPEN_NOW = Date.parse('2026-12-01T12:00:00-07:00');
const ACCESS_TEAM = 'jrhof-test.cloudflareaccess.com';
const ACCESS_AUD = 'board-application-audience';
const accessKeys = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const publicKey = { ...await crypto.subtle.exportKey('jwk', accessKeys.publicKey), kid: 'test-key', alg: 'RS256' };
const base64url = (value) => Buffer.from(value).toString('base64url');
async function accessToken(claims = {}, header = {}) {
  const body = `${base64url(JSON.stringify({ alg: 'RS256', kid: 'test-key', ...header }))}.${base64url(JSON.stringify({
    iss: `https://${ACCESS_TEAM}`, aud: [ACCESS_AUD], email: 'board@jrhof.org',
    sub: 'board-member', type: 'app', iat: OPEN_NOW / 1000, exp: OPEN_NOW / 1000 + 43200, ...claims,
  }))}`;
  return `${body}.${base64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', accessKeys.privateKey, new TextEncoder().encode(body)))}`;
}
let tests = 0;

// Read the quoted CSV format, including embedded commas, quotes and newlines.
function csvRecords(csv) {
  const rows = []; let row = [];
  for (const match of csv.replace(/^\uFEFF/, '').matchAll(/"((?:[^"]|"")*)"(,|\r\n)/g)) {
    row.push(match[1].replaceAll('""', '"'));
    if (match[2] === '\r\n') { rows.push(row); row = []; }
  }
  const [header, ...values] = rows;
  return values.map((cells) => {
    assert.equal(cells.length, header.length);
    return Object.fromEntries(header.map((name, index) => [name, cells[index]]));
  });
}

function fakeStripe() {
  const sessions = new Map();
  const created = [];
  const calls = { list: 0 };
  let counter = 0;

  const paymentIntentFor = (session) => session.payment_intent;
  const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const view = (session) => ({ ...session, payment_intent: paymentIntentFor(session) });

  const fetcher = async (input, init = {}) => {
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://api.stripe.com');
    assert.match(init.headers.Authorization, /^Bearer (sk|rk)_(test|live)_/);
    assert.equal(init.headers['Stripe-Version'], '2026-08-26.dahlia');
    const path = url.pathname.replace('/v1', '');

    if (init.method === 'POST' && path === '/checkout/sessions') {
      const form = new URLSearchParams(init.body);
      created.push(form);
      counter += 1;
      const lineTotals = [];
      for (let index = 0; form.has(`line_items[${index}][quantity]`); index += 1) {
        lineTotals.push(Number(form.get(`line_items[${index}][quantity]`)) * Number(form.get(`line_items[${index}][price_data][unit_amount]`)));
      }
      const pick = (prefix) => Object.fromEntries([...form].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length, -1), value]));
      const session = {
        id: `cs_test_session${String(counter).padStart(6, '0')}`,
        url: `https://checkout.stripe.com/c/pay/cs_test_session${counter}`,
        livemode: false,
        created: Math.floor(OPEN_NOW / 1000) + counter,
        expires_at: Number(form.get('expires_at')),
        status: 'open',
        payment_status: 'unpaid',
        amount_total: lineTotals.reduce((a, b) => a + b, 0),
        currency: 'usd',
        customer_email: form.get('customer_email'),
        customer_details: null,
        metadata: pick('metadata['),
        payment_intent: null,
        pendingPaymentIntentMetadata: pick('payment_intent_data[metadata]['),
      };
      sessions.set(session.id, session);
      return respond(view(session));
    }
    if (init.method === 'GET' && path === '/checkout/sessions') {
      calls.list += 1;
      assert.equal(url.searchParams.get('expand[0]'), 'data.payment_intent.latest_charge');
      const since = Number(url.searchParams.get('created[gte]'));
      return respond({ data: [...sessions.values()].filter((session) => session.created >= since).reverse().map(view), has_more: false });
    }
    if (init.method === 'GET' && path.startsWith('/checkout/sessions/')) {
      const session = sessions.get(decodeURIComponent(path.split('/').pop()));
      return session ? respond(view(session)) : respond({ error: { message: 'No such checkout.session' } }, 404);
    }
    if (init.method === 'POST' && path.startsWith('/payment_intents/')) {
      const id = decodeURIComponent(path.split('/').pop());
      const session = [...sessions.values()].find((candidate) => candidate.payment_intent?.id === id);
      if (!session) return respond({ error: { message: 'No such payment_intent' } }, 404);
      for (const [key, value] of new URLSearchParams(init.body)) {
        const name = key.slice('metadata['.length, -1);
        if (value === '') delete session.payment_intent.metadata[name];
        else session.payment_intent.metadata[name] = value;
      }
      return respond(session.payment_intent);
    }
    throw new Error(`Unexpected Stripe call ${init.method} ${url}`);
  };

  return {
    fetcher,
    created,
    sessions,
    calls,
    pay(id, email = 'buyer@example.com') {
      const session = sessions.get(id);
      session.status = 'complete';
      session.payment_status = 'paid';
      session.customer_details = { email, name: 'Card Holder' };
      session.payment_intent = {
        id: id.replace('cs_', 'pi_'),
        status: 'succeeded',
        metadata: { ...session.pendingPaymentIntentMetadata },
        latest_charge: { id: id.replace('cs_', 'ch_'), amount: session.amount_total, amount_refunded: 0, refunded: false, disputed: false },
      };
      return session;
    },
    refund(id, amount) {
      const charge = sessions.get(id).payment_intent.latest_charge;
      charge.amount_refunded += amount;
      charge.refunded = charge.amount_refunded >= charge.amount;
    },
    expire(id) {
      sessions.get(id).status = 'expired';
    },
  };
}

function setup({ now = OPEN_NOW, key = 'sk_test_example', limiter, origin = ORIGIN } = {}) {
  const stripe = fakeStripe();
  const clock = { now };
  const fetcher = async (input, init) => String(input) === `https://${ACCESS_TEAM}/cdn-cgi/access/certs`
    ? Response.json({ keys: [publicKey] }) : stripe.fetcher(input, init);
  const handler = createHandler({ fetcher, now: () => clock.now });
  const assetsRequests = [];
  const env = {
    ASSETS: { fetch: async (request) => { assetsRequests.push(request.url); return new Response('static'); } },
    STRIPE_SECRET_KEY: key,
    STRIPE_PREVIEW_SECRET_KEY: '',
    BOARD_ACCESS_TEAM_DOMAIN: ACCESS_TEAM,
    BOARD_ACCESS_AUD: ACCESS_AUD,
    STRIPE_WEBHOOK_SECRET: 'whsec_test_example',
    CHECKOUT_LIMITER: limiter,
  };
  const call = (path, init = {}) => handler.fetch(new Request(`${origin}${path}`, init), env);
  return { stripe, call, assetsRequests, env, clock };
}

function registrationForm(overrides = {}) {
  return new URLSearchParams({
    event_id: 'banquet-2027',
    purchaser_name: 'Pat Purchaser',
    purchaser_email: 'Pat@Example.com',
    purchaser_phone: '(303) 555-0142',
    guest_1_name: 'Pat Purchaser',
    guest_1_meal: 'chicken',
    guest_1_dietary: 'No dietary restrictions',
    guest_2_name: 'Sam Guest',
    guest_2_meal: 'steak',
    guest_2_dietary: 'No mushrooms',
    guest_3_name: 'Lee Guest',
    guest_3_meal: 'chicken',
    guest_3_dietary: 'No dietary restrictions',
    seating_request: 'Near the Smith party',
    donation: '25',
    agree: 'yes',
    ga_client_id: '123456789.1700000000',
    ...overrides,
  });
}

const post = (form, { json = true, origin = ORIGIN } = {}) => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...(json ? { Accept: 'application/json' } : {}),
    ...(origin ? { Origin: origin } : {}),
  },
  body: form.toString(),
});

async function signIn() {
  return { headers: { 'Cf-Access-Jwt-Assertion': await accessToken() } };
}

async function test(name, run) {
  await run();
  tests += 1;
  console.log(`  ok ${name}`);
}

console.log('Registration Worker');
await test('early bird is inclusive through December 15 Mountain time; checkout and refunds retain the original price', async () => {
  const regular = event.seatPriceCents;
  event.seatPriceCents = 5000;
  event.earlyBird = configuredEarlyBird;
  try {
    const cutoff = Date.parse('2026-12-16T00:00:00-07:00');
    assert.deepEqual(seatPriceAt(event, cutoff - 1), { amountCents: 4300, label: 'Early bird' });
    assert.deepEqual(seatPriceAt(event, cutoff), { amountCents: 5000, label: 'Regular' });
    for (const [now, amount, label] of [[cutoff - 1, 4300, 'Early bird'], [cutoff, 5000, 'Regular']]) {
      const { call, stripe } = setup({ now });
      const status = await (await call('/api/registration/status?event=banquet-2027')).json();
      assert.equal(status.price.amountCents, amount);
      const response = await call('/api/registration/checkout', post(registrationForm({ quoted_seat_price_cents: String(amount), price: '1' })));
      assert.equal(response.status, 201);
      assert.equal(stripe.created[0].get('line_items[0][price_data][unit_amount]'), String(amount));
      for (const prefix of ['metadata', 'payment_intent_data[metadata]']) {
        assert.equal(stripe.created[0].get(`${prefix}[seat_price_cents]`), String(amount));
        assert.equal(stripe.created[0].get(`${prefix}[ticket_type]`), label);
      }
      const id = [...stripe.sessions.keys()][0]; stripe.pay(id); stripe.refund(id, amount);
      const order = toOrder(stripe.sessions.get(id), event, cutoff + 86400000);
      assert.equal(order.seatPriceCents, amount);
      assert.equal(needsAttention(order, event), true);
      const rows = csvRecords(registrationsCsv([order]));
      assert.equal(rows[0]['Ticket type'], label);
      assert.equal(rows[0]['Seat price (USD)'], (amount / 100).toFixed(2));
      assert.equal(rows.reduce((sum,row)=>sum+Number(row['Order paid (USD)']),0), (3*amount+2500)/100);
      // Historical orders infer their unit price even after the general rate changes.
      delete stripe.sessions.get(id).metadata.seat_price_cents;
      delete stripe.sessions.get(id).payment_intent.metadata.seat_price_cents;
      assert.equal(toOrder(stripe.sessions.get(id), event, cutoff).seatPriceCents, amount);
    }
    const { call, stripe } = setup({ now: cutoff });
    const stale = await call('/api/registration/checkout', post(registrationForm({ quoted_seat_price_cents: '4300' })));
    assert.equal(stale.status, 409); assert.equal((await stale.json()).code, 'price_changed'); assert.equal(stripe.created.length, 0);
    const tampered = await call('/api/registration/checkout', post(registrationForm({ quoted_seat_price_cents: '1' })));
    assert.equal(tampered.status, 409); assert.equal(stripe.created.length, 0);
  } finally { event.seatPriceCents = regular; delete event.earlyBird; }
});
await test('meeting checklist requires verified board access and stays private', async () => {
  const { call } = setup();
  const denied = await call('/board/banquet-2027/meeting/');
  assert.equal(denied.status, 401);
  const response = await call('/board/banquet-2027/meeting/', await signIn());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const page = await response.text();
  assert.match(page, /Kirby Clock/); assert.match(page, /Complimentary seats/); assert.match(page, /mid-January/);
});
await test('campaign links stay on the current origin and labels reject contact details', async () => {
  const origin = 'https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev';
  const url = campaignUrl(origin, event.registerPath, event.id, 'print', 'Club Flyer!');
  assert.equal(url.origin, origin);
  assert.equal(url.pathname, event.registerPath);
  assert.equal(url.searchParams.get('utm_content'), 'club-flyer');
  assert.equal(url.searchParams.get('utm_medium'), 'offline');
  assert.equal(campaignLabel(' November Newsletter '), 'november-newsletter');
  const bad = readAttribution(new URLSearchParams({ utm_source: 'person@example.com', utm_content: '=SUM(A1)', utm_term: 'x'.repeat(81), utm_medium: 'email', utm_campaign: 'banquet-2027' }));
  assert.equal(bad.source, ''); assert.equal(bad.content, ''); assert.equal(bad.term, '');
  assert.equal(bad.campaign, 'banquet-2027');
});
await test('first tagged invitation survives cancel and direct returns without permanent storage', async () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(firstTaggedTouch('', storage, event.id).source, '');
  assert.equal(firstTaggedTouch('?utm_source=newsletter&utm_content=november', storage, event.id).source, 'newsletter');
  assert.equal(firstTaggedTouch('?canceled=1', storage, event.id).content, 'november');
  assert.equal(firstTaggedTouch('?utm_source=facebook', storage, event.id).source, 'newsletter');
  assert.equal(firstTaggedTouch('?utm_source=print', null, event.id).source, 'print');
  assert.equal(firstTaggedTouch('', storage, 'other-event').source, '');
});
await test('share tool authenticates before static assets and excludes external scripts', async () => {
  const { call, assetsRequests, stripe } = setup();
  assert.equal((await call(`/board/${event.id}/share/`)).status, 401);
  assert.equal(assetsRequests.length, 0);
  const response = await call(`/board/${event.id}/share/`, await signIn());
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'static');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('content-security-policy'), /script-src 'self';/);
  assert.equal(stripe.calls.list, 0);
  assert.deepEqual(assetsRequests, [`${ORIGIN}/board/${event.id}/share/`]);
  assert.equal((await call(`/board/${event.id}/share/index.html`, await signIn())).status, 404);
});
await test('campaign labels reach Stripe, survive board edits, and export even on unpaid orders', async () => {
  const { call, stripe } = setup();
  const fields = { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'banquet-2027', utm_content: 'november', utm_term: 'club' };
  await call('/api/registration/checkout', post(registrationForm(fields)));
  const params = stripe.created[0];
  for (const [name, value] of Object.entries(fields)) {
    assert.equal(params.get(`metadata[${name}]`), value);
    assert.equal(params.get(`payment_intent_data[metadata][${name}]`), value);
  }
  const id = [...stripe.sessions.keys()][0];
  const auth = (await signIn()).headers;
  let csv = await (await call(`/board/${event.id}/registrations.csv`, { headers: auth })).text();
  assert.match(csv, /"UTM source","UTM medium","UTM campaign","UTM content","UTM term"/);
  assert.match(csv, /"newsletter","email","banquet-2027","november","club"/);
  stripe.pay(id);
  const edit = new URLSearchParams({ guest_1_name: 'Changed Guest', guest_1_meal: 'steak', guest_1_dietary: 'No dietary restrictions' });
  assert.equal((await call(`/board/${event.id}/orders/${id}/`, { method: 'POST', headers: { ...auth, Origin: ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' }, body: edit.toString() })).status, 303);
  assert.equal(stripe.sessions.get(id).payment_intent.metadata.utm_source, 'newsletter');
  const board = await (await call(`/board/${event.id}/`, { headers: auth })).text();
  assert.match(board, /From newsletter · november/);
  await call('/api/registration/checkout', post(registrationForm({ utm_source: 'person@example.com', utm_content: '<script>', utm_term: 'x'.repeat(81) })));
  assert.equal(stripe.created[1].has('metadata[utm_source]'), false);
});

await test('static pages fall through to assets', async () => {
  const { call, assetsRequests } = setup();
  const response = await call('/events/');
  assert.equal(await response.text(), 'static');
  assert.deepEqual(assetsRequests, [`${ORIGIN}/events/`]);
});

/** Runs `run` as if the board had approved the seat price. */
async function withApprovedPrice(run) {
  const original = event.priceApproved;
  event.priceApproved = true;
  try {
    await run();
  } finally {
    event.priceApproved = original;
  }
}

await test('registration window: live keys wait for the opening date, test keys do not', () => withApprovedPrice(() => {
  const before = Date.parse('2026-11-15T23:59:00-07:00');
  assert.equal(registrationState(event, before, false), 'scheduled');
  assert.equal(registrationState(event, before, true), 'open');
  assert.equal(registrationState(event, Date.parse('2026-11-16T00:00:00-07:00'), false), 'open');
  assert.equal(registrationState(event, Date.parse('2027-01-29T23:59:00-07:00'), false), 'open');
  assert.equal(registrationState(event, Date.parse('2027-01-30T00:00:00-07:00'), true), 'closed');
}));

await test('live mode refuses checkout until the board approves the price', async () => {
  const original = event.priceApproved;
  event.priceApproved = false;
  try {
    assert.equal(registrationState(event, OPEN_NOW, false), 'unapproved');
    assert.equal(registrationState(event, OPEN_NOW, true), 'open', 'test mode stays available for review');
    const live = setup({ key: 'sk_live_example' });
    assert.equal((await (await live.call('/api/registration/status?event=banquet-2027')).json()).state, 'unavailable');
    const response = await live.call('/api/registration/checkout', post(registrationForm()));
    assert.equal(response.status, 503);
    assert.equal(live.stripe.created.length, 0);
  } finally {
    event.priceApproved = original;
  }
});

await test('status reports unavailable without a Stripe key and open with seats', async () => {
  let response = await setup({ key: '' }).call('/api/registration/status?event=banquet-2027');
  assert.equal((await response.json()).state, 'unavailable');
  response = await setup().call('/api/registration/status?event=banquet-2027');
  const body = await response.json();
  assert.equal(body.state, 'open');
  assert.equal(body.seatsAvailable, 8);
  assert.equal(body.testMode, true);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  await withApprovedPrice(async () => {
    response = await setup({ key: 'sk_live_example', now: Date.parse('2026-11-01T12:00:00-07:00') }).call('/api/registration/status?event=banquet-2027');
    assert.equal((await response.json()).state, 'scheduled');
  });
});

await test('registration page seat count is cached for 30 seconds; checkout recounts', async () => {
  const { call, stripe, clock } = setup();
  const status = () => call('/api/registration/status?event=banquet-2027');
  await status();
  await status();
  assert.equal(stripe.calls.list, 1, 'second view within 30 seconds uses the cached count');
  clock.now += 31_000;
  await status();
  assert.equal(stripe.calls.list, 2, 'count refreshes after 30 seconds');
  await call('/api/registration/checkout', post(registrationForm()));
  assert.equal(stripe.calls.list, 3, 'checkout always counts exactly');
  await status();
  assert.equal(stripe.calls.list, 4, 'a new checkout clears the cached count');
});

await test('checkout prices seats server-side, one line item per meal', async () => {
  const { call, stripe } = setup();
  const form = registrationForm({ price: '1', amount: '1' });
  const response = await call('/api/registration/checkout', post(form));
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.match(body.checkoutUrl, /^https:\/\/checkout\.stripe\.com\//);

  const params = stripe.created[0];
  assert.equal(params.get('mode'), 'payment');
  assert.equal(params.has('payment_method_types[0]'), false, 'Stripe selects enabled payment methods');
  assert.match(params.get('integration_identifier'), /^jrhof_registration_[a-z]{8}$/);
  assert.equal(params.get('metadata[guest_2_name]'), 'Sam Guest');
  assert.equal(params.get('metadata[seating_request]'), 'Near the Smith party');
  // One receipt line per guest, named with the guest and meal, then the donation.
  assert.deepEqual([0, 1, 2].map((index) => params.get(`line_items[${index}][price_data][product_data][name]`)), [
    'Banquet seat for Pat Purchaser (Chicken)',
    'Banquet seat for Sam Guest (Steak)',
    'Banquet seat for Lee Guest (Chicken)',
  ]);
  for (const index of [0, 1, 2]) {
    assert.equal(params.get(`line_items[${index}][quantity]`), '1');
    assert.equal(params.get(`line_items[${index}][price_data][unit_amount]`), '7000');
  }
  assert.equal(params.get('line_items[3][price_data][product_data][name]'), 'Additional donation to JR and Associates, Inc.');
  assert.equal(params.get('line_items[3][price_data][unit_amount]'), '2500');
  assert.equal(params.get('customer_email'), 'pat@example.com');
  assert.equal(params.get('payment_intent_data[receipt_email]'), 'pat@example.com');
  assert.equal(params.get('client_reference_id'), '123456789.1700000000');
  assert.equal(params.get('success_url'), `${ORIGIN}/registration/confirmed/?cs={CHECKOUT_SESSION_ID}`);
  assert.equal(params.get('cancel_url'), `${ORIGIN}${event.registerPath}?canceled=1`);
  assert.ok(Number(params.get('expires_at')) >= OPEN_NOW / 1000 + 30 * 60);
  assert.equal(params.get('metadata[event_id]'), 'banquet-2027');
  assert.equal(params.get('metadata[seats]'), '3');
  assert.equal(params.get('payment_intent_data[metadata][guest_2_name]'), 'Sam Guest');
  assert.equal(params.get('payment_intent_data[metadata][guest_2_meal]'), 'Steak');
  assert.equal(params.get('payment_intent_data[metadata][guest_2_dietary]'), 'No mushrooms');
  assert.equal(params.get('payment_intent_data[metadata][donation_cents]'), '2500');
  assert.equal(params.get('payment_intent_data[metadata][guest_1_dietary]'), 'No dietary restrictions');
  assert.equal(params.get('custom_text[submit][message]'), event.refundPolicy);
  assert.equal([...stripe.sessions.values()][0].amount_total, 3 * 7000 + 2500);
});

await test('checkout without JavaScript redirects to Stripe or back to the form', async () => {
  const { call } = setup();
  let response = await call('/api/registration/checkout', post(registrationForm(), { json: false }));
  assert.equal(response.status, 303);
  assert.match(response.headers.get('location'), /^https:\/\/checkout\.stripe\.com\//);
  response = await call('/api/registration/checkout', post(registrationForm({ agree: '' }), { json: false }));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), `${event.registerPath}?error=invalid`);
});

await test('checkout rejects invalid forms with a field to highlight', async () => {
  const { call, stripe } = setup();
  const cases = [
    [{ guest_2_meal: '' }, 'guest_2_meal', /meal for guest 2/],
    [{ guest_3_name: 'X' }, 'guest_3_name', /full name for guest 3/],
    [{ guest_2_meal: 'lobster' }, 'guest_2_meal', /meal for guest 2/],
    [{ purchaser_email: 'not-an-email' }, 'purchaser_email', /valid email/],
    [{ purchaser_phone: '12' }, 'purchaser_phone', /phone/],
    [{ guest_2_dietary: '' }, 'guest_2_dietary', /dietary needs for guest 2/],
    [{ guest_2_email: 'invalid' }, 'guest_2_email', /valid email/],
    [{ guest_2_phone: '12' }, 'guest_2_phone', /valid phone/],
    [{ donation: 'lots' }, 'donation', /dollar amount/],
    [{ donation: '5001' }, 'donation', /limited to \$5,000/],
    [{ agree: 'no' }, 'agree', /refund policy/],
    [{ guest_1_name: '', guest_1_meal: '', guest_1_dietary: '', guest_2_name: '', guest_2_meal: '', guest_2_dietary: '', guest_3_name: '', guest_3_meal: '', guest_3_dietary: '' }, 'guest_1_name', /at least one guest/],
  ];
  for (const [overrides, field, message] of cases) {
    const response = await call('/api/registration/checkout', post(registrationForm(overrides)));
    const body = await response.json();
    assert.equal(response.status, 400, JSON.stringify(overrides));
    assert.equal(body.field, field, JSON.stringify(overrides));
    assert.match(body.error, message);
  }
  assert.equal(stripe.created.length, 0);
});

await test('checkout accepts eight guests and skips blank rows', async () => {
  const { call, stripe } = setup();
  const guests = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [
    [`guest_${index + 1}_name`, `Guest Number ${index + 1}`],
    [`guest_${index + 1}_meal`, index % 2 ? 'steak' : 'chicken'],
    [`guest_${index + 1}_dietary`, 'No dietary restrictions'],
  ]).flat());
  const response = await call('/api/registration/checkout', post(registrationForm({ ...guests, guest_2_dietary: 'No dietary restrictions', donation: '' })));
  assert.equal(response.status, 201);
  assert.equal(stripe.created[0].get('metadata[seats]'), '8');
  assert.equal([...stripe.sessions.values()][0].amount_total, 8 * 7000);

  const sparse = registrationForm({ guest_2_name: '', guest_2_meal: '', guest_2_dietary: '', donation: '0' });
  await call('/api/registration/checkout', post(sparse));
  assert.equal(stripe.created[1].get('metadata[seats]'), '2');
  assert.equal(stripe.created[1].get('payment_intent_data[metadata][guest_2_name]'), 'Lee Guest');
});

await test('each guest contact and dietary response survives checkout, exports and edits', async () => {
  const { call, stripe } = setup();
  const auth = (await signIn()).headers;
  const form = registrationForm({ guest_1_email: 'Pat@Example.com', guest_1_phone: '+1 303 555 0142', guest_2_email: 'Sam@Example.com', guest_2_phone: '303-555-0151' });
  assert.equal((await call('/api/registration/checkout', post(form))).status, 201);
  const [id] = stripe.sessions.keys();
  const expected = { email: 'sam@example.com', phone: '303-555-0151' };
  assert.deepEqual(JSON.parse(stripe.created[0].get('metadata[guest_2_contact]')), expected);
  assert.deepEqual(JSON.parse(stripe.created[0].get('payment_intent_data[metadata][guest_2_contact]')), expected);
  let csv = await (await call('/board/banquet-2027/registrations.csv', { headers: auth })).text();
  assert.match(csv, /"Sam Guest","sam@example.com","303-555-0151","Steak","No mushrooms"/);
  stripe.pay(id);
  csv = await (await call('/board/banquet-2027/attendees.csv', { headers: auth })).text();
  assert.match(csv, /"Sam Guest","sam@example.com","303-555-0151","Steak","No mushrooms"/);
  assert.match(csv, /"Lee Guest","","","Chicken","No dietary restrictions"/, 'optional guest contact stays blank, not copied from purchaser');
  const board = await (await call('/board/banquet-2027/', { headers: auth })).text();
  assert.match(board, /Email: sam@example.com · Phone: 303-555-0151/);
  const path = `/board/banquet-2027/orders/${id}/`;
  const editPage = await (await call(path, { headers: auth })).text();
  assert.match(editPage, /name="guest_2_email"[^>]*value="sam@example.com"/);
  form.set('guest_2_email', 'changed@example.com'); form.set('guest_2_dietary', 'No dairy');
  assert.equal((await call(path, { method: 'POST', headers: { ...auth, Origin: ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() })).status, 303);
  csv = await (await call('/board/banquet-2027/attendees.csv', { headers: auth })).text();
  assert.match(csv, /"Sam Guest","changed@example.com","303-555-0151","Steak","No dairy"/);
  delete stripe.sessions.get(id).payment_intent.metadata.guest_2_contact;
  delete stripe.sessions.get(id).payment_intent.metadata.guest_2_dietary;
  csv = await (await call('/board/banquet-2027/attendees.csv', { headers: auth })).text();
  assert.match(csv, /"Sam Guest","","","Steak","Not recorded"/, 'old missing details remain honest');
});

await test('eight guests with contact, dietary, extras and all campaign fields fit Stripe metadata limits', async () => {
  const { call, stripe } = setup();
  const form = registrationForm(Object.fromEntries(UTM_FIELDS.map((name) => [`utm_${name}`, 'campaign'])));
  for (let number = 1; number <= 8; number++) {
    form.set(`guest_${number}_name`, `Guest Number ${number}`);
    form.set(`guest_${number}_meal`, 'steak');
    form.set(`guest_${number}_dietary`, 'No dairy');
    form.set(`guest_${number}_email`, `${'x'.repeat(242)}@example.com`);
    form.set(`guest_${number}_phone`, '+1 303 555 0142');
  }
  assert.equal((await call('/api/registration/checkout', post(form))).status, 201);
  for (const metadata of [stripe.sessions.values().next().value.metadata, stripe.sessions.values().next().value.pendingPaymentIntentMetadata]) {
    assert.ok(Object.keys(metadata).length <= 50);
    assert.ok(Object.values(metadata).every((value) => value.length <= 500));
    assert.equal(JSON.parse(metadata.guest_8_contact).email.length, 254);
  }
});

await test('checkout refuses cross-site posts, closed windows, and missing keys', async () => {
  let response = await setup().call('/api/registration/checkout', post(registrationForm(), { origin: 'https://evil.example' }));
  assert.equal(response.status, 403);
  response = await setup().call('/api/registration/checkout', post(registrationForm(), { origin: null }));
  assert.equal(response.status, 201, 'a plain form post without Origin still works');
  response = await setup({ now: Date.parse('2027-01-30T08:00:00Z') }).call('/api/registration/checkout', post(registrationForm()));
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /closed/);
  await withApprovedPrice(async () => {
    response = await setup({ key: 'sk_live_example', now: Date.parse('2026-11-01T12:00:00-07:00') }).call('/api/registration/checkout', post(registrationForm()));
    assert.match((await response.json()).error, /opens Monday, November 16, 2026/);
  });
  response = await setup({ key: '' }).call('/api/registration/checkout', post(registrationForm()));
  assert.equal(response.status, 503);
  const limited = setup({ limiter: { limit: async () => ({ success: false }) } });
  response = await limited.call('/api/registration/checkout', post(registrationForm()));
  assert.equal(response.status, 429);
  assert.equal(limited.stripe.created.length, 0);
});

await test('capacity counts paid guests and live checkouts, not expired ones', async () => {
  const { call, stripe } = setup();
  const eight = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [
    [`guest_${index + 1}_name`, `Table Guest ${index + 1}`],
    [`guest_${index + 1}_meal`, 'steak'],
    [`guest_${index + 1}_dietary`, 'No dietary restrictions'],
  ]).flat());
  for (let order = 0; order < 37; order += 1) {
    await call('/api/registration/checkout', post(registrationForm({ ...eight, donation: '' })));
    stripe.pay([...stripe.sessions.keys()].at(-1));
  }
  // 296 paid. An expired checkout holds nothing; an open one holds 3 more.
  await call('/api/registration/checkout', post(registrationForm()));
  stripe.expire([...stripe.sessions.keys()].at(-1));
  assert.equal((await call('/api/registration/checkout', post(registrationForm()))).status, 201);

  let response = await call('/api/registration/checkout', post(registrationForm()));
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /Only 1 seat is left/);
  response = await call('/api/registration/status?event=banquet-2027');
  assert.equal((await response.json()).seatsAvailable, 1);

  const single = registrationForm({ guest_2_name: '', guest_2_meal: '', guest_2_dietary: '', guest_3_name: '', guest_3_meal: '', guest_3_dietary: '' });
  response = await call('/api/registration/checkout', post(single));
  assert.equal(response.status, 201);
  response = await call('/api/registration/status?event=banquet-2027');
  assert.equal((await response.json()).state, 'sold_out');
});

await test('confirmation verifies payment with Stripe and returns no personal data', async () => {
  const { call, stripe } = setup();
  await call('/api/registration/checkout', post(registrationForm()));
  const [id] = stripe.sessions.keys();

  let response = await call(`/api/registration/confirm?cs=${id}`);
  let body = await response.json();
  assert.equal(body.paid, false);

  stripe.pay(id, 'pat@example.com');
  response = await call(`/api/registration/confirm?cs=${id}`);
  body = await response.json();
  assert.equal(body.paid, true);
  assert.equal(body.transactionId, id);
  assert.equal(body.value, 235);
  assert.equal(body.currency, 'USD');
  assert.equal(body.seats, 3);
  assert.deepEqual(body.meals, [{ name: 'Chicken', count: 2 }, { name: 'Steak', count: 1 }]);
  const serialized = JSON.stringify(body).toLowerCase();
  for (const personal of ['pat purchaser', 'sam guest', 'lee guest', 'example.com', '555-0142', 'mushroom', 'smith']) {
    assert.ok(!serialized.includes(personal), `confirmation leaked ${personal}`);
  }

  response = await call('/api/registration/confirm?cs=cs_test_doesnotexist123');
  assert.equal((await response.json()).paid, false);
  response = await call('/api/registration/confirm?cs=../../v1/customers');
  assert.equal(response.status, 400);
});

await test('only board routes require a verified jrhof.org Access identity', async () => {
  const { call, env, stripe } = setup();
  for (const path of ['/board', '/board/', '/board/banquet-2027/', '/board/banquet-2027/kitchen/', '/board/banquet-2027/share/', '/board/banquet-2027/share/index.html', '/board/banquet-2027/attendees.csv', '/board/banquet-2027/registrations.csv', '/board/banquet-2027/orders/cs_test_session000001/']) {
    const response = await call(path);
    assert.equal(response.status, 401, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(await response.text(), /@jrhof.org Google account/);
  }
  for (const path of ['/', '/events/', event.registerPath, '/registration/confirmed/']) {
    assert.equal(await (await call(path)).text(), 'static');
  }
  assert.equal((await call('/api/registration/status?event=banquet-2027')).status, 200);
  assert.equal((await call('/api/registration/checkout', post(registrationForm()))).status, 201);
  assert.equal((await call(`/api/registration/confirm?cs=${[...stripe.sessions.keys()][0]}`)).status, 200);

  const auth = (await signIn()).headers;
  const response = await call('/board/', { headers: auth });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /href="\/board\/logout\/">Sign out/);
  assert.equal((await call('/board/logout/', { headers: auth })).headers.get('location'), '/cdn-cgi/access/logout');
  env.BOARD_ACCESS_AUD = '';
  assert.equal((await call('/board/', { headers: auth })).status, 503);
});

await test('board rejects forged, expired, wrong-app and non-jrhof.org identities', async () => {
  const { call, env } = setup();
  for (const claims of [
    { email: 'board@gmail.com' }, { email: 'board@eviljrhof.org' }, { email: 'board@jrhof.org.evil.example' },
    { email: 'board@jrhof.org@evil.example' }, { aud: ['another-app'] }, { iss: 'https://other.cloudflareaccess.com' },
    { exp: OPEN_NOW / 1000 }, { exp: '9999999999' }, { iat: OPEN_NOW / 1000 + 60 }, { nbf: OPEN_NOW / 1000 + 60 },
    { type: 'service' }, { sub: '' },
  ]) {
    assert.equal((await call('/board/', { headers: { 'Cf-Access-Jwt-Assertion': await accessToken(claims) } })).status, 401, JSON.stringify(claims));
  }
  const token = await accessToken();
  const parts = token.split('.');
  parts[1] = base64url(JSON.stringify({ email: 'hacker@jrhof.org', aud: [ACCESS_AUD], iss: `https://${ACCESS_TEAM}`, type: 'app', sub: 'hacker', exp: OPEN_NOW / 1000 + 60, iat: OPEN_NOW / 1000 }));
  assert.equal((await call('/board/', { headers: { 'Cf-Access-Jwt-Assertion': parts.join('.') } })).status, 401);
  assert.equal((await call('/board/', { headers: { 'Cf-Access-Jwt-Assertion': await accessToken({}, { alg: 'none' }) } })).status, 401);
  assert.equal((await call('/board/', { headers: { 'Cf-Access-Authenticated-User-Email': 'board@jrhof.org', Cookie: 'jrhof_board=legacy-password-cookie' } })).status, 401);
  assert.equal((await call('/board/', { headers: { 'Cf-Access-Jwt-Assertion': await accessToken({ email: 'Board@JRHOF.ORG' }) } })).status, 200);
  env.BOARD_ACCESS_TEAM_DOMAIN = 'attacker.example';
  assert.equal((await call('/board/', { headers: { 'Cf-Access-Jwt-Assertion': token } })).status, 503);
  const unavailableKeys = createHandler({ now: () => OPEN_NOW, fetcher: async () => new Response('unavailable', { status: 503 }) });
  env.BOARD_ACCESS_TEAM_DOMAIN = ACCESS_TEAM;
  assert.equal((await unavailableKeys.fetch(new Request(`${ORIGIN}/board/`, { headers: { 'Cf-Access-Jwt-Assertion': token } }), env)).status, 401);
});

await test('board home personalizes verified accounts without Stripe or a user database', async () => {
  const { call, env, stripe } = setup();
  const tj = { headers: { 'Cf-Access-Jwt-Assertion': await accessToken({ email: 'tj@jrhof.org' }), 'Cf-Access-Authenticated-User-Email': 'someone-else@jrhof.org' } };
  let response = await call('/board/', tj);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  let body = await response.text();
  assert.match(body, /Hi TJ, welcome to your JRHOF dashboard/);
  assert.match(body, /Signed in as tj@jrhof.org/);
  assert.ok(!body.includes('someone-else'));
  for (const path of ['/board/banquet-2027/', '/board/banquet-2027/share/', '/events/golf/', 'https://drive.google.com/', 'https://chat.google.com/', 'https://dashboard.stripe.com/test/payments']) assert.ok(body.includes(path), path);
  assert.equal(stripe.calls.list, 0, 'home does not load every registration');
  response = await call('/board/', { headers: { 'Cf-Access-Jwt-Assertion': await accessToken({ email: 'vicki@jrhof.org' }) } });
  body = await response.text();
  assert.match(body, /Hi Vicki,/);
  assert.ok(!body.includes('tj@jrhof.org'));
  response = await call('/board/', { headers: { 'Cf-Access-Jwt-Assertion': await accessToken({ email: 'member@jrhof.org', name: 'Marissa Example' }) } });
  assert.match(await response.text(), /Hi Marissa,/);
  response = await call('/board/', { headers: { 'Cf-Access-Jwt-Assertion': await accessToken({ email: '<img>@jrhof.org', name: '<script>alert(1)</script>' }) } });
  body = await response.text();
  assert.ok(!body.includes('<img>') && !body.includes('<script>'));
  env.STRIPE_SECRET_KEY = '';
  assert.equal((await call('/board/', tj)).status, 200, 'other board tools survive missing Stripe');
  assert.equal((await call('/board/banquet-2027/', tj)).status, 503);
  assert.equal((await call('/board/', { ...tj, method: 'POST', headers: { ...tj.headers, Origin: ORIGIN } })).status, 405);
});

await test('signed-in identity and board home navigation reach each existing board tool', async () => {
  const { call, env, stripe } = setup();
  const auth = { headers: { 'Cf-Access-Jwt-Assertion': await accessToken({ email: 'tj@jrhof.org' }) } };
  await call('/api/registration/checkout', post(registrationForm()));
  const [id] = stripe.sessions.keys(); stripe.pay(id);
  const sharePage = await readFile(new URL('../dist/board/banquet-2027/share/index.html', import.meta.url), 'utf8');
  env.ASSETS.fetch = async (request) => {
    assert.equal(request.headers.get('if-none-match'), null);
    assert.equal(request.headers.get('if-modified-since'), null);
    return new Response(sharePage, { headers: { ETag: 'static-version', 'Content-Length': String(Buffer.byteLength(sharePage)), 'Content-Type': 'text/html' } });
  };
  for (const path of [`/board/${event.id}/`, `/board/${event.id}/kitchen/`, `/board/${event.id}/orders/${id}/`, `/board/${event.id}/share/`]) {
    const response = await call(path, auth);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('cache-control'), 'no-store', path);
    const body = await response.text();
    assert.match(body, /Signed in as tj@jrhof.org/);
    assert.match(body, /href="\/board\/"[^>]*>Board home/);
    if (path.endsWith('/share/')) {
      assert.equal(response.headers.get('etag'), null);
      assert.equal(response.headers.get('content-length'), null);
    }
  }
  const other = await call(`/board/${event.id}/share/`, { headers: { 'Cf-Access-Jwt-Assertion': await accessToken({ email: 'vicki@jrhof.org' }), 'If-None-Match': 'static-version', 'If-Modified-Since': new Date().toUTCString() } });
  const body = await other.text();
  assert.match(body, /Signed in as vicki@jrhof.org/);
  assert.ok(!body.includes('tj@jrhof.org'));
});

await test('preview and local URLs cannot use live Stripe credentials', async () => {
  for (const origin of ['https://branch-jrhof-webapp.jr-and-associates-inc.workers.dev', 'http://localhost:8787']) {
    const { call, env } = setup({ origin, key: 'sk_live_example' });
    const status = () => call('/api/registration/status?event=banquet-2027');
    assert.equal((await (await status()).json()).state, 'unavailable');
    env.STRIPE_PREVIEW_SECRET_KEY = 'rk_live_example';
    assert.equal((await (await status()).json()).state, 'unavailable');
    env.STRIPE_PREVIEW_SECRET_KEY = 'rk_test_example';
    const body = await (await status()).json();
    assert.equal(body.testMode, true);
    assert.equal(body.state, 'open');
    const response = await call('/api/registration/checkout', post(registrationForm(), { origin }));
    assert.equal(response.status, 201);
    assert.equal((await call('/board/')).status, 401, 'alternate Worker URL still needs board authentication');
  }
  const unknown = setup({ origin: 'https://unconfigured.example' });
  assert.equal((await (await unknown.call('/api/registration/status?event=banquet-2027')).json()).state, 'unavailable');
});

await test('an existing test binding works on preview; explicit preview keys take precedence', async () => {
  const origin = 'https://branch-jrhof-webapp.jr-and-associates-inc.workers.dev';
  for (const key of ['sk_test_existing', 'rk_test_existing']) {
    const { call, env } = setup({ origin, key });
    const status = () => call('/api/registration/status?event=banquet-2027');
    const body = await (await status()).json();
    assert.equal(body.state, 'open');
    assert.equal(body.testMode, true);
    assert.equal((await call('/api/registration/checkout', post(registrationForm(), { origin }))).status, 201);
    env.STRIPE_PREVIEW_SECRET_KEY = 'sk_live_wrong_preview_key';
    assert.equal((await (await status()).json()).state, 'unavailable', 'explicit live preview key must not fall back');
  }
});

await test('unpaid checkouts cannot make the event look sold out', async () => {
  const { call } = setup();
  const eight = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [
    [`guest_${index + 1}_name`, `Held Guest ${index + 1}`],
    [`guest_${index + 1}_meal`, 'chicken'],
    [`guest_${index + 1}_dietary`, 'No dietary restrictions'],
  ]).flat());
  // 37 abandoned checkouts of 8 seats would hold 296 of 300 seats without a cap.
  for (let order = 0; order < 37; order += 1) {
    assert.equal((await call('/api/registration/checkout', post(registrationForm({ ...eight, donation: '' })))).status, 201);
  }
  const status = await (await call('/api/registration/status?event=banquet-2027')).json();
  assert.equal(status.state, 'open');
  assert.equal(status.seatsAvailable, 8);
});

await test('board shows counts, statuses, and refunds', async () => {
  const { call, stripe } = setup();
  const auth = (await signIn(call)).headers;
  let response;

  const ids = [];
  for (const overrides of [{}, { purchaser_name: 'Refunded Buyer' }, { purchaser_name: 'Partial Buyer' }, { purchaser_name: 'Abandoned Buyer' }]) {
    await call('/api/registration/checkout', post(registrationForm(overrides)));
    ids.push([...stripe.sessions.keys()].at(-1));
  }
  stripe.pay(ids[0]);
  stripe.pay(ids[1]);
  stripe.refund(ids[1], 23500);
  stripe.pay(ids[2]);
  stripe.refund(ids[2], 7000);
  stripe.expire(ids[3]);

  response = await call('/board/banquet-2027/', { headers: auth });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  const page = await response.text();
  assert.match(page, /TEST MODE/);
  assert.match(page, /<strong>6<\/strong><span>seats sold of 300<\/span>/);
  assert.match(page, /<strong>4<\/strong><span>Chicken<\/span>/);
  assert.match(page, /<strong>2<\/strong><span>Steak<\/span>/);
  assert.match(page, /Refunded<\/span>/);
  assert.match(page, /Partly refunded<\/span>/);
  assert.match(page, /Needs attention/);
  assert.match(page, /Partial Buyer<\/strong>: Part of this order was refunded/);
  assert.match(page, /Started but did not finish \(1\)/);
  assert.match(page, /https:\/\/dashboard\.stripe\.com\/test\/payments\/pi_test_/);
  // A paid test order left by the retired D1 prototype (no `seats`) is ignored.
  stripe.sessions.set('cs_test_legacyprototype01', {
    ...stripe.sessions.get(ids[0]),
    id: 'cs_test_legacyprototype01',
    metadata: { event_id: 'banquet-2027', reservation_id: 'res_old' },
    customer_details: { email: 'legacy@example.com', name: 'Legacy Prototype Buyer' },
    payment_intent: { id: 'pi_test_legacy', status: 'succeeded', metadata: { event_id: 'banquet-2027', reservation_id: 'res_old' }, latest_charge: { id: 'ch_legacy', amount: 8500, amount_refunded: 0, refunded: false, disputed: false } },
  });
  response = await call('/board/banquet-2027/', { headers: auth });
  const withLegacy = await response.text();
  assert.ok(!withLegacy.includes('Legacy Prototype Buyer'), 'prototype orders stay off the board');
  assert.match(withLegacy, /<strong>2<\/strong><span>paid orders<\/span>/, "two orders still attending; one was fully refunded");
  // 3 paid orders at $235, minus a $235 refund and a $70 refund = $400.
  assert.match(page, /<strong>\$400<\/strong><span>collected after refunds<\/span>/);
  // Donations count only on orders still attending (two of them).
  assert.match(page, /<strong>\$50<\/strong><span>in added donations<\/span>/);
});

await test('attendee CSV has one row per guest with purchaser and paid status', async () => {
  const { call, stripe } = setup();
  const auth = (await signIn(call)).headers;
  await call('/api/registration/checkout', post(registrationForm({ guest_2_name: '=HYPERLINK("http://x")' })));
  await call('/api/registration/checkout', post(registrationForm({ purchaser_name: 'Refunded Buyer' })));
  const [paid, refunded] = stripe.sessions.keys();
  stripe.pay(paid);
  stripe.pay(refunded);
  stripe.refund(refunded, 23500);

  const response = await call('/board/banquet-2027/attendees.csv', { headers: auth });
  assert.equal(response.headers.get('content-type'), 'text/csv; charset=utf-8');
  assert.match(response.headers.get('content-disposition'), /banquet-2027-attendees-2026-12-01\.csv/);
  const csv = (await response.text()).replace(/^﻿/, '');
  const lines = csv.trim().split('\r\n');
  assert.equal(lines[0], '"Guest name","Guest email","Guest phone","Meal","Dietary note","Status","Attending","Purchaser","Purchaser email","Purchaser phone","Seating request","Order date","Checkout session","Guest number","Guests in party","Stripe payment","UTM source","UTM medium","UTM campaign","UTM content","UTM term","Ticket type","Seat price (USD)"');
  assert.equal(lines.length, 7);
  assert.match(lines[1], /^"Pat Purchaser","","","Chicken","No dietary restrictions","Paid","Yes","Pat Purchaser","buyer@example.com","\(303\) 555-0142","Near the Smith party"/);
  assert.match(lines[2], /^"'=HYPERLINK\(""http:\/\/x""\)","","","Steak","No mushrooms","Paid"/);
  assert.match(lines[6], /"Refunded - not attending","No","Refunded Buyer"/);
  const guests = csvRecords(csv);
  assert.equal(guests.filter((row) => row.Attending === 'Yes' && row.Meal === 'Chicken').length, 2);
  assert.deepEqual(guests.filter((row) => row['Checkout session'] === paid).map((row) => row['Guest number']), ['1', '2', '3']);
  assert.equal(csvCell('+1 303 555 0142'), '"+1 303 555 0142"');
  assert.equal(csvCell('@SUM(A1)'), '"\'@SUM(A1)"');
});

await test('board can edit guests; meal count and kitchen sheet follow', async () => {
  const { call, stripe } = setup();
  const auth = (await signIn(call)).headers;
  await call('/api/registration/checkout', post(registrationForm()));
  const [id] = stripe.sessions.keys();
  stripe.pay(id);
  stripe.refund(id, 7000);
  const path = `/board/banquet-2027/orders/${id}/`;

  let response = await call(path, { headers: auth });
  let page = await response.text();
  assert.match(page, /name="guest_3_name"[^>]*value="Lee Guest"/);
  assert.match(page, /<option value="steak" selected>Steak<\/option>/);

  const edit = new URLSearchParams({
    guest_1_name: 'Pat Purchaser', guest_1_meal: 'steak', guest_1_dietary: 'Medium rare',
    guest_2_name: 'Sam Guest', guest_2_meal: 'steak', guest_2_dietary: 'No dietary restrictions',
    guest_3_name: '', guest_3_meal: '', guest_3_dietary: '',
  });
  const request = (origin) => ({ method: 'POST', headers: { ...auth, Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: edit.toString() });
  assert.equal((await call(path, request('https://evil.example'))).status, 403);

  response = await call(path, request(ORIGIN));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/board/banquet-2027/?saved=1');
  const metadata = stripe.sessions.get(id).payment_intent.metadata;
  assert.equal(metadata.guest_1_meal, 'Steak');
  assert.equal(metadata.guest_1_dietary, 'Medium rare');
  assert.equal(metadata.guest_3_name, undefined);
  assert.equal(metadata.purchaser_name, 'Pat Purchaser', 'edits leave purchaser metadata alone');

  page = await (await call('/board/banquet-2027/?saved=1', { headers: auth })).text();
  assert.match(page, /Guest list saved/);
  assert.match(page, /<strong>2<\/strong><span>seats sold of 300<\/span>/);
  assert.match(page, /<strong>0<\/strong><span>Chicken<\/span>/);
  assert.doesNotMatch(page, /Needs attention/, 'removing the refunded guest clears the flag');

  page = await (await call('/board/banquet-2027/kitchen/', { headers: auth })).text();
  assert.match(page, /Meal count \(2 guests\)/);
  assert.match(page, /Medium rare/);

  const invalid = new URLSearchParams({ guest_1_name: 'Pat Purchaser', guest_1_meal: '' });
  response = await call(path, { method: 'POST', headers: { ...auth, Origin: ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' }, body: invalid.toString() });
  assert.equal(response.status, 400);
  assert.match(await response.text(), /Please choose a meal for guest 1/);
});

await test('board escapes guest-supplied text', async () => {
  const { call, stripe } = setup();
  const auth = (await signIn(call)).headers;
  await call('/api/registration/checkout', post(registrationForm({ guest_2_name: '<script>alert(1)</script>' })));
  stripe.pay([...stripe.sessions.keys()][0]);
  const page = await (await call('/board/banquet-2027/', { headers: auth })).text();
  assert.ok(!page.includes('<script>alert(1)</script>'));
  assert.ok(page.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});



await test('all-registration export preserves unpaid guests without counting them as attending', async () => {
  const { call, stripe } = setup();
  const auth = (await signIn()).headers;
  await call('/api/registration/checkout', post(registrationForm()));
  await call('/api/registration/checkout', post(registrationForm({ purchaser_name: 'Abandoned Buyer', guest_2_name: '=HYPERLINK("http://x")' })));
  await call('/api/registration/checkout', post(registrationForm({ purchaser_name: 'Refunded Buyer' })));
  const [paid, abandoned, refunded] = stripe.sessions.keys();
  stripe.pay(paid);
  stripe.expire(abandoned);
  stripe.pay(refunded);
  stripe.refund(refunded, 23500);
  const page = await (await call('/board/banquet-2027/', { headers: auth })).text();
  assert.match(page, /<strong>3<\/strong><span>seats sold of 300/);
  assert.match(page, /Download all registrations/);
  const response = await call('/board/banquet-2027/registrations.csv', { headers: auth });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('content-type'), 'text/csv; charset=utf-8');
  const csv = await response.text();
  assert.equal(csvRecords(csv).length, 9, 'one row per guest, including unpaid and refunded guests');
  assert.match(csv, /Did not finish/);
  assert.match(csv, /Abandoned Buyer/);
  assert.match(csv, /"Sam Guest","","","Steak","No mushrooms"/);
  assert.match(csv, /Near the Smith party/);
  const rows = csvRecords(csv);
  assert.equal(rows.filter((row) => row.Attending === 'Yes' && row.Meal === 'Chicken').length, 2);
  assert.equal(rows.filter((row) => row.Purchaser === 'Pat Purchaser').length, 3);
  assert.ok(rows.filter((row) => row.Purchaser !== 'Pat Purchaser').every((row) => row.Attending === 'No'));
  assert.equal(rows.reduce((sum, row) => sum + Number(row['Order paid (USD)']), 0), 470);
  assert.equal(rows.reduce((sum, row) => sum + Number(row['Order refunded (USD)']), 0), 235);
  assert.equal(rows.filter((row) => row['Order totals included'] === 'Yes').length, 3);
  assert.ok(rows.filter((row) => row['Guest number'] !== '1').every((row) => row['Order paid (USD)'] === ''));
  const attendees = await (await call('/board/banquet-2027/attendees.csv', { headers: auth })).text();
  assert.doesNotMatch(attendees, /Abandoned Buyer/);
});

await test('guest CSV preserves quoted contacts and empty parties without multiplying order amounts', async () => {
  const { call, stripe } = setup();
  await call('/api/registration/checkout', post(registrationForm({ guest_2_name: 'Sam "Guest", Jr.', guest_2_email: 'sam@example.com', guest_2_phone: '+1 303 555 0181', guest_2_dietary: 'No mushrooms, please\nNo dairy' })));
  const [id] = stripe.sessions.keys(); stripe.pay(id);
  const order = toOrder(stripe.sessions.get(id), event, OPEN_NOW);
  order.guests[1].dietary = 'No mushrooms, please\nNo dairy';
  const rows = csvRecords(registrationsCsv([order]));
  assert.equal(rows[1]['Guest name'], 'Sam "Guest", Jr.');
  assert.equal(rows[1]['Dietary note'], 'No mushrooms, please\nNo dairy');
  assert.equal(rows[1]['Guest email'], 'sam@example.com');
  assert.equal(rows[1]['Guest phone'], '+1 303 555 0181');
  const empty = csvRecords(registrationsCsv([{ ...order, guests: [] }]));
  assert.equal(empty.length, 1);
  assert.equal(empty[0]['Guest name'], '');
  assert.equal(empty[0].Attending, 'No');
  assert.equal(empty[0]['Guests in party'], '0');
  assert.equal(empty[0]['Order paid (USD)'], '235.00');
});

await test('signed webhooks log payments without relying on a confirmation visit', async () => {
  const { call, stripe, env } = setup();
  await call('/api/registration/checkout', post(registrationForm()));
  const [id] = stripe.sessions.keys();
  const logs = [];
  const originalLog = console.log;
  const timestamp = Math.floor(OPEN_NOW / 1000);
  const signed = async (body, stamp = timestamp) => {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return `t=${stamp},v1=${Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${stamp}.${body}`))).toString('hex')}`;
  };
  const send = (body, signature) => call('/api/registration/webhook', { method: 'POST', headers: { 'stripe-signature': signature, 'Content-Type': 'application/json' }, body });
  const eventBody = (type, extra = {}) => JSON.stringify({ id: 'evt_test_payment', type, livemode: false, data: { object: { id } }, ...extra });
  console.log = (value) => logs.push(JSON.parse(value));
  try {
    let body = eventBody('checkout.session.completed');
    assert.equal((await send(body, 't=1,v1=forged')).status, 400);
    assert.equal((await send(body, await signed(body, timestamp - 301))).status, 400);
    assert.equal((await send(body + ' ', await signed(body))).status, 400);
    assert.equal((await send(body, await signed(body))).status, 200);
    assert.equal(logs.at(-1).paid, false, 'unpaid completed events cannot confirm a registration');
    stripe.pay(id);
    const delayed = stripe.sessions.get(id);
    delayed.payment_status = 'unpaid';
    delayed.payment_intent.status = 'processing';
    assert.equal(toOrder(delayed, event, OPEN_NOW).status, 'processing');
    delayed.payment_intent.status = 'requires_payment_method';
    body = eventBody('checkout.session.async_payment_failed');
    assert.equal((await send(body, await signed(body))).status, 200);
    assert.equal(logs.at(-1).status, 'not_completed');
    assert.equal(logs.at(-1).paid, false);
    stripe.pay(id);
    body = eventBody('checkout.session.async_payment_succeeded');
    assert.equal((await send(body, await signed(body))).status, 200);
    assert.equal(logs.at(-1).paid, true);
    assert.equal(logs.at(-1).sessionId, id);
    assert.equal((await send(body, await signed(body))).status, 200, 'retries are harmless; Stripe is the store');
    body = eventBody('checkout.session.completed', { livemode: true });
    assert.equal((await send(body, await signed(body))).status, 400, 'reject wrong Stripe mode');
    const serialized = JSON.stringify(logs);
    for (const privateText of ['Pat Purchaser', 'example.com', 'No mushrooms', '555-0142', 'Smith party']) assert.ok(!serialized.includes(privateText));
    env.STRIPE_WEBHOOK_SECRET = '';
    assert.equal((await send(body, 'anything')).status, 503);
    assert.equal((await call('/api/registration/webhook')).status, 405);
  } finally { console.log = originalLog; }
});

console.log(`Passed ${tests} registration Worker tests.`);
