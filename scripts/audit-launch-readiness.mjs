import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const dist = path.join(root, 'dist');
const fail = (message) => { throw new Error(message); };
const requiredMeta = [
  'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height',
  'og:url', 'og:type', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
];

if (!fs.existsSync(dist)) fail('Run npm run build before the launch-readiness audit.');

const htmlFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (entry.name.endsWith('.html')) htmlFiles.push(filename);
  }
};
walk(dist);

const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const metaValue = (html, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1]
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["']`, 'i'))?.[1]
    || '';
};

for (const filename of htmlFiles) {
  const relative = path.relative(dist, filename);
  const html = fs.readFileSync(filename, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  const description = metaValue(html, 'description');
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || '';
  check(Boolean(title.trim()), `${relative}: missing title`);
  check(description.length >= 50 && description.length <= 180, `${relative}: meta description length ${description.length}`);
  check(canonical.startsWith('https://jrhof.org/'), `${relative}: invalid canonical ${canonical}`);
  check(!html.includes('workers.dev'), `${relative}: workers.dev leaked into page metadata`);
  check((html.match(/<h1\b/gi) || []).length === 1, `${relative}: expected exactly one h1`);

  for (const name of requiredMeta) {
    const value = metaValue(html, name);
    check(Boolean(value), `${relative}: missing ${name}`);
  }
  check(metaValue(html, 'og:image') === 'https://jrhof.org/images/jrhof-social-share.png', `${relative}: unexpected social image`);
  check(metaValue(html, 'twitter:card') === 'summary_large_image', `${relative}: unexpected Twitter card`);

  for (const image of html.match(/<img\b[^>]*>/gi) || []) {
    check(/\balt=["'][^"']*["']/i.test(image), `${relative}: image missing alt attribute`);
  }
  for (const anchor of html.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) || []) {
    check(/\brel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(anchor), `${relative}: external new-tab link missing noopener/noreferrer`);
  }
}

const galleryExpectations = new Map([
  ['events/golf/2024-umpires-cup-ii/index.html', 158],
  ['events/golf/2025-umpires-cup-iii/index.html', 244],
  ['events/golf-tournament/index.html', 176],
]);
for (const [relative, expected] of galleryExpectations) {
  const html = fs.readFileSync(path.join(dist, relative), 'utf8');
  const fullSources = [...html.matchAll(/data-full-src="([^"]+)"/g)].map((match) => match[1]);
  const thumbnailSources = [...html.matchAll(/<img src="([^"]+)" alt="" width="72"/g)].map((match) => match[1]);
  check(fullSources.length === expected, `${relative}: expected ${expected} gallery records, found ${fullSources.length}`);
  check(thumbnailSources.length === expected, `${relative}: expected ${expected} filmstrip thumbnails, found ${thumbnailSources.length}`);
  check([...fullSources, ...thumbnailSources].every((url) => url.startsWith('https://media.jrhof.org/')), `${relative}: non-media gallery URL found`);
}

const allHtml = htmlFiles.map((filename) => fs.readFileSync(filename, 'utf8')).join('\n').toLowerCase();
for (const forbidden of ['gallery staged for release', 'release switch', 'view legacy source page', 'original source gallery']) {
  check(!allHtml.includes(forbidden), `Public release/legacy copy found: ${forbidden}`);
}

const headers = fs.readFileSync(path.join(root, 'public/_headers'), 'utf8');
for (const header of ['Content-Security-Policy:', 'X-Content-Type-Options: nosniff', 'Referrer-Policy:', 'Permissions-Policy:', 'Strict-Transport-Security:']) {
  check(headers.includes(header), `Missing security header: ${header}`);
}
check(headers.includes('https://media.jrhof.org'), 'CSP does not allow the permanent media origin.');

const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
check(robots.includes('Sitemap: https://jrhof.org/sitemap-index.xml'), 'robots.txt sitemap is incorrect.');
check(fs.existsSync(path.join(dist, 'sitemap-index.xml')), 'Sitemap index is missing.');

const iconChecks = [
  ['public/apple-touch-icon.png', 180, 180],
  ['public/favicon/android-chrome-192x192.png', 192, 192],
  ['public/favicon/android-chrome-512x512.png', 512, 512],
  ['public/images/jrhof-social-share.png', 1200, 630],
];
for (const [relative, width, height] of iconChecks) {
  const metadata = await sharp(path.join(root, relative)).metadata();
  check(metadata.width === width && metadata.height === height, `${relative}: expected ${width}x${height}`);
}
for (const relative of ['public/favicon.ico', 'public/favicon.svg', 'public/favicon/site.webmanifest']) {
  check(fs.existsSync(path.join(root, relative)), `${relative}: missing`);
}

const tracked = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
if (tracked.status !== 0) fail(tracked.stderr || 'Unable to inspect tracked files.');
const trackedPaths = tracked.stdout.trim().split('\n');
check(!trackedPaths.some((item) => item.startsWith('public/gallery/events/golf/')), 'Tracked event gallery binaries remain.');
check(!trackedPaths.some((item) => item.startsWith('2025 Golf Tournament Pictures/') || item.startsWith('2026 Golf Tournament Pictures/') || item.startsWith('.local-media/')), 'Source or generated gallery binaries are tracked.');

if (errors.length) fail(`Launch-readiness audit failed:\n${errors.join('\n')}`);
console.log(`Audited ${htmlFiles.length} pages, metadata, links, alt attributes, gallery origins, security headers, icons, sitemap, robots, and tracked-media boundaries.`);
