# Inductee Archive Parity Audit

## Inventory

- Canonical Astro records/cards: **150**
- Production archive cards in prior validated crawl: **149** (current DOM image extraction also confirms 149 rendered portraits)
- Production cards linking to biographies: **135**
- Production records without a working archive-to-bio path: **15**
- Astro cards linking to biographies: **150**
- Records using Astro's alternate blue `portrait-pending.svg`: **33**
- Records currently using the production-familiar default in Astro: **0**
- Production visible placeholder cards: **32**; all differently named files are the same image binary
- Production-absent record restored by Astro: **Gene Rozzelle/Rozelle**

## Grid comparison

| Attribute | Production | Astro | Decision |
|---|---|---|---|
| Desktop columns | Five | Five | Keep five-column desktop density. |
| Portrait shape | Approximately 202×290, tall portrait | Approximately 217×217, square | Restore the production-like tall aspect ratio. |
| Name/class | Name-first, visually spare | Name + class + possible pending label | Keep name/class, remove public workflow label from cards. |
| Card links | 14 visible cards unlinked; Gene absent | Every card linked | Keep Astro behavior. |
| Search/filter | WordPress search UI is broad/plugin-shaped | Instant archive-only name/alias/year filter | Keep Astro behavior but visually reduce the panel. |
| Spacing | Tight, familiar gallery | Larger rounded cards/gaps/shadows | Move toward production spacing and quieter borders/shadows. |
| Mobile | WordPress wrapping is familiar but plugin-dependent | Two columns at 390 px, no horizontal overflow | Keep responsive behavior; verify names and touch targets after aspect-ratio change. |

## Missing portrait behavior

Production publishes person-specific filenames such as `Bill_Lind_missing.webp`, but the 32 files are byte-identical. Original-source reconciliation confirms the same hash for those files and `Missing_Inductee.webp`.

Astro does **not** currently use that familiar image. Its 33 unresolved records render `/images/inductees/portrait-pending.svg`, a blue-and-gold silhouette containing the prominent text “PORTRAIT PENDING REVIEW.” The production-familiar WebP exists in `public/images/inductees/` but is not selected by the Astro dataset.

Recommendation: restore the familiar production image, normalize its canonical filename/case, and use it as the one intentional default for all unresolved records. Never interpret a person-specific `Missing` filename as identity evidence. Use neutral alt text such as “Portrait not yet available for [name]” rather than “Portrait of [name].” Remove the public “pending review” label from the artwork.

The 33 affected records are identified row-by-row in `_migration/parity/inductee-portrait-parity-audit.csv` and `_migration/parity/inductee-bio-formatting-audit.csv`.

## Gene Rozzelle / Rozelle

- Control roster/display value: **Gene Rozzelle**.
- Original biography, portrait filenames, legacy route, WordPress page, and biography copy: **Gene Rozelle**.
- Astro canonical route: `/inductees/gene_rozelle/`.
- Production legacy route: `/gene_rozelle/`.
- Production archive: absent; direct detail page exists.
- Recommendation: retain archive visibility, canonical route, legacy redirect, and alias. Board/human decision is required on public display spelling before launch. The warning should not be a prominent public alert.

## Archive implementation acceptance criteria

1. Exactly 150 unique cards and canonical links.
2. Five columns on wide desktop; responsive wrapping without horizontal overflow.
3. Production-like tall portrait ratio with consistent crop/focal handling.
4. One shared placeholder for every unresolved portrait.
5. No pending/review/editorial labels on archive cards.
6. Search by display name, alias, and class/year remains keyboard- and screen-reader-accessible.
7. Missing-image alt text does not imply a verified portrait.
8. Gene remains visible regardless of the final approved spelling.
