/**
 * @fileoverview TOTP Challenge Token
 *
 * Short-lived HMAC-signed token that proves a user already passed password
 * authentication and is now pending TOTP verification.
 *
 * This prevents an attacker from calling verifyTotpAndLoginAction() directly
 * with an arbitrary userId — they must first know the user's password.
 *
 * Token format: base64url(JSON { userId, exp }) + "." + base64url(HMAC-SHA256)
 * Lifetime: 5 minutes (enough to open an authenticator app)
 */

import { getSessionSecret } from './session';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getSessionSecret();
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret + ':totp-challenge'), // domain-separate from session signing
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64Url(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString('base64url');
}

function fromBase64Url(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

export async function createTotpChallengeToken(userId: string): Promise<string> {
  const payload = JSON.stringify({ userId, exp: Date.now() + CHALLENGE_TTL_MS });
  const payloadB64 = Buffer.from(payload).toString('base64url');

  const key = await getHmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));

  return `${payloadB64}.${toBase64Url(sig)}`;
}

export async function verifyTotpChallengeToken(token: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;

  try {
    const key = await getHmacKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sigB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;

    const payload = JSON.parse(fromBase64Url(payloadB64).toString('utf-8'));
    if (!payload.userId || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null; // expired

    return payload.userId;
  } catch {
    return null;
  }
}
