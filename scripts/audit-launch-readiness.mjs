import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const dist = path.join(root, 'dist');
const fail = (message) => { throw new Error(message); };
const productionOrigin = 'https://jrhof.org';
const siteOrigin = new URL(process.env.PUBLIC_SITE_URL?.trim() || productionOrigin).origin;
const socialImageUrl = `${siteOrigin}/social-card-v2.png`;
const isPreviewBuild = siteOrigin !== productionOrigin;
const clarityProjectId = process.env.PUBLIC_CLARITY_PROJECT_ID?.trim();
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

// Measurement contract (docs/architecture/JRHOF_MARKETING_ARCHITECTURE.md §6).
// GTM-WGDF4SBN is the only Google loader; data-ga-event names and data-ga-params
// keys must stay inside the approved taxonomy so GTM/GA4/Ads never receive
// undocumented or PII-bearing attributes.
const gtmContainerId = 'GTM-WGDF4SBN';
const approvedAttributeEvents = new Set([
  'donate_click', 'donate_once_click', 'donate_monthly_click', 'banquet_support_click',
  'banquet_info_click', 'contact_click', 'email_click', 'phone_click',
  'external_partner_click', 'event_register_click', 'golf_register_click',
  'inductee_profile_click',
]);
const approvedAttributeParams = new Set([
  'link_text', 'destination_url', 'link_context', 'cta_location',
  'donation_type', 'event_name', 'partner', 'inductee_name',
]);
const noindexRoutes = new Set(['donate/thank-you/index.html', 'donate/return/index.html']);
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
  check(canonical.startsWith(`${siteOrigin}/`), `${relative}: invalid canonical ${canonical}`);
  if (!isPreviewBuild) check(!html.includes('workers.dev'), `${relative}: workers.dev leaked into production metadata`);
  check((html.match(/<h1\b/gi) || []).length === 1, `${relative}: expected exactly one h1`);

  for (const name of requiredMeta) {
    const value = metaValue(html, name);
    check(Boolean(value), `${relative}: missing ${name}`);
  }
  check(metaValue(html, 'og:url').startsWith(`${siteOrigin}/`), `${relative}: unexpected Open Graph URL`);
  check(metaValue(html, 'og:image') === socialImageUrl, `${relative}: unexpected social image`);
  check(metaValue(html, 'twitter:image') === socialImageUrl, `${relative}: unexpected Twitter image`);
  check(metaValue(html, 'og:image:width') === '1200', `${relative}: unexpected social image width`);
  check(metaValue(html, 'og:image:height') === '630', `${relative}: unexpected social image height`);
  check(metaValue(html, 'twitter:card') === 'summary_large_image', `${relative}: unexpected Twitter card`);

  // Single-loader rule: exactly one GTM head snippet and one noscript iframe,
  // no other container IDs, and no parallel Google loaders in the shipped HTML.
  check((html.match(/googletagmanager\.com\/gtm\.js/g) || []).length === 1, `${relative}: expected exactly one GTM loader.`);
  check((html.match(/googletagmanager\.com\/ns\.html\?id=/g) || []).length === 1, `${relative}: expected exactly one GTM noscript iframe.`);
  check((html.match(/GTM-[A-Z0-9]+/g) || []).every((id) => id === gtmContainerId), `${relative}: unexpected GTM container reference.`);
  check(!html.includes('googletagmanager.com/gtag/js'), `${relative}: hard-coded gtag.js loader found (GTM must be the only Google loader).`);
  check(!/cdn-cgi\/zaraz|zaraz\.js/i.test(html), `${relative}: Zaraz loader reference found.`);
  check(!html.includes('cdn.jrhof.org'), `${relative}: legacy cdn.jrhof.org reference found (use media.jrhof.org).`);

  // Taxonomy guard: attribute-driven events and their params must stay approved.
  for (const [, eventName] of html.matchAll(/data-ga-event="([^"]*)"/g)) {
    check(approvedAttributeEvents.has(eventName), `${relative}: data-ga-event "${eventName}" is not in the approved taxonomy.`);
  }
  for (const [, rawParams] of html.matchAll(/data-ga-params="([^"]*)"/g)) {
    const decoded = rawParams.replaceAll('&quot;', '"').replaceAll('&#34;', '"').replaceAll('&amp;', '&');
    try {
      for (const key of Object.keys(JSON.parse(decoded || '{}'))) {
        check(approvedAttributeParams.has(key), `${relative}: data-ga-params key "${key}" is not in the approved parameter set.`);
      }
    } catch {
      errors.push(`${relative}: data-ga-params is not valid JSON.`);
    }
  }

  // Robots contract: donation return/thank-you stay noindex (404 may be);
  // nothing else may carry noindex.
  if (noindexRoutes.has(relative)) {
    check(/<meta name="robots" content="noindex/i.test(html), `${relative}: expected a noindex robots meta.`);
  } else if (relative !== '404.html') {
    check(!/<meta name="robots" content="[^"]*noindex/i.test(html), `${relative}: unexpected noindex robots meta.`);
  }

  // Structured data must parse on every page.
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  check(jsonLdBlocks.length >= 1, `${relative}: missing JSON-LD structured data.`);
  for (const [, block] of jsonLdBlocks) {
    try { JSON.parse(block); } catch { errors.push(`${relative}: JSON-LD does not parse.`); }
  }

  for (const image of html.match(/<img\b[^>]*>/gi) || []) {
    check(/\balt=["'][^"']*["']/i.test(image), `${relative}: image missing alt attribute`);
  }
  for (const anchor of html.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) || []) {
    check(/\brel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(anchor), `${relative}: external new-tab link missing noopener/noreferrer`);
  }
}

