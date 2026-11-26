// Turns a record's biography paragraphs into display blocks.
//
// Conventions in src/data/inductees.json (see docs/CONTENT_MODEL.md):
//   "## Title"  -> a section title inside the biography
//   "- Item"    -> one list item; consecutive items form one list
//   anything else -> a paragraph
//
// Links come only from src/data/bio-links.json, which holds reviewed
// organization links and reviewed mentions of other inductees. Each term is
// linked once per biography, at its first mention in a paragraph or list item.
import inductees from '../data/inductees.json';
import bioLinks from '../data/bio-links.json';

type Inductee = (typeof inductees)[number];

export type BioLink =
  | { kind: 'partner'; text: string; href: string; partner: string }
  | { kind: 'inductee'; text: string; href: string; inducteeName: string };
export type BioSegment = string | BioLink;
export type BioBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; segments: BioSegment[] }
  | { type: 'list'; items: BioSegment[][] };

const byName = new Map(inductees.map((record) => [record.display_name, record]));

// A name inside "Joe Rossi Umpires Hall of Fame", "Irv Brown Baseball School"
// or "Ken Furman Award" names the honor, not the person, so it is not linked.
const honorAfterName = /^(?:’s|'s)?\s+(?:Umpires?\s+)?(?:Hall of Fame|Award|Baseball School)/;

type Term = { text: string; link: BioLink; skip?: RegExp };

function termsFor(record: Inductee): Term[] {
  const terms: Term[] = bioLinks.organizations.map((org) => ({
    text: org.term,
    link: { kind: 'partner', text: org.term, href: org.url, partner: org.partner },
  }));
  const mentions = (bioLinks.inductee_mentions as Record<string, string[]>)[record.display_name] ?? [];
  for (const name of mentions) {
    const target = byName.get(name);
    if (!target) throw new Error(`bio-links.json: ${record.display_name} links to unknown inductee ${name}`);
    terms.push({
      text: name,
      link: { kind: 'inductee', text: name, href: target.proposed_canonical_url, inducteeName: name },
      skip: honorAfterName,
    });
  }
  // Longer terms first, so a long name wins over a shorter one inside it.
  return terms.sort((a, b) => b.text.length - a.text.length);
}

function linkText(text: string, terms: Term[], used: Set<string>): BioSegment[] {
  const segments: BioSegment[] = [];
  let rest = text;
  while (rest) {
    let best: { index: number; term: Term } | undefined;
    for (const term of terms) {
      if (used.has(term.text)) continue;
      let from = 0;
      while (true) {
        const index = rest.indexOf(term.text, from);
        if (index < 0) break;
        const before = rest[index - 1];
        const after = rest[index + term.text.length];
        const wholeWord = !(before && /[\p{L}\p{N}]/u.test(before)) && !(after && /[\p{L}\p{N}]/u.test(after));
        const honor = term.skip?.test(rest.slice(index + term.text.length));
        if (wholeWord && !honor) {
          if (!best || index < best.index) best = { index, term };
          break;
        }
        from = index + 1;
      }
    }
    if (!best) {
      segments.push(rest);
      break;
    }
    if (best.index > 0) segments.push(rest.slice(0, best.index));
    segments.push(best.term.link);
    used.add(best.term.text);
    rest = rest.slice(best.index + best.term.text.length);
  }
  return segments;
}

const headerPattern = /hall of fame inductee/i;

// The opening "2026 Hall of Fame Inductee – Name (Hometown)" line repeats the
// page heading and the "Class of" line, so it is not shown in the body. A
// header that also names who nominated or presented the inductee stays.
export function isHeaderParagraph(paragraph: string, index: number) {
  return index < 3
    && paragraph.length < 220
    && headerPattern.test(paragraph)
    && !/\b(?:Nominated|Presented)\b/i.test(paragraph)
    && !/[.!?]["”]?\s*$/.test(paragraph.trim().replace(/\b(?:Jr|Sr)\.$/, ''));
}

export function bodyParagraphs(record: Inductee) {
  return record.biography.filter((paragraph, index) => !isHeaderParagraph(paragraph, index));
}

export function firstBodyParagraph(record: Inductee) {
  return bodyParagraphs(record).find((paragraph) => !paragraph.startsWith('## ') && !paragraph.startsWith('- '));
}

export function biographyBlocks(record: Inductee): BioBlock[] {
  const terms = termsFor(record);
  const used = new Set<string>();
  const blocks: BioBlock[] = [];
  for (const paragraph of bodyParagraphs(record)) {
    if (paragraph.startsWith('## ')) {
      blocks.push({ type: 'heading', text: paragraph.slice(3).trim() });
    } else if (paragraph.startsWith('- ')) {
      const item = linkText(paragraph.slice(2).trim(), terms, used);
      const last = blocks.at(-1);
      if (last?.type === 'list') last.items.push(item);
      else blocks.push({ type: 'list', items: [item] });
    } else {
      blocks.push({ type: 'paragraph', segments: linkText(paragraph, terms, used) });
    }
  }
  return blocks;
}
