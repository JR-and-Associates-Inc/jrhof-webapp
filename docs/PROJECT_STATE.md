# Project state and documentation scope

Reviewed October 11, 2026. This page distinguishes implemented code, production source, rehearsal evidence, historical observations, and proposals. It does not authorize deployment or account changes.

## Sources checked

- GitHub main: `7aa294fa09505af775439ea92c1951fd34f3ba33` (dependency security update, PR #79).
- Registration feature: `feature/banquet-stripe-registration`, head `93ac2fc383797de015ebd516acc6ef70d893357a`, open draft [PR #76](https://github.com/JR-and-Associates-Inc/jrhof-webapp/pull/76). Its site, CodeQL and Cloudflare build checks were successful when read on October 11. The feature includes current main as an ancestor.
- This documentation reconciliation starts from that feature head on `codex/docs-preview-reconciliation`. It has inherited feature code; review it against the registration feature, not as a documentation-only diff against main. The changes are documentation only and are reviewed against the registration feature. Integrating them into that feature does not release the feature to production.
- Local attached checkout was on `main` at `2c51be1` before this audit, two main commits behind. The separate banquet worktree held the current feature. A checkout path alone does not identify its branch or release status.
- Code/data/configuration reviewed: `package.json`, `wrangler.jsonc`, `astro.config.mjs`, `src/components/BaseLayout.astro`, `src/styles/global.css`, `src/data/events.ts`, `src/data/registrations.ts`, inductee data/manifest, registration pages and Worker, measurement audit/tests.
- The October 11 rehearsal already recorded an eight-guest test checkout ($43 × 8 plus $25 donation = $369), paid confirmation, eight guest export rows, successful signed webhook, and full test refund. This is dated rehearsal evidence, not a fresh live-payment test during this documentation audit.
- Cloudflare active production version, Google account/campaign/tag settings, group delivery and Stripe account permissions were not reread in this audit. A GitHub build success does not certify current deployment or conversion delivery. Documentation audit validation passed: Astro check/build, content and launch-readiness checks, public-page acceptance and all 34 fake-Stripe Worker tests; local Markdown links resolved. No runtime source or design was changed.

## Main versus registration preview

| Area | Production source main | Unmerged registration feature |
|---|---|---|
| Hosting | Static Astro 7.3.5, Cloudflare Workers Static Assets | Same public architecture plus narrow registration/board Worker |
| Routes | Asset-only; no registration Worker | `/api/*`, `/board`, `/board/*`; static public content |
| Payment paths | Stripe Payment Links for donations; approved Eventbrite golf link | Same donations/golf paths; direct banquet form uses Stripe test Checkout |
| Registration storage | No native banquet registration store | Stripe Checkout Sessions and PaymentIntents; no D1 |
| Board | No native board dashboard | Google-only Access, signed JWT validation, personal greeting, event dashboard, guest editing, CSVs, kitchen sheet, share tool and meeting checklist |
| Class of 2027 | Not yet added | Kirby Clock, Sean Grogan, Brent Mulliniks; verified profile/card WebP pairs in R2; biographies to come |
| Archive totals | 150 inductees; 27 unavailable biographies; 33 unresolved portraits | 153 inductees; 30 unavailable biographies; 33 unresolved portraits |
| Banquet details | February 6, 2027 save-the-date page | Adds noon–4 p.m., business casual and confirmed honorees |
| Seat prices | No native price offer | $43 through Dec 15 inclusive Mountain, then $50; server-selected, original rate retained per checkout |
| Live launch | Not enabled | `priceApproved: false`, event registration not open; test checkout allowed |
| Date/menu settings | Save-the-date content | Nov 16 opening, end-of-Jan 29 closing, 300 seats and Chicken/Steak are current preview settings awaiting board confirmation |
| Guest data | No native form | Purchaser contact required; every guest name/meal/dietary response required; individual guest email/phone optional |
| Exports | No native banquet exports | One row per guest, party/purchaser identifiers, separate contact/meal/dietary fields, original ticket rate and campaign labels; order money once per checkout in all-registration CSV |
| QR branding | No board QR tool | High-resolution brand-kit SVG overlay, locally generated/decoded 720px PNG, preview/test labels |
| Analytics | GTM sole Google loader; donation completion browser event | Same loader plus server-paid-verified registration completion and separate test event; board pages have no analytics |

Preview: https://feature-banquet-stripe-registration-jrhof-webapp.jr-and-associates-inc.workers.dev/

- Public event: `/events/induction-banquet/2027-hall-of-fame-induction-banquet/`
- Direct test form: `/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`
- Board home: `/board/`
- Banquet tools: `/board/banquet-2027/`
- Meeting decisions: `/board/banquet-2027/meeting/`

Only board routes require Google Workspace login. Public registration, confirmation and the signed Stripe webhook remain public. Preview settings do not imply production board Access was configured.

## Design source of truth

Main and feature have identical `src/components/BaseLayout.astro` and `src/styles/global.css` at the reviewed heads. The feature changes event content and adds private board/registration pages; it does not redesign the shared header, footer or homepage layout.

- Public layout: JRHOF/CHSBUA header, archive tone, single light theme, Georgia headings, system/Inter body stack, baseball-field background and constrained surfaces.
- Current CSS navy `#082b4c`, blue `#064b86`, gold `#e8b646`; these are page tokens, distinct from the emblem’s logo colors in the external brand kit.
- Public header/footer reference `public/images/jrhof-emblem.webp` and `chsbua-logo.webp`. The QR-specific vector is `public/images/jrhof-qr-emblem.svg`; changing it did not replace every website logo or favicon.
- Private board pages use their own practical navy/gold light dashboard styles in `worker/board.ts` and the share page. They intentionally omit public marketing tags.
- `docs/implementation/BANQUET_2027_PUBLIC_PAGE.md` describes the public page; `docs/operations/EVENT_REGISTRATION.md` describes the preview form and board.
- Portrait/gallery media resolves through the R2 manifest/helpers. Published immutable keys must never be overwritten.

## Not implemented or not approved

- Manual mail/cash/check entries, recognition-price registrations and complimentary registrations. D1 manual entry is a proposal for the custom Stripe approach; no database/binding is provisioned.
- Google Chat signup/donation alerts, a new Chat space, newsletter subscriptions, a live golf Worker registration flow, or bios for the three 2027 inductees.
- Strict seat reservation locking. Current checks can oversell under concurrent checkouts.
- Zeffy account/campaign integration, site embeds, completed-payment analytics attribution, or board synchronization. See [Zeffy evaluation](operations/ZEFFY_EVALUATION.md).
- Board approval of menu, final opening/closing dates, capacity, recognition/comps, refunds/privacy/retention, and authorized live release. See [meeting checklist](operations/BOARD_MEETING_2026-10-11.md).

## Documentation inventory and freshness

| Documents | Role and limits |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md` | Current workflow; branch scope now explicit. Preview requires Worker command, not Astro dev alone. |
| `docs/README.md`, this page, `HANDOFF.md`, `CLOUDFLARE.md` | Current operating references; Cloudflare account inventory remains explicitly dated September evidence. |
| `ROADMAP.md`, `DECISIONS.md`, `IMPLEMENTATION_GUARDRAILS.md` | Current priorities/guardrails, with superseded ADRs retained and pointed to their replacements. |
| `CONTENT_MODEL.md`, `events-architecture.md`, `MEDIA.md`, `implementation/*` | Current repository content/media/design rules; feature-specific additions labeled. |
| `operations/EVENT_REGISTRATION.md`, `operations/BOARD_MEETING_2026-10-11.md` | Implemented preview behavior versus launch decisions/proposals. |
| `operations/ZEFFY_EVALUATION.md` | Proposed account/pilot and official documented limits, checked October 11; no account test claimed. |
| `ANALYTICS.md`, `architecture/JRHOF_MARKETING_ARCHITECTURE.md`, `playbooks/JRHOF_GA4_GTM_ADS_OPERATIONS.md`, `launch/SEO_AND_AD_GRANTS_READINESS.md` | Current emission/design/checklists; live Google setup remains independently verifiable. Historic audit claims are not current state. |
| `architecture/JRHOF_GOOGLE_WORKSPACE_*` | Dated plan and incomplete inventory; Google sign-in is in use but broad migration is not certified complete. |
| `launch/STRIPE_PHASE_2_ARCHITECTURE.md` | Future donation Checkout proposal, distinct from current donation Payment Links and preview event Worker. |
| `GITHUB_SECURITY_CHECKLIST.md` | Desired repository/account controls; requires live permission/ruleset readback, not a statement all controls are active. |
| `LICENSE_REVIEW.md`, `CONTENT_RIGHTS.md`, `COPYRIGHT.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `SECURITY.md` | Durable license, rights, conduct, support and reporting policy; no new legal commitments added by this audit. |
| Ignored `docs/private/` | Private dated evidence and account records; not published or treated as current account certification. |
| Parent project handoff, brand README and October 3 Claude marketing files | Handoff points to this current state; brand asset inventory is distinct from deployment. October 3 reports remain dated historical evidence, not executable current instructions. |

## Keeping docs aligned

For each implementation or release: identify the branch/head; update its runbook, ADR/roadmap and page notes; run verification; record what was actually tested and what remains proposed. At merge, update this main/preview matrix to the released source commit and verify the Cloudflare version separately. For external configuration, record observation date, system and evidence privately. Recheck before repeating dashboard changes. Do not replace unknowns with assumed completion.
