export const BANQUET_REGISTRATION_PATH = '/events/induction-banquet/2027-hall-of-fame-induction-banquet/register/';
export const BANQUET_ATTRIBUTION_STORAGE_KEY = 'jrhof:banquet-attribution:v1';
export const UTM_FIELDS = ['source', 'medium', 'campaign', 'content', 'term'];

const limits = { source: 100, medium: 100, campaign: 160, content: 160, term: 160 };
const controlCharacters = /[\u0000-\u001f\u007f-\u009f]/u;

export const emptyAttribution = () => ({
  source: null,
  medium: null,
  campaign: null,
  content: null,
  term: null,
});

const normalizeAttributionValue = (value, maxLength) => {
  if (!value || controlCharacters.test(value)) return null;
  const normalized = value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  return normalized ? normalized.slice(0, maxLength) : null;
};

export const isAttribution = (value) => (
  typeof value === 'object'
  && value !== null
  && !Array.isArray(value)
  && Object.keys(value).length === UTM_FIELDS.length
  && UTM_FIELDS.every((field) => (
    Object.hasOwn(value, field)
    && (
      value[field] === null
      || (
        typeof value[field] === 'string'
        && value[field] === normalizeAttributionValue(value[field], limits[field])
      )
    )
  ))
);

export function attributionFromSearch(search) {
  const params = new URLSearchParams(search);
  const attribution = emptyAttribution();
  for (const field of UTM_FIELDS) {
    attribution[field] = normalizeAttributionValue(params.get(`utm_${field}`), limits[field]);
  }
  return attribution;
}

export function captureFirstTouchAttribution(search, storage) {
  if (storage) {
    try {
      const raw = storage.getItem(BANQUET_ATTRIBUTION_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (isAttribution(stored)) return stored;
      }
    } catch {
      // Fall through to current-page UTMs when storage is unavailable or corrupt.
    }
  }

  const attribution = attributionFromSearch(search);
  if (storage) {
    try {
      storage.setItem(BANQUET_ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    } catch {
      // The caller can still submit this page's attribution without persistence.
    }
  }
  return attribution;
}

export const campaignLabel = (value) => String(value || '')
  .normalize('NFKD')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/gu, '_')
  .replace(/^_+|_+$/gu, '')
  .slice(0, 160);

export function buildBanquetCampaignUrl(origin, values) {
  const url = new URL(BANQUET_REGISTRATION_PATH, origin);
  for (const field of UTM_FIELDS) {
    const value = campaignLabel(values[field]);
    if (value) url.searchParams.set(`utm_${field}`, value);
  }
  return url;
}