const galleryExpectations = new Map([
  ['events/induction-banquet/2026-hall-of-fame-induction-banquet/index.html', 139],
  ['events/golf/2024-umpires-cup-ii/index.html', 158],
  ['events/golf/2025-umpires-cup-iii/index.html', 244],
  ['events/golf/2026-umpires-cup-iv/index.html', 176],
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
if (clarityProjectId) {
  for (const filename of htmlFiles) {
    const relative = path.relative(dist, filename);
    const html = fs.readFileSync(filename, 'utf8');
    check(html.includes(`const projectId = ${JSON.stringify(clarityProjectId)}`), `${relative}: configured Clarity project ID is missing.`);
    check((html.match(/https:\/\/www\.clarity\.ms\/tag\//g) || []).length === 1, `${relative}: expected exactly one Clarity loader.`);
  }
}
for (const forbidden of ['gallery staged for release', 'release switch', 'view legacy source page', 'original source gallery']) {
  check(!allHtml.includes(forbidden), `Public release/legacy copy found: ${forbidden}`);
}
check(!allHtml.includes('tentative'), 'Outdated event-date language found in public HTML.');

const headers = fs.readFileSync(path.join(root, 'public/_headers'), 'utf8');
for (const header of ['Content-Security-Policy:', 'X-Content-Type-Options: nosniff', 'Referrer-Policy:', 'Permissions-Policy:', 'Strict-Transport-Security:']) {
  check(headers.includes(header), `Missing security header: ${header}`);
}
check(headers.includes('https://media.jrhof.org'), 'CSP does not allow the permanent media origin.');
for (const gtmOrigin of ['https://www.googletagmanager.com', 'https://www.google-analytics.com']) {
  check(headers.includes(gtmOrigin), `CSP does not allow the Google measurement origin: ${gtmOrigin}`);
}
check(headers.includes('https://analytics.google.com'), 'CSP does not allow the Google Analytics connect origin.');
check(headers.includes('https://region1.google-analytics.com'), 'CSP does not allow the regional Google Analytics connect origin.');
check(headers.includes('https://*.google-analytics.com'), 'CSP does not allow the wildcard Google Analytics origin.');
check(headers.includes('https://*.analytics.google.com'), 'CSP does not allow the wildcard analytics.google.com origin.');
for (const clarityOrigin of ['https://www.clarity.ms', 'https://*.clarity.ms', 'https://c.bing.com']) {
  check(headers.includes(clarityOrigin), `CSP does not allow Clarity origin: ${clarityOrigin}`);
}
check(!headers.includes('.r2.dev'), 'CSP still allows the temporary r2.dev endpoint.');
for (const previewHost of ['https://jrhof-webapp.jr-and-associates-inc.workers.dev/*', 'https://jrhof-webapp.tmco-consulting.workers.dev/*']) {
  check(headers.includes(previewHost), `_headers is missing the noindex rule for ${previewHost}`);
}
// X-Robots-Tag may only appear under host-scoped workers.dev matchers, never
// under a path-only matcher that would also apply to jrhof.org.
{
  let currentMatcher = '';
  for (const line of headers.split('\n')) {
    if (line && !line.startsWith(' ') && !line.startsWith('#')) currentMatcher = line.trim();
    else if (/^\s+X-Robots-Tag/i.test(line)) {
      check(currentMatcher.includes('workers.dev'), `_headers sends X-Robots-Tag under non-preview matcher "${currentMatcher}".`);
    }
  }
}

const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
check(robots.includes('Sitemap: https://jrhof.org/sitemap-index.xml'), 'robots.txt sitemap is incorrect.');
check(fs.existsSync(path.join(dist, 'sitemap-index.xml')), 'Sitemap index is missing.');

// The sitemap must list exactly the indexable pages: every built page except
// the 404 route and the noindex donation return/thank-you routes.
const sitemapFile = path.join(dist, 'sitemap-0.xml');
check(fs.existsSync(sitemapFile), 'sitemap-0.xml is missing.');
if (fs.existsSync(sitemapFile)) {
  const sitemapUrls = new Set(
    [...fs.readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
  );
  const expectedUrls = new Set(
    htmlFiles
      .map((filename) => path.relative(dist, filename))
      .filter((relative) => relative !== '404.html' && !noindexRoutes.has(relative))
      .map((relative) => `${siteOrigin}/${relative.replace(/index\.html$/, '')}`),
  );
  for (const url of expectedUrls) check(sitemapUrls.has(url), `Sitemap is missing ${url}`);
  for (const url of sitemapUrls) check(expectedUrls.has(url), `Sitemap lists unexpected URL ${url}`);
}

// The donation-completion signal must stay gated on the Stripe checkout-session
// token and deduplicated across refreshes (PR-1 contract).
const thankYouHtml = fs.readFileSync(path.join(dist, 'donate/thank-you/index.html'), 'utf8');
for (const marker of ["get('cs')", 'jrhof:donation_complete:', 'sessionStorage', "jrhofTrack('donation_complete'"]) {
  check(thankYouHtml.includes(marker), `donate/thank-you: donation_complete gating/dedupe marker missing: ${marker}`);
}

const iconChecks = [
  ['public/apple-touch-icon.png', 180, 180],
  ['public/favicon/android-chrome-192x192.png', 192, 192],
  ['public/favicon/android-chrome-512x512.png', 512, 512],
  ['public/social-card-v2.png', 1200, 630],
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
check(!trackedPaths.some((item) => item.startsWith('2025 Golf Tournament Pictures/') || item.startsWith('2026 Golf Tournament Pictures/') || item.startsWith('2026_CHSBUA_HOF_Induction_Banquet/') || item.startsWith('.local-media/')), 'Source or generated gallery binaries are tracked.');
const ignoredBanquetSource = spawnSync('git', ['check-ignore', '-q', '2026_CHSBUA_HOF_Induction_Banquet/GN1A5712.JPG'], { cwd: root });
check(ignoredBanquetSource.status === 0, 'The 2026 banquet source folder is not ignored by Git.');

if (errors.length) fail(`Launch-readiness audit failed:\n${errors.join('\n')}`);
console.log(`Audited ${htmlFiles.length} pages: metadata, links, alt attributes, gallery origins, security headers, icons, sitemap coverage, robots/noindex contract, GTM single-loader rule, analytics taxonomy attributes, JSON-LD parsing, donation-conversion gating, and tracked-media boundaries.`);
