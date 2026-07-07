#!/usr/bin/env node
// Inductee portrait optimizer — deterministic WebP derivative generation.
//
// Generates two EXIF-stripped WebP variants for every VERIFIED inductee portrait
// plus the shared missing-portrait placeholder, into the gitignored
// `.local-media/` workspace, and writes the committed metadata-only manifest
// `manifests/r2/inductee-portraits-v1.json`.
//
//   profile.webp  — biography portrait, Open Graph image, Person.image schema
//   card.webp     — archive / homepage / banquet cards
//
// This script does NOT upload to R2 and does NOT rewrite any live `portrait_url`.
// Flipping the site to `media.jrhof.org` is a separate, approval-gated cutover
// (see docs/INDUCTEE_MEDIA_R2_MIGRATION.md) that must happen only after these
// objects are uploaded and checksum-verified through the custom domain. Pending
// / board-review-blocked records are deliberately excluded — no object key is
// minted for an unverified identity.
//
// Sources are read from the controlled originals (`portrait_source`, i.e.
// `content/Photos/*`) when present, falling back to the tracked web JPEG.
// Metadata (EXIF/GPS/XMP) is stripped by sharp's default WebP encoder; `.rotate()`
// bakes orientation first so no pixels are lost.
//
// Usage:
//   node scripts/optimize-inductee-portraits.mjs generate
//   node scripts/optimize-inductee-portraits.mjs verify-local

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = process.cwd();
const dataPath = path.join(root, 'src/data/inductees.json');
const manifestPath = path.join(root, 'manifests/r2/inductee-portraits-v1.json');
const localRoot = '.local-media/inductees';

// Public delivery contract (documented, non-secret). Objects are immutable.
const bucket = 'jrhof-media-public';
const objectVersion = 'v1';
const prefix = `inductees/portraits/${objectVersion}`;
const placeholderPrefix = `inductees/placeholders/${objectVersion}`;
const contentType = 'image/webp';
const cacheControl = 'public, max-age=31536000, immutable';
const mediaBaseUrl = 'https://media.jrhof.org';

// Historical/person photos: keep faces crisp. Portraits are re-encoded, not
// force-cropped — the site uses object-fit: cover, so native aspect is preserved.
const pipeline = {
  profile: { width: 960, quality: 88, effort: 6 },
  card: { width: 400, quality: 82, effort: 6 },
};

const placeholderSourceUrl = '/images/inductees/missing_inductee.webp';

