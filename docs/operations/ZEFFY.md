# Zeffy: banquet registration

The board chose Zeffy for banquet registration on October 11, 2026 (ADR-017 in [DECISIONS.md](../DECISIONS.md)). Zeffy charges JRHOF no platform or processing fees and board members run it themselves. This page covers how Zeffy and the website fit together and how to change either safely.

## What lives where

| In Zeffy (board members, own logins) | In this repository |
|---|---|
| The campaign, ticket types, prices, early-bird schedule, capacity, sales window | `src/data/registrations.ts`: the prices, meals, guest limit and dates the site displays |
| Guest questions (name, meal, dietary, contact) | `src/data/events.ts`: event status and registration status (`not-open`, `open`, `closed`) |
| Discount codes (never published on the site or in this repository) | `src/config/zeffy.ts`: the embedded form's slug |
| Confirmation and reminder emails, e-tickets, banner image | `src/components/ZeffyEmbed.astro` and `src/lib/zeffyTracking.ts`: the embed and its conversion bridge |
| Attendee list, check-in, refunds, exports, payouts | The register page, `/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/`, and its path-scoped CSP in `public/_headers` |

Zeffy uses its own Stripe Connect account; it does not use JRHOF's donation Stripe account.

## How the register page behaves

- **Registration not open** (production today): the page shows "Registration opens soon" with prices and details but no Zeffy form, and nothing on the site links to it. It is noindex and excluded from the sitemap.
- **Registration open**: the page embeds the Zeffy form (`https://www.zeffy.com/embed/v2/zeffy-embed.js`) with the JRHOF hero, steps and event summary, plus a link to Zeffy's full-page checkout for Apple Pay and Google Pay. The event page, events hub and homepage show Register buttons, and the Event schema lists the ticket offers.
- `preview/go-live` always shows the open state for board review, with a ribbon on preview hosts. Payments there are real.

## Opening registration (launch day)

1. Board approval of the open banquet and register pages on `preview/go-live`.
2. In Zeffy: bank account linked, sales set to open on the launch date, a test order placed and refunded (Zeffy has no test mode; use a 100%-off code or a small order).
3. In a pull request to `main`, set the banquet's `status: 'registration-open'` and `registration.status: 'open'` in `src/data/events.ts`. Run `npm run verify`; the banquet test checks the open state.
4. After deploy, check that the register page loads the form and the Register buttons appear. In GTM Preview, step into the form far enough to see `begin_checkout` fire, then stop before paying ([ANALYTICS.md](../ANALYTICS.md)).

## Changing the campaign

Anything that the site also displays changes in both places, code first: prices, early-bird date, meals, guest limit, close date, venue name. If the campaign is renamed, copied or replaced, update the slug in `src/config/zeffy.ts`. Ticket descriptions, emails, the banner, discount codes and attendee management need no code change.

## Known limits

- Zeffy's embed messages carry no amount, so registration conversions have no value; set a default value on the Google Ads conversion action.
- Orders on Zeffy's full-page checkout never return to jrhof.org and are not counted as conversions.
- Per-guest answers appear in reports and tickets but do not create contact profiles; get explicit consent before using guest emails for a mailing list.
- A custom thank-you page appears inside the embed's iframe and is not proof of payment.

## Ownership

One Zeffy organization account owned by JR and Associates, signed in with a named JRHOF Google Workspace login with MFA (not the Workspace super-admin and never a shared password). Board operators get their own logins with the permissions they need. Name a successor before an administrator steps away. Keep credentials and recovery details in the organization's private credential system.
