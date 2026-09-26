import { findRegistration, registrations, type RegistrationConfig } from '../src/data/registrations.ts';
import { renderBoardIndex, renderDashboard, renderEditOrder, renderKitchenSheet, renderLogin, renderMessage } from './board.ts';
import { ATTENDING, attendeesCsv, loadOrders, seatsTaken, summarize, toOrder } from './orders.ts';
import { clearSessionCookie, hasSession, passwordMatches, safeNext, sessionCookie } from './session.ts';
import { createStripeClient, StripeApiError, type Metadata, type StripeClient } from './stripe.ts';
import { guestMetadata, parseGuests, validateRegistration, ValidationError, type Registration } from './validation.ts';

// The jrhof-webapp Worker. Static pages are served straight from dist/; only
// /api/* and /board/* reach this script (assets.run_worker_first in
// wrangler.jsonc). Stripe is the only data store. See
// docs/operations/EVENT_REGISTRATION.md.

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  STRIPE_SECRET_KEY?: string;
  BOARD_PASSWORD?: string;
  /** Optional. Signs board sessions; STRIPE_SECRET_KEY is used when unset. */
  BOARD_SESSION_SECRET?: string;
  CHECKOUT_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

export interface Dependencies {
  fetcher?: typeof fetch;
  now?: () => number;
}

const CHECKOUT_TTL_SECONDS = 31 * 60;
const SEAT_COUNT_CACHE_MS = 30_000;
const MAX_FORM_BYTES = 20_000;
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;
const CONFIRMATION_PATH = '/registration/confirmed/';

const securityHeaders = {
  'Cache-Control': 'no-store',
  // Not no-referrer: under that policy browsers send `Origin: null` on
  // same-site form posts, which would fail the origin checks below.
  'Referrer-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow',
};

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: securityHeaders });

const html = (body: string, status = 200, extra: Record<string, string> = {}) => new Response(body, {
  status,
  headers: {
    ...securityHeaders,
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    ...extra,
  },
});

/**
 * Whether a POST came from this site. Browsers send the page origin, or
 * `null` plus Sec-Fetch-Site in some privacy modes. `allowUnknown` accepts
 * requests carrying neither header (very old browsers posting the plain
 * registration form); board changes always require proof.
 */
export function isSameOriginPost(request: Request, allowUnknown = false): boolean {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (origin && origin !== 'null') return origin === new URL(request.url).origin;
  if (fetchSite) return fetchSite === 'same-origin';
  return allowUnknown && !origin;
}

/** Stripe error messages can echo what a guest typed, so log only Stripe's status for them. */
const logDetail = (error: unknown) => (error instanceof StripeApiError
  ? { stripeStatus: error.status }
  : { message: error instanceof Error ? error.message : 'unknown' });

const redirect = (location: string) => new Response(null, { status: 303, headers: { ...securityHeaders, Location: location } });

type RegistrationState = 'open' | 'scheduled' | 'closed';

export function registrationState(event: RegistrationConfig, now: number, testMode: boolean): RegistrationState | 'unapproved' {
  // Real-money checkout needs a board-approved price; test mode is for review.
  if (!testMode && !event.priceApproved) return 'unapproved';
  if (now >= Date.parse(event.closesAt)) return 'closed';
  // Test mode ignores the opening date so the board can rehearse before launch.
  if (now < Date.parse(event.opensAt) && !testMode) return 'scheduled';
  return 'open';
}

class PublicError extends Error {
  code: string;
  status: number;
  field?: string;
  constructor(code: string, message: string, status = 400, field?: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

const unavailable = () => new PublicError('unavailable', 'Online registration is not available right now. Please try again later or contact us.', 503);

async function readForm(request: Request): Promise<URLSearchParams> {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/x-www-form-urlencoded') throw new PublicError('bad_request', 'Please submit the registration form.', 415);
  const text = await request.text();
  if (text.length > MAX_FORM_BYTES) throw new PublicError('bad_request', 'The form is too large.', 413);
  return new URLSearchParams(text);
}

function mealCounts(event: RegistrationConfig, guests: { meal: string }[]) {
  return event.meals
    .map((meal) => ({ meal, count: guests.filter((guest) => guest.meal === meal.name).length }))
    .filter(({ count }) => count > 0);
}

function withoutEmpty(metadata: Metadata): Metadata {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== ''));
}

