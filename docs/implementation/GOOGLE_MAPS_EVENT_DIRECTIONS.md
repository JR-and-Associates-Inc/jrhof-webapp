# Google Maps event directions

## Current public implementation

The 2027 banquet page always displays the approved venue name and address as selectable text and provides the standard keyless Google Maps directions URL. JRHOF does not request the visitor's device location.

The component also supports an optional click-to-load Maps Embed API iframe through `PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`. The iframe has no `src` and does not exist in the document until a keyboard-operable visitor action. If the build variable is absent, the interactive control is omitted and the venue panel becomes a direct Google Maps link. The direct link is therefore the primary fallback for missing configuration, JavaScript-disabled visitors, and API failure.

The configured iframe uses a descriptive title, `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, and responsive dimensions of at least 200 by 200 pixels. CSP permits frames only from the exact `https://www.google.com` origin needed for the Embed API. The Privacy Policy explains both optional Google requests.

## Create and restrict the dedicated browser key

Do not place a key in Git, source code, a pull-request comment, or documentation. A board-approved operator must:

1. Open the approved JRHOF Google Cloud project and confirm its owner, billing relationship, and emergency contact.
2. Enable only the Maps Embed API needed by this page.
3. Create a dedicated browser key named `JRHOF 2027 banquet map embed`; do not reuse a server, Android, iOS, or unrelated website key.
4. Apply **Websites** restrictions for these exact approved surfaces:
   - `https://jrhof.org/*`
   - `https://feature-banquet-2027-public-page-jrhof-webapp.tmco-consulting.workers.dev/*`
   - `https://feature-banquet-2027-public-page-jrhof-webapp.jr-and-associates-inc.workers.dev/*`
5. Apply an API restriction allowing only the **Maps Embed API**.
6. Set `PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` as an encrypted build variable in each approved Cloudflare Git integration's preview and production environments. Although the browser key is visible to visitors, storing it outside Git makes rotation and environment scoping safer.
7. Rebuild the branch preview. Verify a successful request from each approved origin and a rejected request from an unapproved origin.
8. Check the page's Network panel before activation: there must be no request to Google Maps. Activate the map with mouse and keyboard and confirm the iframe title, minimum dimensions, focus treatment, and direct-link fallback.

If the Google Cloud project, billing responsibility, or approved origins are uncertain, leave the variable unset. The address and directions link remain complete and usable without it.

Google documents the Embed API setup at <https://developers.google.com/maps/documentation/embed/get-api-key>, embed requirements at <https://developers.google.com/maps/documentation/embed/embedding-map>, and key restrictions at <https://docs.cloud.google.com/docs/authentication/api-keys>.

## Rotation or emergency disable

Create and fully restrict a replacement key before changing the configured build variable. Validate the replacement on the approved preview, update each authorized Cloudflare environment, rebuild, and then delete the old key after confirming the rollout. To disable the map immediately, remove `PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` and rebuild or disable/delete the dedicated key; the selectable address and keyless directions link must remain available.
