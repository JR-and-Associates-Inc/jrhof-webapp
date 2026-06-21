# JRHOF Page Parity Matrix

Priority reflects launch impact; risk reflects the likelihood of changing trusted content or behavior.

| Page | Production strengths | Astro strengths | Astro drift/problems | Recommended action | Priority | Implementation risk |
|---|---|---|---|---|---|---|
| `/` | Familiar header, field background, translucent blocks, established sequence | Very close visual/content parity; cleaner nav and no plugin UI | Small typography/spacing differences only | `keep_as_astro`; use as inner-page visual reference | P1 | Low |
| `/about/` | Linear story, familiar single wrapper, complete topic sequence | Cleaner copy and source-aware claim restraint | Giant blue hero, card grid, reordered/omitted “Impact & Community,” public pending-governance language | `restore_from_production` layout/rhythm; retain verified copy corrections | P1 | Medium |
| `/inductees/` | Familiar five-column rhythm and tall portraits | All 150 records, all cards link, accessible filter, alt text | Square crops, large hero/search panel, review labels on cards, more app-like styling | `restore_from_production` card proportions/rhythm; keep Astro data/link/filter improvements | P1 | Medium |
| 150 biography pages | Simple title/class/portrait/body pattern | Correct canonical records, responsive layout, source reconciliation | Huge hero, wide body, visible internal notes, prominent aliases/review states, four merged bios | `restore_from_production` simplicity with improved measure/spacing | P1 | Medium |
| Robert Schnabel | Correct portrait is visible, but biography is Joe Rossi and card is unlinked | Correct original-source Robert biography and portrait | Biography is one merged paragraph; public migration note | `keep_as_astro` content; reformat and remove internal note | P0 | Low |
| Gene Rozzelle / Rozelle | Detail page exists as Gene Rozelle; archive omits him | Visible in archive, canonical bio, alias retained | Displays roster spelling “Rozzelle” while source/live use “Rozelle”; prominent warning | `needs_human_decision`; keep route/alias compatibility | P0 | Medium |
| `/events/` | Familiar post list, event imagery/excerpts | Clear current/past grouping; plugin clutter removed | Generic cards and large hero; no migrated gallery imagery; status copy reads technical | Restore production-like information hierarchy, keep removals | P2 | Medium |
| Golf: production `/2026-hof-golf-tournament/`, Astro `/events/golf-tournament/` | Flyer imagery and familiar information order | Valid date/time/fee/location; safe event-state logic; no comments/shares | Large hero/cards; disabled CTA unclear; support content duplicated across mutually exclusive DOM states | Simplify hierarchy, consolidate state content, provide approved status CTA | P1 | Medium |
| Banquet: production `/2026-hof-induction-banquet/`, Astro `/events/induction-banquet/` | Inductee imagery and familiar event narrative | Correctly concluded; broken time and stale links omitted | Technical migration explanations and card-heavy composition | Restore familiar archive-style presentation; keep stale fields removed | P2 | Low |
| `/donate/` | Direct giving choices and straightforward support copy | Avoids unsafe payment flow; clearer purpose categories | Pending trust boxes and disabled checkout feel unfinished; Sponsor CTA premature | Publish approved trust facts, simplify page, keep checkout disabled until ready | P1 | High |
| `/contact/` | Familiar form, image, newsletter invitation | No unapproved data collection; clear intended topics | No actionable contact path; two status notices dominate; production image absent | Add approved contact channel later; simplify presentation now | P1 | High |
| `/privacy-policy/` | Existing policy and revision date | Static first-party route without plugin UI | Must match actual future data practices; route differs only if redirects are incomplete | `needs_human_decision` with legal/privacy review | P1 | High |
| `/terms/` | Production route currently 404s | Astro provides a terms route | New legal content cannot claim parity and needs approval | Keep unlinked pending legal review; add redirect only after approval | P2 | High |
| `/sponsor/` | No established primary-nav destination | Future shell exists | Donate page promotes an unapproved future page | `remove_from_astro` CTA; keep route unadvertised or noindex pending decision | P2 | Low |

## Cross-page conclusion

The homepage belongs to the production visual family. The inner pages do not yet: their blue billboard heroes, floating surfaces, repeated cards, and workflow notices create the “SaaS/marketing” feeling the audit guardrail warns against. Shared layout correction has higher value than page-by-page polishing.

