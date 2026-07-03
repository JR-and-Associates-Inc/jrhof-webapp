import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = process.cwd();
const bucket = 'jrhof-media-public';
const contentType = 'image/webp';
const cacheControl = 'public, max-age=31536000, immutable';
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff']);
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const eventConfigs = {
  'banquet-2026': {
    id: 'banquet-2026',
    year: 2026,
    eventType: 'induction-banquet',
    title: '2026 Hall of Fame Induction Banquet',
    slug: '2026-hall-of-fame-induction-banquet',
    sourceDirectory: '2026_CHSBUA_HOF_Induction_Banquet',
    expectedImages: 139,
    galleryDirectory: 'gallery',
  },
};

const derivativeConfig = {
  web: { longEdge: 2000, quality: 84, effort: 5 },
  thumbnail: { longEdge: 640, quality: 78, effort: 5 },
  hero: { longEdge: 2400, quality: 86, effort: 5 },
};

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? '' : process.argv[index + 1] || '';
}

function selectedConfig() {
  const id = argumentValue('--event') || 'banquet-2026';
  const config = eventConfigs[id];
  if (!config) throw new Error(`Unknown event ${id}. Available events: ${Object.keys(eventConfigs).join(', ')}`);
  return config;
}

function pathsFor(config) {
  const prefix = `events/${config.eventType}/${config.slug}`;
  const generatedRoot = path.join(root, '.local-media/generated', prefix);
  return {
    prefix,
    sourceRoot: path.join(root, config.sourceDirectory),
    generatedRoot,
    galleryRoot: path.join(generatedRoot, config.galleryDirectory),
    thumbnailRoot: path.join(generatedRoot, 'thumbs'),
    heroPath: path.join(generatedRoot, 'hero.webp'),
    manifestPath: path.join(root, `manifests/r2/${config.id}.json`),
  };
}

