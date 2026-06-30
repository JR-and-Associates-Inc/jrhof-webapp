const configuredMediaBaseUrl = (import.meta.env.PUBLIC_MEDIA_BASE_URL || '').trim();

export const productionMediaBaseUrl = 'https://media.jrhof.org';

function normalizeMediaBaseUrl(value: string) {
  if (!value) return '';

  const url = new URL(value);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_MEDIA_BASE_URL must be an HTTPS origin with no path, query, or fragment.');
  }

  return url.origin;
}

export const publicMediaBaseUrl = normalizeMediaBaseUrl(configuredMediaBaseUrl);

export function resolvePublicMediaUrl(localPath: string, publicObjectPath: string) {
  if (!publicMediaBaseUrl) return localPath;

  const normalizedObjectPath = publicObjectPath.replace(/^\/+/, '');
  return new URL(normalizedObjectPath, `${publicMediaBaseUrl}/`).href;
}

export function resolveConfiguredMediaObjectUrl(publicObjectPath: string) {
  if (!publicMediaBaseUrl) return null;

  const normalizedObjectPath = publicObjectPath.replace(/^\/+/, '');
  return new URL(normalizedObjectPath, `${publicMediaBaseUrl}/`).href;
}
