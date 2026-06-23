# Bio Source Inventory

Branch: `codex/bio-source-inventory`

This inventory covers the source biography DOCX files under `content/Bios/` and uses the existing reconciliation outputs as supporting evidence. The workflow under review is:

`content/Bios/<Inductee>.docx` -> `npm run content:generate` -> `src/data/inductees.json` -> Astro inductee pages

Howard Dunbar was the pilot model for source-based cleanup and remains the reference pattern for the duplicate-section cleanup path.

## Summary

| Category | Count | Recommended action |
| --- | ---: | --- |
| 1. Already clean | 15 | Leave as-is for now; these are the easiest future batch candidates if a formatting sweep is needed. |
| 2. Original plus revised duplicate pattern | 100 | Keep only the revised/polished biography text, following the Howard Dunbar model. |
| 3. Raw original only / needs rewrite | 6 | Rewrite carefully from source text without inventing facts. |
| 4. Incomplete or missing substantive content | 28 | Board/source follow-up required. |
| 5. Identity-sensitive / do not touch yet | 5 | Do not rewrite until board/source approval. |

Total DOCX files analyzed: 155

## 1. Already Clean

These files contain a single coherent biography with no duplicated original/revised sections. Risk is low and they are safe for a later formatting-only pass if needed.

- `Borgmann.docx` - Bert Borgman  `low`  `Yes`
- `Bert_Borgmann.docx` - Bert Borgmann  `low`  `Yes`
- `Dan_Weikle.docx` - Dan Weikle  `low`  `Yes`
- `Dave_Chick_Baker.docx` - Dave Baker  `low`  `Yes`
- `Irv_Moss.docx` - Irv Moss  `low`  `Yes`
- `Jim_Paronto.docx` - Jim Paronto  `low`  `Yes`
- `Joe_Bonacquista.docx` - Joe Bonacquista  `low`  `Yes`
- `Joey_Borjon.docx` - Joey Borjon  `low`  `Yes`
- `Leo_Bahl.docx` - Leo Bahl  `low`  `Yes`
- `Ray_Belfiore.docx` - Ray Belfiore  `low`  `Yes`
- `Steve_Heuer.docx` - Steve Heuer  `low`  `Yes`
- `Terry_Reed.docx` - Terry Reed  `low`  `Yes`
- `Tom_Robinson.docx` - Tom Robinson  `low`  `Yes`
- `Virgil_Jester.docx` - Virgil Jester  `low`  `Yes`
- `Warren_Kettner.docx` - Warren Kettner  `low`  `Yes`

## 2. Original Plus Revised Duplicate Pattern

Common profile: original copied text plus a revised biography section. Recommended action: keep only the revised/polished biography text. Risk is medium because the source needs trimming, but the underlying facts already exist in the revised section.