async function createCheckout(stripe: StripeClient, event: RegistrationConfig, registration: Registration, origin: string, now: number) {
  const { purchaser, guests, donationCents } = registration;
  const seats = String(guests.length);
  // One line per guest: Stripe prints line-item names on the checkout page and
  // the emailed receipt, so the purchaser keeps a record of who each seat is for.
  const lineItems: Record<string, unknown>[] = guests.map((guest) => ({
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: event.seatPriceCents,
      product_data: { name: `${event.seatLabel} for ${guest.name} (${guest.meal})`, description: `${event.title}, ${event.displayDate}` },
    },
  }));
  if (donationCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency: 'usd', unit_amount: donationCents, product_data: { name: 'Additional donation to JR and Associates, Inc.' } },
    });
  }
  const expectedTotal = guests.length * event.seatPriceCents + donationCents;
  const shared = { event_id: event.id, seats, purchaser_name: purchaser.name, purchaser_phone: purchaser.phone };

  const session = await stripe.createCheckoutSession({
    mode: 'payment',
    submit_type: 'book',
    payment_method_types: ['card'],
    line_items: lineItems as never,
    customer_email: purchaser.email,
    client_reference_id: registration.gaClientId ?? undefined,
    expires_at: Math.floor(now / 1000) + CHECKOUT_TTL_SECONDS,
    success_url: `${origin}${CONFIRMATION_PATH}?cs={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${event.registerPath}?canceled=1`,
    custom_text: { submit: { message: event.refundPolicy } },
    metadata: shared,
    payment_intent_data: {
      description: `${event.title}: ${seats} ${guests.length === 1 ? 'seat' : 'seats'}`,
      receipt_email: purchaser.email,
      metadata: withoutEmpty({
        ...shared,
        donation_cents: String(donationCents),
        seating_request: registration.seatingRequest,
        ...guestMetadata(guests, guests.length),
      }),
    },
  }, crypto.randomUUID());

  if (!session.url?.startsWith('https://checkout.stripe.com/') || session.amount_total !== expectedTotal) {
    throw new Error('Stripe returned an unexpected Checkout Session');
  }
  return session;
}

/**
 * Seats taken, remembered for 30 seconds per event and Stripe mode so each
 * registration-page view doesn't list every Checkout Session. Checkout always
 * recounts exactly and clears the entry. Kept per Worker instance, in memory.
 */
type SeatCountCache = Map<string, { seatsTaken: number; expires: number }>;
const seatCacheKey = (event: RegistrationConfig, stripe: StripeClient) => `${event.id}:${stripe.testMode ? 'test' : 'live'}`;

async function handleStatus(url: URL, stripe: StripeClient | null, now: number, cache: SeatCountCache): Promise<Response> {
  const event = findRegistration(url.searchParams.get('event') ?? '');
  if (!event) return json({ error: 'Unknown event.' }, 404);
  if (!stripe) return json({ state: 'unavailable' });
  const state = registrationState(event, now, stripe.testMode);
  const base = { testMode: stripe.testMode, opens: event.opensDisplay, closes: event.closesDisplay };
  if (state === 'unapproved') return json({ state: 'unavailable', ...base });
  if (state !== 'open') return json({ state, ...base });
  try {
    const key = seatCacheKey(event, stripe);
    let cached = cache.get(key);
    if (!cached || cached.expires <= now) {
      cached = { seatsTaken: seatsTaken(await loadOrders(stripe, event, now), event.capacity), expires: now + SEAT_COUNT_CACHE_MS };
      cache.set(key, cached);
    }
    const remaining = event.capacity - cached.seatsTaken;
    if (remaining <= 0) return json({ state: 'sold_out', ...base });
    return json({ state, seatsAvailable: Math.min(remaining, event.maxSeatsPerOrder), ...base });
  } catch {
    return json({ state: 'unavailable', ...base });
  }
}

