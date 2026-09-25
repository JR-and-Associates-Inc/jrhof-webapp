# Roadmap

Where the website is headed, in priority order. Update this file when a priority changes or an item ships. Detailed rules live in [AGENTS.md](../AGENTS.md) and [IMPLEMENTATION_GUARDRAILS.md](IMPLEMENTATION_GUARDRAILS.md).

## Direction

jrhof.org is the permanent public archive of Colorado high school baseball umpiring and the home of the Hall of Fame's two annual events and its fundraising. The principles that shape every change:

- **Archive first.** The inductee record and event history are the site's lasting value. Events and fundraising pages serve the mission; they don't turn the site into a marketing funnel.
- **Maintainable by one volunteer.** Prefer static pages, data files, and managed services over custom infrastructure. Every new moving part needs a clear owner and a reason to exist.
- **Own the relationship, minimize the data.** Take payments on Stripe from jrhof.org instead of through third-party event platforms. Collect only the personal data an event actually needs, and keep it in as few places as possible.
- **Verified facts only.** Names, dates, biographies, portraits, prices, and legal or tax claims are published only when confirmed.
- **Measure outcomes, not activity.** Donations and registrations are the conversions; page views and clicks are not.

## Now (fall 2026)

1. **Repository cleanup.** Dependencies are current, accessibility contrast fixed, stale hand-typed event copy replaced by data, and images right-sized (PR #71). Docs are reconciled with the repository and the Cloudflare account.
2. **Google Ad Grants.** The account is approved but not performing. Run a read-only audit of Google Ads, GTM, GA4, and the Stripe Payment Link redirect settings, then fix what it finds.
   - The site currently reports no completed-donation or registration conversion. Ad Grants requires valid conversion tracking that records meaningful conversions every month, so the donation and registration conversions are the first fix.
   - Target structure is three Search campaigns: **Donations** (Colorado), **Brand & Archive** for evergreen awareness (US), and **Events** with a banquet ad group (about November to early February) and a golf ad group (about March to June).
   - Keep the account compliant: account CTR of at least 5%, no Quality Score 1–2 or single-word keywords, at least two ad groups per campaign with at least two ads each, and sitelinks. Check Google's current Ad Grants policy before relying on any threshold.
3. **2027 banquet registration on Stripe.** The banquet is Saturday, February 6, 2027, so registration should open by mid-November 2026. Requirements:
   - one registration covers up to 8 seats
   - a full name and meal choice (Chicken or Steak) for every attendee, plus an optional dietary note
   - the board gets an export with headcount by meal for the hotel kitchen, and the attendee list
   - the purchaser gets a Stripe receipt and lands on a jrhof.org confirmation page that records the registration conversion

   Stripe Payment Links alone can't capture per-attendee names and meals. Still to decide: a small Worker that creates Stripe Checkout Sessions with Stripe as the record, or a slimmed version of the D1-backed work on `feature/banquet-registration-checkout`.

## Next (winter–spring 2027)

- **A reusable upcoming-event page.** Replace the bespoke 2027 banquet branch (`isBanquet2027`) with a layout driven by the event record, so the next banquet and the golf tournament get the same page and Register button without new code.
- **Golf 2027 on the same registration flow**, then retire Eventbrite. When the last Eventbrite link goes, remove `eventLinks.golfRegistration` and the Eventbrite exception in validation.
- **Class of 2027.** Add the inductees, portraits, and banquet record when they're announced (see [CONTENT_MODEL.md](CONTENT_MODEL.md)). The homepage and event pages pick them up from the data.
- **Better archive browsing.** Class-year pages (`/inductees/class-of-<year>/`), year or decade filters on `/inductees/`, and "other members of this class" links on each biography.
- **Retire the registration preview infrastructure.** Remove the two preview Workers and the preview database listed in [CLOUDFLARE.md](CLOUDFLARE.md) once the registration branch is replaced, after tagging it.

## Later (needs organization input)

- **Help complete the archive.** 27 inductees have no published biography, 33 have no portrait, and 29 are recorded only as "Pre 1990". A public call for programs, clippings, and photos would turn this into a community project. It must be worded without internal review language.
- **Verify details before changing them:**
  - Name punctuation: `Ed OConnor`, `Pete DAmato`, `Edmund DHaillecourt`, `H_R Phillips`.
  - The founding year: the About page says 1989, but one inductee is recorded in 1987.
  - The identity-blocked records in CONTENT_MODEL.md.
- **Pages visitors expect from a hall of fame and a nonprofit:**
  - how to nominate someone
  - leadership and transparency (board, annual summary, Candid profile)
  - sponsor recognition (`/sponsor/` exists but isn't linked from anywhere yet)
- **An email list** for event announcements. This is a new third-party service, so it needs a decision on provider, ownership, and privacy.

## Standing maintenance

- **Monthly:** merge the grouped Dependabot updates once CI passes; check the Ad Grants compliance numbers.
- **After each event:** update the event status, recap, and gallery (see [events-architecture.md](events-architecture.md) and [MEDIA.md](MEDIA.md)), and pause that event's ad group.
- **Yearly:** run the audit checklist in [CLOUDFLARE.md](CLOUDFLARE.md), review this roadmap, and confirm the Ad Grants program survey was answered.
