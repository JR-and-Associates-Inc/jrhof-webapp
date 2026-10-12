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

export function trackingAttrs(eventName: string, params: Record<string, string> = {}) {
  return {
    'data-ga-event': eventName,
    'data-ga-params': JSON.stringify(params),
  };
}
