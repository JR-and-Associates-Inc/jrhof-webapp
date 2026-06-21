# Inductee Biography Formatting Audit

## Summary

| Measure | Count |
|---|---:|
| Total biographies/routes audited | 150 |
| Complete-source biographies | 123 |
| Good paragraph structure | 119 |
| Likely paragraph-merge/spacing issues | 4 |
| Pending biographies | 27 |
| Using production-familiar default missing portrait | 0 |
| Using Astro alternate pending-review SVG | 33 |
| Pages with a user-facing source/review notice | 150 |
| Pages with an additional board-review warning | 33 |
| Pages needing human review before launch | 33 |

“Good paragraph structure” means an available biography contains multiple source paragraphs. Pending pages are counted separately. The four likely merges are **Dan Weikle, Julius Carabello, Robert Schnabel, and Warren Kettner**.

## Template findings

- Title/class data is present for all 150 records, but the biography hero is much larger than production and long names dominate the page.
- Desktop biography copy can reach roughly 788 px with `max-width: none`; restore a readable 65–75ch measure.
- Mobile collapses to one column without horizontal overflow, but content quality still suffers where a long biography is a single paragraph.
- Portrait placement is technically consistent but square and heavily framed; production's simpler/taller visual should guide the revision.
- All pages publicly show “candidate migration record” and editorial-lane language. This is internal workflow metadata and should be removed.
- Thirty-three pages also expose a board-review alert. Most should remain unpublished or use restrained visitor-centered language—not an alarming governance warning.
- Alias cards are too prominent for ordinary spelling variants. Keep aliases in metadata/search/redirects and show them publicly only when approved and useful.
- Pending biographies should use a brief, warm line such as “Biography coming soon” and a correction/contact path once that path is operational.

## Robert Schnabel

- Astro does **not** use the live Joe Rossi biography.
- Astro uses `content/Bios/Robert_Schnabel.docx` via the reconciled dataset and the person-specific `Robert_Schnabel.jpg` source.
- Content is confidently mapped and names Robert throughout.
- Current issue: all source lines are merged into one 114-word paragraph, and an internal migration note is visible.
- Action: preserve the content/portrait, restore paragraph breaks, and remove the public source note.

## Gene Rozzelle / Rozelle

- Biography paragraphs are structurally good.
- The page title displays “Gene Rozzelle”; the body/source uses “Gene Rozelle.”
- Alias, board warning, and migration note stack three review signals around a public biography.
- Action: human decision on spelling; retain aliases/redirects in metadata and reduce public warning prominence.

## Recommended template changes

1. Replace the oversized bio hero with a compact title/class block.
2. Constrain prose to 65–75ch and preserve source paragraph boundaries.
3. Remove the universal source-note footer and internal migration-lane labels.
4. Replace prominent board/portrait warnings with editorial gating or subtle approved copy.
5. Use a taller production-like portrait ratio and restore one shared production-familiar missing image in place of the blue review SVG.
6. Keep aliases out of the primary visual hierarchy.
7. Add consistent spacing for paragraphs, lists, subheads, and pending states.
8. Preserve responsive one-column behavior and verify at 320, 390, 768, and desktop widths.

The per-record classification is in `_migration/parity/inductee-bio-formatting-audit.csv`.
