import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { BanquetEnv, BoardAccessIdentity } from './types';

const ACCESS_HOST_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/;

export class BoardAccessError extends Error {
  constructor(
    readonly code: string,
    readonly status: 401 | 403 | 503,
  ) {
    super(code);
    this.name = 'BoardAccessError';
  }
}

const accessConfiguration = (env: BanquetEnv) => {
  const host = env.ACCESS_TEAM_DOMAIN?.trim().toLowerCase();
  const audience = env.ACCESS_AUD?.trim();
  const allowedEmails = new Set(
    (env.BOARD_EXPORT_ALLOWED_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!host || !ACCESS_HOST_PATTERN.test(host) || !audience || allowedEmails.size === 0) {
    throw new BoardAccessError('board_export_not_configured', 503);
  }
  return { host, audience, allowedEmails, issuer: `https://${host}` };
};

export async function verifyBoardAccess(
  request: Request,
  env: BanquetEnv,
  getKey?: JWTVerifyGetKey,
): Promise<BoardAccessIdentity> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new BoardAccessError('access_jwt_required', 401);

  const config = accessConfiguration(env);
  const key = getKey ?? createRemoteJWKSet(
    new URL(`${config.issuer}/cdn-cgi/access/certs`),
  );

  let payload;
  try {
    ({ payload } = await jwtVerify(token, key, {
      algorithms: ['RS256'],
      issuer: config.issuer,
      audience: config.audience,
      clockTolerance: 5,
    }));
  } catch {
    throw new BoardAccessError('access_jwt_invalid', 401);
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const subject = typeof payload.sub === 'string' ? payload.sub.trim() : '';
  if (payload.type !== 'app' || !email || !subject) {
    throw new BoardAccessError('access_identity_invalid', 403);
  }
  if (!config.allowedEmails.has(email)) {
    throw new BoardAccessError('access_identity_not_authorized', 403);
  }
  return { email, subject };
}
