import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = process.cwd();
const dataPath = path.join(root, 'src/data/inductees.json');
const outputPath = path.join(root, 'manifests/audits/inductee-media.json');
const placeholderUrl = '/images/inductees/missing_inductee.webp';

async function sha256File(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

const trackedResult = spawnSync('git', ['ls-files', 'public/images/inductees'], {
  cwd: root,
  encoding: 'utf8',
});
if (trackedResult.status !== 0) throw new Error(trackedResult.stderr || 'Unable to list tracked inductee media.');

const trackedPaths = trackedResult.stdout.trim().split('\n').filter(Boolean).sort();
const records = JSON.parse(await fs.readFile(dataPath, 'utf8'));
const referencesByUrl = Object.groupBy(records, (record) => (
  record.portrait_status === 'pending_review' ? placeholderUrl : record.portrait_url
));

const files = [];
for (const trackedPath of trackedPaths) {
  const absolutePath = path.join(root, trackedPath);
  const stats = await fs.stat(absolutePath);
  const metadata = await sharp(absolutePath, { failOn: 'error' }).metadata();
  const publicUrl = `/${trackedPath.replace(/^public\//, '')}`;
  const recordReferences = (referencesByUrl[publicUrl] || []).map((record) => ({
    stableId: record.stable_id,
    slug: record.canonical_slug,
    displayName: record.display_name,
    inductionYear: record.induction_year,
    portraitStatus: record.portrait_status,
    boardReviewRequired: record.board_review_required,
  }));

  files.push({
    trackedPath,
    publicUrl,
    format: metadata.format,
    bytes: stats.size,
    sha256: await sha256File(absolutePath),
    width: metadata.width,
    height: metadata.height,
    recordReferences,
    proposedR2Key: publicUrl === placeholderUrl
      ? 'inductees/placeholders/v1/missing-inductee.webp'
      : recordReferences.length === 1
        ? `inductees/portraits/v1/${recordReferences[0].slug}/portrait.webp`
        : null,
  });
}

const trackedUrls = new Set(files.map((file) => file.publicUrl));
const referencedUrls = Object.keys(referencesByUrl).filter(Boolean).sort();
const brokenReferences = referencedUrls
  .filter((url) => !trackedUrls.has(url))
  .map((url) => ({
    publicUrl: url,
    records: referencesByUrl[url].map((record) => ({
      stableId: record.stable_id,
      slug: record.canonical_slug,
      displayName: record.display_name,
      portraitStatus: record.portrait_status,
    })),
  }));
const unreferencedTrackedFiles = files
  .filter((file) => file.recordReferences.length === 0)
  .map((file) => file.trackedPath);
const pendingPortraitRecords = records
  .filter((record) => record.portrait_status === 'pending_review')
  .map((record) => ({
    stableId: record.stable_id,
    slug: record.canonical_slug,
    displayName: record.display_name,
    inductionYear: record.induction_year,
    portraitUrl: record.portrait_url,
    boardReviewRequired: record.board_review_required,
    reviewerNotes: record.reviewer_notes,
  }));
const duplicateHashes = Object.values(Object.groupBy(files, (file) => file.sha256))
  .filter((group) => group.length > 1)
  .map((group) => group.map((file) => file.trackedPath));

const audit = {
  schemaVersion: 1,
  sourceData: 'src/data/inductees.json',
  trackedDirectory: 'public/images/inductees',
  placeholderUrl,
  consumers: [
    'src/pages/inductees/[slug].astro: biography portrait, Open Graph image, and Person schema',
    'src/pages/inductees/index.astro: archive cards and missing-portrait placeholder',
    'src/pages/index.astro: current class portraits',
    'src/pages/events/induction-banquet/index.astro: banquet inductee cards',
  ],
  counts: {
    inducteeRecords: records.length,
    trackedFiles: files.length,
    verifiedPortraitRecords: records.filter((record) => record.portrait_status === 'verified_candidate').length,
    pendingPortraitRecords: pendingPortraitRecords.length,
    uniqueReferencedUrls: referencedUrls.length,
    brokenReferences: brokenReferences.length,
    unreferencedTrackedFiles: unreferencedTrackedFiles.length,
    duplicateHashGroups: duplicateHashes.length,
  },
  files,
  pendingPortraitRecords,
  brokenReferences,
  unreferencedTrackedFiles,
  duplicateHashes,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify(audit.counts, null, 2));
