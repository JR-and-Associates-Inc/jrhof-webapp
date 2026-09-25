// Minimal Stripe REST client. The Worker needs four calls, so it talks to the
// API directly instead of bundling the Stripe SDK.

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2025-03-31.basil';

export type Metadata = Record<string, string>;

export interface StripeCharge {
  id: string;
  amount: number;
  amount_refunded: number;
  refunded: boolean;
  disputed: boolean;
}

export interface StripePaymentIntent {
  id: string;
  status: string;
  metadata: Metadata;
  latest_charge: StripeCharge | string | null;
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  livemode: boolean;
  created: number;
  expires_at: number;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_details: { email: string | null; name: string | null } | null;
  metadata: Metadata;
  payment_intent: StripePaymentIntent | string | null;
}

interface StripeList<T> {
  data: T[];
  has_more: boolean;
}

export class StripeApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'StripeApiError';
    this.status = status;
  }
}

type FormValue = string | number | boolean | null | undefined | FormValue[] | { [key: string]: FormValue };

/** Encodes nested params the way Stripe expects: a[b][0][c]=value. */
export function encodeForm(params: Record<string, FormValue>): URLSearchParams {
  const body = new URLSearchParams();
  const append = (key: string, value: FormValue) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((item, index) => append(`${key}[${index}]`, item));
    else if (typeof value === 'object') for (const [child, item] of Object.entries(value)) append(`${key}[${child}]`, item);
    else body.append(key, String(value));
  };
  for (const [key, value] of Object.entries(params)) append(key, value);
  return body;
}

export function createStripeClient(secretKey: string, fetcher: typeof fetch = fetch) {
  async function call<T>(method: 'GET' | 'POST', path: string, params: Record<string, FormValue> = {}, idempotencyKey?: string): Promise<T> {
    const form = encodeForm(params);
    const url = method === 'GET' && [...form].length ? `${STRIPE_API}${path}?${form}` : `${STRIPE_API}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${secretKey}`,
      'Stripe-Version': STRIPE_VERSION,
    };
    if (method === 'POST') headers['Content-Type'] = 'application/x-www-form-urlencoded';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const response = await fetcher(url, { method, headers, body: method === 'POST' ? form.toString() : undefined });
    const payload = await response.json() as { error?: { message?: string } };
    if (!response.ok) throw new StripeApiError(response.status, payload.error?.message ?? 'Stripe request failed');
    return payload as T;
  }

  return {
    testMode: secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_'),

    createCheckoutSession(params: Record<string, FormValue>, idempotencyKey: string) {
      return call<StripeCheckoutSession>('POST', '/checkout/sessions', params, idempotencyKey);
    },

    retrieveCheckoutSession(id: string) {
      return call<StripeCheckoutSession>('GET', `/checkout/sessions/${encodeURIComponent(id)}`, {
        expand: ['payment_intent.latest_charge'],
      });
    },

    /** Every Checkout Session created since `createdSince` (unix seconds), newest first. */
    async listCheckoutSessions(createdSince: number): Promise<StripeCheckoutSession[]> {
      const sessions: StripeCheckoutSession[] = [];
      let startingAfter: string | undefined;
      for (let page = 0; page < 50; page += 1) {
        const result = await call<StripeList<StripeCheckoutSession>>('GET', '/checkout/sessions', {
          limit: 100,
          created: { gte: createdSince },
          expand: ['data.payment_intent.latest_charge'],
          starting_after: startingAfter,
        });
        sessions.push(...result.data);
        if (!result.has_more || !result.data.length) return sessions;
        startingAfter = result.data[result.data.length - 1].id;
      }
      throw new Error('Too many Checkout Sessions to list');
    },

    /** Stripe merges metadata: a key set to '' is removed. */
    updatePaymentIntentMetadata(id: string, metadata: Metadata) {
      return call<StripePaymentIntent>('POST', `/payment_intents/${encodeURIComponent(id)}`, { metadata });
    },
  };
}

export type StripeClient = ReturnType<typeof createStripeClient>;
