# JRHOF Content Parity Audit

**Compared:** Astro preview at `http://localhost:4321` and live WordPress at `https://jrhof.org`  
**Date:** June 20, 2026  
**Scope:** Public content parity only; no transactional, analytics, deployment, or architecture work

## Executive summary

The Astro foundation already preserved the production header/footer, homepage sequence, complete 150-record archive, and safer inductee content. This pass restored useful live copy that had not yet reached Astro: fuller About content, exact homepage event excerpts, 2024/2025 event archive context, 2026 event details and flyer references, sponsor/donor acknowledgment, donation-purpose language, and contact/newsletter explanations.

Known WordPress defects and runtime features remain excluded. No login/register UI, site-search modal, comments, countdowns, broken banquet time, stale registration CTA, payment link, or backend form was restored.

## Disposition definitions

- `restore_now` — useful public content, supported by current production and migration evidence, restored in this pass.
- `restore_later` — useful content requiring media transfer, rights review, operational tooling, or a later approved implementation.
- `intentionally_exclude` — plugin UI, defects, expired transactional behavior, duplication, or content that weakens safety/accessibility.
- `needs_board_review` — claims, legal/trust details, program descriptions, or publication decisions needing nonprofit approval.

## Page-by-page findings

### Homepage (`/`)

| Missing or differing live item | Disposition | Result |
|---|---|---|
| Exact 2026 golf excerpt naming Applewood Golf Club | `restore_now` | Restored. |
| Banquet excerpt describing its place in the high school baseball season | `restore_now` | Restored in cleaned, non-transactional form. |
| 2025 golf excerpt naming sponsor KSK and LeBaron Portraits | `restore_now` | Restored. |
| Duplicate mission paragraph under the Class of 2026 heading | `intentionally_exclude` | Not restored; it appears to be duplicated production content. |
| Header search/login/account surfaces | `intentionally_exclude` | Not restored. |

The required homepage sequence and CTA language remain: Our Mission, 2026 Hall of Fame Inductees, Our Latest Events, Explore Our Past Events, Support the Hall of Fame, All Inductees, Read More, Events, and Donate.

### About (`/about/`)

| Missing live item | Disposition | Result |
|---|---|---|
| Founded-in-1989 and Joe Rossi origin copy | `restore_now` | Restored. |
| Live mission statement | `restore_now` | Restored in a cleaned form. |
| Inductee selection explanation | `restore_now` | Restored. |
| Looking Ahead and Get Involved copy | `restore_now` | Restored without unverified metrics. |
| Claims that JRHOF currently provides scholarships, mentorship, and other measured impact | `needs_board_review` | Not asserted; governance/impact placeholders remain. |
| Board roster, stewardship proof, and impact metrics | `needs_board_review` | Still pending. |

### Inductees (`/inductees/`)

| Missing or differing live item | Disposition | Result |
|---|---|---|
| WordPress archive search experience | `intentionally_exclude` | The accessible archive-specific Astro filter remains; the global WordPress search/modal does not. |
| Gene Rozelle/Rozzelle, absent from the visible live archive | `restore_now` | Already preserved by the Astro guardrail. |
| Live card links and person-specific Missing portraits | `intentionally_exclude` | Astro keeps all 150 detail links and one shared placeholder policy. |
| Final name/year/portrait adjudication for flagged records | `needs_board_review` | Remains in reconciliation workflow. |

### Events index (`/events/`)

| Missing live item | Disposition | Result |
|---|---|---|
| 2025 Umpire's Cup III archive description | `restore_now` | Restored with KSK and LeBaron Portraits acknowledgment. |
| 2024 Umpire's Cup II archive description | `restore_now` | Restored. |
| General sponsor/donor thank-you copy | `restore_now` | Restored. |
| 2024/2025 image galleries | `restore_later` | Awaiting approved media migration and rights/source verification. |
| Comment count and comments | `intentionally_exclude` | Not restored. |
| Direct Stripe donation CTA embedded in event listing | `intentionally_exclude` | Not restored; local Donate information page remains the safe path. |

### 2026 Golf Tournament

**Live:** `/2026-hof-golf-tournament/`  
**Astro canonical:** `/events/golf/2026-umpires-cup-iv/`

