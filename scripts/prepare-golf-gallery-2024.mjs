import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceDir = path.join(root, '2024 Golf Tournament Pictures');
const webDir = path.join(root, 'public/gallery/events/golf/2024/web');
const thumbDir = path.join(root, 'public/gallery/events/golf/2024/thumbs');
const manifestPath = path.join(root, 'src/data/galleries/golf-2024.json');
const auditOnly = process.argv.includes('--audit-only');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff']);
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const sourceNames = (await fs.readdir(sourceDir))
  .filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()))
  .sort(collator.compare);

const sha256 = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const differenceHash = async (filePath) => {
  const { data } = await sharp(filePath, { failOn: 'error' })
    .rotate()
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let hash = 0n;
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      hash = (hash << 1n) | BigInt(data[(row * 9) + column] > data[(row * 9) + column + 1]);
    }
  }
  return hash;
};

const hammingDistance = (left, right) => {
  let value = left ^ right;
  let distance = 0;
  while (value) {
    distance += Number(value & 1n);
    value >>= 1n;
  }
  return distance;
};

const audit = [];
const unreadable = [];
for (const name of sourceNames) {
  const filePath = path.join(sourceDir, name);
  try {
    const [metadata, digest, perceptualHash] = await Promise.all([
      sharp(filePath, { failOn: 'error' }).metadata(),
      sha256(filePath),
      differenceHash(filePath),
    ]);
    const rotated = metadata.orientation && metadata.orientation >= 5;
    audit.push({
      name,
      format: metadata.format,
      width: rotated ? metadata.height : metadata.width,
      height: rotated ? metadata.width : metadata.height,
      digest,
      perceptualHash,
    });
  } catch (error) {
    unreadable.push({ name, error: error instanceof Error ? error.message : String(error) });
  }
}

const exactDuplicateGroups = Object.values(Object.groupBy(audit, (image) => image.digest))
  .filter((group) => group.length > 1)
  .map((group) => group.map((image) => image.name));
const duplicateLookingPairs = [];
for (let left = 0; left < audit.length; left += 1) {
  for (let right = left + 1; right < audit.length; right += 1) {
    const distance = hammingDistance(audit[left].perceptualHash, audit[right].perceptualHash);
    if (distance <= 2) duplicateLookingPairs.push([audit[left].name, audit[right].name, distance]);
  }
}

const dimensionCounts = Object.entries(Object.groupBy(audit, (image) => `${image.width}x${image.height}`))
  .map(([dimensions, images]) => ({ dimensions, count: images.length }))
  .sort((left, right) => right.count - left.count);
const formatCounts = Object.fromEntries(
  Object.entries(Object.groupBy(audit, (image) => image.format))
    .map(([format, images]) => [format, images.length]),
);

console.log(JSON.stringify({
  sourceDirectory: path.relative(root, sourceDir),
  discoveredFiles: sourceNames.length,
  readableImages: audit.length,
  unreadable,
  formats: formatCounts,
  dimensions: dimensionCounts,
  exactDuplicateGroups,
  duplicateLookingPairs,
}, null, 2));

if (unreadable.length > 0) {
  throw new Error('Source audit found unreadable images. No gallery assets were generated.');
}

if (!auditOnly) {
  await Promise.all([
    fs.mkdir(webDir, { recursive: true }),
    fs.mkdir(thumbDir, { recursive: true }),
    fs.mkdir(path.dirname(manifestPath), { recursive: true }),
  ]);

  const manifest = [];
  for (const [index, image] of audit.entries()) {
    const sequence = String(index + 1).padStart(3, '0');
    const filename = `2024-umpires-cup-ii-${sequence}.webp`;
    const sourcePath = path.join(sourceDir, image.name);
    const webPath = path.join(webDir, filename);
    const thumbPath = path.join(thumbDir, filename);

    const [webInfo, thumbInfo] = await Promise.all([
      sharp(sourcePath, { failOn: 'error' })
        .rotate()
        .resize({ width: 1800, withoutEnlargement: true })
        .webp({ quality: 83, effort: 4, smartSubsample: true })
        .toFile(webPath),
      sharp(sourcePath, { failOn: 'error' })
        .rotate()
        .resize({ width: 500, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4, smartSubsample: true })
        .toFile(thumbPath),
    ]);

    manifest.push({
      src: `/gallery/events/golf/2024/web/${filename}`,
      thumbnail: `/gallery/events/golf/2024/thumbs/${filename}`,
      alt: '2024 Umpire’s Cup II golf tournament photo',
      width: webInfo.width,
      height: webInfo.height,
      thumbnailWidth: thumbInfo.width,
      thumbnailHeight: thumbInfo.height,
      event: 'The Umpire’s Cup II',
      eventType: 'Golf Tournament',
      year: 2024,
    });
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  for (const image of manifest) {
    for (const relativePath of [image.src, image.thumbnail]) {
      const metadata = await sharp(path.join(root, 'public', relativePath)).metadata();
      if (metadata.exif || metadata.xmp || metadata.iptc) {
        throw new Error(`Metadata was retained unexpectedly in ${relativePath}`);
      }
    }
  }

  console.log(`Generated ${manifest.length} web images, ${manifest.length} thumbnails, and ${path.relative(root, manifestPath)}.`);
}
