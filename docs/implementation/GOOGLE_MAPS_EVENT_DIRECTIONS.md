# Google Maps event directions

## Keyless public implementation

The 2027 banquet page displays the approved venue name and address as selectable text and provides a standard keyless Google Maps directions URL. JRHOF does not request the visitor's device location.

The location panel uses the iframe URL produced by Google Maps' standard **Share or embed map** feature, which does not require a Google Cloud project, API key, or billing account. The iframe has no `src` and does not exist in the document until a keyboard-operable visitor activates **Load Google Maps**. Google therefore receives no map request during ordinary page load.

The iframe uses the exact approved venue and address, a descriptive title, `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, and responsive dimensions of at least 200 by 200 pixels. CSP permits frames only from the exact `https://www.google.com` origin. The Privacy Policy explains the optional Google request.

Google documents the keyless sharing flow at <https://support.google.com/maps/answer/11471036>. This is distinct from the developer-controlled Maps Embed API, which requires a key and billing even though its requests are no-charge.

## Validation

1. Load the event page with the browser Network panel open and filter for `google.com/maps`.
2. Confirm there is no Google Maps request and no map iframe before activation.
3. Tab to **Load Google Maps** and activate it with Enter and Space; repeat with a pointer.
4. Confirm the iframe is titled `Google Maps location for Holiday Inn Denver–Lakewood`, remains at least 200 by 200 pixels, and shows the exact approved venue/address.
5. Confirm the separate **Get directions in Google Maps** link works when JavaScript is unavailable or the iframe cannot load.

## Emergency disable

Remove the click-to-load map host and its script in a normal pull request, then rebuild. The selectable venue/address and direct directions link must remain available. No credential rotation or Cloudflare variable change is required because the implementation has no API key.
