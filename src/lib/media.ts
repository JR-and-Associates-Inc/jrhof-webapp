// Centralized media URL resolver for Cloudflare R2 delivery.
//
// Public inductee portraits are served from the R2 bucket `jrhof-media-public`
// through the custom media domain (see manifests/r2/inductee-portraits-v1.json).
// Reference media through this module rather than hardcoding literal URLs, so the
// media origin is single-sourced and object keys stay canonical.
//
//   mediaUrl(key)                     -> `${mediaBaseUrl}/${key}`
//   inducteePortrait(record, variant) -> resolved R2 portrait (or placeholder)

import manifest from '../../manifests/r2/inductee-portraits-v1.json';

/** Media delivery origin, e.g. `https://media.jrhof.org` (no trailing slash). */
export const mediaBaseUrl: string = manifest.mediaBaseUrl.replace(/\/+$/, '');

/** Build an absolute media URL from a canonical R2 object key. */
export function mediaUrl(objectKey: string): string {
  return `${mediaBaseUrl}/${objectKey.replace(/^\/+/, '')}`;
}

export type PortraitVariant = 'profile' | 'card';

interface PortraitVariantRecord {
  key: string;
  width: number;
  height: number;
}

interface ManifestVariants {
  profile: PortraitVariantRecord;
  card: PortraitVariantRecord;
}

/** Minimal shape needed to resolve an inductee's portrait. */
export interface InducteePortraitRecord {
  stable_id: string;
  portrait_status: string;
}

export interface ResolvedPortrait {
  /** Absolute R2 URL for the requested variant. */
  url: string;
  /** Intrinsic width of the WebP derivative. */
  width: number;
  /** Intrinsic height of the WebP derivative. */
  height: number;
  /** True when the shared placeholder was returned (pending/unmatched record). */
  isPlaceholder: boolean;
}

const variantsByStableId = new Map<string, ManifestVariants>(
  manifest.records.map((record) => [record.stableId, record.variants as ManifestVariants]),
);

const placeholder = manifest.placeholder;

/**
 * Resolve an inductee's portrait to its R2-hosted variant. Verified records
 * resolve to their generated `profile`/`card` WebP; pending or unmatched records
 * fall back to the shared missing-inductee placeholder. Never returns a local path.
 */
export function inducteePortrait(
  record: InducteePortraitRecord,
  variant: PortraitVariant,
): ResolvedPortrait {
  const variants =
    record.portrait_status === 'verified_candidate'
      ? variantsByStableId.get(record.stable_id)
      : undefined;

  if (variants) {
    const chosen = variants[variant];
    return { url: mediaUrl(chosen.key), width: chosen.width, height: chosen.height, isPlaceholder: false };
  }

  return {
    url: mediaUrl(placeholder.key),
    width: placeholder.width,
    height: placeholder.height,
    isPlaceholder: true,
  };
}
