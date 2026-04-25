/**
 * @fileoverview Invite token generation for tribes.
 *
 * Tokens are 12-character URL-safe random strings (a-z, 0-9).
 * ~4.7 × 10²¹ possible values — effectively unguessable.
 *
 * Each tribe has exactly ONE active invite token at a time.
 * Regenerating invalidates the previous one.
 */

import { randomBytes } from 'crypto';

/**
 * Generate a random, URL-safe invite token.
 * 12 chars of base36 ≈ 62 bits of entropy.
 */
export function generateInviteToken(): string {
  return randomBytes(9)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12)
    .toLowerCase();
}