- `Art_Wollenweber.docx` - Art Wollenweber  `medium`  `Yes`
- `William_Bill_Fanning.docx` - Bill Fanning  `medium`  `Yes`
- `Bill_Helman.docx` - Bill Helman  `medium`  `Yes`
- `Bill_Lind.docx` - Bill Lind  `medium`  `Yes`
- `Bill_Vincent.docx` - Bill Vincent  `medium`  `Yes`
- `Bob_Ferguson.docx` - Bob Ferguson  `medium`  `Yes`
- `Bob_Jones.docx` - Bob Jones  `medium`  `Yes`
- `Bob_Meisner.docx` - Bob Meisner  `medium`  `Yes`
- `Bob_Ottewill.docx` - Bob Ottewill  `medium`  `Yes`
- `Bruce_Bradshaw.docx` - Bruce Bradshaw  `medium`  `Yes`
- `Bruce_Grigsby.docx` - Bruce Grigsby  `medium`  `Yes`
- `Bud_Best.docx` - Bud Best  `medium`  `Yes`
- `Bud_Schoepflin.docx` - Bud Schoepflin  `medium`  `Yes`
- `Carl_Zele_Jr.docx` - Carl Zele, Jr  `medium`  `Yes`
- `Charlie_Chainhalt.docx` - Charlie Chainhalt  `medium`  `Yes`
- `Chris_Dittman.docx` - Chris Dittman  `medium`  `Yes`
- `Chuck_Denney.docx` - Chuck Denney  `medium`  `Yes`
- `Cliff_Hendrick.docx` - Cliff Hendrick  `medium`  `Yes`
- `Dan_Cholas.docx` - Dan Cholas  `medium`  `Yes`
- `Dave_Schmidt.docx` - Dave Schmidt  `medium`  `Yes`
- `David_Letofsky.docx` - David Letofsky  `medium`  `Yes`
- `Dennis_Smith.docx` - Dennis Smith  `medium`  `Yes`
- `Dick_Cartin.docx` - Dick Cartin  `medium`  `Yes`
- `Richard_Dick_Reininger.docx` - Dick Reininger  `medium`  `Yes`
- `Dick_Yates.docx` - Dick Yates  `medium`  `Yes`
- `Don_Carlsen.docx` - Don Carlsen  `medium`  `Yes`
- `Don_Stengel.docx` - Don Stengel  `medium`  `Yes`
- `Doug_Graham.docx` - Doug Graham  `medium`  `Yes`
- `Ed_OConnor.docx` - Ed OConnor  `medium`  `Yes`
- `Ed_Underwood.docx` - Ed Underwood  `medium`  `Yes`
- `Edward_Stevens.docx` - Edward Stevens  `medium`  `Yes`
- `Ernie_Kozacek.docx` - Ernie Kozacek  `medium`  `Yes`
- `Ernie_Ortiz.docx` - Ernie Ortiz  `medium`  `Yes`
- `Frank_DeAngelis.docx` - Frank DeAngelis  `medium`  `Yes`
- `Frank_Messenger.docx` - Frank Messenger  `medium`  `Yes`
- `Frank_Prentup.docx` - Frank Prentup  `medium`  `Yes`
- `Frank_Zele.docx` - Frank Zele  `medium`  `Yes`
- `Fred_Zuercher.docx` - Fred Zuercher  `medium`  `Yes`
- `Fritz_Johnstone.docx` - Fritz Johnstone  `medium`  `Yes`
- `Gary_Baker.docx` - Gary Baker  `medium`  `Yes`
- `Gene_Bunnelle.docx` - Gene Bunnelle  `medium`  `Yes`
- `George_Demetriou.docx` - George Demetriou  `medium`  `Yes`
- `Gordon_Cooper.docx` - Gordon Cooper  `medium`  `Yes`
- `H_R_Phillips.docx` - H_R Phillips  `medium`  `Yes`
- `Harry_Wise.docx` - Harry Wise  `medium`  `Yes`
- `Howard_Dunbar.docx` - Howard Dunbar  `medium`  `Yes`
- `Howard_Wentz.docx` - Howard Wentz  `medium`  `Yes`
- `Irv_Brown.docx` - Irv Brown  `medium`  `Yes`
- `Jack_Smith.docx` - Jack Smith  `medium`  `Yes`
- `James_Roorda.docx` - James Roorda  `medium`  `Yes`
- `Jim_Darden.docx` - Jim Darden  `medium`  `Yes`
- `Jim_Dorsey.docx` - Jim Dorsey  `medium`  `Yes`
- `Jim_Jenkins.docx` - Jim Jenkins  `medium`  `Yes`
- `Jim_Schaefer.docx` - Jim Schaefer  `medium`  `Yes`
- `Joe_Maciel.docx` - Joe Maciel  `medium`  `Yes`
- `Joe_Rossi.docx` - Joe Rossi  `medium`  `Yes`
- `John_DeSiato.docx` - John DeSiato  `medium`  `Yes`
- `John_Walsh.docx` - John Walsh  `medium`  `Yes`
- `Joseph_Massaro.docx` - Joseph Massaro  `medium`  `Yes`
- `Keith_Bailey.docx` - Keith Bailey  `medium`  `Yes`
- `Ken_Furman.docx` - Ken Furman  `medium`  `Yes`
- `Lee_Rosa.docx` - Lee Rosa  `medium`  `Yes`
- `Leonard_Varriano.docx` - Leonard Varriano  `medium`  `Yes`
- `Leroy_Garzonio.docx` - Leroy Garzonio  `medium`  `Yes`
- `Lou_Nedbalski.docx` - Lou Nedbalski  `medium`  `Yes`
- `Manual_Boody.docx` - Manual Boody  `medium`  `Yes`
- `Mark_Denzin.docx` - Mark Denzin  `medium`  `Yes`
- `Melvin_Martin.docx` - Melvin Martin  `medium`  `Yes`
- `Mert_Letofsky.docx` - Mert Letofsky  `medium`  `Yes`
- `Mike_Brady.docx` - Mike Brady  `medium`  `Yes`
- `Mike_Doohan.docx` - Mike Doohan  `medium`  `Yes`
- `Mike_Kronkright.docx` - Mike Kronkright  `medium`  `Yes`
- `Mitchell_Burns.docx` - Mitchell Burns  `medium`  `Yes`
- `Myran_Dunker.docx` - Myran Dunker  `medium`  `Yes`
- `Neil_Devlin.docx` - Neil Devlin  `medium`  `Yes`
- `Pat_Haggerty.docx` - Pat Haggerty  `medium`  `Yes`
- `Paul_Babkiewich.docx` - Paul Babkiewich  `medium`  `Yes`
- `Pete_Butler.docx` - Pete Butler  `medium`  `Yes`
- `Pete_DAmato.docx` - Pete DAmato  `medium`  `Yes`
- `Randy_Holmen.docx` - Randy Holmen  `medium`  `Yes`
- `Raymond_Powe.docx` - Raymond Powe  `medium`  `Yes`
- `Rich_Czernicki.docx` - Rich Czernicki  `medium`  `Yes`
- `Richard_Chandler.docx` - Richard Chandler  `medium`  `Yes`
- `Richard_Fanning.docx` - Richard Fanning  `medium`  `Yes`
- `Richard_Hawkins.docx` - Richard Hawkins  `medium`  `Yes`
- `Richard_Mauro.docx` - Richard Mauro  `medium`  `Yes`
- `Robert_Blaser.docx` - Robert Blaser  `medium`  `Yes`
- `Robert_Campbell.docx` - Robert Campbell  `medium`  `Yes`
- `Roger_Kinney.docx` - Roger Kinney  `medium`  `Yes`
- `Ron_Piotraschke.docx` - Ron Piotraschke  `medium`  `Yes`
- `Ron_Sisson.docx` - Ron Sisson  `medium`  `Yes`
- `Ross_Barlow.docx` - Ross Barlow  `medium`  `Yes`
- `Ross_MacAskill.docx` - Ross MacAskill  `medium`  `Yes`
- `Terry_Angell.docx` - Terry Angell  `medium`  `Yes`
- `Terry_Schiessler.docx` - Terry Schiessler  `medium`  `Yes`
- `Thomas_Severtson.docx` - Thomas Severtson  `medium`  `Yes`
- `Tim_Kardatzke.docx` - Tim Kardatzke  `medium`  `Yes`
- `Tom_Freed.docx` - Tom Freed  `medium`  `Yes`
- `Tom_Smith.docx` - Tom Smith  `medium`  `Yes`
- `Willie_White.docx` - Willie White  `medium`  `Yes`

