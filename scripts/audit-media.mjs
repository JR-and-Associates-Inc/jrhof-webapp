#!/usr/bin/env node
// Repository-wide media audit.
//
// Enumerates every Git-tracked raster/vector image, records its format,
// dimensions, byte size, and SHA-256, discovers where it is referenced by the
// live Astro site, and recommends an action (keep / convert / move-to-r2 /
// replace-reference / archive / delete-candidate).
//
// Output is deterministic (sorted, no wall-clock timestamp) so re-runs produce
// clean diffs:
//   - manifests/audits/media-audit.json  (machine-readable)
//   - docs/MEDIA_AUDIT_2026-07-07.md      (human summary; regenerate in place)
//
// Untracked working files (raw camera drops, .local-media derivatives, dist,
// node_modules, .astro) are intentionally excluded: `git ls-files` only lists
// tracked paths. Run: `node scripts/audit-media.mjs`.

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = process.cwd();
const jsonOutputPath = path.join(root, 'manifests/audits/media-audit.json');
const markdownOutputPath = path.join(root, 'docs/MEDIA_AUDIT_2026-07-07.md');

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.ico',
  '.heic', '.tif', '.tiff', '.bmp',
]);
const RASTER_LOSSLESS_KEEP = new Set(['.ico', '.svg']);
const OVERSIZE_BYTES = 300 * 1024;

function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  return result.stdout;
}