| Missing live item | Disposition | Result |
|---|---|---|
| Tradition/community introduction | `restore_now` | Restored. |
| Date, valid time, entry fee, and Applewood Golf Club address | `restore_now` | Restored as public event information. |
| 2026 flyer PDF reference | `restore_now` | Restored as an external static-media reference. |
| Raffle-ticket and mulligan explanation | `restore_now` | Restored without purchase links. |
| Can't-attend donation explanation | `restore_now` | Restored with a local `/donate/` link. |
| Event photographs | `restore_later` | Awaiting the event and approved media files/rights. |
| External registration and purchase/payment links | `intentionally_exclude` | Not restored; availability is explicitly marked for confirmation. |
| Countdown and public comments | `intentionally_exclude` | Not restored. |
| Sponsor fulfillment/package details | `needs_board_review` | Remain pending. |

### 2026 Induction Banquet

**Live:** `/2026-hof-induction-banquet/`  
**Astro canonical:** `/events/induction-banquet/`

| Missing live item | Disposition | Result |
|---|---|---|
| Banquet purpose and Class of 2026 context | `restore_now` | Restored. |
| Terry Angell, George Demetriou, and Fred Zuercher linked cards | `restore_now` | Restored using reconciled Astro records and portraits. |
| Historical date, location, and attire | `restore_now` | Restored as concluded-event information. |
| 2026 flyer PDF reference | `restore_now` | Restored as an external static-media reference. |
| Banquet photo archive | `restore_later` | Awaiting approved source media and rights. |
| Broken WordPress time (`31, 2026`) | `intentionally_exclude` | Explicitly omitted. |
| Expired hotel deadline, ticket prices, and external registration links | `intentionally_exclude` | Not presented as current public instructions. |
| Countdown, comments, and share plugin UI | `intentionally_exclude` | Not restored. |

### Donate (`/donate/`)

| Missing live item | Disposition | Result |
|---|---|---|
| Donation-purpose introduction and Why Your Support Matters | `restore_now` | Restored. |
| Banquet, history preservation, education/community, and operational-support categories | `restore_now` | Restored with an approval caveat for allocation/metrics. |
| One-time and monthly giving explanations | `restore_now` | Restored without payment behavior. |
| Get Involved copy | `restore_now` | Restored. |
| WordPress Stripe donation links | `intentionally_exclude` | Not restored in this phase. |
| EIN, deductibility language, receipt expectations, stewardship details, and impact metrics | `needs_board_review` | Visible placeholders remain. |
| Sponsor package details | `needs_board_review` | Remain on the separate Sponsor shell. |

### Contact (`/contact/`)

| Missing live item | Disposition | Result |
|---|---|---|
| “Send us a message” explanatory context | `restore_now` | Restored. |
| “Keep in touch / Don't strike out” newsletter invitation | `restore_now` | Restored as explanatory copy. |
| Contact form submission | `restore_later` | Requires privacy-reviewed delivery, retention, and spam controls. |
| Newsletter subscription form | `restore_later` | Requires consent, list ownership, unsubscribe, and delivery decisions. |
| WordPress form plugin markup and JavaScript failure messages | `intentionally_exclude` | Not restored. |
| Approved public email/contact channel | `needs_board_review` | Still pending publication confirmation. |

## Intentionally excluded WordPress defects and plugin UI

- Duplicate mobile/desktop header output in extracted page content.
- Login, password reset, account modal, and global search modal.
- Public comments, comment forms, comment counts, share widgets, and plugin boilerplate.
- Golf and banquet countdowns.
- Banquet's malformed Time value.
- Expired banquet pricing, hotel deadline, and registration CTA.
- External registration, raffle, mulligan, donation, and payment links as active site architecture.
- Person-specific `Missing` images and generic silhouettes treated as portraits.

## Remaining gaps

- Approved 2024, 2025, and 2026 event gallery media and usage rights.
- Native event registration and transaction architecture (explicitly outside this pass).
- Board-approved sponsor packages and fulfillment terms.
- Approved contact channel, form operations, and newsletter provider/consent workflow.
- EIN publication, donation deductibility wording, receipts, stewardship details, and verified impact metrics.
- Final board approval for the outstanding inductee identity/content/media reconciliation queue.

## Recommendation

Next, run a board/operations approval pass focused on trust details, event media rights, sponsor packages, and a public contact channel. Keep transactional implementation separate until those decisions and the final content/media approvals are documented.