## 3. Raw Original Only / Needs Rewrite

Common profile: readable source text without a revised section, but still rough enough that it should be rewritten carefully from the source text. Recommended action: rewrite conservatively and keep factual claims unchanged.

- `Al_Raglin.docx` - Al Raglin  `medium`  `Maybe`
- `Arny_Karraker.docx` - Arny Karraker  `medium`  `Maybe`
- `Boody.docx` - Boody  `medium`  `Maybe`
- `Burns.docx` - Burns  `medium`  `Maybe`
- `Butler.docx` - Butler  `medium`  `Maybe`
- `Julius_Carabello.docx` - Julius Carabello  `medium`  `Maybe`

## 4. Incomplete Or Missing Substantive Content

Common profile: empty, placeholder-like, or too short to support a public biography. Recommended action: board/source follow-up required before any rewrite attempt.

- `Bob_Mullerberg.docx` - Bob Mullerberg  `high`  `No`
- `Bob_Westhoff.docx` - Bob Westhoff  `high`  `No`
- `Dan_Ringsby.docx` - Dan Ringsby  `high`  `No`
- `Del_Petersen.docx` - Del Petersen  `high`  `No`
- `Dick_Hotton.docx` - Dick Hotton  `high`  `No`
- `Dick_Reininger.docx` - Dick Reininger  `high`  `No`
- `Don_Cimaglia.docx` - Don Cimaglia  `high`  `No`
- `Don_Hegi.docx` - Don Hegi  `high`  `No`
- `Don_Shiverdecker.docx` - Don Shiverdecker  `high`  `No`
- `Ed_Tracy.docx` - Ed Tracy  `high`  `No`
- `Edmund_DHaillecourt.docx` - Edmund DHaillecourt  `high`  `No`
- `Ernest_Cavalieri.docx` - Ernest Cavalieri  `high`  `No`
- `Ervin_Douglas.docx` - Ervin Douglas  `high`  `No`
- `Francis_Ford.docx` - Francis Ford  `high`  `No`
- `George_Theodore.docx` - George Theodore  `high`  `No`
- `Joe_Bellich.docx` - Joe Bellich  `high`  `No`
- `Joe_Brooks.docx` - Joe Brooks  `high`  `No`
- `John_Wenglass.docx` - John Wenglass  `high`  `No`
- `Ken_Zetner.docx` - Ken Zetner  `high`  `No`
- `Lou_Nolin.docx` - Lou Nolin  `high`  `No`
- `Lou_Spector.docx` - Lou Spector  `high`  `No`
- `Mark_Junge.docx` - Mark Junge  `high`  `No`
- `Nick_Vitale.docx` - Nick Vitale  `high`  `No`
- `Sal_Salazar.docx` - Sal Salazar  `high`  `No`
- `Sid_Peretti.docx` - Sid Peretti  `high`  `No`
- `Stormy_Stucker.docx` - Stormy Stucker  `high`  `No`
- `Vic_Damon.docx` - Vic Damon  `high`  `No`
- `Wiley_Chance.docx` - Wiley Chance  `high`  `No`

