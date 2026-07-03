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

export interface R2GalleryManifest {
  images?: R2GalleryImage[];
  objects?: Array<R2Variant & { variant: string }>;
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
  if (!manifest.images && manifest.objects) {
    const thumbnails = new Map(
      manifest.objects
        .filter((object) => object.variant === 'thumbs')
        .map((object) => [object.key.split('/').at(-1), object]),
    );

    return manifest.objects
      .filter((object) => object.variant === 'web')
      .flatMap((web, index) => {
        const thumbnail = thumbnails.get(web.key.split('/').at(-1));
        const src = resolveConfiguredMediaObjectUrl(web.key);
        const thumbnailUrl = thumbnail ? resolveConfiguredMediaObjectUrl(thumbnail.key) : null;
        if (!src || !thumbnail || !thumbnailUrl) return [];

        return [{
          src,
          thumbnail: thumbnailUrl,
          alt: `The Umpire’s Cup II golf tournament, 2024 — photo ${index + 1}`,
          caption: 'The Umpire’s Cup II · 2024',
          width: web.width,
          height: web.height,
          thumbnailWidth: thumbnail.width,
          thumbnailHeight: thumbnail.height,
        }];
      });
  }

  return (manifest.images || []).flatMap((image) => {
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