async function sha256File(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

// Files that represent the LIVE site (things that ship or drive the build).
// Referencing an asset from one of these means it is used by the running site.
async function collectLiveSourceCorpus() {
  const tracked = git(['ls-files']).trim().split('\n').filter(Boolean);
  const liveGlobs = [
    (p) => p.startsWith('src/'),
    (p) => p === 'astro.config.mjs',
    (p) => p.startsWith('public/') && !IMAGE_EXTENSIONS.has(path.extname(p).toLowerCase()),
  ];
  const textLike = new Set(['.astro', '.ts', '.js', '.mjs', '.json', '.css', '.md', '.txt', '.webmanifest', '.xml', '.html', '']);
  const corpus = [];
  for (const file of tracked) {
    if (!liveGlobs.some((match) => match(file))) continue;
    if (!textLike.has(path.extname(file).toLowerCase())) continue;
    try {
      const text = await fs.readFile(path.join(root, file), 'utf8');
      corpus.push({ file, text });
    } catch {
      // binary or unreadable; skip
    }
  }
  return corpus;
}

function classify(file, { bytes, referencedByLive, referencedAsSource }) {
  const ext = path.extname(file).toLowerCase();
  const isInducteePortrait = file.startsWith('public/images/inductees/');
  const isContentOriginal = file.startsWith('content/');
  const isArchived = file.startsWith('_archive/');
  const isWebp = ext === '.webp';
  const oversize = bytes > OVERSIZE_BYTES && !isWebp && !RASTER_LOSSLESS_KEEP.has(ext);

  if (isArchived) {
    return { action: 'archive', reason: 'Already under _archive/; excluded from live site. Leave tracked as historical record.' };
  }
  if (isContentOriginal) {
    return {
      action: 'archive',
      reason: 'Archival inductee source original. `/content/` is gitignored; untrack with `git rm --cached` and hold in the controlled Drive/R2 archive.',
    };
  }
  if (isInducteePortrait) {
    if (RASTER_LOSSLESS_KEEP.has(ext) || isWebp) {
      return { action: 'keep', reason: 'Placeholder/vector asset served directly by inductee routes.' };
    }
    if (referencedByLive) {
      return { action: 'convert', reason: 'Verified portrait served as JPEG. Generate EXIF-stripped WebP profile/card derivatives for R2 (manifests/r2/inductee-portraits-v1.json).' };
    }
    return { action: 'archive', reason: 'Tracked portrait not referenced by any live route. Quarantine for identity/provenance review before conversion or removal (do not mechanically delete).' };
  }
  if (!referencedByLive && !referencedAsSource) {
    return { action: 'delete-candidate', reason: 'No live reference found. Confirm manually before removal.' };
  }
  if (RASTER_LOSSLESS_KEEP.has(ext)) {
    return { action: 'keep', reason: 'Icon/vector site asset.' };
  }
  if (['favicon', 'apple-touch-icon', 'android-chrome', 'social-card'].some((n) => path.basename(file).toLowerCase().includes(n))) {
    return { action: 'keep', reason: 'Brand/PWA/social asset; format is required by platform consumers.' };
  }
  if (isWebp) {
    return { action: 'keep', reason: 'Already an optimized WebP site asset.' };
  }
  if (oversize) {
    return { action: 'convert', reason: `Oversized ${ext.slice(1).toUpperCase()} site asset (${(bytes / 1024).toFixed(0)} KB). Candidate for WebP conversion.` };
  }
  return { action: 'keep', reason: 'Referenced site asset within acceptable size.' };
}

async function main() {
  const trackedImages = git(['ls-files'])
    .trim()
    .split('\n')
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort();

  const corpus = await collectLiveSourceCorpus();
  const inducteeRecords = JSON.parse(await fs.readFile(path.join(root, 'src/data/inductees.json'), 'utf8'));
  const sourcePointers = new Set(
    inducteeRecords
      .flatMap((record) => [record.portrait_source, record.source_provenance?.original_portrait])
      .filter(Boolean),
  );

  const entries = [];
  for (const file of trackedImages) {
    const absolutePath = path.join(root, file);
    const stats = await fs.stat(absolutePath);
    const ext = path.extname(file).toLowerCase();
    const publicUrl = file.startsWith('public/') ? `/${file.slice('public/'.length)}` : null;
    const basename = path.basename(file);

    let width = null;
    let height = null;
    let format = ext.slice(1);
    try {
      const metadata = await sharp(absolutePath, { failOn: 'error' }).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
      format = metadata.format ?? format;
    } catch {
      // SVG/ICO or unreadable by sharp; leave dimensions null.
    }

    // Reference discovery. The public URL is the strong signal: portrait_url and
    // every site asset are referenced by full `/…` path. A bare-basename match is
    // weak and, inside `src/data/*.json`, conflates a live `portrait_url` with an
    // archival `portrait_source` pointer (e.g. `content/Photos/Ray_Garvey.jpg`),
    // so basename matches there are ignored for the "live" determination.
    const referencedBy = [];
    let urlReferenced = false;
    let basenameReferencedOutsideData = false;
    for (const { file: sourceFile, text } of corpus) {
      const hitUrl = Boolean(publicUrl) && text.includes(publicUrl);
      const hitName = text.includes(basename);
      if (!hitUrl && !hitName) continue;
      referencedBy.push({ sourceFile, matchedBy: hitUrl ? 'url' : 'basename' });
      if (hitUrl) urlReferenced = true;
      if (hitName && !sourceFile.startsWith('src/data/')) basenameReferencedOutsideData = true;
    }
    const referencedByLive = urlReferenced || basenameReferencedOutsideData;
    const referencedAsSource = sourcePointers.has(file);

    const { action, reason } = classify(file, {
      bytes: stats.size, referencedByLive, referencedAsSource,
    });

    entries.push({
      path: file,
      publicUrl,
      format,
      ext,
      width,
      height,
      bytes: stats.size,
      sha256: await sha256File(absolutePath),
      referencedByLive,
      referencedAsSource,
      referencedBy: referencedBy.map((r) => r.sourceFile).sort(),
      recommendedAction: action,
      reason,
    });
  }

  const byAction = {};
  for (const entry of entries) {
    byAction[entry.recommendedAction] = (byAction[entry.recommendedAction] || 0) + 1;
  }

  const totalBytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  const byTopDir = {};
  for (const entry of entries) {
    const top = entry.path.split('/').slice(0, 2).join('/');
    byTopDir[top] = byTopDir[top] || { files: 0, bytes: 0 };
    byTopDir[top].files += 1;
    byTopDir[top].bytes += entry.bytes;
  }

  const audit = {
    schemaVersion: 1,
    scope: 'Git-tracked image assets. Untracked working files (.local-media, raw drops, dist) are excluded by design.',
    counts: {
      trackedImages: entries.length,
      totalBytes,
      byAction,
      byFormat: Object.fromEntries(
        Object.entries(
          entries.reduce((acc, e) => ({ ...acc, [e.format]: (acc[e.format] || 0) + 1 }), {}),
        ).sort(),
      ),
    },
    byTopDirectory: Object.fromEntries(Object.entries(byTopDir).sort()),
    entries,
  };

  await fs.mkdir(path.dirname(jsonOutputPath), { recursive: true });
  await fs.writeFile(jsonOutputPath, `${JSON.stringify(audit, null, 2)}\n`);

  await fs.writeFile(markdownOutputPath, renderMarkdown(audit));

  console.log(JSON.stringify({ trackedImages: entries.length, totalBytes, byAction }, null, 2));
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function renderMarkdown(audit) {
  const lines = [];
  lines.push('# Repository Media Audit');
  lines.push('');
  lines.push('Generated by `scripts/audit-media.mjs` (`node scripts/audit-media.mjs`). Deterministic — no wall-clock timestamp — so re-runs diff cleanly. Machine-readable copy: `manifests/audits/media-audit.json`.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Tracked images: **${audit.counts.trackedImages}** (${kb(audit.counts.totalBytes)} total)`);
  lines.push('- By recommended action:');
  for (const [action, count] of Object.entries(audit.counts.byAction).sort()) {
    lines.push(`  - \`${action}\`: ${count}`);
  }
  lines.push('- By format:');
  for (const [format, count] of Object.entries(audit.counts.byFormat)) {
    lines.push(`  - ${format}: ${count}`);
  }
  lines.push('');
  lines.push('## By directory');
  lines.push('');
  lines.push('| Directory | Files | Size |');
  lines.push('|---|---:|---:|');
  for (const [dir, stat] of Object.entries(audit.byTopDirectory)) {
    lines.push(`| \`${dir}\` | ${stat.files} | ${kb(stat.bytes)} |`);
  }
  lines.push('');
  lines.push('## Action legend');
  lines.push('');
  lines.push('- **keep** — optimized/required asset; no change.');
  lines.push('- **convert** — raster asset to re-encode as WebP (portraits/site imagery) for R2 delivery.');
  lines.push('- **archive** — original/source or quarantined asset; untrack from Git and hold in the controlled archive. Not deleted.');
  lines.push('- **delete-candidate** — no live reference found; confirm manually before removal.');
  lines.push('');
  lines.push('## Entries requiring action (convert / archive / delete-candidate)');
  lines.push('');
  lines.push('| Path | Format | Dimensions | Size | Referenced | Action | Reason |');
  lines.push('|---|---|---|---:|---|---|---|');
  for (const entry of audit.entries) {
    if (entry.recommendedAction === 'keep') continue;
    const dims = entry.width && entry.height ? `${entry.width}×${entry.height}` : '—';
    const ref = entry.referencedByLive ? 'live' : entry.referencedAsSource ? 'source-only' : 'none';
    lines.push(`| \`${entry.path}\` | ${entry.format} | ${dims} | ${kb(entry.bytes)} | ${ref} | ${entry.recommendedAction} | ${entry.reason} |`);
  }
  lines.push('');
  lines.push('_The full per-file inventory, including `keep` assets and SHA-256 hashes, is in `manifests/audits/media-audit.json`._');
  lines.push('');
  return lines.join('\n');
}

await main();
