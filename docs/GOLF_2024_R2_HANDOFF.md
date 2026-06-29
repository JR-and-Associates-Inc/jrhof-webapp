# 2024 Umpire’s Cup II Gallery R2 Handoff

The 2024 golf gallery has been prepared from local archival source photos in `2024 Golf Tournament Pictures/`.

The original full-size photos are source/archive files only. They should remain outside the public website repo and should not be committed.

## Generated local website assets

Optimized assets are currently generated under:

- `public/gallery/events/golf/2024/web/`
- `public/gallery/events/golf/2024/thumbs/`

The gallery manifest is:

- `src/data/galleries/golf-2024.json`

The manifest currently points at local public paths such as:

- `/gallery/events/golf/2024/web/2024-umpires-cup-ii-001.webp`
- `/gallery/events/golf/2024/thumbs/2024-umpires-cup-ii-001.webp`

These paths can later be swapped to an R2-backed public media domain, for example:

- `https://media.jrhof.org/events/golf/2024/web/2024-umpires-cup-ii-001.webp`
- `https://media.jrhof.org/events/golf/2024/thumbs/2024-umpires-cup-ii-001.webp`

## Future R2 target structure

Use this object-key layout when an approved R2 upload workflow is available:

- `events/golf/2024/web/`
- `events/golf/2024/thumbs/`
- `events/golf/2024/originals/`

`originals/` should be treated as archival storage. Do not serve it as the default public gallery source unless the organization intentionally approves public original-photo access.

## Upload status

No R2 upload was performed during this work.

The current `wrangler.jsonc` does not define an R2 bucket binding or approved gallery upload workflow, and no R2 credentials were used.

## Suggested next step

After an R2 bucket and public media domain are confirmed, upload only the optimized `web/` and `thumbs/` outputs for public gallery use. Upload originals separately only if the archival policy and access controls are confirmed.
