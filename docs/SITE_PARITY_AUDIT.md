# JRHOF Site Parity Audit

**Audit date:** June 21, 2026  
**Compared:** live WordPress (`https://jrhof.org`), Astro branch `codex/astro-static-foundation`, and migration/original-source evidence  
**Scope:** visual/content parity and launch planning only; no implementation changes

## Outcome

The Astro homepage is deliberately close to production and should remain the visual reference. Inner pages are not yet at parity: the large blue intro treatment, repeated elevated cards, square portrait system, and public migration notices make them feel like a new marketing template rather than the familiar JRHOF site.

Astro is materially safer and more complete where it excludes WordPress/plugin defects. It preserves all 150 inductees, fixes archive links, uses the correct Robert Schnabel source, keeps Gene Rozzelle visible, omits public accounts/comments, and avoids stale or fragmented transactional flows. Those gains should be retained while the inner-page presentation moves back toward production's simpler rhythm.

## Evidence and method

- Inspected the current rendered production and local Astro pages at desktop and 390 px mobile widths.
- Audited the canonical 150-record `src/data/inductees.json` dataset and all generated biography routes.
- Compared live-site validation and reconciliation evidence in `docs/LIVE_SITE_VALIDATION_AUDIT.md`, `_migration/reconciliation/`, and `_migration/source-reconciliation/`.
- Verified that all 32 person-specific production `Missing` files and the intentional `Missing_Inductee.webp` are the same SHA-256 binary (`42a7b...a10`). They are one placeholder, not portraits.
- Used content structure, source status, paragraph count, portrait status, and board-review flags to classify every biography.

## Site-wide findings

### Keep from Astro

- Complete 150-person canonical archive and working biography links.
- Header/homepage visual direction, accessible skip link, useful archive filter, descriptive image alt text, mobile navigation, and sticky-footer flex structure.
- Native canonical routes and redirect planning.
- Removal of login/register UI, comments, share/plugin clutter, broken countdown behavior, stale banquet fields, and unsafe transactional dependencies.
- One shared unresolved-portrait data state rather than person-specific filenames presented as portraits.

### Restore from production

- Simpler inner-page hierarchy: modest page title inside the content area instead of a billboard-sized blue hero.
- Wider, calmer production-like content flow with fewer isolated cards and less “dashboard” composition.
- Taller archive portrait proportion and production-like card rhythm, while retaining Astro links and accessibility.
- Simpler biography title/class/portrait/body composition and less decorative framing.
- Production's event-information order and visual familiarity, with stale/plugin/transactional defects removed.

### Remove from Astro

- Public source/migration notes on all 150 biographies.
- Prominent “Record under board review,” alias, and portrait-review treatments; unresolved facts should be handled editorially or with subtle public copy only when truly necessary.
- Large blue page/bio heroes and excessive vertical section spacing on inner pages.
- Repeated card/surface wrappers when one production-like content panel is enough.
- Sponsor-page CTA until packages and ownership are approved; keep the route unadvertised if retained as a future shell.

## Named issues

- **About drift:** production uses one familiar translucent content wrapper and a linear editorial flow. Astro uses a large blue hero, two-column feature, three cards, two additional panels, and unapproved governance placeholders. Restore production's sequence and density; retain only verified copy improvements.
- **Oversized white wrapper:** production's single wrapper can feel long, but Astro's answer should be a restrained content panel—not many independent white cards. Avoid both a giant blank shell and fragmented SaaS-like cards.
- **Oversized blue intro:** clear parity failure on all inner pages and especially biographies. Reduce to a compact title band or title within the content wrapper.
- **Footer position:** Astro's `site-shell` flex column and growing `main` already implement a sticky-footer pattern. Keep it and verify short pages after layout changes.
- **Golf:** Astro preserves valid details and hides post-event content until the event passes. Donation/support copy is duplicated in mutually exclusive pre/post DOM sections; consolidate during implementation. Keep the current-date state logic, but do not restore production's broken countdown, comments, shares, Eventbrite, or split Stripe links.
- **Events CTAs:** state must be explicit: current registration method, registration unavailable, or concluded. Never show active-looking expired CTAs.
- **Donate trust gap:** Astro correctly withholds payments, but visible “pending” trust boxes feel unfinished. Publish approved legal name, EIN/deductibility/receipt/contact details before enabling checkout; otherwise use concise neutral copy.
- **Sponsor page:** not in primary navigation, but linked from Donate. Remove that CTA until the board approves packages, fulfillment, contact ownership, and payment flow.
- **Homepage vs inner pages:** homepage feels closest to JRHOF; inner pages currently feel like a separate marketing system.

## Keep / restore / remove decisions

| Element | Decision | Rationale |
|---|---|---|
| Header and homepage sequence | `keep_as_astro` | Close production parity with cleaner implementation. |
| Sticky footer structure | `keep_as_astro` | Correct short-page behavior is already encoded. |
| Inner-page giant blue heroes | `remove_from_astro` | Visually unfamiliar and disproportionately large. |
| Production-like inner-page rhythm | `restore_from_production` | Core trust/familiarity requirement. |
| Archive filter | `keep_as_astro` | Useful, accessible enhancement without redesigning the archive. |
| Square archive portraits | `restore_from_production` | Production uses familiar taller portrait crops. |
| Shared missing-inductee image | `restore_from_production` | Astro currently shows a different blue review SVG; use the familiar production placeholder binary once. |
| Public migration/review notes | `remove_from_astro` | Internal workflow language alarms visitors. |
| Complete 150-record archive | `keep_as_astro` | Corrects production omission/link defects. |
| Gene Rozzelle display spelling | `needs_human_decision` | Control roster conflicts with source/live spelling “Rozelle.” |
| Native canonical bio URLs | `keep_as_astro` | Clean structure; preserve old paths via redirects. |
| Comments/login/share plugins | `keep_removed_from_production` | Clutter, privacy, moderation, and security burden. |
| Broken/stale countdown and banquet time | `keep_removed_from_production` | Confirmed production defects. |
| Eventbrite/fragmented Stripe architecture | `keep_removed_from_production` | Not acceptable as final architecture. |
| Sponsor route promotion | `remove_from_astro` | Future content is not yet approved. |

## Top 10 recommended fixes

1. Replace giant inner-page and biography heroes with a compact production-like title treatment.
2. Remove all public migration/source notes; make exceptional review language subtle and visitor-centered.
3. Restore production-like archive portrait proportions, spacing, and card density while retaining all 150 links.
4. Reformat the four merged biographies into real paragraphs.
5. Simplify biography pages to portrait + class + readable body with a 65–75ch text measure.
6. Replace Astro's blue review SVG with one shared production-familiar missing portrait for all 33 unresolved records.
7. Rebuild About around production's linear content order and remove unapproved trust placeholders from the public presentation.
8. Consolidate golf state content and present one unambiguous registration/status CTA.
9. Tighten section spacing and reduce repeated white cards across Events, Donate, and Contact.
10. Resolve Gene Rozzelle/Rozelle and the remaining board-review queue before launch.

## First implementation target

Implement Phase A shared rhythm/hero changes first, then Phase B archive and biography formatting. This order makes every inner page feel familiar before page-specific copy/layout work begins.

## Avoid

Do not redesign the homepage, add SaaS-style panels, expose internal editorial states, restore WordPress plugins, re-enable stale event CTAs, treat person-specific `Missing` filenames as portraits, or build Eventbrite/fragmented Stripe dependencies into the final architecture.
