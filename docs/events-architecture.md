# Events Architecture

## Purpose

JRHOF events are content records, not pages that are reused and overwritten each year. Every golf tournament, induction banquet, and future recurring program receives an immutable annual record in `src/data/events.ts`. The shared route renderer turns those records into detail pages, while landing and archive pages are generated from the same data.

## URL conventions

Program landing pages remain stable:

- `/events/`
- `/events/golf/`
- `/events/induction-banquet/`

Annual instances use this canonical pattern:

```text
/events/{event-type}/{year}-{descriptive-event-slug}/
```

Examples:

- `/events/golf/2026-umpires-cup-iv/`
- `/events/induction-banquet/2026-hall-of-fame-induction-banquet/`

Never replace an older record when a new year is announced. Never use a bare year as the canonical slug. A legacy or generic year URL may redirect to the descriptive canonical URL.

## Content model

`EventRecord` supports:

- identity: `id`, `eventType`, `year`, `slug`, `canonicalPath`
- presentation: `title`, `shortTitle`, `subtitle`, `description`, `recap`, `heroImage`
- lifecycle: `status`, `startDate`, `endDate`, `displayDate`
- place: `venueName`, `venueAddress`, `location`
- participation and media: `registration`, `gallery`, `flyer`, `program`, `documents`
- people and partners: `sponsors`, `photographer`, `inductees`
- discovery: `seoTitle`, `seoDescription`

Allowed primary lifecycle values are `scheduled`, `registration-open`, `completed`, `gallery-published`, and `archived`. Registration and gallery availability are modeled separately so a completed event can gain a gallery without losing its historical state.

## Rendering and canonical behavior

`src/pages/events/[eventType]/[slug].astro` generates every annual instance from the event data. It also generates the canonical tag, breadcrumbs, Event structured data, program/archive links, gallery, and support panel. The landing pages and `/events/archive/` read the same records, avoiding hand-maintained duplicate cards.

The generated sitemap receives the immutable instance routes automatically. Redirects in `public/_redirects` preserve only known older URLs; internal links always use `canonicalPath`.

## Event lifecycle

1. Create the annual record as `scheduled` after the date is approved.
2. Add confirmed venue and registration details; change to `registration-open` only when the registration URL works.
3. After the event, set `completed`, close registration, and add the recap.
4. Process and publish approved derivatives; set gallery status to `published` and the primary event status to `gallery-published`.
5. Use `archived` for a historical record whose verified details are intentionally limited.
6. Keep the record, canonical URL, media keys, and documents intact when a new year is added.

## Add a new annual event

1. Choose an existing `eventType`, or extend `EventType` and add a matching program landing page.
2. Add a complete `EventRecord` in `src/data/events.ts` with a unique ID and descriptive slug.
3. Confirm that `canonicalPath` exactly matches `/events/{eventType}/{slug}/`.
4. Add only verified dates, location, people, registration, documents, and sponsor details.
5. Run `npm run check`, `npm run build`, and `npm run validate`.
6. Inspect the detail page, program landing page, full archive, breadcrumbs, JSON-LD, and sitemap.

## Add a gallery

1. Complete the archival and processing steps in `docs/media-workflow.md`.
2. Commit the generated manifest under `manifests/r2/`; never commit image binaries or originals.
3. Import the manifest in the shared annual-instance route and add its key to the manifest map.
4. Set `gallery.status` to `published` only after every object is accessible and checksum-verified through `media.jrhof.org`.
5. Record the public derivative count and permanent media path in the event record.

## Validation checklist

- Every event has one descriptive canonical path.
- Landing, archive, card, breadcrumb, sitemap, metadata, and schema URLs match `canonicalPath`.
- Past instances remain reachable after a new year is added.
- Registration state and event state are accurate.
- Event dates and structured data match approved facts.
- Galleries contain optimized R2 derivatives only.
- Existing published golf object URLs remain unchanged.
- Redirects point directly to the final canonical URL.
- `git diff --check`, `npm run check`, `npm run build`, and `npm run validate` pass.
