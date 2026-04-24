/**
 * @fileoverview Contribution tracking service.
 * Phase 3 Revised: Earn-path membership — track community contributions
 * and auto-upgrade users who reach the monthly membership threshold.
 *
 * Design principles (game-theory hardened):
 *   - Tuned for a user spending 2-3 hours/day on the platform
 *   - Monthly earned status (re-evaluated every 30 days)
 *   - Earned status does NOT grant voting rights (coop_voting)
 *   - Moderation points only awarded when report is upheld (via awardModerationPoints)
 *   - Referral points only when referred user verifies email + 7d account age
 *   - Comments tracked separately from posts
 *
 * Point values:
 *   post:          3 pts   (creating content)
 *   comment:       1 pt    (engaging with content)
 *   vibe_given:    1 pt    (reacting, capped at 10/day)
 *   moderation:    5 pts   (upheld reports only — awarded by moderation-service)
 *   referral:     10 pts   (verified referral only — validated signup + 7d age)
 *   event_hosted: 10 pts   (hosting a community event)
 *   event_rsvp:    2 pts   (attending events)
 *   bug_report:    5 pts   (reporting a bug)
 *   tribe_created:  5 pts  (creating a new tribe)
 *
 * Monthly earn threshold: 500 points → earned membership for 30 days
 * Target: ~21 pts/day for an active user → ~24 days to earn
 *
 * IMPORTANT: All queries use the shared `db` from @/db to respect
 * the local-first sync architecture (local SQLite → sqld → public).
 */

import { db } from '@/db';
import { contributions, subscriptions, plans, users } from '@/db/schema';
import { eq, and, sql, gte, sum, lte } from 'drizzle-orm';

const EARN_THRESHOLD = 500;
const EARNED_PLAN_ID = 'individual_coop';
const EARNED_DURATION_DAYS = 30;

// Point values by contribution type
const POINT_VALUES: Record<string, number> = {
  post: 3,
  comment: 1,
  vibe_given: 1,
  moderation: 5,     // Only awarded via awardModerationPoints (upheld reports)
  referral: 10,      // Only awarded via awardReferralPoints (validated)
  event_hosted: 10,
  event_rsvp: 2,
  bug_report: 5,
  tribe_created: 5,
};

// Daily contribution caps by role (anti-farming)
const DAILY_CAPS: Record<string, number> = {
  'Human_Free': 30,
  'Human_Paid': 100,
  'Human_Pro': 200,
  'Admin': 999999, // effectively unlimited
};

// Per-type daily caps (additional anti-farming)
const TYPE_DAILY_CAPS: Record<string, number> = {
  vibe_given: 10,  // Max 10 vibe points per day
  comment: 15,     // Max 15 comment points per day
  post: 10,        // Max ~3 posts worth of points
};

/**
 * Records a contribution and checks if the user has earned membership.
 * Enforces daily contribution cap by user role + per-type caps.
 */
export async function recordContribution(
  userId: string,
  type: string,
  referenceId?: string,
  description?: string,
): Promise<{ points: number; totalPoints: number; earned: boolean }> {
  const pts = POINT_VALUES[type];
  if (!pts) throw new Error(`Unknown contribution type: ${type}`);

  // Block direct calls for moderation/referral — must go through dedicated functions
  if (type === 'moderation') {
    throw new Error('Moderation points must be awarded via awardModerationPoints()');
  }
  if (type === 'referral') {
    throw new Error('Referral points must be awarded via awardReferralPoints()');
  }

  // Get user role for cap lookup
  const [user] = await db.select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const userRole = user?.role ?? 'Human_Free';
  const dailyCap = DAILY_CAPS[userRole] ?? DAILY_CAPS['Human_Free']!;

  // Check today's total
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayResult] = await db.select({
    todayTotal: sql<number>`COALESCE(SUM(${contributions.points}), 0)`,
  }).from(contributions)
    .where(and(
      eq(contributions.userId, userId),
      gte(contributions.createdAt, todayStart),
    ));
  const todayTotal = Number(todayResult?.todayTotal ?? 0);

  if (todayTotal + pts > dailyCap) {
    throw new Error(`Daily contribution cap reached (${dailyCap} pts for ${userRole}). Try again tomorrow.`);
  }

  // Per-type daily cap check
  const typeCap = TYPE_DAILY_CAPS[type];
  if (typeCap !== undefined) {
    const [typeResult] = await db.select({
      typeTotal: sql<number>`COALESCE(SUM(${contributions.points}), 0)`,
    }).from(contributions)
      .where(and(
        eq(contributions.userId, userId),
        eq(contributions.type, type),
        gte(contributions.createdAt, todayStart),
      ));
    const typeTotal = Number(typeResult?.typeTotal ?? 0);
    if (typeTotal + pts > typeCap) {
      // Silently cap — don't error, just return 0 points
      const [totals] = await db.select({
        total: sql<number>`COALESCE(SUM(${contributions.points}), 0)`,
      }).from(contributions).where(eq(contributions.userId, userId));
      return { points: 0, totalPoints: Number(totals?.total ?? 0), earned: false };
    }
  }

  return _insertContribution(userId, type, pts, referenceId, description);
}

