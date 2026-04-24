/**
 * @fileoverview Invite code service.
 *
 * Invite codes gate platform access (not membership tier).
 * - Admin/founding codes: segmented by purpose (family, public, partner)
 * - User referral codes: grant `free` plan access, max 3 active per user
 * - When redeemed at signup, the code is auto-consumed and the inviter
 *   earns 25 referral reputation points.
 *
 * Uses the shared `db` from @/db (local-first sync architecture).
 */

import { db } from '@/db';
import { inviteCodes, inviteRedemptions, subscriptions, plans, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// ============================================================
// CODE GENERATION
// ============================================================

/**
 * Generates a cryptographically random invite code.
 * Format: TRIBE-XXXX-XXXX (8 random alphanumeric uppercase chars)
 */
function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // No I/L/O/0/1 to avoid confusion
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const code = Array.from(bytes, b => chars[b % chars.length]).join('');
  return `TRIBE-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validates an invite code without redeeming it.
 * Returns the code details or throws an error.
 */
export async function validateInviteCode(code: string): Promise<{
  id: string;
  grantsPlanId: string;
  planName: string;
  remainingUses: number;
}> {
  const normalizedCode = code.trim().toUpperCase();

  const [invite] = await db.select().from(inviteCodes)
    .where(eq(inviteCodes.id, normalizedCode))
    .limit(1);

  if (!invite) {
    throw new Error('Invalid invite code');
  }

  // Check if expired
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new Error('This invite code has expired');
  }

  // Check if used up
  const remaining = (invite.maxUses ?? 1) - (invite.usedCount ?? 0);
  if (remaining <= 0) {
    throw new Error('This invite code has been fully redeemed');
  }

  // Get plan name
  const [plan] = await db.select().from(plans)
    .where(eq(plans.id, invite.grantsPlanId))
    .limit(1);

  return {
    id: invite.id,
    grantsPlanId: invite.grantsPlanId,
    planName: plan?.name ?? invite.grantsPlanId,
    remainingUses: remaining,
  };
}

// ============================================================
// REDEMPTION
// ============================================================

/**
 * Redeems an invite code for a user.
 * For founding codes: creates a subscription + upgrades role.
 * For free codes: just records the redemption (user stays on free plan).
 */
export async function redeemInviteCode(
  userId: string,
  code: string,
): Promise<{ planName: string; source: string }> {
  const normalizedCode = code.trim().toUpperCase();

  // Validate the code
  const validated = await validateInviteCode(normalizedCode);

  // Check if user already redeemed this code
  const [existing] = await db.select().from(inviteRedemptions)
    .where(and(
      eq(inviteRedemptions.inviteCodeId, normalizedCode),
      eq(inviteRedemptions.userId, userId),
    ))
    .limit(1);

  if (existing) {
    throw new Error('You have already redeemed this invite code');
  }

  // Get the plan to determine the target role
  const [plan] = await db.select().from(plans)
    .where(eq(plans.id, validated.grantsPlanId))
    .limit(1);

  if (!plan) throw new Error('Plan not found');

  // Determine source based on code prefix
  const source = normalizedCode.startsWith('TRIBE-') ? 'referral' : 'founding';
  const subId = `sub-${userId}-${Date.now()}`;
  const redemptionId = `redemption-${userId}-${Date.now()}`;

  // Only create a subscription if the plan isn't 'free'
  if (validated.grantsPlanId !== 'free') {
    // Check if user already has an active subscription
    const [existingSub] = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1);

    if (!existingSub) {
      // Create subscription
      await db.insert(subscriptions).values({
        id: subId,
        userId,
        planId: validated.grantsPlanId,
        status: 'active',
        source,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Upgrade user role
      await db.update(users)
        .set({ role: plan.targetRole })
        .where(eq(users.id, userId));
    }
  }

  // Record redemption
  await db.insert(inviteRedemptions).values({
    id: redemptionId,
    inviteCodeId: normalizedCode,
    userId,
  });

  // Increment used count
  const [currentCode] = await db.select({ usedCount: inviteCodes.usedCount })
    .from(inviteCodes).where(eq(inviteCodes.id, normalizedCode)).limit(1);
  await db.update(inviteCodes)
    .set({ usedCount: (currentCode?.usedCount ?? 0) + 1 })
    .where(eq(inviteCodes.id, normalizedCode));

  // Referral tracking: award inviter 25 reputation points and auto-send a bond request
  try {
    const [codeRecord] = await db.select({ createdBy: inviteCodes.createdBy })
      .from(inviteCodes).where(eq(inviteCodes.id, normalizedCode)).limit(1);
    const createdBy = codeRecord?.createdBy;
    if (createdBy && createdBy !== userId) {
      const { recordContribution } = await import('@/lib/services/contribution-service');
      await recordContribution(createdBy, 'referral', userId, `Referred user via invite code ${normalizedCode}`);

      // Auto-create a bond request from the new user to the inviter
      try {
        const { createBondRequest } = await import('@/lib/services/bond-service');
        await createBondRequest(
          userId,         // fromUserId (invitee)
          createdBy,      // toUserId (inviter)
          'friend',       // bondType
          'digital_introduction', // formationMethod
          'I just joined using your invite code!'
        );
      } catch (bondErr) {
        console.warn('[invite-service] auto bond request failed:', bondErr);
      }
    }
  } catch (e) { console.warn('[invite-service] referral tracking failed:', e); }

  return { planName: plan.name, source };
}

// ============================================================
// USER CODE GENERATION
// ============================================================

const MAX_ACTIVE_CODES_PER_USER = 3;

/**
 * Generates a referral invite code for a user.
 * - Grants `free` plan access (platform entry, not paid membership)
 * - Max 3 active codes per user
 * - When someone redeems it, the creator earns 25 referral points
 */
export async function generateInviteCode(
  userId: string,
  maxUses: number = 5,
): Promise<{ code: string; maxUses: number }> {
  // Check active code count
  const activeCodes = await db.select({ id: inviteCodes.id, usedCount: inviteCodes.usedCount, maxUses: inviteCodes.maxUses })
    .from(inviteCodes)
    .where(eq(inviteCodes.createdBy, userId));

  const activeCount = activeCodes.filter(c => (c.usedCount ?? 0) < (c.maxUses ?? 1)).length;
  if (activeCount >= MAX_ACTIVE_CODES_PER_USER) {
    throw new Error(`You can have at most ${MAX_ACTIVE_CODES_PER_USER} active invite codes. Wait for existing codes to be used or expire.`);
  }

  const code = generateRandomCode();

  await db.insert(inviteCodes).values({
    id: code,
    createdBy: userId,
    grantsPlanId: 'free',
    maxUses: Math.min(maxUses, 10), // Cap at 10 uses per code
    usedCount: 0,
  });

  return { code, maxUses: Math.min(maxUses, 10) };
}

/**
 * Gets all invite codes created by a user (for the settings UI).
 */
export async function getUserInviteCodes(userId: string) {
  return db.select({
    id: inviteCodes.id,
    maxUses: inviteCodes.maxUses,
    usedCount: inviteCodes.usedCount,
    createdAt: inviteCodes.createdAt,
    expiresAt: inviteCodes.expiresAt,
  }).from(inviteCodes)
    .where(eq(inviteCodes.createdBy, userId))
    .orderBy(inviteCodes.createdAt);
}

// ============================================================
// ADMIN: FOUNDING CODE GENERATION
// ============================================================

/**
 * Admin: creates a batch of founding invite codes for a specific purpose.
 * These grant `individual_coop` (or specified plan) access.
 */
export async function createFoundingCodes(
  label: string,
  count: number,
  planId: string = 'individual_coop',
  maxUsesEach: number = 10,
): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = generateRandomCode();
    await db.insert(inviteCodes).values({
      id: code,
      grantsPlanId: planId,
      maxUses: maxUsesEach,
      usedCount: 0,
    });
    codes.push(code);
  }

  console.log(`[invite] Created ${count} founding codes for "${label}": ${codes.join(', ')}`);
  return codes;
}
