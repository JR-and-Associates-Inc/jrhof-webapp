// Unit tests for the Zeffy conversion bridge (src/lib/zeffyTracking.ts).
// Node 22.18+ strips the TypeScript types, so the module is imported directly.
import assert from 'node:assert/strict';
import { createZeffyTracker, isZeffyMessage, ZEFFY_ORIGIN } from '../src/lib/zeffyTracking.ts';

const setup = (hostname = 'jrhof.org', conversion = 'registration_complete') => {
  const events = [];
  let n = 0;
  const handle = createZeffyTracker({
    track: (event, params) => events.push({ event, ...params }),
    conversion,
    params: { event_slug: '2027-hall-of-fame-induction-banquet', event_year: '2027' },
    hostname,
    newId: () => `id${++n}`,
  });
  return { events, handle };
};

const payment = { type: 'zeffy-embed:step-changed', step: 'payment', embedId: 'x' };
const animation = { type: 'zeffy-embed:thank-you-animation-shown', embedId: 'x' };
const thanks = { type: 'zeffy-embed:thank-you-page-shown', embedId: 'x' };

// Production: begin_checkout once, then one registration_complete for the
// animation + page pair Zeffy sends at the end of an order.
{
  const { events, handle } = setup();
  handle({ type: 'zeffy-embed:resized', height: 900 });
  handle({ type: 'zeffy-embed:step-changed', step: 'tickets' });
  handle(payment);
  handle(payment);
  handle(animation);
  handle(thanks);
  assert.deepEqual(events.map((e) => e.event), ['begin_checkout', 'registration_complete']);
  assert.deepEqual(events[1], {
    event: 'registration_complete',
    event_slug: '2027-hall-of-fame-induction-banquet',
    event_year: '2027',
    form_type: 'registration',
    payment_provider: 'zeffy',
    currency: 'USD',
    transaction_id: 'zeffy-id1',
  });
  assert.equal('value' in events[1], false, 'Zeffy sends no amount, so no value is invented');
}

// A second order in the same embed counts again with a new transaction_id.
{
  const { events, handle } = setup('www.jrhof.org');
  handle(payment);
  handle(thanks);
  handle(payment);
  handle(thanks);
  assert.deepEqual(events.map((e) => e.event), ['begin_checkout', 'registration_complete', 'begin_checkout', 'registration_complete']);
  assert.notEqual(events[1].transaction_id, events[3].transaction_id);
}

// A thank-you screen without a payment step (for example a $0 ticket) still counts once.
{
  const { events, handle } = setup();
  handle(thanks);
  handle(thanks);
  assert.deepEqual(events.map((e) => e.event), ['registration_complete']);
}

// Preview and local hosts never send the production event names.
for (const host of ['feature-zeffy-registration-preview-jrhof-webapp.jr-and-associates-inc.workers.dev', 'localhost', 'jrhof.org.evil.test']) {
  const { events, handle } = setup(host);
  handle(payment);
  handle(thanks);
  assert.deepEqual(events.map((e) => e.event), ['begin_checkout_test', 'registration_complete_test'], host);
}

// Donation forms (messages recorded from the live JRHOF donation embed on
// October 12, 2026: connected, step-changed pushMonthly, step-changed payment):
// begin_checkout once, the monthly upsell ignored, one donation_complete, no
// amount and no personal data.
{
  const setupDonation = (hostname) => {
    const events = [];
    let n = 0;
    const handle = createZeffyTracker({ track: (event, params) => events.push({ event, ...params }), conversion: 'donation_complete', hostname, newId: () => `d${++n}` });
    return { events, handle };
  };
  const { events, handle } = setupDonation('jrhof.org');
  handle({ type: 'zeffy-embed:connected', embedId: 'zeffy-embed-1' });
  handle({ type: 'zeffy-embed:step-changed', embedId: 'zeffy-embed-1', step: 'pushMonthly' });
  handle({ type: 'zeffy-embed:step-changed', embedId: 'zeffy-embed-1', step: 'payment' });
  handle({ type: 'zeffy-embed:step-changed', embedId: 'zeffy-embed-1', step: 'payment' });
  handle({ type: 'zeffy-embed:thank-you-animation-shown', embedId: 'zeffy-embed-1' });
  handle({ type: 'zeffy-embed:thank-you-page-shown', embedId: 'zeffy-embed-1' });
  assert.deepEqual(events, [
    { event: 'begin_checkout', form_type: 'donation', payment_provider: 'zeffy', currency: 'USD' },
    { event: 'donation_complete', form_type: 'donation', payment_provider: 'zeffy', currency: 'USD', transaction_id: 'zeffy-d1' },
  ]);

  const preview = setupDonation('donations-zeffy-embed-jrhof-webapp.jr-and-associates-inc.workers.dev');
  preview.handle({ type: 'zeffy-embed:step-changed', step: 'payment' });
  preview.handle({ type: 'zeffy-embed:thank-you-page-shown' });
  assert.deepEqual(preview.events.map((e) => e.event), ['begin_checkout_test', 'donation_complete_test']);
}

// Junk and non-Zeffy message shapes are ignored.
{
  const { events, handle } = setup();
  for (const data of [null, undefined, 'zeffy-embed:thank-you-page-shown', 42, {}, { type: 'thank-you-page-shown' }, { type: 7 }]) handle(data);
  assert.equal(events.length, 0);
}

// Origin and frame checks.
{
  const frameWindow = {};
  const frames = [{ contentWindow: {} }, { contentWindow: frameWindow }];
  assert.equal(isZeffyMessage({ origin: ZEFFY_ORIGIN, source: frameWindow }, frames), true);
  assert.equal(isZeffyMessage({ origin: 'https://zeffy.com', source: frameWindow }, frames), false);
  assert.equal(isZeffyMessage({ origin: 'https://evil.example', source: frameWindow }, frames), false);
  assert.equal(isZeffyMessage({ origin: ZEFFY_ORIGIN, source: {} }, frames), false);
  assert.equal(isZeffyMessage({ origin: ZEFFY_ORIGIN, source: null }, [{ contentWindow: null }]), false);
}

console.log('Zeffy conversion tracking tests passed.');
