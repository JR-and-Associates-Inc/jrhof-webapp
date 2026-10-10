// Stripe remains the durable registration store. Webhooks provide payment-event
// audit logs even if the purchaser never returns to the confirmation page.
export interface StripeEvent {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: { id: string; metadata?: Record<string, string>; payment_status?: string } };
}

export async function verifyWebhook(body: string, signature: string, secret: string, now: number): Promise<StripeEvent | null> {
  try {
    const pieces = signature.split(',').map((part) => part.trim().split('='));
    const timestamps = pieces.filter(([name]) => name === 't');
    if (timestamps.length !== 1 || !/^\d+$/.test(timestamps[0][1])) return null;
    const timestamp = Number(timestamps[0][1]);
    if (Math.abs(now / 1000 - timestamp) > 300) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const message = new TextEncoder().encode(`${timestamp}.${body}`);
    let valid = false;
    for (const [name, value] of pieces) {
      if (name !== 'v1' || !/^[a-f0-9]{64}$/.test(value)) continue;
      const bytes = Uint8Array.from(value.match(/../g)!, (pair) => Number.parseInt(pair, 16));
      if (await crypto.subtle.verify('HMAC', key, bytes, message)) valid = true;
    }
    if (!valid) return null;
    const event = JSON.parse(body) as StripeEvent;
    if (typeof event.id !== 'string' || typeof event.type !== 'string' || typeof event.livemode !== 'boolean' || typeof event.data?.object?.id !== 'string') return null;
    return event;
  } catch {
    return null;
  }
}
