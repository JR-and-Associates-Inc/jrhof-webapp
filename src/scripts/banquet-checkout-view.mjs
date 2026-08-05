/**
 * Resolve which banquet registration preview view to show from a URL query string.
 *
 * Preview-only: the success/canceled states are driven entirely client-side by the
 * `?checkout=` parameter that Stripe test Checkout appends to the return URL
 * (`?checkout=success` / `?checkout=canceled`, matching BANQUET_SUCCESS_URL /
 * BANQUET_CANCEL_URL). This is a display state only; it never asserts payment
 * status, which is reconciled server-side from the verified Stripe webhook.
 *
 * @param {string} [search] - `location.search`, with or without a leading `?`.
 * @returns {'success' | 'canceled' | 'form'}
 */
export function resolveCheckoutView(search) {
  const params = new URLSearchParams(search ?? '');
  switch (params.get('checkout')) {
    case 'success':
      return 'success';
    case 'canceled':
      return 'canceled';
    default:
      return 'form';
  }
}
