// Campaign labels only: no contact details, advertising IDs, or visitor identifiers.
export const UTM_FIELDS = ['source', 'medium', 'campaign', 'content', 'term'] as const;
export type Attribution = Record<(typeof UTM_FIELDS)[number], string>;
export const emptyAttribution = (): Attribution => ({ source: '', medium: '', campaign: '', content: '', term: '' });
export function campaignLabel(value: string): string {
  return value.normalize('NFKD').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/g, '');
}
export function readAttribution(params: URLSearchParams): Attribution {
  const result = emptyAttribution();
  for (const field of UTM_FIELDS) {
    const value = params.get(`utm_${field}`) ?? '';
    // Drop malformed/oversized labels rather than letting tracking break checkout.
    if (/^[a-z0-9][a-z0-9_-]{0,79}$/.test(value)) result[field] = value;
  }
  return result;
}
export function firstTaggedTouch(search: string, storage: Pick<Storage, 'getItem' | 'setItem'> | null, eventId: string): Attribution {
  const key = `jrhof:campaign:${eventId}:v1`;
  try {
    const saved = storage?.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const params = new URLSearchParams();
        for (const field of UTM_FIELDS) if (typeof parsed[field] === 'string') params.set(`utm_${field}`, parsed[field]);
        const result = readAttribution(params);
        if (result.source || result.medium || result.campaign) return result;
      }
    }
  } catch { /* Storage is optional. */ }
  const result = readAttribution(new URLSearchParams(search));
  if (result.source || result.medium || result.campaign) {
    try { storage?.setItem(key, JSON.stringify(result)); } catch { /* Use this page's labels. */ }
  }
  return result;
}
export const CHANNELS = {
  newsletter: { source: 'newsletter', medium: 'email', label: 'JRHOF newsletter' },
  board: { source: 'board-outreach', medium: 'referral', label: 'Board member email or text' },
  chsbua: { source: 'chsbua', medium: 'referral', label: 'CHSBUA website or email' },
  partner: { source: 'community-partner', medium: 'referral', label: 'Community partner' },
  print: { source: 'print', medium: 'offline', label: 'Printed flyer, invitation, or sign' },
  facebook: { source: 'facebook', medium: 'social', label: 'Facebook or Instagram' },
} as const;
export function campaignUrl(origin: string, registerPath: string, eventId: string, channel: keyof typeof CHANNELS, invitation: string): URL {
  const url = new URL(registerPath, origin);
  const preset = CHANNELS[channel];
  url.searchParams.set('utm_source', preset.source);
  url.searchParams.set('utm_medium', preset.medium);
  url.searchParams.set('utm_campaign', campaignLabel(eventId));
  url.searchParams.set('utm_content', campaignLabel(invitation));
  return url;
}
