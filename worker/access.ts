// Cloudflare Access performs Google OAuth. Verify its signed assertion here too,
// so alternate Worker URLs cannot expose board data by bypassing the edge policy.
export interface AccessConfig {
  BOARD_ACCESS_TEAM_DOMAIN?: string;
  BOARD_ACCESS_AUD?: string;
}

export function accessIssuer(config: AccessConfig): string | null {
  const domain = config.BOARD_ACCESS_TEAM_DOMAIN?.trim();
  return domain && /^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) ? `https://${domain}` : null;
}

function decode(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid token');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));
}

const parse = (value: string) => JSON.parse(new TextDecoder().decode(decode(value)));

export function createAccessVerifier(fetcher: typeof fetch = fetch) {
  let cached: { issuer: string; expires: number; keys: (JsonWebKey & { kid?: string })[] } | undefined;
  return async (request: Request, config: AccessConfig, now: number): Promise<boolean> => {
    const issuer = accessIssuer(config);
    const audience = config.BOARD_ACCESS_AUD?.trim();
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!issuer || !audience || !token || token.length > 16_000) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const header = parse(parts[0]);
      const claims = parse(parts[1]);
      const seconds = Math.floor(now / 1000);
      if (header.alg !== 'RS256' || typeof header.kid !== 'string') return false;
      if (claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(audience)) return false;
      if (!Number.isFinite(claims.exp) || claims.exp <= seconds || !Number.isFinite(claims.iat) || claims.iat > seconds + 30) return false;
      if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > seconds + 30)) return false;
      if (claims.type !== 'app' || typeof claims.sub !== 'string' || !claims.sub) return false;
      if (typeof claims.email !== 'string' || !/^[^\s@]+@jrhof\.org$/i.test(claims.email)) return false;
      if (!cached || cached.issuer !== issuer || cached.expires <= now || !cached.keys.some((key) => key.kid === header.kid)) {
        const response = await fetcher(`${issuer}/cdn-cgi/access/certs`);
        if (!response.ok) return false;
        const body = await response.json() as { keys: (JsonWebKey & { kid?: string })[] };
        if (!Array.isArray(body.keys)) return false;
        cached = { issuer, keys: body.keys, expires: now + 5 * 60_000 };
      }
      const jwk = cached.keys.find((key) => key.kid === header.kid && key.kty === 'RSA');
      if (!jwk) return false;
      const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    } catch {
      return false;
    }
  };
}