async function handleCheckout(request: Request, env: Env, stripe: StripeClient | null, now: number, cache: SeatCountCache): Promise<Response> {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  let event: RegistrationConfig | undefined;
  try {
    if (request.method !== 'POST') throw new PublicError('bad_request', 'Please submit the registration form.', 405);
    if (!isSameOriginPost(request, true)) throw new PublicError('bad_request', 'Please register from jrhof.org.', 403);
    const form = await readForm(request);
    event = findRegistration(form.get('event_id') ?? '');
    if (!event) throw new PublicError('bad_request', 'Please register from the event page.', 404);
    if (!stripe) throw unavailable();

    const limiter = env.CHECKOUT_LIMITER;
    if (limiter && !(await limiter.limit({ key: request.headers.get('cf-connecting-ip') ?? 'unknown' })).success) {
      throw new PublicError('rate_limited', 'Too many attempts. Please wait a minute and try again.', 429);
    }

    const state = registrationState(event, now, stripe.testMode);
    if (state === 'unapproved') throw unavailable();
    if (state === 'scheduled') throw new PublicError('scheduled', `Registration opens ${event.opensDisplay}.`, 409);
    if (state === 'closed') throw new PublicError('closed', 'Online registration for this event has closed. Please contact us about seats.', 409);

    let registration: Registration;
    try {
      registration = validateRegistration(form, event);
    } catch (error) {
      if (error instanceof ValidationError) throw new PublicError('invalid', error.message, 400, error.field);
      throw error;
    }

    const remaining = event.capacity - seatsTaken(await loadOrders(stripe, event, now), event.capacity);
    if (remaining <= 0) throw new PublicError('sold_out', 'This event is sold out. Please contact us to join the waiting list.', 409);
    if (registration.guests.length > remaining) {
      throw new PublicError('sold_out', `Only ${remaining} ${remaining === 1 ? 'seat is' : 'seats are'} left. Please remove ${registration.guests.length - remaining} ${registration.guests.length - remaining === 1 ? 'guest' : 'guests'} and try again.`, 409, 'guest_1_name');
    }

    const session = await createCheckout(stripe, event, registration, new URL(request.url).origin, now);
    cache.delete(seatCacheKey(event, stripe));
    return wantsJson ? json({ checkoutUrl: session.url }, 201) : redirect(session.url!);
  } catch (error) {
    const publicError = error instanceof PublicError ? error : unavailable();
    if (!(error instanceof PublicError)) console.error(JSON.stringify({ event: 'checkout_failed', ...logDetail(error) }));
    if (wantsJson) return json({ error: publicError.message, code: publicError.code, field: publicError.field }, publicError.status);
    const back = new URL(event?.registerPath ?? '/events/', request.url);
    back.searchParams.set('error', publicError.code);
    return redirect(`${back.pathname}${back.search}`);
  }
}

async function handleConfirm(url: URL, stripe: StripeClient | null, now: number): Promise<Response> {
  const sessionId = url.searchParams.get('cs') ?? '';
  if (!SESSION_ID.test(sessionId)) return json({ paid: false, error: 'Unknown registration.' }, 400);
  if (!stripe) return json({ paid: false, error: 'Unavailable.' }, 503);
  try {
    const session = await stripe.retrieveCheckoutSession(sessionId);
    const event = findRegistration(session.metadata?.event_id ?? '');
    const order = event ? toOrder(session, event, now) : null;
    if (!event || !order) return json({ paid: false, error: 'Unknown registration.' }, 404);
    // Only non-personal facts: the session ID is shared with analytics as the
    // transaction_id, so this response must never include names or emails.
    const { guests } = order;
    return json({
      paid: session.status === 'complete' && session.payment_status === 'paid',
      transactionId: session.id,
      event: { id: event.id, title: event.title, path: event.eventPath, date: event.displayDate },
      seats: guests.length || order.seatsPurchased,
      meals: mealCounts(event, guests).map(({ meal, count }) => ({ name: meal.name, count })),
      value: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? 'usd').toUpperCase(),
      testMode: !session.livemode,
    });
  } catch {
    return json({ paid: false, error: 'Unknown registration.' }, 404);
  }
}

