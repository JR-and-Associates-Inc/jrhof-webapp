// Microsoft Clarity loads only through GTM (ADR-018). Run after `npm run build`; reads dist/.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
assert.ok(fs.existsSync(dist), 'Run npm run build before the Clarity test.');

const pages = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (/\.(html|js)$/.test(entry.name)) pages.push(filename);
  }
};
walk(dist);

// No hard-coded Clarity loader or bootstrap in any built page or script.
for (const filename of pages) {
  const text = fs.readFileSync(filename, 'utf8');
  const relative = path.relative(dist, filename);
  assert.ok(!text.includes('clarity.ms/tag'), `${relative}: hard-coded Clarity loader (clarity.ms/tag) found`);
  assert.ok(!/window\[functionName\]|["']clarity["']\s*,\s*["']script["']/.test(text), `${relative}: Clarity bootstrap snippet found`);
}

// The old build-time loader is gone.
assert.ok(!fs.existsSync(path.join(root, 'src/components/Clarity.astro')), 'src/components/Clarity.astro must stay removed.');
for (const file of ['.env.example', 'astro.config.mjs', 'wrangler.jsonc', 'src/components/BaseLayout.astro']) {
  assert.ok(!fs.readFileSync(path.join(root, file), 'utf8').includes('PUBLIC_CLARITY_PROJECT_ID'), `${file} still references PUBLIC_CLARITY_PROJECT_ID`);
}

// GTM injects Clarity, so the CSP must keep allowing its origins.
const headers = fs.readFileSync(path.join(root, 'public/_headers'), 'utf8');
for (const policy of [...headers.matchAll(/^\s+Content-Security-Policy: (.+)$/gm)].map((match) => match[1])) {
  for (const origin of ['https://www.clarity.ms', 'https://*.clarity.ms', 'https://c.bing.com']) {
    assert.ok(policy.includes(origin), `A Content-Security-Policy no longer allows ${origin}`);
  }
}

// Zeffy embeds are masked in Clarity recordings.
const embed = fs.readFileSync(path.join(root, 'src/components/ZeffyEmbed.astro'), 'utf8');
assert.match(embed, /data-zeffy-wrapper\s+data-clarity-mask="true"/, 'ZeffyEmbed wrapper must carry data-clarity-mask="true".');
let embeds = 0;
for (const filename of pages.filter((file) => file.endsWith('.html'))) {
  const html = fs.readFileSync(filename, 'utf8');
  for (const [tag] of html.matchAll(/<div\b[^>]*\bdata-zeffy-wrapper\b[^>]*>/g)) {
    embeds += 1;
    assert.ok(tag.includes('data-clarity-mask="true"'), `${path.relative(dist, filename)}: Zeffy embed container is not masked for Clarity`);
  }
}

console.log(`Clarity tests passed: no hard-coded loader in ${pages.length} built files, CSP keeps Clarity origins, ${embeds} rendered Zeffy embed(s) masked.`);
