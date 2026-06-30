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
  2025: {
    year: 2025,
    title: 'The Umpire’s Cup III',
    slug: 'umpires-cup-iii',
    sourceDirectory: '2025 Golf Tournament Pictures',
    expectedImages: 244,
  },
  2026: {
    year: 2026,
    title: 'The Umpire’s Cup IV',
    slug: 'umpires-cup-iv',
    sourceDirectory: '2026 Golf Tournament Pictures',
    expectedImages: 176,
  },
};

const derivativeConfig = {
  objectVersion: 'v1',
  web: { width: 2000, quality: 84, effort: 5 },
  thumbnail: { width: 720, quality: 78, effort: 5 },
};

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? '' : process.argv[index + 1] || '';
}

function selectedConfig() {
  const year = Number(argumentValue('--year'));
  const config = eventConfigs[year];
  if (!config) throw new Error('Pass --year 2025 or --year 2026.');
  return config;
}

function pathsFor(config) {
  const prefix = `events/golf/${config.year}/${config.slug}/${derivativeConfig.objectVersion}`;
  const generatedRoot = path.join(root, '.local-media/generated', prefix);
  return {
    prefix,
    sourceRoot: path.join(root, config.sourceDirectory),
    generatedRoot,
    webRoot: path.join(generatedRoot, 'web'),
    thumbnailRoot: path.join(generatedRoot, 'thumbs'),
    manifestPath: path.join(root, `manifests/r2/golf-${config.year}.json`),
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
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function sourceFiles(config, paths) {
  const names = (await fs.readdir(paths.sourceRoot))
    .filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()))
    .sort(collator.compare);

  if (names.length !== config.expectedImages) {
    throw new Error(`Expected ${config.expectedImages} ${config.year} source images, received ${names.length}.`);
  }
  return names;
}

async function variantRecord(localPath, key, info) {
  const stats = await fs.stat(localPath);
  const metadata = await sharp(localPath, { failOn: 'error' }).metadata();
  if (metadata.format !== 'webp') throw new Error(`Expected WebP output: ${localPath}`);
  if (metadata.exif || metadata.xmp || metadata.iptc) {
    throw new Error(`Generated derivative retained metadata: ${localPath}`);
  }

  return {
    localPath: path.relative(root, localPath).split(path.sep).join('/'),
    key,
    bytes: stats.size,
    sha256: await sha256File(localPath),
    width: info.width,
    height: info.height,
    contentType,
    cacheControl,
  };
}

