# Roadmap

Where the website is headed, in priority order. Update this file when a priority changes or an item ships. Detailed rules live in [AGENTS.md](../AGENTS.md) and [IMPLEMENTATION_GUARDRAILS.md](IMPLEMENTATION_GUARDRAILS.md).

## Direction

jrhof.org is the permanent public archive of Colorado high school baseball umpiring and the home of the Hall of Fame's two annual events and its fundraising. The principles that shape every change:

- **Archive first.** The inductee record and event history are the site's lasting value. Events and fundraising pages serve the mission; they don't turn the site into a marketing funnel.
- **Maintainable by one volunteer.** Prefer static pages, data files, and managed services over custom infrastructure. Every new moving part needs a clear owner and a reason to exist.
- **Own the relationship, minimize the data.** Keep registration on jrhof.org pages (Zeffy embedded in the site rather than a separate event platform). Collect only the personal data an event actually needs, and keep it in as few places as possible.
- **Verified facts only.** Names, dates, biographies, portraits, prices, and legal or tax claims are published only when confirmed.
- **Measure outcomes, not activity.** Donations and registrations are the conversions; page views and clicks are not.

## Now (fall 2026)

1. **Google Ad Grants.** Audited September 25; tracking and campaigns rebuilt October 3, 2026 (see [ANALYTICS.md](ANALYTICS.md#conversion-settings) for the conversion settings).
   - Done: GTM version 12 forwards `registration_complete`; GA4 key events are set; Ads imports them as conversions and the never-firing actions are removed. Golf registration buttons now send `golf_register_click` and the `/sponsor/` call to action sends `sponsor_inquiry`, which Ads already imports.
   - Live: `Evergreen | Awareness` and `Evergreen | Donations` (United States, phrase and exact match only). The older campaigns are paused, not deleted.
   - Next: move donations and a newsletter sign-up to Zeffy embeds so real completions (`donation_complete`, `newsletter_signup`) record; prove each end to end with a real test; set the GA4 internal-traffic filter to Active; build `Seasonal | Induction Banquet` (Colorado) and, once the 2027 date is set, `Seasonal | Umpire's Cup Golf`.
   - Keep the account compliant: account CTR of at least 5%, at least one conversion a month, no Quality Score 1–2 or single-word keywords, at least two ad groups per campaign with at least two ads each, and sitelinks. Check Google's current Ad Grants policy before relying on any threshold.
2. **2027 banquet registration on Zeffy.** The board chose Zeffy on October 11, 2026. Registration opens November 16 for the Saturday, February 6, 2027 banquet. The site pages are on `main` with "Registration opens soon"; `preview/go-live` shows the open state for board approval. Open registration on `main` once the board approves and the [launch checklist](PROJECT_STATE.md#launch-checklist) passes: bank linked in Zeffy, sales opening set, a test order, Google conversion setup, and Search Console and Ads checks after deploy.

## Next (winter–spring 2027)

- **A reusable upcoming-event page.** Replace the bespoke 2027 banquet branch (`isBanquet2027`) with a layout driven by the event record, so the next banquet and the golf tournament get the same page and Register button without new code.
- **Golf 2027 on Zeffy** (tickets, add-ons and sponsorships in the same account), then retire Eventbrite. When the last Eventbrite link goes, remove `eventLinks.golfRegistration` and the Eventbrite exception in validation.
- **Class of 2027 biographies.** The inductees and portraits are live (PR #83); add verified biographies when supplied, and re-publish the three portraits with corrected color (see [MEDIA.md](MEDIA.md)).
- **Better archive browsing.** Class-year pages (`/inductees/class-of-<year>/`), year or decade filters on `/inductees/`, and "other members of this class" links on each biography.
- **Retire the Stripe registration infrastructure.** Remove the two preview Workers and the preview database listed in [CLOUDFLARE.md](CLOUDFLARE.md), and decide whether to keep the Stripe reference branch (PR #76 is closed).

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
