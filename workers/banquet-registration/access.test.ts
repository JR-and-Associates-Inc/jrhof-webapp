import { generateKeyPair, SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { BoardAccessError, verifyBoardAccess } from './access';
import type { BanquetEnv } from './types';

const issuer = 'https://preview-team.cloudflareaccess.com';
const audience = 'preview-access-audience';
const env = {
  ACCESS_TEAM_DOMAIN: 'preview-team.cloudflareaccess.com',
  ACCESS_AUD: audience,
  BOARD_EXPORT_ALLOWED_EMAILS: 'greg@example.invalid, tj@example.invalid',
} as BanquetEnv;

const tokenFor = async (
  privateKey: CryptoKey,
  overrides: { email?: string; audience?: string; issuer?: string; expiresIn?: string | number } = {},
) => new SignJWT({
  email: overrides.email ?? 'greg@example.invalid',
  type: 'app',
})
  .setProtectedHeader({ alg: 'RS256', kid: 'preview-key' })
  .setSubject('access-user-preview-subject')
  .setIssuer(overrides.issuer ?? issuer)
  .setAudience(overrides.audience ?? audience)
  .setIssuedAt()
  .setExpirationTime(overrides.expiresIn ?? '5m')
  .sign(privateKey);

describe('Cloudflare Access board identity verification', () => {
  it('validates signature, issuer, audience, expiration, token type, and email allowlist', async () => {
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    const token = await tokenFor(privateKey);
    const identity = await verifyBoardAccess(
      new Request('https://preview.invalid/export', {
        headers: { 'Cf-Access-Jwt-Assertion': token },
      }),
      env,
      async () => publicKey,
    );
    expect(identity).toEqual({
      email: 'greg@example.invalid',
      subject: 'access-user-preview-subject',
    });
  });

  it.each([
    ['wrong audience', { audience: 'wrong-audience' }, 'access_jwt_invalid', 401],
    ['wrong issuer', { issuer: 'https://other.cloudflareaccess.com' }, 'access_jwt_invalid', 401],
    ['expired token', { expiresIn: -60 }, 'access_jwt_invalid', 401],
    ['email outside allowlist', { email: 'outsider@example.invalid' }, 'access_identity_not_authorized', 403],
  ] as const)('rejects %s', async (_label, overrides, code, status) => {
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    const token = await tokenFor(privateKey, overrides);
    const verification = verifyBoardAccess(
      new Request('https://preview.invalid/export', {
        headers: {
          'Cf-Access-Jwt-Assertion': token,
          'Cf-Access-Authenticated-User-Email': 'greg@example.invalid',
        },
      }),
      env,
      async () => publicKey,
    );
    await expect(verification).rejects.toMatchObject<Partial<BoardAccessError>>({ code, status });
  });

  it('does not trust an email header without a signed Access JWT', async () => {
    await expect(verifyBoardAccess(
      new Request('https://preview.invalid/export', {
        headers: { 'Cf-Access-Authenticated-User-Email': 'greg@example.invalid' },
      }),
      env,
    )).rejects.toMatchObject<Partial<BoardAccessError>>({ code: 'access_jwt_required', status: 401 });
  });
});
