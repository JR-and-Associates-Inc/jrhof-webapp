# Event pages: one lifecycle template

Plan, September 2026. Nothing here is built yet. It replaces the bespoke 2027 banquet page (`isBanquet2027`) with one page design that both annual events move through each year, and it simplifies the events hub and archive.

## Why the event pages are hard to read

- **Internal wording on public pages.** Cards and archive pages show "Completed · Gallery Published", "Archived", "Exact date not yet recorded", "No gallery currently published", "optimized photographs published", "This archive is intentionally partial", "digitized and approved", and a subtitle calling the 2024 and 2025 banquets "an immutable record in the Hall of Fame banquet archive". These are our workflow terms, not a visitor's.
- **Two page designs.** The 2027 banquet has a custom hero and layout. Every other event, including next year's banquet and every golf tournament, gets the plain archive template. Neither answers "what is happening and what should I do now?" for a returning visitor.
- **Too many routes to the same records.** Each events page opens with four pill links (Events Hub, Full Events Archive, Banquet Program, Golf Program). The hub then has six sections: featured event, latest completed, recent galleries, program areas, an archive callout, and a donate panel.
- **No upcoming golf tournament.** There is no 2027 Umpire's Cup record, so the golf page is only an archive and the hub features only the banquet.
- **Hard-coded copy.** Any banquet gallery is headed "The 2026 induction banquet in photographs". `VenueLocation` hard-codes Holiday Inn Denver–Lakewood in its heading and map title. Every event hero image gets the alt text "Baseball-themed table setting".
- **Unused add-ons.** `stripeLinks.golfRaffle` and `golfMulligans` are configured, but no page links to them.

## The lifecycle

Both events follow the same five phases every year. The page for a given year always has the same URL and the same sections; the phase decides the headline, the one primary button, and which sections show.

| Phase | When | Headline example | Primary button | Shown |
|---|---|---|---|---|
| **Save the date** | Record exists, registration not open | "Saturday, February 6, 2027 · Registration opens November 16" | Add to calendar | Date, venue, what the evening is, honorees if announced, past years |
| **Registration open** | `opensAt` to `closesAt` | "Registration is open until January 29" | Register | Price (only once approved), what's included, deadline, seats left, refund policy, FAQ |
| **Get ready** | Registration closed, before the event | "Registration is closed. See you on the 6th." | Get directions | Schedule, check-in, parking, dress, add-ons (golf: mulligans, raffle), donate for those who can't attend |
| **Thank you** | Event day until the gallery is published | "Thank you for a wonderful evening" | Donate | Honorees, short recap once written, "Photos from the evening will be posted here" |
| **Remembered** | Gallery published | "The 2026 Induction Banquet in photographs" | View the gallery | Recap, honorees, gallery, photographer and sponsor credits, link to next year's page |

Rules that carry over from today: one primary call to action per page, no price until the board approves it, no claim about a program, flyer, or gallery until it exists, and every past year keeps its page.

## Data changes (`src/data/events.ts`)

Add optional fields, so old records need no edits:

- `venue: { name, address, postalAddress, url?, mapQuery? }` in place of the four separate venue fields, so `VenueLocation` takes its heading and map title from data.
- `startTime`, `doorsTime`, and `schedule: { time, label }[]` for the "get ready" phase.
- `faq: { question, answer }[]`: parking, dress, meal choices, accessibility, and refunds (the refund answer comes from `registrations.ts`, never retyped).
- `addOns: ('mulligans' | 'raffle' | 'donation')[]`, resolved to the Stripe links in `src/config/site.ts`.
- `heroAlt` for the hero image.

Add one derived function, `eventPhase(event, registration, now)`, and replace `eventStatusLabels` with visitor wording: "Upcoming", "Registration open", "Registration closed", "Completed", "Photos available". A record without an exact date shows only its year.

### Static pages and time

The site is prebuilt, so a page's phase changes only when the site rebuilds. That is acceptable because:

- The registration Worker (`feature/banquet-registration-checkout`) opens and closes checkout on its own dates, and the Register button reads `/api/registration/status` live.
- The other phase changes already happen through the one-line status edits in the registration runbook.

Add a validation check that fails when a record's status contradicts its dates at build time, such as an event in the past that is still `scheduled`, so a stale page is caught by the next build. A scheduled daily rebuild is optional; check what Workers Builds supports before adding one.

## Page layout (both events)

1. **Hero:** name, date, venue, the phase headline, one button. Reuse the 2027 banquet hero styling as the default for every event.
2. **At a glance:** date and time, venue, price, deadline, what's included. Show only the lines that have verified values.
3. **Phase section:** registration details, getting ready, or the recap.
4. **Honorees** (banquet): the class cards already used on event pages.
5. **Venue and directions:** `VenueLocation`, driven by `venue`.
6. **Support:** donate, sponsor, and add-ons for that event.
7. **Gallery:** when published.
8. **FAQ.**
9. **Past years:** a short row of links to earlier years of the same event.

An **Add to calendar** link serves a static `.ics` file generated at build time (for example `/events/induction-banquet/2027-hall-of-fame-induction-banquet/event.ics`). It needs no third-party service.

## Hub and archive

- `/events/`: two cards, **Next induction banquet** and **Next Umpire's Cup**, each with its date, phase, and one button, followed by a year-by-year list of past events. The four-pill navigation goes away; breadcrumbs already provide the path.
- `/events/induction-banquet/` and `/events/golf/`: a short description of the tradition, the next event card, and that event's past years.
- `/events/archive/`: the year-by-year list, without process notes.
- Every current URL stays. `/events/induction-banquet/`, the 2027 banquet page, and the 2026 golf page are Google Ads final URLs or sitelinks.

## Measurement

The phase decides the one tracked action on each page, using existing event names: `event_register_click` or `golf_register_click` for Register, `donate_click` for Donate, and `external_partner_click` for directions. The registration branch adds `begin_checkout` and `registration_complete`. The Ads **Events** campaign should point each ad group at the current year's page and pause after the event (see [ROADMAP.md](../ROADMAP.md)).

## Sequence

1. **Now, small and safe:** replace the internal wording listed above with visitor wording, fix the hard-coded gallery heading, and add the 2027 Umpire's Cup record as "save the date" once the board confirms its date. This touches files the registration branch also changes, so keep it small or land it after step 2.
2. **Before November 16, 2026:** rebase `feature/banquet-registration-checkout` onto `main`, renumber its decision record (`main` already has ADR-016), protect `/board/*` with Cloudflare Access, and merge it dark per its runbook.
3. **Build the lifecycle template** on a branch from that `main`: add the data fields and `eventPhase`, generalize `VenueLocation`, move the 2027 banquet onto the template, and update `scripts/test-banquet-public-page.mjs` in the same change. Aim to finish before registration opens, or hold the banquet page steady until February and ship the template with golf registration in March.
4. **Golf 2027** on the same template and registration flow, then retire Eventbrite (remove `eventLinks.golfRegistration` and its validation exception).

## Acceptance checks

- A test script renders each phase with a fixed "now" and asserts the headline, the single primary button, and that no price appears before approval.
- No public event page contains the internal phrases listed at the top of this plan; add them to the forbidden-phrase list in `scripts/validate-foundation.mjs`.
- Each phase is checked at desktop and at 390px width.
- Event JSON-LD matches the visible phase: `offers` only while registration is open with an approved price, and `EventCompleted` after the date.
