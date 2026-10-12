// One representative photograph per published gallery, for event cards and
// program tiles. `pick` is the gallery photo number (1-based) chosen as the
// cover (people over signage where possible); it falls back to the first
// landscape photo.
import banquet2026 from '../../../manifests/r2/banquet-2026.json';
import golf2024 from '../../../manifests/r2/golf-2024.json';
import golf2025 from '../../../manifests/r2/golf-2025.json';
import golf2026 from '../../../manifests/r2/golf-2026.json';
import type { EventRecord } from '../events';
import { galleryImagesFromR2Manifest, type GalleryImage, type R2GalleryManifest } from './r2';

const manifests: Record<string, { manifest: R2GalleryManifest; pick: number }> = {
  'banquet-2026': { manifest: banquet2026 as R2GalleryManifest, pick: 36 },
  'golf-2024': { manifest: golf2024 as R2GalleryManifest, pick: 1 },
  'golf-2025': { manifest: golf2025 as R2GalleryManifest, pick: 18 },
  'golf-2026': { manifest: golf2026 as R2GalleryManifest, pick: 48 },
};

const cache = new Map<string, GalleryImage | undefined>();
const imageCache = new Map<string, GalleryImage[]>();
const imagesFor = (key: string) => {
  if (!imageCache.has(key)) imageCache.set(key, galleryImagesFromR2Manifest(manifests[key].manifest));
  return imageCache.get(key) ?? [];
};

/** The cover photograph for an event's published gallery, if it has one. */
export function galleryCover(event: EventRecord): GalleryImage | undefined {
  const key = event.gallery?.status === 'published' ? event.gallery.manifest : undefined;
  if (!key || !manifests[key]) return undefined;
  if (!cache.has(key)) {
    const { pick } = manifests[key];
    const images = imagesFor(key);
    const chosen = images[pick - 1];
    const landscape = (image?: GalleryImage) => image && image.width > image.height;
    cache.set(key, landscape(chosen) ? chosen : images.find((image) => landscape(image)) ?? images[0]);
  }
  return cache.get(key);
}

/** A specific photograph (1-based gallery number) from an event's published gallery. */
export function galleryPhoto(event: EventRecord, number: number): GalleryImage | undefined {
  const key = event.gallery?.status === 'published' ? event.gallery.manifest : undefined;
  if (!key || !manifests[key]) return undefined;
  return imagesFor(key)[number - 1];
}
