// Board sign-in: one shared password, remembered for 12 hours with a signed
// cookie. The signing key combines BOARD_PASSWORD with a server secret
// (BOARD_SESSION_SECRET, else STRIPE_SECRET_KEY), so a stolen cookie can't be
// used to guess the password offline. Changing either signs everyone out.

const COOKIE = 'jrhof_board';
const SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

/** The password and the server secret that sign board sessions. */
export interface BoardKeys {
  password: string;
  secret: string;
}

async function signingKey({ password, secret }: BoardKeys): Promise<CryptoKey> {
  const material = await crypto.subtle.digest('SHA-256', encoder.encode(`jrhof-board-session:${secret}:${password}`));
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(keys: BoardKeys, expires: number): Promise<string> {
  return hex(await crypto.subtle.sign('HMAC', await signingKey(keys), encoder.encode(`board:${expires}`)));
}

/** Compares two strings in time that does not depend on where they differ. */
async function sameText(given: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([given, expected].map((text) => crypto.subtle.digest('SHA-256', encoder.encode(text))));
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let difference = 0;
  for (let index = 0; index < right.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export const passwordMatches = sameText;

export async function sessionCookie(keys: BoardKeys, now: number): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_SECONDS;
  const token = `${expires}.${await sign(keys, expires)}`;
  return `${COOKIE}=${token}; Path=/board; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export const clearSessionCookie = `${COOKIE}=; Path=/board; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

export async function hasSession(request: Request, keys: BoardKeys, now: number): Promise<boolean> {
  const token = request.headers.get('cookie')?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  const [expiresText, signature] = token?.split('.') ?? [];
  const expires = Number(expiresText);
  if (!signature || !Number.isSafeInteger(expires) || expires <= now / 1000) return false;
  return sameText(signature, await sign(keys, expires));
}

/** Only return to board pages after sign-in. */
export function safeNext(value: string | null): string {
  return value && value.startsWith('/board/') && !value.startsWith('//') && !value.includes('\\') ? value : '/board/';
}
