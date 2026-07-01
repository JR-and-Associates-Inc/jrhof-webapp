import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const bucket = 'jrhof-media-public';
const remotePrefix = 'events/golf/2024/umpires-cup-ii';
const galleryRoot = path.join(root, 'public/gallery/events/golf/2024');
const galleryDataPath = path.join(root, 'src/data/galleries/golf-2024.json');
const manifestPath = path.join(root, 'manifests/r2/golf-2024.json');
const contentType = 'image/webp';
const cacheControl = 'public, max-age=31536000, immutable';
const expectedPerVariant = 158;

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? '' : process.argv[index + 1] || '';
}

async function sha256File(filename) {
  const bytes = await fs.readFile(filename);
  return createHash('sha256').update(bytes).digest('hex');
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

async function buildManifest() {
  const galleryImages = JSON.parse(await fs.readFile(galleryDataPath, 'utf8'));
  if (galleryImages.length !== expectedPerVariant) {
    throw new Error(`Expected ${expectedPerVariant} gallery records, received ${galleryImages.length}`);
  }

  const objects = [];
  for (const variant of ['web', 'thumbs']) {
    const directory = path.join(galleryRoot, variant);
    const filenames = (await fs.readdir(directory))
      .filter((filename) => filename.endsWith('.webp'))
      .sort();

    if (filenames.length !== expectedPerVariant) {
      throw new Error(`Expected ${expectedPerVariant} ${variant} images, received ${filenames.length}`);
    }

    for (const [index, filename] of filenames.entries()) {
      const image = galleryImages[index];
      const expectedPath = variant === 'web' ? image.src : image.thumbnail;
      if (path.posix.basename(expectedPath) !== filename) {
        throw new Error(`Gallery record ${index + 1} does not match ${variant}/${filename}`);
      }

      const localPath = path.posix.join('public/gallery/events/golf/2024', variant, filename);
      const absolutePath = path.join(root, localPath);
      const stats = await fs.stat(absolutePath);
      objects.push({
        localPath,
        key: path.posix.join(remotePrefix, variant, filename),
        variant,
        bytes: stats.size,
        sha256: await sha256File(absolutePath),
        width: variant === 'web' ? image.width : image.thumbnailWidth,
        height: variant === 'web' ? image.height : image.thumbnailHeight,
        contentType,
        cacheControl,
      });
    }
  }

  return {
    schemaVersion: 1,
    bucket,
    prefix: remotePrefix,
    contentType,
    cacheControl,
    counts: {
      web: objects.filter((object) => object.variant === 'web').length,
      thumbs: objects.filter((object) => object.variant === 'thumbs').length,
      total: objects.length,
    },
    totalBytes: objects.reduce((sum, object) => sum + object.bytes, 0),
    objects,
  };
}

async function writeManifest() {
  const manifest = await buildManifest();
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${manifest.counts.total} objects to ${path.relative(root, manifestPath)}.`);
}

async function readManifest() {
  return JSON.parse(await fs.readFile(manifestPath, 'utf8'));
}

async function verifyLocal() {
  const manifest = await readManifest();
  if (manifest.bucket !== bucket || manifest.prefix !== remotePrefix) {
    throw new Error('Manifest bucket or prefix does not match the approved 2024 gallery target.');
  }
  if (manifest.counts.web !== expectedPerVariant || manifest.counts.thumbs !== expectedPerVariant || manifest.counts.total !== expectedPerVariant * 2) {
    throw new Error('Manifest object counts are incorrect.');
  }

  await mapWithConcurrency(manifest.objects, 12, async (object) => {
    const absolutePath = path.join(root, object.localPath);
    const stats = await fs.stat(absolutePath);
    if (stats.size !== object.bytes) throw new Error(`Byte count mismatch: ${object.localPath}`);
    if (await sha256File(absolutePath) !== object.sha256) throw new Error(`SHA-256 mismatch: ${object.localPath}`);
    if (object.contentType !== contentType || object.cacheControl !== cacheControl) {
      throw new Error(`HTTP metadata mismatch: ${object.localPath}`);
    }
  });

  console.log(`Verified ${manifest.counts.total} local objects (${manifest.totalBytes} bytes) against SHA-256 manifest.`);
  return manifest;
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
  if (!process.argv.includes('--apply')) {
    throw new Error('Remote upload requires the explicit --apply flag.');
  }
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Set CLOUDFLARE_ACCOUNT_ID for the approved JR and Associates account.');
  }

  const manifest = await verifyLocal();
  let completed = 0;
  await mapWithConcurrency(manifest.objects, 6, async (object, index) => {
    await runWrangler([
      'r2', 'object', 'put', `${manifest.bucket}/${object.key}`,
      '--file', object.localPath,
      '--content-type', object.contentType,
      '--cache-control', object.cacheControl,
      '--remote',
    ], `/tmp/jrhof-r2-upload-${index}.log`);
    completed += 1;
    if (completed % 20 === 0 || completed === manifest.objects.length) {
      console.log(`Uploaded ${completed}/${manifest.objects.length} objects.`);
    }
  });
}

async function verifyRemote() {
  const originValue = argumentValue('--origin') || process.env.PUBLIC_MEDIA_BASE_URL || '';
  const origin = new URL(originValue);
  if (origin.protocol !== 'https:' || origin.pathname !== '/') {
    throw new Error('The verification origin must be an HTTPS origin with no path.');
  }

  const manifest = await verifyLocal();
  let completed = 0;
  await mapWithConcurrency(manifest.objects, 12, async (object) => {
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
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (sha256 !== object.sha256) throw new Error(`SHA-256 mismatch for ${url}`);
    completed += 1;
    if (completed % 40 === 0 || completed === manifest.objects.length) {
      console.log(`Verified ${completed}/${manifest.objects.length} remote objects.`);
    }
  });
}

const command = process.argv[2];
if (command === 'manifest') await writeManifest();
else if (command === 'verify-local') await verifyLocal();
else if (command === 'upload') await uploadRemote();
else if (command === 'verify-remote') await verifyRemote();
else throw new Error('Usage: r2-gallery-2024.mjs <manifest|verify-local|upload --apply|verify-remote --origin https://...>');