/**
 * Awards moderation points — ONLY called when a report results in action.
 * Do NOT call this when a report is filed; call it when a report is upheld.
 */
export async function awardModerationPoints(
  userId: string,
  reportId: string,
): Promise<{ points: number; totalPoints: number; earned: boolean }> {
  const pts = POINT_VALUES['moderation']!;
  return _insertContribution(userId, 'moderation', pts, reportId, 'Upheld content report');
}

/**
 * Awards referral points — ONLY called when the referred user has:
 *   1. Verified their email
 *   2. Account is at least 7 days old
 */
export async function awardReferralPoints(
  referrerId: string,
  referredUserId: string,
): Promise<{ points: number; totalPoints: number; earned: boolean }> {
  // Validate the referred user exists, is verified, and is 7+ days old
  const [referred] = await db.select({
    createdAt: users.createdAt,
    emailVerified: users.emailVerified,
  }).from(users).where(eq(users.id, referredUserId)).limit(1);

  if (!referred) throw new Error('Referred user not found');
  if (!referred.emailVerified) throw new Error('Referred user has not verified email');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (referred.createdAt && referred.createdAt > sevenDaysAgo) {
    throw new Error('Referred user account is less than 7 days old');
  }

  const pts = POINT_VALUES['referral']!;
  return _insertContribution(referrerId, 'referral', pts, referredUserId, 'Verified referral');
}

/**
 * Internal: inserts a contribution record and checks for earned membership.
 */
async function _insertContribution(
  userId: string,
  type: string,
  pts: number,
  referenceId?: string,
  description?: string,
): Promise<{ points: number; totalPoints: number; earned: boolean }> {
  const contribId = `contrib-${userId}-${Date.now()}`;

  // Deduplication: skip if same (userId, type, referenceId) already exists
  if (referenceId) {
    const [existing] = await db.select({ id: contributions.id })
      .from(contributions)
      .where(and(
        eq(contributions.userId, userId),
        eq(contributions.type, type),
        eq(contributions.referenceId, referenceId),
      ))
      .limit(1);

    if (existing) {
      // Already tracked — return current totals without inserting
      const [totals] = await db.select({
        total: sql<number>`COALESCE(SUM(${contributions.points}), 0)`,
      }).from(contributions)
        .where(eq(contributions.userId, userId));
      return { points: 0, totalPoints: Number(totals?.total ?? 0), earned: false };
    }
  }

  // Insert the contribution
  await db.insert(contributions).values({
    id: contribId,
    userId,
    type,
    referenceId: referenceId ?? null,
    points: pts,
    description: description ?? null,
  });

  // Calculate total points in the current 30-day window
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totals] = await db.select({
    total: sql<number>`COALESCE(SUM(${contributions.points}), 0)`,
  }).from(contributions)
    .where(and(
      eq(contributions.userId, userId),
      gte(contributions.createdAt, thirtyDaysAgo),
    ));
  const monthlyPoints = Number(totals?.total ?? 0);

  // Check if user earned membership this month
  let earned = false;
  if (monthlyPoints >= EARN_THRESHOLD) {
    earned = await _grantOrRenewEarnedMembership(userId);
  }

  // Update reputation score + auto-transition status
  const { updateReputation } = await import('@/lib/services/reputation-service');
  await updateReputation(userId, pts);

  return { points: pts, totalPoints: monthlyPoints, earned };
}

/**
 * Grants or renews a monthly earned membership.
 * The earned subscription expires after 30 days and must be re-earned.
 *
 * Earned memberships grant MOST features but NOT coop_voting.
 * Voting requires a paid subscription.
 */
