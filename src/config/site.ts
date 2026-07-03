export const site = {
  name: 'Joe Rossi Umpires Hall of Fame',
  shortName: 'JRHOF',
  legalName: 'JR and Associates, Inc.',
  canonicalUrl: 'https://jrhof.org',
  ein: '33-1883765',
  contactEmail: 'contact@jrhof.org',
  securityEmail: 'contact@jrhof.org',
  mission:
    'The Joe Rossi Umpires Hall of Fame preserves the history, celebrates the achievements, and inspires future generations of Colorado high school baseball umpires through recognition, education, and community support.',
} as const;

export const partnerLinks = {
  chsbua: 'https://www.chsbua.com',
  tmco: 'https://tmcoconsulting.com',
} as const;

const donationCampaign = {
  utm_source: 'jrhof.org',
  utm_medium: 'website',
  utm_campaign: 'donation',
};

export const stripeLinks = {
  donateOnce:
    import.meta.env.PUBLIC_STRIPE_DONATE_ONETIME_URL ||
    import.meta.env.PUBLIC_STRIPE_DONATE_URL ||
    'https://donate.stripe.com/00w5kC7Xc4yS1Jagfw93y01',
  donateMonthly:
    import.meta.env.PUBLIC_STRIPE_DONATE_MONTHLY_URL ||
    'https://donate.stripe.com/14AfZg6T81mG0F69R893y04',
  banquetSupport: import.meta.env.PUBLIC_STRIPE_BANQUET_SUPPORT_URL || '',
  golfRaffle: 'https://buy.stripe.com/7sYdR84L01mG0F64wO93y02',
  golfMulligans: 'https://buy.stripe.com/5kQ3cuelA6H04VmbZg93y03',
} as const;

export const eventLinks = {
  golfRegistration: 'https://www.eventbrite.com/e/joe-rossi-hof-golf-tournament-2026-tickets-1985644019715',
  raffleTickets: stripeLinks.golfRaffle,
  mulligans: stripeLinks.golfMulligans,
  donate: stripeLinks.donateOnce,
} as const;

export function withDonationUtm(url: string, content: string) {
  if (!url) return '';

  const trackedUrl = new URL(url);
  for (const [key, value] of Object.entries(donationCampaign)) {
    trackedUrl.searchParams.set(key, value);
  }
  trackedUrl.searchParams.set('utm_content', content);
  return trackedUrl.href;
}

export function trackingAttrs(eventName: string, params: Record<string, string> = {}) {
  return {
    'data-ga-event': eventName,
    'data-ga-params': JSON.stringify(params),
  };
}