## 5. Identity-Sensitive / Do Not Touch Yet

Common profile: name, identity, year, source, or person-conflict risk. Recommended action: do not rewrite until board/source approval resolves the conflict.

- `Robert_Schnabel.docx` - Robert Schnabel  `high`  `No`
- `Gene_Rozelle.docx` - Gene Rozelle  `high`  `No`
- `Sam_Corentino.docx` - Sam Corentino  `high`  `No`
- `Steve_Usecheck.docx` - Steve Usecheck  `high`  `No`
- `Terry_Garvey.docx` - Terry Garvey  `high`  `No`
- `Walt_Clay.docx` - Walt Clay  `high`  `No`

## External-Link Research Candidates

These files mention potentially linkable authoritative entities such as schools, cities, councils, associations, leagues, fields, or halls of fame. No links should be added in this branch; this is only a research list for a later verified-link pass.

- `Howard_Dunbar.docx` - Howard Dunbar  `research only`
- `George_Demetriou.docx` - George Demetriou  `research only`
- `Fred_Zuercher.docx` - Fred Zuercher  `research only`
- `Ray_Belfiore.docx` - Ray Belfiore  `research only`
- `Steve_Heuer.docx` - Steve Heuer  `research only`
- `Terry_Angell.docx` - Terry Angell  `research only`
- `Bill_Helman.docx` - Bill Helman  `research only`
- `Bob_Jones.docx` - Bob Jones  `research only`
- `Frank_DeAngelis.docx` - Frank DeAngelis  `research only`
- `Tom_Smith.docx` - Tom Smith  `research only`
- `Mike_Brady.docx` - Mike Brady  `research only`
- `Richard_Fanning.docx` - Richard Fanning  `research only`

## Suggested First Rewrite Batch

If we want a small, low-risk next pass after the Howard pilot, start here. These are all duplicate-pattern biographies with clear revised sections and no identity conflicts in the current reconciliation set:

- `Bill_Helman.docx` - Bill Helman
- `Bob_Jones.docx` - Bob Jones
- `Bruce_Grigsby.docx` - Bruce Grigsby
- `Dan_Cholas.docx` - Dan Cholas
- `Dave_Schmidt.docx` - Dave Schmidt
- `Jim_Schaefer.docx` - Jim Schaefer
- `John_Walsh.docx` - John Walsh
- `Tom_Smith.docx` - Tom Smith
- `Terry_Angell.docx` - Terry Angell
- `Ray_Belfiore.docx` - Ray Belfiore

## Notes

- No generated data was manually edited in this branch.
- No external links were added.
- No source DOCX files were modified in this branch.
- The inventory is based on the source reconciliation outputs and direct DOCX text inspection.
