// Turns the paragraph strings in src/data/inductees.json into the blocks an
// inductee page renders. Formatting only: the words come from the data, and a
// link is added only where the text already names another inductee or one of
// the organizations below. Data conventions are documented in docs/CONTENT_MODEL.md.
//
//   "## Heading"   a subheading inside the biography
//   "- Item"       a list item; consecutive items form one list
//   a paragraph that is one quotation, “like this.”, renders as a pull quote
//   leading "2026 Hall of Fame Inductee – Name (Hometown)" lines are the header:
//   they supply the hometown and are not repeated in the body.

import { partnerLinks } from '../config/site';

export interface BiographyRecord {
  display_name: string;
  sort_name: string;
  aliases: string[];
  canonical_slug: string;
  proposed_canonical_url: string;
  biography: string[];
}

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'inductee'; text: string; href: string; name: string }
  | { kind: 'reference'; text: string; href: string; label: string };

export type BiographyBlock =
  | { type: 'paragraph'; segments: Segment[] }
  | { type: 'quote'; segments: Segment[] }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: Segment[][] };

export interface Biography {
  location?: string;
  credits?: string;
  blocks: BiographyBlock[];
  /** Plain text of the first body paragraph. */
  lead?: string;
}

/**
 * Organizations that biographies name, linked on their first mention.
 * Add one only after confirming its official site.
 */
export const referenceLinks = [
  { label: 'CHSBUA', href: partnerLinks.chsbua, pattern: /\bColorado High School Baseball Umpires Association\b|\bCHSBUA\b/g },
  { label: 'CHSAA', href: 'https://chsaanow.com/', pattern: /\bColorado High School Activities Association\b|\bCHSAA\b/g },
  { label: 'NFHS', href: 'https://www.nfhs.org/', pattern: /\bNational Federation of State High School Associations\b|\bNFHS\b/g },
  { label: 'Colorado Sports Hall of Fame', href: 'https://www.coloradosports.org/', pattern: /\bColorado Sports Hall of Fame\b/g },
  { label: 'Connie Mack World Series', href: 'https://www.conniemackworldseries.com/', pattern: /\bConnie Mack World Series\b/g },
  { label: 'Referee Magazine', href: 'https://www.referee.com/', pattern: /\bReferee Magazine\b/g },
  { label: 'NASO', href: 'https://www.naso.org/', pattern: /\bNational Association of Sports Officials\b|\bNASO\b/g },
] as const;

/**
 * Names in a biography that match an inductee but may be a different person.
 * Keyed by the slug of the biography being rendered. Remove an entry once the
 * organization confirms the identity.
 */
export const unconfirmedMentions: Record<string, string[]> = {
  // "Bob Jones, the first NCAA Umpire Development representative assigned to the
  // Mid-west" may or may not be the 2013 inductee from Kansas City.
  dan_weikle: ['Bob Jones'],
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isHeaderLine = (paragraph: string) =>
  (/hall of fame inductee/i.test(paragraph) && paragraph.length < 220)
  || (paragraph.length < 80 && /\s[–—-]\s/.test(paragraph) && !/[.!?”"]$/.test(paragraph));

function locationFrom(header: string, surname: string): string | undefined {
  const parenthetical = header.match(/\(([^()]{2,60})\)\s*$/)?.[1]?.trim();
  if (parenthetical) return parenthetical;

  const sections = header.split(/\s(?:–|—|-)\s/);
  if (sections.length < 2) return undefined;

  let location = sections.at(-1)?.replace(/\s+(?:Nominated|Presented)\b.*$/i, '').trim();
  if (!location) return undefined;

  const commaParts = location.split(',').map((part) => part.trim());
  if (commaParts.length > 1 && commaParts[0].toLowerCase().includes(surname)) {
    location = commaParts.slice(1).join(', ');
  }
  return location.length <= 80 ? location : undefined;
}

function creditsFrom(header: string): string | undefined {
  const credits = [header.match(/Nominated by [^•·]+/)?.[0], header.match(/Presented by [^•·]+/)?.[0]]
    .map((part) => part?.trim())
    .filter(Boolean);
  return credits.length ? credits.join(' · ') : undefined;
}

interface LinkCandidate {
  key: string;
  pattern: RegExp;
  toSegment: (text: string) => Segment;
}

function linkCandidates(record: BiographyRecord, roster: BiographyRecord[]): LinkCandidate[] {
  const skip = new Set(unconfirmedMentions[record.canonical_slug] ?? []);
  const people = roster
    .filter((person) => person.canonical_slug !== record.canonical_slug)
    .flatMap((person) => [person.display_name, ...person.aliases]
      .filter((name) => name.trim().split(/\s+/).length >= 2 && !skip.has(name))
      .map((name) => ({
        key: `inductee:${person.canonical_slug}`,
        // Not "Joe Rossi Hall of Fame" or "Joe Rossi Umpires Hall of Fame".
        pattern: new RegExp(`\\b${escapeRegExp(name)}\\b(?!(?:['’]s)?\\s+(?:Umpires\\s+)?Hall\\b)`, 'g'),
        toSegment: (text: string): Segment => ({ kind: 'inductee', text, href: person.proposed_canonical_url, name: person.display_name }),
      })));
  const organizations = referenceLinks.map((reference) => ({
    key: `reference:${reference.label}`,
    pattern: new RegExp(reference.pattern.source, 'g'),
    toSegment: (text: string): Segment => ({ kind: 'reference', text, href: reference.href, label: reference.label }),
  }));
  return [...people, ...organizations];
}

/** Links the first mention of each candidate on the page; `used` spans the whole biography. */
function linkText(text: string, candidates: LinkCandidate[], used: Set<string>): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    let best: { index: number; length: number; candidate: LinkCandidate } | undefined;
    for (const candidate of candidates) {
      if (used.has(candidate.key)) continue;
      candidate.pattern.lastIndex = cursor;
      const match = candidate.pattern.exec(text);
      if (!match) continue;
      if (!best || match.index < best.index || (match.index === best.index && match[0].length > best.length)) {
        best = { index: match.index, length: match[0].length, candidate };
      }
    }
    if (!best) break;
    if (best.index > cursor) segments.push({ kind: 'text', text: text.slice(cursor, best.index) });
    segments.push(best.candidate.toSegment(text.slice(best.index, best.index + best.length)));
    used.add(best.candidate.key);
    cursor = best.index + best.length;
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });
  return segments;
}

