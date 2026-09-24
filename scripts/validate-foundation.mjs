import fs from 'node:fs';
import path from 'node:path';

// Roster invariants. Change these deliberately, in the same commit, when a new
// inductee class is added or a pending portrait is verified (docs/CONTENT_MODEL.md).
const EXPECTED_INDUCTEES = 150;
const EXPECTED_UNRESOLVED_PORTRAITS = 33;

const root = process.cwd();
const records = JSON.parse(fs.readFileSync(path.join(root, 'src/data/inductees.json'), 'utf8'));
const portraitManifest = JSON.parse(fs.readFileSync(path.join(root, 'manifests/r2/inductee-portraits-v1.json'), 'utf8'));
const fail = (message) => { throw new Error(message); };

if (records.length !== EXPECTED_INDUCTEES) fail(`Expected ${EXPECTED_INDUCTEES} inductees, received ${records.length}`);
if (new Set(records.map((record) => record.stable_id)).size !== records.length) fail('Stable IDs are not unique');
if (new Set(records.map((record) => record.canonical_slug)).size !== records.length) fail('Canonical slugs are not unique');
for (const record of records) {
  if (record.proposed_canonical_url !== `/inductees/${record.canonical_slug}/`) fail(`${record.display_name}: proposed_canonical_url must be /inductees/${record.canonical_slug}/`);
  if (!record.induction_year && !record.induction_era) fail(`${record.display_name}: needs induction_year or induction_era`);
  if (!Array.isArray(record.biography)) fail(`${record.display_name}: biography must be an array of paragraphs`);
}

// Every verified portrait must have R2 variants, or src/lib/media.ts silently
// falls back to the placeholder; every manifest record must belong to a verified inductee.
// Everyone else uses the one shared R2 placeholder.
const manifestIds = new Set(portraitManifest.records.map((record) => record.stableId));
const verifiedIds = new Set(records.filter((record) => record.portrait_status === 'verified_candidate').map((record) => record.stable_id));
for (const id of verifiedIds) if (!manifestIds.has(id)) fail(`Verified portrait ${id} has no record in manifests/r2/inductee-portraits-v1.json`);
for (const id of manifestIds) if (!verifiedIds.has(id)) fail(`Portrait manifest record ${id} does not match a verified inductee`);
const placeholderUrl = `${portraitManifest.mediaBaseUrl}/${portraitManifest.placeholder.key}`;
const variantsById = new Map(portraitManifest.records.map((record) => [record.stableId, record.variants]));
const expectedPortrait = (record, variant) => (verifiedIds.has(record.stable_id)
  ? `${portraitManifest.mediaBaseUrl}/${variantsById.get(record.stable_id)[variant].key}`
  : placeholderUrl);
for (const record of records) {
  if (record.portrait_url !== expectedPortrait(record, 'profile')) fail(`${record.display_name}: portrait_url must be ${expectedPortrait(record, 'profile')}`);
}

const robert = records.find((record) => record.display_name === 'Robert Schnabel');
if (!robert || robert.bio_source !== 'content/Bios/Robert_Schnabel.docx') fail('Robert Schnabel is not using the original source bio');
const robertText = robert.biography.join(' ').toLowerCase();
if (!robertText.includes('robert schnabel') || robertText.includes('1996 hall of fame inductee joe rossi')) fail('Robert Schnabel biography guardrail failed');
if (!records.some((record) => record.display_name === 'Gene Rozzelle')) fail('Gene Rozzelle is missing');
if (records.some((record) => /missing/i.test(record.portrait_output_filename))) fail('A person-specific Missing portrait was accepted');
const unresolvedPortraits = records.filter((record) => !verifiedIds.has(record.stable_id));
if (unresolvedPortraits.length !== EXPECTED_UNRESOLVED_PORTRAITS) fail(`Expected ${EXPECTED_UNRESOLVED_PORTRAITS} unresolved portraits, received ${unresolvedPortraits.length}`);

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  const archive = fs.readFileSync(path.join(dist, 'inductees/index.html'), 'utf8');
  const cards = (archive.match(/<a\b[^>]*\bdata-inductee-card\b/g) || []).length;
  if (cards !== records.length) fail(`Expected ${records.length} archive cards, received ${cards}`);
  for (const record of records) {
    const detail = path.join(dist, 'inductees', record.canonical_slug, 'index.html');
    if (!fs.existsSync(detail)) fail(`Missing detail page for ${record.display_name}`);
    if (!archive.includes(`href="${record.proposed_canonical_url}"`)) fail(`Archive link missing for ${record.display_name}`);
    // The rendered portrait must be the inductee's R2 variant or the shared R2 placeholder.
    const detailImages = [...fs.readFileSync(detail, 'utf8').matchAll(/<img\b[^>]*\bsrc="([^"]*\/inductees\/[^"]*)"/g)].map((match) => match[1]);
    if (!detailImages.length || detailImages.some((src) => src !== expectedPortrait(record, 'profile'))) fail(`${record.display_name}: biography page must show ${expectedPortrait(record, 'profile')}`);
    const card = archive.match(new RegExp(`<a\\b[^>]*href="${record.proposed_canonical_url}"[\\s\\S]*?</a>`))?.[0] || '';
    if (!card.includes(`src="${expectedPortrait(record, 'card')}"`)) fail(`${record.display_name}: archive card must show ${expectedPortrait(record, 'card')}`);
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
  const localInducteeImages = htmlFiles.filter((file) => /src="\/images\/inductees\//.test(fs.readFileSync(file, 'utf8')));
  if (localInducteeImages.length) fail(`Inductee images must come from media.jrhof.org, not /images/inductees/: ${localInducteeImages.map((file) => path.relative(dist, file)).join(', ')}`);
  // Eventbrite is allowed only for the golf registration link configured in src/config/site.ts.
  const approvedGolfRegistrationUrl = fs.readFileSync(path.join(root, 'src/config/site.ts'), 'utf8')
    .match(/golfRegistration:\s*'([^']+)'/)?.[1];
  if (!approvedGolfRegistrationUrl) fail('Unable to read eventLinks.golfRegistration from src/config/site.ts');
  const allHtml = htmlFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n').toLowerCase();
  const legacyUiHtml = allHtml.replaceAll(approvedGolfRegistrationUrl.toLowerCase(), '');
  for (const forbidden of ['eventbrite.com', 'public login', 'register account', 'comments are closed', 'candidate migration record', 'record under board review', 'editorial review status', 'biography pending review', 'portrait pending review']) {
    if (legacyUiHtml.includes(forbidden)) fail(`Forbidden legacy UI/content found: ${forbidden}`);
  }
}

console.log(`Validated ${records.length} unique inductees, R2 portraits and placeholder, content safety, approved event registration scope, static routes, and internal links.`);
