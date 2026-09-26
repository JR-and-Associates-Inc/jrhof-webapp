// Runtime tests for the registration Worker (worker/). Runs the real handler
// against an in-memory fake of the four Stripe endpoints it uses.
// Run with: node scripts/test-registration-worker.mjs (Node 22.18+ strips TS types).

import assert from 'node:assert/strict';
import { createHandler, registrationState } from '../worker/index.ts';
import { csvCell } from '../worker/orders.ts';
import { findRegistration } from '../src/data/registrations.ts';

const event = findRegistration('banquet-2027');
// Fix the seat price for these tests so the expected totals below don't change
// whenever the proposed price in src/data/registrations.ts does.
event.seatPriceCents = 7000;
const ORIGIN = 'https://jrhof.org';
const OPEN_NOW = Date.parse('2026-12-01T12:00:00-07:00');
const BOARD_PASSWORD = 'correct-horse-battery';
let tests = 0;

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
    assert.match(init.headers.Authorization, /^Bearer sk_(test|live)_/);
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

function setup({ now = OPEN_NOW, key = 'sk_test_example', password = BOARD_PASSWORD, limiter } = {}) {
  const stripe = fakeStripe();
  const clock = { now };
  const handler = createHandler({ fetcher: stripe.fetcher, now: () => clock.now });
  const assetsRequests = [];
  const env = {
    ASSETS: { fetch: async (request) => { assetsRequests.push(request.url); return new Response('static'); } },
    STRIPE_SECRET_KEY: key,
    BOARD_PASSWORD: password,
    CHECKOUT_LIMITER: limiter,
  };
  const call = (path, init = {}) => handler.fetch(new Request(`${ORIGIN}${path}`, init), env);
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
    guest_1_dietary: '',
    guest_2_name: 'Sam Guest',
    guest_2_meal: 'steak',
    guest_2_dietary: 'No mushrooms',
    guest_3_name: 'Lee Guest',
    guest_3_meal: 'chicken',
    guest_3_dietary: '',
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

async function signIn(call, password = BOARD_PASSWORD, next = '/board/banquet-2027/') {
  const response = await call('/board/login/', {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ password, next }).toString(),
  });
  const cookie = response.headers.get('set-cookie');
  return { response, headers: cookie ? { Cookie: cookie.split(';')[0] } : {} };
}

async function test(name, run) {
  await run();
  tests += 1;
  console.log(`  ok ${name}`);
}

console.log('Registration Worker');

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
  assert.equal(params.get('payment_method_types[0]'), 'card');
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
  assert.equal(params.has('payment_intent_data[metadata][guest_1_dietary]'), false, 'empty metadata values are omitted');
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
    [{ donation: 'lots' }, 'donation', /dollar amount/],
    [{ donation: '5001' }, 'donation', /limited to \$5,000/],
    [{ agree: 'no' }, 'agree', /refund policy/],
    [{ guest_1_name: '', guest_1_meal: '', guest_2_name: '', guest_2_meal: '', guest_2_dietary: '', guest_3_name: '', guest_3_meal: '' }, 'guest_1_name', /at least one guest/],
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
  ]).flat());
  const response = await call('/api/registration/checkout', post(registrationForm({ ...guests, guest_2_dietary: '', donation: '' })));
  assert.equal(response.status, 201);
  assert.equal(stripe.created[0].get('metadata[seats]'), '8');
  assert.equal([...stripe.sessions.values()][0].amount_total, 8 * 7000);

  const sparse = registrationForm({ guest_2_name: '', guest_2_meal: '', guest_2_dietary: '', donation: '0' });
  await call('/api/registration/checkout', post(sparse));
  assert.equal(stripe.created[1].get('metadata[seats]'), '2');
  assert.equal(stripe.created[1].get('payment_intent_data[metadata][guest_2_name]'), 'Lee Guest');
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

  const single = registrationForm({ guest_2_name: '', guest_2_meal: '', guest_2_dietary: '', guest_3_name: '', guest_3_meal: '' });
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

