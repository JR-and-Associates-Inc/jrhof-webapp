import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const records = JSON.parse(fs.readFileSync(path.join(root, 'src/data/inductees.json'), 'utf8'));
const fail = (message) => { throw new Error(message); };

if (records.length !== 150) fail(`Expected 150 inductees, received ${records.length}`);
if (new Set(records.map((record) => record.stable_id)).size !== 150) fail('Stable IDs are not unique');
if (new Set(records.map((record) => record.canonical_slug)).size !== 150) fail('Canonical slugs are not unique');

const robert = records.find((record) => record.display_name === 'Robert Schnabel');
if (!robert || robert.bio_source !== 'content/Bios/Robert_Schnabel.docx') fail('Robert Schnabel is not using the original source bio');
const robertText = robert.biography.join(' ').toLowerCase();
if (!robertText.includes('robert schnabel') || robertText.includes('1996 hall of fame inductee joe rossi')) fail('Robert Schnabel biography guardrail failed');
if (!records.some((record) => record.display_name === 'Gene Rozzelle')) fail('Gene Rozzelle is missing');
if (records.some((record) => /missing/i.test(record.portrait_output_filename))) fail('A person-specific Missing portrait was accepted');

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  const archive = fs.readFileSync(path.join(dist, 'inductees/index.html'), 'utf8');
  const cards = (archive.match(/<a\b[^>]*\bdata-inductee-card\b/g) || []).length;
  if (cards !== 150) fail(`Expected 150 archive cards, received ${cards}`);
  for (const record of records) {
    const detail = path.join(dist, 'inductees', record.canonical_slug, 'index.html');
    if (!fs.existsSync(detail)) fail(`Missing detail page for ${record.display_name}`);
    if (!archive.includes(`href="${record.proposed_canonical_url}"`)) fail(`Archive link missing for ${record.display_name}`);
  }
  const htmlFiles = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name.endsWith('.html')) htmlFiles.push(fullPath);
    }
  };
  walk(dist);
  const brokenInternalLinks = [];
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    for (const href of hrefs) {
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const pathname = decodeURIComponent(href.split('#')[0].split('?')[0]);
      if (!pathname) continue;
      const candidate = pathname === '/'
        ? path.join(dist, 'index.html')
        : pathname.endsWith('/')
          ? path.join(dist, pathname, 'index.html')
          : path.join(dist, pathname);
      if (!fs.existsSync(candidate)) brokenInternalLinks.push(`${path.relative(dist, file)} -> ${href}`);
    }
  }
  if (brokenInternalLinks.length) fail(`Broken internal links:\n${brokenInternalLinks.slice(0, 20).join('\n')}`);
  const allHtml = htmlFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n').toLowerCase();
  for (const forbidden of ['eventbrite.com', 'public login', 'register account', 'comments are closed']) {
    if (allHtml.includes(forbidden)) fail(`Forbidden legacy UI/content found: ${forbidden}`);
  }
}

console.log(`Validated ${records.length} unique inductees, Robert Schnabel source safety, Gene Rozzelle visibility, portrait policy, static routes, and internal links.`);
