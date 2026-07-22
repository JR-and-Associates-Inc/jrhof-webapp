# 2027 banquet public-page design

## Purpose

This branch is the public, nontransactional save-the-date experience for the 2027 induction banquet. It intentionally contains no registration form, price, meal, payment, Stripe, D1, protected export, or invented program detail.

## Design decisions

- A dedicated 2027 hero replaces the reused 2026 event photograph. The image is original illustrative promotional artwork, not documentary photography of an actual banquet or an announced inductee.
- The hero leads with the confirmed date and venue, a clear registration-closed status, event details, and directions. It does not imitate an active registration call to action.
- The page follows a single story: save the date, understand why the evening matters, watch for the Class of 2027 announcement, understand seating, plan the venue, explore relevant history, and ask an event question.
- The page does not add another donation pitch. Donate remains available in the global navigation and footer without competing with the event's purpose.
- The three related links are contextual: the 2026 banquet gallery, inductee archive, and About page.
- The location panel uses Google Maps’ standard keyless sharing embed behind a click-to-load control, with the exact address and a direct directions link available without JavaScript.

## Hero asset

`public/images/events/banquet-2027-hero.jpg` is a 1774 by 887 pixel, approximately 317 KB JPEG created for this page. It depicts a staged ceremonial still life with an umpire mask and baseball. It contains no people, names, year, generated logo, or event claim. The HTML treats it as decorative because the confirmed date, venue, and status are supplied as real text.

Source prompt summary: a refined, dignified editorial still life for a nonprofit baseball umpire Hall of Fame induction banquet; deep navy and warm brass light; umpire mask and baseball; wide composition with left-side copy space; no people, logos, text, fake plaques, or documentary claim.

## Review gates

- Board or designated content owner approves the artwork for public use.
- Desktop and mobile crops retain clear text contrast and do not hide the umpire mask/baseball.
- Keyboard and screen-reader checks pass for the hero links, location panel, related links, and contact path.
- The default build makes no Google Maps request. A key-enabled build makes no Google Maps request before activation.
- Event schema uses the confirmed `Place`/`PostalAddress`, the dedicated 2027 image, and no `offers`.
- Registration remains visibly closed and no registration/payment implementation enters this branch.