async function sha256File(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await callback(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function sourceFiles(config, paths) {
  const entries = await fs.readdir(paths.sourceRoot, { withFileTypes: true });
  const names = entries
    .filter((entry) => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort(collator.compare);
  if (names.length !== config.expectedImages) {
    throw new Error(`Expected ${config.expectedImages} root-level source images, received ${names.length}. Nested archival originals are intentionally excluded.`);
  }
  return names;
}

async function variantRecord(localPath, key) {
  const [stats, metadata, sha256] = await Promise.all([
    fs.stat(localPath),
    sharp(localPath, { failOn: 'error' }).metadata(),
    sha256File(localPath),
  ]);
  if (metadata.format !== 'webp') throw new Error(`Expected WebP output: ${localPath}`);
  if (metadata.exif || metadata.xmp || metadata.iptc) throw new Error(`Generated derivative retained source metadata: ${localPath}`);
  return {
    localPath: path.relative(root, localPath).split(path.sep).join('/'),
    key,
    bytes: stats.size,
    sha256,
    width: metadata.width,
    height: metadata.height,
    contentType,
    cacheControl,
  };
}

function imagePipeline(sourcePath, longEdge, quality, effort) {
  return sharp(sourcePath, { failOn: 'error' })
    .rotate()
    .resize({ width: longEdge, height: longEdge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort, smartSubsample: true });
}

async function processEvent() {
  const config = selectedConfig();
  const paths = pathsFor(config);
  const names = await sourceFiles(config, paths);
  await fs.rm(paths.generatedRoot, { recursive: true, force: true });
  await Promise.all([
    fs.mkdir(paths.galleryRoot, { recursive: true }),
    fs.mkdir(paths.thumbnailRoot, { recursive: true }),
    fs.mkdir(path.dirname(paths.manifestPath), { recursive: true }),
  ]);

  let completed = 0;
  const images = await mapWithConcurrency(names, 4, async (sourceFilename, index) => {
    const sequence = String(index + 1).padStart(3, '0');
    const outputFilename = `${config.slug}-${sequence}.webp`;
    const sourcePath = path.join(paths.sourceRoot, sourceFilename);
    const galleryPath = path.join(paths.galleryRoot, outputFilename);
    const thumbnailPath = path.join(paths.thumbnailRoot, outputFilename);
    const [sourceMetadata, sourceStats, sourceSha256] = await Promise.all([
      sharp(sourcePath, { failOn: 'error' }).metadata(),
      fs.stat(sourcePath),
      sha256File(sourcePath),
    ]);

    await Promise.all([
      imagePipeline(sourcePath, derivativeConfig.web.longEdge, derivativeConfig.web.quality, derivativeConfig.web.effort).toFile(galleryPath),
      imagePipeline(sourcePath, derivativeConfig.thumbnail.longEdge, derivativeConfig.thumbnail.quality, derivativeConfig.thumbnail.effort).toFile(thumbnailPath),
    ]);

    const rotated = sourceMetadata.orientation && sourceMetadata.orientation >= 5;
    const [web, thumbnail] = await Promise.all([
      variantRecord(galleryPath, `${paths.prefix}/${config.galleryDirectory}/${outputFilename}`),
      variantRecord(thumbnailPath, `${paths.prefix}/thumbs/${outputFilename}`),
    ]);

    completed += 1;
    if (completed % 20 === 0 || completed === names.length) console.log(`Processed ${completed}/${names.length} images.`);
    return {
      index: index + 1,
      source: {
        filename: sourceFilename,
        bytes: sourceStats.size,
        sha256: sourceSha256,
        width: rotated ? sourceMetadata.height : sourceMetadata.width,
        height: rotated ? sourceMetadata.width : sourceMetadata.height,
      },
      alt: `${config.title} — photo ${index + 1}`,
      caption: `${config.title} · photo ${index + 1}`,
      variants: { web, thumbnail },
    };
  });

  const heroSource = path.join(paths.sourceRoot, names[0]);
  await imagePipeline(heroSource, derivativeConfig.hero.longEdge, derivativeConfig.hero.quality, derivativeConfig.hero.effort).toFile(paths.heroPath);
  const hero = await variantRecord(paths.heroPath, `${paths.prefix}/hero.webp`);
  const sourceGroups = Object.groupBy(images, (image) => image.source.sha256);
  const exactDuplicateGroups = Object.values(sourceGroups)
    .filter((group) => group.length > 1)
    .map((group) => group.map((image) => image.source.filename));
  const objects = [hero, ...images.flatMap((image) => [image.variants.web, image.variants.thumbnail])];
  const manifest = {
    schemaVersion: 3,
    event: { id: config.id, eventType: config.eventType, year: config.year, title: config.title, slug: config.slug },
    bucket,
    prefix: paths.prefix,
    contentType,
    cacheControl,
    metadataPolicy: 'Source EXIF, GPS, IPTC, and XMP are stripped from public derivatives. Attribution belongs in event data after confirmation.',
    pipeline: derivativeConfig,
    counts: { images: images.length, gallery: images.length, thumbnails: images.length, hero: 1, objects: objects.length },
    sourceBytes: images.reduce((sum, image) => sum + image.source.bytes, 0),
    generatedBytes: objects.reduce((sum, object) => sum + object.bytes, 0),
    exactDuplicateGroups,
    hero,
    images,
  };
  await fs.writeFile(paths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, paths.manifestPath)} with ${objects.length} upload-ready objects.`);
}

async function readManifest(config) {
  const paths = pathsFor(config);
  return { paths, manifest: JSON.parse(await fs.readFile(paths.manifestPath, 'utf8')) };
}

function objectRecords(manifest) {
  return [manifest.hero, ...manifest.images.flatMap((image) => [image.variants.web, image.variants.thumbnail])];
}

async function validateLocal() {
  const config = selectedConfig();
  const { paths, manifest } = await readManifest(config);
  if (manifest.bucket !== bucket || manifest.prefix !== paths.prefix) throw new Error('Manifest bucket or prefix does not match the approved target.');
  if (manifest.counts.images !== config.expectedImages || manifest.counts.objects !== config.expectedImages * 2 + 1) throw new Error('Manifest counts do not match the approved source selection.');
  const objects = objectRecords(manifest);
  await mapWithConcurrency(objects, 12, async (object) => {
    const absolutePath = path.join(root, object.localPath);
    const [stats, sha256, metadata] = await Promise.all([fs.stat(absolutePath), sha256File(absolutePath), sharp(absolutePath, { failOn: 'error' }).metadata()]);
    if (stats.size !== object.bytes || sha256 !== object.sha256) throw new Error(`Checksum mismatch: ${object.localPath}`);
    if (metadata.format !== 'webp' || metadata.width !== object.width || metadata.height !== object.height) throw new Error(`Image metadata mismatch: ${object.localPath}`);
    if (metadata.exif || metadata.xmp || metadata.iptc) throw new Error(`Public derivative retained source metadata: ${object.localPath}`);
  });
  const totalBytes = objects.reduce((sum, object) => sum + object.bytes, 0);
  if (totalBytes !== manifest.generatedBytes) throw new Error('Generated byte total does not match the manifest.');
  console.log(`Validated ${objects.length} local objects (${totalBytes} bytes).`);
  return { config, manifest, objects };
}

function runWrangler(args, logPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(path.join(root, 'node_modules/.bin/wrangler'), args, {
      cwd: root,
      env: { ...process.env, WRANGLER_LOG_PATH: logPath },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(output) : reject(new Error(output || `Wrangler exited with code ${code}`)));
  });
}

async function uploadRemote() {
  if (!process.argv.includes('--apply')) throw new Error('Remote upload requires --apply.');
  const { config, manifest, objects } = await validateLocal();
  let completed = 0;
  await mapWithConcurrency(objects, 8, async (object, index) => {
    await runWrangler([
      'r2', 'object', 'put', `${manifest.bucket}/${object.key}`,
      '--file', object.localPath,
      '--content-type', object.contentType,
      '--cache-control', object.cacheControl,
      '--remote',
    ], `/tmp/jrhof-${config.id}-upload-${index}.log`);
    completed += 1;
    if (completed % 40 === 0 || completed === objects.length) console.log(`Uploaded ${completed}/${objects.length} objects.`);
  });
}

async function validateRemote() {
  const origin = new URL(argumentValue('--origin') || 'https://media.jrhof.org');
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Verification origin must be an HTTPS origin.');
  const { objects } = await validateLocal();
  let completed = 0;
  await mapWithConcurrency(objects, 16, async (object) => {
    const url = new URL(`/${object.key}`, origin);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} for ${url}`);
    if (response.headers.get('content-type')?.split(';')[0] !== object.contentType) throw new Error(`Content-Type mismatch for ${url}`);
    if (response.headers.get('cache-control') !== object.cacheControl) throw new Error(`Cache-Control mismatch for ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength !== object.bytes || createHash('sha256').update(bytes).digest('hex') !== object.sha256) throw new Error(`Remote checksum mismatch for ${url}`);
    completed += 1;
    if (completed % 50 === 0 || completed === objects.length) console.log(`Validated ${completed}/${objects.length} remote objects.`);
  });
}

const command = process.argv[2];
if (command === 'process') await processEvent();
else if (command === 'validate') await validateLocal();
else if (command === 'upload') await uploadRemote();
else if (command === 'validate-remote') await validateRemote();
else throw new Error('Usage: event-media.mjs <process|validate|upload --apply|validate-remote> [--event banquet-2026] [--origin https://media.jrhof.org]');
