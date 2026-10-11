# Zeffy evaluation

Official documentation reviewed October 11, 2026. Zeffy is under consideration, not selected. A draft Zeffy ticketing campaign exists and is embedded on the separate `feature/zeffy-registration-preview` branch so the board can compare it side by side with the Stripe preview. Production is unchanged. The pros and cons, demo script and the form changes needed are in [REGISTRATION_OPTIONS.md](REGISTRATION_OPTIONS.md).

## Account setup recommendation

- Create one organization account using TJ’s named Workspace user `tj@jrhof.org`, preferably with Google sign-in. Do not use the Workspace super-admin as the everyday vendor login or share credentials.
- Use the verified legal name JR and Associates, Inc.; use JRHOF / Joe Rossi Umpires Hall of Fame for public branding where supported. The authorized human completes identity/banking verification; never guess legal details.
- Use the existing monitored `contact@jrhof.org` group for public support/notifications where the actual settings allow it. A group address is not the shared admin login.
- Invite board operators using their own accounts and the minimum needed permissions. Zeffy documents one organization Admin/owner at a time, additional users and ownership transfer. Name a successor and document handoff before a volunteer leaves.
- Secure the Google login with organization MFA and configure Zeffy’s offered 2FA. Keep recovery details and credentials in the organization’s private credential system.
- Explore campaign layouts before completing payment verification if preferred. Do not advertise or accept real payments until the board selects the platform and the launch checklist passes.

