import type { BanquetEnv } from './types';

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export async function checkCheckoutRateLimit(env: BanquetEnv, request: Request): Promise<boolean> {
  const origin = request.headers.get('origin') ?? 'missing-origin';
  const edgeAddress = request.headers.get('cf-connecting-ip') ?? 'local-preview';
  const actorDigest = await sha256Hex(`${origin}\u0000${edgeAddress}`);
  const outcome = await env.BANQUET_CHECKOUT_RATE_LIMITER.limit({
    key: `checkout:${actorDigest}`,
  });
  return outcome.success;
}