async function sha256File(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

function publicUrlFor(key) {
  return new URL(key, `${mediaBaseUrl}/`).href;
}

async function fileExists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

// Resolve the best available source: controlled original first, then the tracked
// web JPEG that the live site currently serves.
async function resolveSource(record) {
  const candidates = [
    record.source_provenance?.original_portrait,
    record.portrait_source,
    record.portrait_url ? `public${record.portrait_url}` : null,
  ].filter(Boolean);
  for (const candidate of candidates) {
    const absolutePath = path.join(root, candidate);
    if (await fileExists(absolutePath)) return { relPath: candidate, absolutePath };
  }
  return null;
}

async function encodeVariant(absoluteSource, variantConfig, absoluteOutput) {
  await fs.mkdir(path.dirname(absoluteOutput), { recursive: true });
  await sharp(absoluteSource, { failOn: 'error' })
    .rotate() // bake EXIF orientation before metadata is dropped
    .resize({ width: variantConfig.width, withoutEnlargement: true })
    .webp({ quality: variantConfig.quality, effort: variantConfig.effort })
    .toFile(absoluteOutput); // sharp drops EXIF/GPS/XMP by default (no withMetadata)

  const metadata = await sharp(absoluteOutput).metadata();
  if (metadata.format !== 'webp') throw new Error(`Expected WebP output: ${absoluteOutput}`);
  const stats = await fs.stat(absoluteOutput);
  return {
    width: metadata.width,
    height: metadata.height,
    bytes: stats.size,
    sha256: await sha256File(absoluteOutput),
  };
}

async function generate() {
  const records = JSON.parse(await fs.readFile(dataPath, 'utf8'));
  const verified = records
    .filter((record) => record.portrait_status === 'verified_candidate')
    .sort((a, b) => a.canonical_slug.localeCompare(b.canonical_slug));

  const manifestRecords = [];
  const missingSources = [];
  let generatedBytes = 0;

  for (const record of verified) {
    const source = await resolveSource(record);
    if (!source) {
      missingSources.push({ slug: record.canonical_slug, portraitUrl: record.portrait_url });
      continue;
    }
    const sourceSha256 = await sha256File(source.absolutePath);
    const variants = {};
    for (const [name, config] of Object.entries(pipeline)) {
      const key = `${prefix}/${record.canonical_slug}/${name}.webp`;
      const localPath = `${localRoot}/portraits/${objectVersion}/${record.canonical_slug}/${name}.webp`;
      const result = await encodeVariant(source.absolutePath, config, path.join(root, localPath));
      generatedBytes += result.bytes;
      variants[name] = {
        localPath,
        key,
        publicUrl: publicUrlFor(key),
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        sha256: result.sha256,
        contentType,
        cacheControl,
      };
    }
    manifestRecords.push({
      stableId: record.stable_id,
      slug: record.canonical_slug,
      displayName: record.display_name,
      inductionYear: record.induction_year,
      portraitStatus: record.portrait_status,
      livePortraitUrl: record.portrait_url,
      source: { path: source.relPath, sha256: sourceSha256 },
      variants,
    });
  }

  // Shared placeholder is generated once as its own object.
  const placeholderSourceAbsolute = path.join(root, 'public', placeholderSourceUrl);
  const placeholderKey = `${placeholderPrefix}/missing-inductee.webp`;
  const placeholderLocalPath = `${localRoot}/placeholders/${objectVersion}/missing-inductee.webp`;
  const placeholderResult = await encodeVariant(
    placeholderSourceAbsolute,
    pipeline.card,
    path.join(root, placeholderLocalPath),
  );
  generatedBytes += placeholderResult.bytes;
  const placeholder = {
    sourceUrl: placeholderSourceUrl,
    localPath: placeholderLocalPath,
    key: placeholderKey,
    publicUrl: publicUrlFor(placeholderKey),
    width: placeholderResult.width,
    height: placeholderResult.height,
    bytes: placeholderResult.bytes,
    sha256: placeholderResult.sha256,
    contentType,
    cacheControl,
  };

  const pendingRecords = records
    .filter((record) => record.portrait_status !== 'verified_candidate')
    .map((record) => ({
      stableId: record.stable_id,
      slug: record.canonical_slug,
      displayName: record.display_name,
      portraitStatus: record.portrait_status,
      boardReviewRequired: record.board_review_required,
      note: 'Excluded from v1: no object key minted until identity/provenance is approved.',
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const manifest = {
    schemaVersion: 1,
    note: 'Metadata-only R2 delivery manifest. Generated binaries live in gitignored .local-media/. This manifest does NOT authorize a live URL cutover; see docs/INDUCTEE_MEDIA_R2_MIGRATION.md.',
    generator: 'scripts/optimize-inductee-portraits.mjs',
    bucket,
    prefix,
    mediaBaseUrl,
    contentType,
    cacheControl,
    pipeline,
    counts: {
      verifiedRecords: verified.length,
      generatedRecords: manifestRecords.length,
      missingSources: missingSources.length,
      pendingRecords: pendingRecords.length,
      objectsPlanned: manifestRecords.length * Object.keys(pipeline).length + 1,
    },
    generatedBytes,
    placeholder,
    records: manifestRecords,
    missingSources,
    pendingRecords,
  };

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ ...manifest.counts, generatedBytes }, null, 2));
  if (missingSources.length) {
    console.warn(`WARNING: ${missingSources.length} verified records had no readable source.`);
  }
}

// Re-hash local derivatives against the committed manifest. Note: WebP bytes are
// libvips-build dependent; a hash mismatch on a different sharp build is expected
// and does not by itself indicate corruption — regenerate to refresh the manifest.
async function verifyLocal() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const objects = [
    manifest.placeholder,
    ...manifest.records.flatMap((record) => Object.values(record.variants)),
  ];
  let checked = 0;
  let mismatches = 0;
  for (const object of objects) {
    const absolutePath = path.join(root, object.localPath);
    if (!(await fileExists(absolutePath))) {
      console.error(`MISSING: ${object.localPath} (run \`generate\` first)`);
      mismatches += 1;
      continue;
    }
    const digest = await sha256File(absolutePath);
    if (digest !== object.sha256) {
      console.error(`SHA-256 mismatch: ${object.localPath}`);
      mismatches += 1;
    }
    checked += 1;
  }
  console.log(JSON.stringify({ checked, mismatches }, null, 2));
  if (mismatches) process.exitCode = 1;
}

const command = process.argv[2];
if (command === 'generate') {
  await generate();
} else if (command === 'verify-local') {
  await verifyLocal();
} else {
  console.error('Usage: node scripts/optimize-inductee-portraits.mjs <generate|verify-local>');
  process.exitCode = 1;
}
