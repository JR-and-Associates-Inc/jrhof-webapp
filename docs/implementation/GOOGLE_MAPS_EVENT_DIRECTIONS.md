# Google Maps event directions

## Current public implementation

The 2027 banquet page displays the approved venue name and address as selectable text and links to Google Maps directions with the standard keyless directions URL. It does not embed a map, ship an API key, request the visitor's location, or contact Google Maps during page load.

The direct link is the non-JavaScript fallback as well as the primary directions control. The Privacy Policy explains that Google receives a request only after the visitor follows that link.

## Optional future click-to-load embed

Do not add an iframe until a board-approved operator has created and verified a dedicated public browser key. Before a future release:

1. Enable only the Maps Embed API in the approved Google Cloud project.
2. Create a dedicated key named for the JRHOF event-map embed; do not reuse a server or unrelated website key.
3. Apply website restrictions for `https://jrhof.org` and `https://jrhof.org/*`, plus each specifically approved preview origin. Do not allow wildcard preview providers or all websites.
4. Apply an API restriction allowing only the Maps Embed API.
5. Verify rejected requests from an unapproved origin and successful requests from every approved origin.
6. Keep the iframe `src` unset until a keyboard-operable visitor action. Use a descriptive title, `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, and responsive dimensions never smaller than 200 by 200 pixels.
7. Add only the Google Maps iframe origin required by the tested Embed API request to `frame-src`; do not broaden other CSP directives.
8. Recheck the Privacy Policy, network waterfall before activation, no-JavaScript fallback, keyboard focus, screen-reader name, and direct directions link.

Google documents the Embed API setup at <https://developers.google.com/maps/documentation/embed/get-api-key>, embed requirements at <https://developers.google.com/maps/documentation/embed/embedding-map>, and key restrictions at <https://docs.cloud.google.com/docs/authentication/api-keys>.

## Rotation or emergency disable

Create and fully restrict a replacement key before changing the deployed key. Validate the replacement on the approved preview, switch the configured public value, and then delete the old key after confirming the rollout. To disable the map immediately, remove the iframe feature or disable/delete the dedicated key; the selectable address and keyless directions link must remain available.
