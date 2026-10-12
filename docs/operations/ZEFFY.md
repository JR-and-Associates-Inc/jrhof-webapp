# Zeffy: banquet registration, donations and email news

The board chose Zeffy for banquet registration on October 11, 2026 (ADR-017 in [DECISIONS.md](../DECISIONS.md)), and donations and the email news sign-up moved to Zeffy in October 2026 (ADR-019). Zeffy charges JRHOF no platform or processing fees and board members run it themselves. This page covers how Zeffy and the website fit together and how to change either safely.

## What lives where

| In Zeffy (board members, own logins) | In this repository |
|---|---|
| The campaign, ticket types, prices, early-bird schedule, capacity, sales window | `src/data/registrations.ts`: the prices, meals, guest limit and dates the site displays |
| Guest questions (name, meal, dietary, contact) | `src/data/events.ts`: event status and registration status (`not-open`, `open`, `closed`) |
| Discount codes (never published on the site or in this repository) | `src/config/zeffy.ts`: each embedded form's slug (`banquet2027`, `donation`, `newsletter`) |
| The newsletter sign-up form "Stay in the loop" (Contacts → Sign-up Forms), the list it adds people to, and the emails sent to that list | `src/components/NewsletterSignup.astro`: the copy, consent line and privacy link around the form |
| Confirmation and reminder emails, e-tickets, banner image | `src/components/ZeffyEmbed.astro` and `src/lib/zeffyTracking.ts`: the embed and its conversion bridge |
| Attendee list, check-in, refunds, exports, payouts | The register page, `/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`, `/donate/`, and their path-scoped CSP in `public/_headers` |
| The donation form `help-preserve-colorados-umpiring-legacy`: amounts, one-time and recurring options, dedications, receipt text, thank-you message | `src/pages/donate/index.astro`: the page copy around the form |

Zeffy uses its own Stripe Connect account; it does not use JRHOF's old Stripe account. That account's Payment Links are retired; monthly gifts that began there before October 2026 stay in Stripe until the owner decides how to move them.

## How the register page behaves

- **Registration not open** (production today): the page shows "Registration opens soon" with prices and details but no Zeffy form, and nothing on the site links to it. It is noindex and excluded from the sitemap.
- **Registration open**: the page embeds the Zeffy form (`https://www.zeffy.com/embed/v2/zeffy-embed.js`) with the JRHOF hero, steps and event summary, plus a link to Zeffy's full-page checkout for Apple Pay and Google Pay. The event page, events hub and homepage show Register buttons, and the Event schema lists the ticket offers.
- `preview/go-live` always shows the open state for board review, with a ribbon on preview hosts. Payments there are real.

## How the donate page behaves

- `/donate/` keeps its own indexable copy (why give, what gifts preserve, organization information and EIN) and embeds the Zeffy donation form with `ZeffyEmbed` (`directLink={false}`). It never links out to zeffy.com: Google Ad Grants requires ads to land on the nonprofit's own domain, and gifts made inside the embed are the only ones the site can count.
- The form can't take payments until JRHOF's bank account is linked in Zeffy; until then it shows "not ready to accept payments". Don't release the donate page to `main` before that.
- A gift is counted as `donation_complete` from the embed's thank-you screen ([ANALYTICS.md](../ANALYTICS.md)). Zeffy has no test mode: test with a real small gift and refund it.
- The old Stripe return pages, `/donate/thank-you/` and `/donate/return/`, redirect to `/donate/`.

## How the newsletter sign-up behaves

- `NewsletterSignup.astro` shows a short pitch, the consent line ("We'll email news about inductions and events. Unsubscribe anytime.") with a link to the privacy policy's `#newsletter` section, and the Zeffy form `/en-US/embed/newsletter-form/stay-in-the-loop-16`.
- It appears on the homepage under the support callout, on every events page that uses `EventsClosing.astro` (the hub, the program pages, the archive and past-event pages), and at the bottom of `/donate/`. The 2027 banquet page leaves it out so registration stays its one call to action.
- The form is lazy: the page loads nothing from Zeffy until the sign-up nears the screen or the visitor clicks "Sign up for email news".
- A completed sign-up sends `newsletter_signup` once per embed ([ANALYTICS.md](../ANALYTICS.md)). Use the list only for the news the consent line promises; it never feeds another tool without a privacy-policy update.

## Opening registration (launch day)

1. Board approval of the open banquet and register pages on `preview/go-live`.
2. In Zeffy: bank account linked, sales set to open on the launch date, a test order placed and refunded (Zeffy has no test mode; use a 100%-off code or a small order).
3. In a pull request to `main`, set the banquet's `status: 'registration-open'` and `registration.status: 'open'` in `src/data/events.ts`. Run `npm run verify`; the banquet test checks the open state.
4. After deploy, check that the register page loads the form and the Register buttons appear. In GTM Preview, step into the form far enough to see `begin_checkout` fire, then stop before paying ([ANALYTICS.md](../ANALYTICS.md)).

## Changing the campaign

Anything that the site also displays changes in both places, code first: prices, early-bird date, meals, guest limit, close date, venue name. If a campaign or the donation form is renamed, copied or replaced, update its slug in `src/config/zeffy.ts`. Ticket descriptions, emails, the banner, discount codes and attendee management need no code change.

## Known limits

- Zeffy's embed messages carry no amount, so registration conversions have no value; set a default value on the Google Ads conversion action.
- Orders and gifts on Zeffy's full-page forms never return to jrhof.org and are not counted as conversions.
- Per-guest answers appear in reports and tickets but do not create contact profiles; get explicit consent before using guest emails for a mailing list.
- A custom thank-you page appears inside the embed's iframe and is not proof of payment.

## Ownership

One Zeffy organization account owned by JR and Associates, signed in with a named JRHOF Google Workspace login with MFA (not the Workspace super-admin and never a shared password). Board operators get their own logins with the permissions they need. Name a successor before an administrator steps away. Keep credentials and recovery details in the organization's private credential system.