export function parseBiography(record: BiographyRecord, roster: BiographyRecord[]): Biography {
  const paragraphs = record.biography.map((paragraph) => paragraph.trim()).filter(Boolean);
  let headerCount = 0;
  while (headerCount < Math.min(2, paragraphs.length - 1) && isHeaderLine(paragraphs[headerCount])) headerCount += 1;
  const header = paragraphs.slice(0, headerCount);
  const surname = record.sort_name.split(',')[0].trim().toLowerCase();

  const candidates = linkCandidates(record, roster);
  const used = new Set<string>();
  const blocks: BiographyBlock[] = [];
  let lead: string | undefined;

  for (const paragraph of paragraphs.slice(headerCount)) {
    if (paragraph.startsWith('## ')) {
      blocks.push({ type: 'heading', text: paragraph.slice(3).trim() });
    } else if (paragraph.startsWith('- ')) {
      const item = linkText(paragraph.slice(2).trim(), candidates, used);
      const previous = blocks.at(-1);
      if (previous?.type === 'list') previous.items.push(item);
      else blocks.push({ type: 'list', items: [item] });
    } else if (/^“[^“”]+”\.?$/.test(paragraph)) {
      blocks.push({ type: 'quote', segments: linkText(paragraph, candidates, used) });
    } else {
      lead ??= paragraph;
      blocks.push({ type: 'paragraph', segments: linkText(paragraph, candidates, used) });
    }
  }

  return {
    location: header.map((line) => locationFrom(line, surname)).find(Boolean),
    credits: header.map(creditsFrom).find(Boolean),
    blocks,
    lead,
  };
}

// "B.A.", "U.S.", "s.o.b.", a middle initial, or a title does not end a sentence.
const ABBREVIATION = /^(?:(?:[A-Za-z]\.){2,}|[A-Z]\.|(?:Jr|Sr|Dr|Mr|Mrs|Ms|St|Mt|No|vs|Inc|Co|Ft|Ave)\.)$/;

/** Offsets just after each sentence end in `text`. */
function sentenceEnds(text: string): number[] {
  const ends: number[] = [];
  for (const match of text.matchAll(/[.!?][”"’)]*(?=\s+[A-Z“"‘(]|\s*$)/g)) {
    const end = match.index + match[0].length;
    const word = text.slice(0, end).replace(/[”"’)]+$/, '').match(/(\S+)$/)?.[1] ?? '';
    if (!ABBREVIATION.test(word.replace(/^[“"‘(]+/, ''))) ends.push(end);
  }
  return ends;
}

/** Whole sentences from the start of `text`, at most `max` characters. */
export function summarize(text: string, max: number): string {
  if (text.length <= max) return text;
  const summary = text.slice(0, sentenceEnds(text).filter((end) => end <= max).at(-1) ?? 0).trim();
  if (summary.length >= Math.min(80, max / 2)) return summary;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,;:–—-]$/, '')}…`;
}
