// Keeps the documentation aligned for every contributor and coding tool:
// - links between Markdown files resolve;
// - every docs/<name>.md path mentioned in docs, code comments or headers exists;
// - the tool-specific instruction files only point to AGENTS.md.
// Run with `node scripts/check-docs.mjs` (part of `npm run validate`).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const skip = new Set(['node_modules', 'dist', '.git', '.astro', '.wrangler', '.local-media', 'media-sources', 'content']);
const failures = [];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(root);
const markdown = files.filter((file) => file.endsWith('.md'));
const sources = files.filter((file) => /\.(md|astro|ts|mjs|js|json|jsonc)$/.test(file) || file.endsWith('_headers'));
const rel = (file) => path.relative(root, file);

for (const file of markdown) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURI(target.split('#')[0]));
    if (!fs.existsSync(resolved)) failures.push(`${rel(file)}: broken link to ${target}`);
  }
}

for (const file of sources) {
  if (file.includes(`${path.sep}manifests${path.sep}`) || file.endsWith('package-lock.json')) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\bdocs\/[\w./-]+\.md\b/g)) {
    if (!fs.existsSync(path.join(root, match[0]))) failures.push(`${rel(file)}: mentions missing ${match[0]}`);
  }
}

const pointers = { 'CLAUDE.md': '@AGENTS.md', 'GEMINI.md': '@AGENTS.md', '.github/copilot-instructions.md': 'AGENTS.md' };
for (const [file, needle] of Object.entries(pointers)) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) failures.push(`${file} is missing; it must point to AGENTS.md`);
  else if (!fs.readFileSync(full, 'utf8').includes(needle)) failures.push(`${file} must reference ${needle}`);
}

if (failures.length) {
  console.error(`Documentation check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Checked ${markdown.length} Markdown files: links resolve, doc references exist, and tool instruction files point to AGENTS.md.`);