Sources: [account exploration](https://support.zeffy.com/exploring-and-learning-more-about-zeffy-8f3b0), [ownership transfer](https://support.zeffy.com/recovering-access-to-your-zeffy-account-if-your-admin-has-left-oogck), [account security](https://support.zeffy.com/account-security-tth6u).

## Branch and design

The preview branch is `feature/zeffy-registration-preview`, created from main `7aa294f` and kept separate from `feature/banquet-stripe-registration`. Do not merge it, force-push the Stripe branch, or alter the Stripe board rehearsal to accommodate it. Zeffy has no sandbox: use its documented payment-test workflow, keep the campaign in draft, and treat any payment through the published form as real money.

What the branch does:

- `src/pages/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/index.astro` renders the JRHOF layout, hero and event summary around `src/components/ZeffyEmbed.astro`. The form URL lives in `src/config/zeffy.ts`.
- The embed loads `https://www.zeffy.com/embed/v2/zeffy-embed.js`, which only accepts resize messages from `https://www.zeffy.com`. If the script fails, the page shows the iframe fallback and a link to the hosted form.
- `public/_headers` widens CSP (`script-src`, `frame-src`) and `Permissions-Policy` (`payment`) for that one path only.
- No analytics events, Worker code, cookies or stored data are added.

Keep the JRHOF site and event content, stable URLs, public navy/gold layout and the event page as the landing page. The embed omits campaign imagery, logo and description, so those stay in the surrounding JRHOF page. Zeffy adjusts a custom color for legibility, so an exact match is not possible; fonts inside the form are Zeffy's.

Sources: [embedding](https://support.zeffy.com/how-to-embed-your-zeffy-campaign-on-your-website-km0gv), [styling](https://support.zeffy.com/how-can-i-change-the-style-of-my-form-ntcjr).

## Documented capabilities and limits

| Need | Documented support / unresolved test |
|---|---|
| Scheduled early bird | Scheduled ticket availability; test Dec 15 Mountain cutoff and no overlap/gap with regular tickets. |
| Eight guests | Group/bundle tickets and per-attendee questions; test eight distinct guests, meals, required dietary responses and optional individual contacts. |
| Contacts/mailing list | Per-attendee custom answers appear in reports/tickets; they do not automatically become individual contact profile fields. Verify an export/import and explicit subscription consent before promising a mailing list. |
| Offline entries/comps | Manual registrations/payments supported; verify cash/check/unpaid/complimentary behavior, attendance and reports. |
| Existing Stripe | Zeffy uses a separate Custom Connect Stripe account; it cannot attach the current JRHOF Stripe account. Do not expect historical payments to move automatically. |
| Costs/checkout | No nonprofit platform/payment fees under Zeffy’s documented model; an optional contribution to Zeffy appears at checkout. Rehearse selecting zero and the clarity of total charges. |
| Native GA integration | Visits and traffic sources only; interactions/conversions are not currently supported. Embedded forms also require their own integration. |
| Campaign/QR attribution | Native UTM tracking is documented for donation forms only, not event ticketing. Preserve full event invitation attribution only after a tested alternative exists. |
| Custom thank-you | Configured through Zeffy support. For embeds it appears inside the iframe. A redirect alone does not establish transaction identity, amount or ad attribution. |
| Custom board/alerts | API read access and completed-payment webhooks are documented. Synchronization, access controls, deduplication, refunds and Google Chat alerts still need implementation/testing. |

Sources: [ticket schedules](https://support.zeffy.com/schedule-ticket-availability-or-add-a-waitlist-to-an-event-l8rp6), [group tickets](https://support.zeffy.com/create-group-tickets-or-ticket-bundles-cqezb), [guest custom fields](https://support.zeffy.com/custom-questions-and-custom-contact-fields-9ai9s), [manual payments](https://support.zeffy.com/manual-payment-or-registration-entries-to-log-cash-check-or-other-offline-payments-l5e1w), [Stripe account](https://support.zeffy.com/connecting-an-existing-stripe-account-to-zeffy-7hz27), [optional contribution](https://support.zeffy.com/what-is-the-contribution-made-towards-zeffy-why-was-i-charged-extra-s41ae), [GA limitations](https://support.zeffy.com/how-can-i-integrate-zeffy-with-google-analytics-bo9pn), [UTMs](https://support.zeffy.com/utm-tracking-on-zeffy-forms-sbfs5), [thank-you redirect](https://support.zeffy.com/how-to-redirect-donors-to-a-custom-thank-you-page-9mjy3), [API/webhooks](https://support.zeffy.com/get-started-with-the-zeffy-api-yourg).

## Pilot acceptance before selection

1. Board operator can run the event and hand ownership to a successor using named logins.
2. Eight-person registration exports one usable guest row per person, with purchaser/party, meals, dietary details and guest contacts separate. Filter Chicken and one purchaser’s party successfully.
3. Early-bird/regular pricing, added donations, offline entries, recognition/comps after rules approval, full/partial refunds and guest corrections produce accurate counts and reports.
4. JRHOF public pages work at desktop and 390px, with clear amounts, contribution choice, receipt/support information and accessible controls.
5. An ad-attributed successful payment records exactly once in the existing GA4/Ads setup, with accurate amount/currency and privacy-safe transaction reference. Confirm how ad click/browser identity survives checkout; API/webhook availability alone is not proof. Abandoned/test/refreshed/direct thank-you visits must not count as completed production payments.
6. Event QR/campaign labels survive registration or their limitation is explicitly accepted by the board.
7. Decide whether the first pilot uses Zeffy’s own administration from links on Board home, or a tested read-only custom dashboard integration. The existing Stripe dashboard cannot automatically display Zeffy records without work.
8. Export/retention/support/rollback owners and financial reconciliation are documented before any live change.

Keep Ad Grants ads landing on substantive public `jrhof.org` pages. Google requires an organization-controlled landing domain and active accurate conversion tracking, including transactions on third-party payment platforms. Existing GTM remains the sole Google loader for the site. A button click is a diagnostic, not proof of a donation.

References: [Ad Grants website policy](https://support.google.com/nonprofits/answer/1657899?hl=en), [conversion tracking](https://support.google.com/nonprofits/answer/9841491?hl=en).

## Decision gate

Recommend Zeffy only if the administration savings and fee model outweigh the integration needed to preserve guest reporting, event attribution and verified Google conversion tracking. If those tests fail or require more maintenance than the existing Stripe flow, keep Stripe. Account creation and drafts do not authorize production migration, bulk contact import, publication or live payments.