async function _grantOrRenewEarnedMembership(userId: string): Promise<boolean> {
  // Check for existing earned subscription
  const [existingEarned] = await db.select({ id: subscriptions.id, currentPeriodEnd: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.source, 'earned'),
    ))
    .limit(1);

  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EARNED_DURATION_DAYS);

  if (existingEarned) {
    // Renew: extend the period
    await db.update(subscriptions).set({
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: expiresAt,
      updatedAt: now,
    }).where(eq(subscriptions.id, existingEarned.id));

    console.log(`[contributions] User ${userId} renewed earned membership (expires ${expiresAt.toISOString()})`);
    return false; // Renewal, not first earn
  }

  // Check for active paid subscription — don't downgrade
  const [activePaid] = await db.select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active'),
    ))
    .limit(1);

  if (activePaid) return false; // Already has paid — don't create earned

  // Get the earned plan's target role
  const [plan] = await db.select({ targetRole: plans.targetRole })
    .from(plans)
    .where(eq(plans.id, EARNED_PLAN_ID))
    .limit(1);
  const targetRole = plan?.targetRole ?? 'Human_Paid';

  // Create new earned subscription with expiry
  await db.insert(subscriptions).values({
    id: `sub-earned-${userId}-${Date.now()}`,
    userId,
    planId: EARNED_PLAN_ID,
    status: 'active',
    source: 'earned',
    currentPeriodStart: now,
    currentPeriodEnd: expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  await db.update(users)
    .set({ role: targetRole })
    .where(eq(users.id, userId));

  console.log(`[contributions] User ${userId} earned membership! (expires ${expiresAt.toISOString()})`);
  return true;
}

/**
 * Checks and expires earned memberships that have passed their period end.
 * Should be called periodically (e.g., on login, or via cron).
 */
export async function expireEarnedMemberships(): Promise<number> {
  const now = new Date();

  // Find expired earned subscriptions
  const expired = await db.select({ id: subscriptions.id, userId: subscriptions.userId })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.source, 'earned'),
      eq(subscriptions.status, 'active'),
      lte(subscriptions.currentPeriodEnd, now),
    ));

  for (const sub of expired) {
    await db.update(subscriptions).set({
      status: 'canceled',
      updatedAt: now,
    }).where(eq(subscriptions.id, sub.id));

    // Check if user has another active subscription before downgrading role
    const [otherActive] = await db.select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, sub.userId),
        eq(subscriptions.status, 'active'),
      ))
      .limit(1);

    if (!otherActive) {
      await db.update(users)
        .set({ role: 'Human_Free' })
        .where(eq(users.id, sub.userId));
      console.log(`[contributions] User ${sub.userId} earned membership expired — downgraded to free`);
    }
  }

  return expired.length;
}

/**
 * Gets the contribution summary for a user.
 * Now shows monthly points (rolling 30d) instead of all-time.
 */
export async function getContributionSummary(userId: string): Promise<{
  monthlyPoints: number;
  allTimePoints: number;
  threshold: number;
  progress: number; // 0-100 percent
  daysUntilReset: number | null; // Days until earned membership expires
  contributions: Array<{
    type: string;
    points: number;
    description: string | null;
    createdAt: number | null;
  }>;
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const allContribs = await db.select({
    type: contributions.type,
    points: contributions.points,
    description: contributions.description,
    createdAt: contributions.createdAt,
  }).from(contributions)
    .where(eq(contributions.userId, userId))
    .orderBy(contributions.createdAt);

  const allTimePoints = allContribs.reduce((sum, c) => sum + c.points, 0);
  const monthlyPoints = allContribs
    .filter(c => c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo)
    .reduce((sum, c) => sum + c.points, 0);

  // Check for active earned subscription expiry
  let daysUntilReset: number | null = null;
  const [earnedSub] = await db.select({ currentPeriodEnd: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.source, 'earned'),
      eq(subscriptions.status, 'active'),
    ))
    .limit(1);

  if (earnedSub?.currentPeriodEnd) {
    const diff = earnedSub.currentPeriodEnd.getTime() - Date.now();
    daysUntilReset = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    monthlyPoints,
    allTimePoints,
    threshold: EARN_THRESHOLD,
    progress: Math.min(100, Math.floor((monthlyPoints / EARN_THRESHOLD) * 100)),
    daysUntilReset,
    contributions: allContribs.map(c => ({
      ...c,
      createdAt: c.createdAt ? Math.floor(c.createdAt.getTime() / 1000) : null,
    })),
  };
}
