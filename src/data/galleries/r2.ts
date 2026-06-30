import { resolveConfiguredMediaObjectUrl } from '../../config/media';

interface R2Variant {
  key: string;
  width: number;
  height: number;
}

interface R2GalleryImage {
  alt: string;
  caption: string;
  variants: {
    web: R2Variant;
    thumbnail: R2Variant;
  };
}

interface R2GalleryManifest {
  images: R2GalleryImage[];
}

export interface GalleryImage {
  src: string;
  thumbnail: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export function galleryImagesFromR2Manifest(manifest: R2GalleryManifest): GalleryImage[] {
  return manifest.images.flatMap((image) => {
    const src = resolveConfiguredMediaObjectUrl(image.variants.web.key);
    const thumbnail = resolveConfiguredMediaObjectUrl(image.variants.thumbnail.key);
    if (!src || !thumbnail) return [];

    return [{
      src,
      thumbnail,
      alt: image.alt,
      caption: image.caption,
      width: image.variants.web.width,
      height: image.variants.web.height,
      thumbnailWidth: image.variants.thumbnail.width,
      thumbnailHeight: image.variants.thumbnail.height,
    }];
  });
}