await test('board sign-in page, 12-hour session, and sign out', async () => {
  const { call } = setup();
  assert.equal((await setup({ password: '' }).call('/board/')).status, 503);
  assert.equal((await setup({ password: 'short' }).call('/board/')).status, 503);

  let response = await call('/board/banquet-2027/kitchen/');
  assert.equal(response.status, 401);
  let page = await response.text();
  assert.match(page, /Board sign in/);
  assert.match(page, /name="next" value="\/board\/banquet-2027\/kitchen\/"/);

  const wrong = await signIn(call, 'wrong-password-123');
  assert.equal(wrong.response.status, 401);
  assert.deepEqual(wrong.headers, {});
  assert.match(await wrong.response.text(), /That password is not right/);

  const { response: signedIn, headers: auth } = await signIn(call);
  assert.equal(signedIn.status, 303);
  assert.equal(signedIn.headers.get('location'), '/board/banquet-2027/');
  assert.match(signedIn.headers.get('set-cookie'), /Path=\/board; Max-Age=43200; HttpOnly; Secure; SameSite=Lax/);
  assert.equal((await call('/board/', { headers: auth })).status, 200);
  assert.match(await (await call('/board/', { headers: auth })).text(), /href="\/board\/logout\/">Sign out/);

  assert.equal((await call('/board/', { headers: { Cookie: 'jrhof_board=9999999999.deadbeef' } })).status, 401, 'forged cookie');
  assert.equal((await setup({ now: OPEN_NOW + 13 * 3600 * 1000 }).call('/board/', { headers: auth })).status, 401, 'expired after 12 hours');
  assert.equal((await setup({ password: 'a-brand-new-board-password' }).call('/board/', { headers: auth })).status, 401, 'password change signs everyone out');
  assert.equal((await signIn(call, BOARD_PASSWORD, 'https://evil.example/')).response.headers.get('location'), '/board/');
  assert.equal((await call('/board/login/', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/x-www-form-urlencoded' }, body: `password=${BOARD_PASSWORD}` })).status, 403);

  // Browsers may send Origin: null on same-site form posts; Sec-Fetch-Site decides.
  const loginWith = (headers) => call('/board/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams({ password: BOARD_PASSWORD, next: '/board/' }).toString(),
  });
  assert.equal((await loginWith({ Origin: 'null', 'Sec-Fetch-Site': 'same-origin' })).status, 303);
  assert.equal((await loginWith({ Origin: 'null', 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await loginWith({})).status, 403, 'board posts need proof of origin');
  assert.equal((await call('/board/', { headers: auth })).headers.get('referrer-policy'), 'same-origin');

  response = await call('/board/logout/', { headers: auth });
  assert.equal(response.status, 303);
  assert.match(response.headers.get('set-cookie'), /^jrhof_board=; Path=\/board; Max-Age=0/);

  const limited = setup({ limiter: { limit: async () => ({ success: false }) } });
  assert.equal((await signIn(limited.call)).response.status, 429);
});

await test('a stolen board cookie cannot be used to guess the password', async () => {
  const { call } = setup();
  const { headers: auth } = await signIn(call);
  assert.equal((await call('/board/', { headers: auth })).status, 200);

  // The pre-hardening cookie was keyed on the password alone, so its MAC could be
  // brute-forced offline. The Worker must reject that format.
  const encoder = new TextEncoder();
  const hex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const passwordOnlyKey = await crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', encoder.encode(`jrhof-board-session:${BOARD_PASSWORD}`)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expires = Math.floor(OPEN_NOW / 1000) + 3600;
  const passwordOnlyCookie = `jrhof_board=${expires}.${hex(await crypto.subtle.sign('HMAC', passwordOnlyKey, encoder.encode(`board:${expires}`)))}`;
  assert.equal((await call('/board/', { headers: { Cookie: passwordOnlyCookie } })).status, 401);

  assert.equal((await setup({ key: 'sk_test_rotated' }).call('/board/', { headers: auth })).status, 401, 'rotating the Stripe key signs everyone out');
  assert.equal((await setup({ key: '' }).call('/board/')).status, 503, 'no server secret, no board');
  const withSessionSecret = setup();
  withSessionSecret.env.BOARD_SESSION_SECRET = 'a-separate-random-session-secret';
  assert.equal((await withSessionSecret.call('/board/', { headers: auth })).status, 401, 'BOARD_SESSION_SECRET takes precedence');
  const { headers: secretAuth } = await signIn(withSessionSecret.call);
  assert.equal((await withSessionSecret.call('/board/', { headers: secretAuth })).status, 200);
});

await test('unpaid checkouts cannot make the event look sold out', async () => {
  const { call } = setup();
  const eight = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [
    [`guest_${index + 1}_name`, `Held Guest ${index + 1}`],
    [`guest_${index + 1}_meal`, 'chicken'],
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
  assert.equal(lines[0], '"Guest name","Meal","Dietary note","Status","Purchaser","Purchaser email","Purchaser phone","Seating request","Order date","Stripe payment"');
  assert.equal(lines.length, 7);
  assert.match(lines[1], /^"Pat Purchaser","Chicken","","Paid","Pat Purchaser","buyer@example.com","\(303\) 555-0142","Near the Smith party"/);
  assert.match(lines[2], /^"'=HYPERLINK\(""http:\/\/x""\)","Steak","No mushrooms","Paid"/);
  assert.match(lines[6], /"Refunded - not attending","Refunded Buyer"/);
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
    guest_2_name: 'Sam Guest', guest_2_meal: 'steak', guest_2_dietary: '',
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

console.log(`Passed ${tests} registration Worker tests.`);