async function generate() {
  const config = selectedConfig();
  const paths = pathsFor(config);
  const names = await sourceFiles(config, paths);
  await Promise.all([
    fs.mkdir(paths.webRoot, { recursive: true }),
    fs.mkdir(paths.thumbnailRoot, { recursive: true }),
    fs.mkdir(path.dirname(paths.manifestPath), { recursive: true }),
  ]);

  let completed = 0;
  const images = await mapWithConcurrency(names, 4, async (sourceFilename, index) => {
    const sequence = String(index + 1).padStart(3, '0');
    const outputFilename = `${config.year}-${config.slug}-${sequence}.webp`;
    const sourcePath = path.join(paths.sourceRoot, sourceFilename);
    const webPath = path.join(paths.webRoot, outputFilename);
    const thumbnailPath = path.join(paths.thumbnailRoot, outputFilename);
    const [sourceMetadata, sourceStats, sourceSha256] = await Promise.all([
      sharp(sourcePath, { failOn: 'error' }).metadata(),
      fs.stat(sourcePath),
      sha256File(sourcePath),
    ]);

    const [webInfo, thumbnailInfo] = await Promise.all([
      sharp(sourcePath, { failOn: 'error' })
        .rotate()
        .resize({ width: derivativeConfig.web.width, withoutEnlargement: true })
        .webp({
          quality: derivativeConfig.web.quality,
          effort: derivativeConfig.web.effort,
          smartSubsample: true,
        })
        .toFile(webPath),
      sharp(sourcePath, { failOn: 'error' })
        .rotate()
        .resize({ width: derivativeConfig.thumbnail.width, withoutEnlargement: true })
        .webp({
          quality: derivativeConfig.thumbnail.quality,
          effort: derivativeConfig.thumbnail.effort,
          smartSubsample: true,
        })
        .toFile(thumbnailPath),
    ]);

    const rotated = sourceMetadata.orientation && sourceMetadata.orientation >= 5;
    const sourceWidth = rotated ? sourceMetadata.height : sourceMetadata.width;
    const sourceHeight = rotated ? sourceMetadata.width : sourceMetadata.height;
    const [web, thumbnail] = await Promise.all([
      variantRecord(webPath, `${paths.prefix}/web/${outputFilename}`, webInfo),
      variantRecord(thumbnailPath, `${paths.prefix}/thumbs/${outputFilename}`, thumbnailInfo),
    ]);

    completed += 1;
    if (completed % 20 === 0 || completed === names.length) {
      console.log(`Generated ${completed}/${names.length} ${config.year} images.`);
    }

    return {
      index: index + 1,
      source: {
        filename: sourceFilename,
        bytes: sourceStats.size,
        sha256: sourceSha256,
        width: sourceWidth,
        height: sourceHeight,
      },
      alt: `${config.title} golf tournament, ${config.year} — photo ${index + 1}`,
      caption: `${config.title} · ${config.year}`,
      variants: { web, thumbnail },
    };
  });

  const sourceHashes = Object.groupBy(images, (image) => image.source.sha256);
  const exactDuplicateGroups = Object.values(sourceHashes)
    .filter((group) => group.length > 1)
    .map((group) => group.map((image) => image.source.filename));
  const objectRecords = images.flatMap((image) => [image.variants.web, image.variants.thumbnail]);
  const manifest = {
    schemaVersion: 2,
    event: {
      year: config.year,
      title: config.title,
      slug: config.slug,
    },
    bucket,
    prefix: paths.prefix,
    contentType,
    cacheControl,
    pipeline: derivativeConfig,
    counts: {
      images: images.length,
      web: images.length,
      thumbnails: images.length,
      objects: objectRecords.length,
    },
    sourceBytes: images.reduce((sum, image) => sum + image.source.bytes, 0),
    generatedBytes: objectRecords.reduce((sum, object) => sum + object.bytes, 0),
    exactDuplicateGroups,
    images,
  };

  await fs.writeFile(paths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, paths.manifestPath)} with ${manifest.counts.objects} objects.`);
}

async function readManifest(config) {
  const paths = pathsFor(config);
  return {
    paths,
    manifest: JSON.parse(await fs.readFile(paths.manifestPath, 'utf8')),
  };
}

function objectRecords(manifest) {
  return manifest.images.flatMap((image) => [image.variants.web, image.variants.thumbnail]);
}

async function verifyLocal() {
  const config = selectedConfig();
  const { paths, manifest } = await readManifest(config);
  if (manifest.bucket !== bucket || manifest.prefix !== paths.prefix) {
    throw new Error('Manifest bucket or versioned prefix does not match the approved target.');
  }
  if (manifest.counts.images !== config.expectedImages || manifest.counts.objects !== config.expectedImages * 2) {
    throw new Error('Manifest counts do not match the approved source set.');
  }

  const objects = objectRecords(manifest);
  await mapWithConcurrency(objects, 12, async (object) => {
    const absolutePath = path.join(root, object.localPath);
    const stats = await fs.stat(absolutePath);
    if (stats.size !== object.bytes) throw new Error(`Byte count mismatch: ${object.localPath}`);
    if (await sha256File(absolutePath) !== object.sha256) throw new Error(`SHA-256 mismatch: ${object.localPath}`);
    const metadata = await sharp(absolutePath, { failOn: 'error' }).metadata();
    if (metadata.format !== 'webp' || metadata.width !== object.width || metadata.height !== object.height) {
      throw new Error(`Image metadata mismatch: ${object.localPath}`);
    }
    if (object.contentType !== contentType || object.cacheControl !== cacheControl) {
      throw new Error(`HTTP metadata mismatch: ${object.localPath}`);
    }
  });

  const totalBytes = objects.reduce((sum, object) => sum + object.bytes, 0);
  if (totalBytes !== manifest.generatedBytes) throw new Error('Generated byte total does not match the manifest.');
  console.log(`Verified ${objects.length} local ${config.year} objects (${totalBytes} bytes).`);
  return { config, manifest, objects };
}

function runWrangler(args, logPath) {
  return new Promise((resolve, reject) => {
    const command = path.join(root, 'node_modules/.bin/wrangler');
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, WRANGLER_LOG_PATH: logPath },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(output || `Wrangler exited with code ${code}`));
    });
  });
}

async function uploadRemote() {
  if (!process.argv.includes('--apply')) throw new Error('Remote upload requires the explicit --apply flag.');
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Set CLOUDFLARE_ACCOUNT_ID for the approved JR and Associates account.');
  }

  const { config, manifest, objects } = await verifyLocal();
  let completed = 0;
  await mapWithConcurrency(objects, 8, async (object, index) => {
    await runWrangler([
      'r2', 'object', 'put', `${manifest.bucket}/${object.key}`,
      '--file', object.localPath,
      '--content-type', object.contentType,
      '--cache-control', object.cacheControl,
      '--remote',
    ], `/tmp/jrhof-r2-${config.year}-upload-${index}.log`);
    completed += 1;
    if (completed % 40 === 0 || completed === objects.length) {
      console.log(`Uploaded ${completed}/${objects.length} ${config.year} objects.`);
    }
  });
}

async function verifyRemote() {
  const originValue = argumentValue('--origin');
  const origin = new URL(originValue);
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('The verification origin must be an HTTPS origin with no path, query, or fragment.');
  }

  const { config, objects } = await verifyLocal();
  let completed = 0;
  await mapWithConcurrency(objects, 16, async (object) => {
    const url = new URL(`/${object.key}`, origin);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} for ${url}`);
    if (response.headers.get('content-type')?.split(';')[0] !== object.contentType) {
      throw new Error(`Content-Type mismatch for ${url}`);
    }
    if (response.headers.get('cache-control') !== object.cacheControl) {
      throw new Error(`Cache-Control mismatch for ${url}: ${response.headers.get('cache-control')}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength !== object.bytes) throw new Error(`Byte count mismatch for ${url}`);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== object.sha256) throw new Error(`SHA-256 mismatch for ${url}`);
    completed += 1;
    if (completed % 50 === 0 || completed === objects.length) {
      console.log(`Verified ${completed}/${objects.length} ${config.year} remote objects.`);
    }
  });
}

const command = process.argv[2];
if (command === 'generate') await generate();
else if (command === 'verify-local') await verifyLocal();
else if (command === 'upload') await uploadRemote();
else if (command === 'verify-remote') await verifyRemote();
else {
  throw new Error('Usage: gallery-media.mjs <generate|verify-local|upload --apply|verify-remote --origin https://...> --year <2025|2026>');
}
