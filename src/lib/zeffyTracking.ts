// Conversion bridge for embedded Zeffy forms.
//
// A Zeffy form runs on www.zeffy.com inside an iframe, so GTM on jrhof.org
// cannot see a registration or donation finish. Zeffy's embed posts
// `zeffy-embed:*` messages to the parent page; this module turns the payment
// step and the thank-you screen into the same dataLayer events the rest of the
// site uses, so GTM, GA4 and Google Ads see them as first-party events with
// the visitor's own click ID. See docs/ANALYTICS.md.
//
// Zeffy's messages carry no amount and no order ID, and Zeffy has no test
// mode. Values therefore come from the Google Ads default value, and preview
// hosts send `<conversion>_test` so a preview can never count as a real
// conversion (GTM's production-hostname guard is the second line of defense).
// The module imports nothing so Node can run its tests directly.

export const ZEFFY_ORIGIN = 'https://www.zeffy.com';
export const PRODUCTION_HOSTS = ['jrhof.org', 'www.jrhof.org'];

export type ZeffyConversion = 'registration_complete' | 'donation_complete' | 'newsletter_signup';

/** form_type sent with every event, so reports can tell the forms apart. */
const FORM_TYPES: Record<ZeffyConversion, string> = {
  registration_complete: 'registration',
  donation_complete: 'donation',
  newsletter_signup: 'newsletter',
};

export interface ZeffyTrackerOptions {
  /** Pushes one event into the dataLayer (window.jrhofTrack on the site). */
  track: (eventName: string, params: Record<string, string>) => void;
  /** The conversion this form represents. */
  conversion: ZeffyConversion;
  /** Extra parameters sent with every event, such as event_slug. */
  params?: Record<string, string>;
  /** Page hostname; non-production hosts send `<event>_test`. */
  hostname: string;
  /** Unique reference per completed form, used as transaction_id. */
  newId: () => string;
}

/** Returns a handler for message data already checked to come from Zeffy. */
export function createZeffyTracker(options: ZeffyTrackerOptions) {
  const { track, conversion, params = {}, hostname, newId } = options;
  const production = PRODUCTION_HOSTS.includes(hostname.toLowerCase());
  const name = (event: string) => (production ? event : `${event}_test`);
  // A newsletter sign-up has no payment: no begin_checkout, provider, currency
  // or transaction_id, and it counts once per embed (Google Ads counts One).
  const payment = conversion !== 'newsletter_signup';
  const base = { ...params, form_type: FORM_TYPES[conversion], ...(payment ? { payment_provider: 'zeffy', currency: 'USD' } : {}) };

  // One begin_checkout per checkout and one conversion per thank-you screen.
  // Reaching payment again (a second order in the same embed) re-arms both.
  // Other steps (a donation form's monthly upsell, `pushMonthly`) are ignored.
  let checkoutSent = false;
  let converted = false;

  return (data: unknown): string | undefined => {
    if (!data || typeof data !== 'object') return undefined;
    const { type, step } = data as { type?: unknown; step?: unknown };
    if (typeof type !== 'string' || !type.startsWith('zeffy-embed:')) return undefined;

    if (type === 'zeffy-embed:step-changed' && step === 'payment') {
      if (!payment) return undefined;
      converted = false;
      if (checkoutSent) return undefined;
      checkoutSent = true;
      const event = name('begin_checkout');
      track(event, base);
      return event;
    }

    if (type === 'zeffy-embed:thank-you-page-shown' || type === 'zeffy-embed:thank-you-animation-shown') {
      checkoutSent = false;
      if (converted) return undefined;
      converted = true;
      const event = name(conversion);
      track(event, payment ? { ...base, transaction_id: `zeffy-${newId()}` } : base);
      return event;
    }

    return undefined;
  };
}

/** True when a message event came from Zeffy and from one of the given frames. */
export function isZeffyMessage(
  event: { origin: string; source: unknown },
  frames: Iterable<{ contentWindow: unknown }>,
): boolean {
  if (event.origin !== ZEFFY_ORIGIN) return false;
  for (const frame of frames) {
    if (frame.contentWindow && frame.contentWindow === event.source) return true;
  }
  return false;
}
