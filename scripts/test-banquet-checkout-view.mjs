import assert from 'node:assert/strict';
import { resolveCheckoutView } from '../src/scripts/banquet-checkout-view.mjs';

// Success and canceled states come from the Stripe return URLs.
assert.equal(resolveCheckoutView('?checkout=success'), 'success');
assert.equal(resolveCheckoutView('checkout=success'), 'success');
assert.equal(resolveCheckoutView('?checkout=canceled'), 'canceled');
assert.equal(resolveCheckoutView('checkout=canceled'), 'canceled');

// Everything else falls back to the form, so the preview never claims a state it
// was not explicitly returned to. British spelling is intentionally NOT matched
// because the Worker cancel URL emits the American "canceled".
assert.equal(resolveCheckoutView('?checkout=cancelled'), 'form');
assert.equal(resolveCheckoutView('?checkout=Success'), 'form');
assert.equal(resolveCheckoutView('?checkout=paid'), 'form');
assert.equal(resolveCheckoutView('?foo=bar'), 'form');
assert.equal(resolveCheckoutView('?checkout='), 'form');
assert.equal(resolveCheckoutView(''), 'form');
assert.equal(resolveCheckoutView(undefined), 'form');

// Extra params and duplicate keys resolve deterministically (first value wins).
assert.equal(resolveCheckoutView('?checkout=success&utm=x'), 'success');
assert.equal(resolveCheckoutView('?checkout=success&checkout=canceled'), 'success');

console.log('Validated the banquet checkout view resolver.');
