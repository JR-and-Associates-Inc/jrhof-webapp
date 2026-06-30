# Analytics Strategy

## Active tools

- **Cloudflare Web Analytics:** active for privacy-conscious traffic and web-performance visibility. It is managed in the Cloudflare dashboard; automatic injection means the beacon may not appear in repository templates.
- **Google Analytics 4:** active through Cloudflare Zaraz with measurement ID `G-VYQQ5E7ZHM`. Zaraz, tool triggers, consent behavior, and publishing state are dashboard configuration.
- **Site event bridge:** `src/components/BaseLayout.astro` emits selected events to `dataLayer`, an available `gtag`, and the `jrhof:analytics-event` browser event. It does not configure a measurement destination itself.

Do not add a hardcoded GA4/GTM script while Zaraz owns GA4 delivery, and do not manually add the Cloudflare beacon while automatic injection is active. Duplicate tags produce misleading pageviews and needless client work.

## Validation and ownership

The analytics owner should verify after material releases:

1. Cloudflare Web Analytics receives production traffic without a duplicate beacon.
2. Zaraz is published on the production zone and points to exactly `G-VYQQ5E7ZHM`.
3. GA4 Realtime/DebugView sees expected page views and approved custom events.
4. Preview traffic is excluded or clearly distinguishable.
5. `public/_headers` continues to allow the required Cloudflare and Google endpoints without broadening CSP unnecessarily.
6. Privacy language and consent behavior match the actual tools and organizational policy.

Keep account identifiers, access roles, consent decisions, and dashboard screenshots in an access-controlled operations runbook. Do not commit credentials or recovery information.

## Future Microsoft Clarity

Clarity is deferred. Before enabling it, JR and Associates should approve the privacy purpose, recording/masking settings, consent behavior, retention, access roles, CSP changes, and a test plan. The retired Next.js Clarity component under `_archive/legacy-nextjs/` is historical code and must not be reactivated by import.
