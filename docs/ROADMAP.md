# Roadmap

Reviewed October 11, 2026 against current main and the registration feature. [PROJECT_STATE.md](PROJECT_STATE.md) records release scope and evidence; completed preview work is not production work.

## Direction

jrhof.org is the permanent public archive of Colorado high school baseball umpiring and the home of JRHOF events and fundraising.

- Archive first: preserve history and source facts.
- Maintainable by one volunteer: prefer small static pages, data files and managed services with a named owner.
- Own the relationship and minimize data: keep the organization’s website, accounts and exportable records. Stripe is the implemented payment path; Zeffy is an alternative under evaluation, not a settled change.
- Publish only confirmed facts and approved legal/privacy claims.
- Measure completed outcomes; keep page views and routine clicks as diagnostics.

## Current production source

Main `7aa294f` has the static Astro 7.3.5 archive, approved R2 media, existing shared design, Stripe donation Payment Links and the approved golf Eventbrite link. Dependency/security updates are merged. The registration feature remains draft PR #76 and has not changed production. Google measurement delivery and Ad Grants campaign status require current dashboard verification rather than repository inference.

## Now: board demonstration and launch decision

1. **Registration preview implemented.** Google-only board home and tools, public test checkout for up to eight guests, per-guest meal/dietary/contact data, separate guest CSV rows, kitchen sheet, guest changes/refunds, signed webhook, original price retention, campaign links and vector-logo QR downloads. No D1; Stripe holds online registrations.
2. **2027 preview content implemented.** Kirby Clock, Sean Grogan and Brent Mulliniks, verified R2 WebP portrait pairs, February 6 noon–4 p.m., business casual. Receive approved biographies next. Main still has the prior save-the-date content and 150-person roster.
3. **Pricing implemented for rehearsal.** $43 through December 15 inclusive Mountain, then $50. Live checkout stays blocked by `priceApproved: false`. Final opening/closing, menu, capacity, recognition/comps, refunds/privacy/retention and inventory-lock requirements need board decisions. See [meeting checklist](operations/BOARD_MEETING_2026-10-11.md).
4. **Choose the operational platform.** A Zeffy-embedded register page now runs on the separate `feature/zeffy-registration-preview` branch (from main) at the same path as this preview, for a side-by-side board demo. Update the draft Zeffy form to match first, then decide before adding more custom administration. Trade-offs and the form changes are in [REGISTRATION_OPTIONS.md](operations/REGISTRATION_OPTIONS.md); acceptance tests (eight-guest reports, offline/comps/refunds, payment-attributed GA4/Ads) are in [ZEFFY_EVALUATION.md](operations/ZEFFY_EVALUATION.md).
5. **Offline registration.** Not implemented. If custom Stripe is selected, design a small private D1 board-entry flow with paid/unpaid status, edit history and duplicate-payment controls. If Zeffy is selected, prove its manual-entry/reporting workflow instead.
6. **Google measurement.** Preserve the existing GTM container/property/history. Verify donation completion, preview/live separation, paid registration completion, campaign attribution and Ads goals before relying on reports. Existing browser donation completion is not server-paid proof. See [ANALYTICS.md](ANALYTICS.md).
7. **Live release is separate.** Complete event decisions, production board Access, approved payment credentials/webhook, financial/support ownership and end-to-end checks before approving a main merge. Do not promote a test preview to production to repair missing settings.

## Next

- Reusable upcoming-event layout: replace the bespoke `isBanquet2027` branch deliberately after the current launch work; use confirmed event records for future years.
- Golf 2027: confirm date/rules first, choose registration platform and validate it before retiring the approved Eventbrite link.
- Receive approved 2027 biographies; continue source-faithful archive enrichment.
- Board navigation: grow from the implemented landing page as useful approved tools become available; existing golf/Workspace links are navigation, not integrated dashboards.
- Signup/donation alerts: decide Google Chat space, recipients, permitted information and notification volume; no space or alerts enabled yet.
- Backlog carried from the October 3 Ad Grants task brief (each is platform-dependent; on Zeffy most become form settings rather than code):
  - Ads conversion mapping table in [ANALYTICS.md](ANALYTICS.md): `registration_complete` and `donation_complete` as primary purchase conversions, register/donate clicks as interim, contact events, test events never imported.
  - Golf add-ons in the same checkout: mulligans first; online raffle sales only after the board confirms Colorado raffle licensing covers them. Then remove the separate mulligan/raffle Payment Links.
  - Hole and team sponsorships with tiers the board sets; logos by email, never uploaded to the site.
  - Tribute and memorial gifts (approved by TJ October 3): a `/donate/tribute/` page and an "in memory or honor of" field on the donation links; a custom donation flow only with a later go-ahead.
  - An add-to-calendar `.ics` file on the registration confirmation page.
- Retire historical D1 prototype Workers/database and assess the TMCO mirror only after a fresh resource inventory and approval. Current Stripe preview does not use them.

## Later: organization input

- Archive completeness: feature has 30 unavailable biographies (including the three new inductees), 33 unresolved portraits and 29 “Pre 1990” records. Main counts remain 27/33/29 until release.
- Resolve identity-blocked records in [CONTENT_MODEL.md](CONTENT_MODEL.md), name punctuation and the founding-year inconsistency before altering public claims.
- Nomination process, leadership/transparency and sponsor navigation need approved content and owners.
- Mailing list requires a provider and explicit subscription/privacy decisions. Collecting guest email does not subscribe that person.

## Standing maintenance

- Update relevant docs with every implementation/decision; label preview, production, historical observation and proposal explicitly.
- Validate dependency PRs before release; review Ad Grants against current official policy and actual dashboard evidence.
- After events, update status/recap/gallery and any seasonal campaign through its named owner.
- Annually and after ownership changes, run [Cloudflare](CLOUDFLARE.md) and [GitHub](GITHUB_SECURITY_CHECKLIST.md) checklists and review organizational access, retention and recovery.