async function handleBoard(request: Request, url: URL, env: Env, stripe: StripeClient | null, now: number): Promise<Response> {
  const secret = env.BOARD_SESSION_SECRET?.trim() || env.STRIPE_SECRET_KEY?.trim();
  if (!env.BOARD_PASSWORD || env.BOARD_PASSWORD.length < 12 || !secret) {
    return html(renderMessage('Board access', 'Board access has not been set up yet.'), 503);
  }
  const keys = { password: env.BOARD_PASSWORD, secret };
  if (request.method !== 'GET' && request.method !== 'POST') return html(renderMessage('Not allowed', 'That action is not allowed.'), 405);
  if (request.method === 'POST' && !isSameOriginPost(request)) {
    return html(renderMessage('Not allowed', 'Please use the board pages on this site.'), 403);
  }

  if (url.pathname === '/board/logout/') {
    return new Response(null, { status: 303, headers: { ...securityHeaders, Location: '/board/', 'Set-Cookie': clearSessionCookie } });
  }
  if (url.pathname === '/board/login/' && request.method === 'POST') {
    const form = await readForm(request);
    const next = safeNext(form.get('next'));
    const limiter = env.CHECKOUT_LIMITER;
    if (limiter && !(await limiter.limit({ key: `login:${request.headers.get('cf-connecting-ip') ?? 'unknown'}` })).success) {
      return html(renderLogin(next, 'Too many attempts. Please wait a minute and try again.'), 429);
    }
    if (!(await passwordMatches(form.get('password') ?? '', env.BOARD_PASSWORD))) {
      return html(renderLogin(next, 'That password is not right. Please try again.'), 401);
    }
    return new Response(null, {
      status: 303,
      headers: { ...securityHeaders, Location: next, 'Set-Cookie': await sessionCookie(keys, now) },
    });
  }
  if (!(await hasSession(request, keys, now))) {
    return html(renderLogin(safeNext(`${url.pathname}${url.search}`)), 401);
  }
  if (!stripe) return html(renderMessage('Registrations', 'Stripe is not connected yet.'), 503);

  const parts = url.pathname.split('/').filter(Boolean); // ['board', eventId, ...]
  if (parts.length === 1) return html(renderBoardIndex(registrations, stripe.testMode));
  const event = findRegistration(parts[1]);
  if (!event) return html(renderMessage('Not found', 'That event does not exist.', stripe.testMode), 404);
  const rest = parts.slice(2).join('/');

  try {
    if (rest.startsWith('orders/') && parts.length === 4) return await handleEditOrder(request, event, parts[3], stripe, now);
    if (request.method !== 'GET') return html(renderMessage('Not allowed', 'That action is not allowed.'), 405);

    const orders = await loadOrders(stripe, event, now);
    const summary = summarize(orders, event);
    if (rest === '') {
      const notice = url.searchParams.get('saved') === '1' ? 'Guest list saved. The meal count below is up to date.' : '';
      return html(renderDashboard(event, orders, summary, stripe.testMode, notice));
    }
    if (rest === 'kitchen') return html(renderKitchenSheet(event, orders, summary, stripe.testMode));
    if (rest === 'attendees.csv') {
      const date = new Date(now).toISOString().slice(0, 10);
      return new Response(attendeesCsv(orders), {
        headers: {
          ...securityHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${event.id}-attendees-${date}.csv"`,
        },
      });
    }
    return html(renderMessage('Not found', 'That page does not exist.', stripe.testMode), 404);
  } catch (error) {
    console.error(JSON.stringify({ event: 'board_failed', ...logDetail(error) }));
    return html(renderMessage('Stripe is not responding', 'The board could not load registrations from Stripe. Please try again in a minute.', stripe.testMode), 502);
  }
}

async function handleEditOrder(request: Request, event: RegistrationConfig, sessionId: string, stripe: StripeClient, now: number): Promise<Response> {
  if (!SESSION_ID.test(sessionId)) return html(renderMessage('Not found', 'That order does not exist.', stripe.testMode), 404);
  const order = toOrder(await stripe.retrieveCheckoutSession(sessionId), event, now);
  if (!order || !order.paymentIntentId || !ATTENDING.includes(order.status)) {
    return html(renderMessage('Cannot edit', 'Only paid orders for this event can be edited.', stripe.testMode), 404);
  }
  if (request.method === 'GET') return html(renderEditOrder(event, order, stripe.testMode));

  const form = await readForm(request);
  const slots = Math.max(order.seatsPurchased, order.guests.length, 1);
  try {
    const guests = parseGuests(form, event, slots);
    await stripe.updatePaymentIntentMetadata(order.paymentIntentId, guestMetadata(guests, event.maxSeatsPerOrder));
    return redirect(`/board/${event.id}/?saved=1`);
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    return html(renderEditOrder(event, order, stripe.testMode, error.message, form), 400);
  }
}

export function createHandler(dependencies: Dependencies = {}) {
  const seatCounts: SeatCountCache = new Map();
  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);
      const now = dependencies.now?.() ?? Date.now();
      const key = env.STRIPE_SECRET_KEY?.trim();
      const stripe = key ? createStripeClient(key, dependencies.fetcher) : null;

      if (url.pathname === '/api/registration/status') return handleStatus(url, stripe, now, seatCounts);
      if (url.pathname === '/api/registration/checkout') return handleCheckout(request, env, stripe, now, seatCounts);
      if (url.pathname === '/api/registration/confirm') return handleConfirm(url, stripe, now);
      if (url.pathname === '/board' || url.pathname.startsWith('/board/')) return handleBoard(request, url, env, stripe, now);
      if (url.pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
      return env.ASSETS.fetch(request);
    },
  };
}

export default createHandler();
