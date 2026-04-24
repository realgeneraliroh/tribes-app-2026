'use server';

import { requireAuth, requireVerifiedEmail, getCurrentUserId } from './shared';
import type { Proposal } from '@/lib/services/voting-service';

// ======== READ ========

export async function getProposals(options?: {
  tribeId?: string | null;
  status?: 'active' | 'closed' | 'canceled';
}): Promise<Proposal[]> {
  const userId = await getCurrentUserId();
  const { getProposals: fn } = await import('@/lib/services/voting-service');
  return fn({ ...options, currentUserId: userId ?? undefined });
}

export async function getProposalById(proposalId: string): Promise<Proposal | null> {
  const userId = await getCurrentUserId();
  const { getProposalById: fn } = await import('@/lib/services/voting-service');
  return fn(proposalId, userId ?? undefined);
}

// ======== MUTATIONS ========

export async function createProposal(payload: {
  title: string;
  description: string;
  tribeId?: string | null;
  deadlineDays: number; // Days from now
  options: string[];
}): Promise<Proposal> {
  const userId = await requireVerifiedEmail();

  // Only admins can create platform-wide proposals (no tribeId)
  if (!payload.tribeId) {
    const { db } = await import('@/db');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (user?.role !== 'Admin') {
      throw new Error('Only platform administrators can create platform-wide proposals.');
    }
  } else {
    // Tribe-scoped: check that user is founder or speaker
    const { requireTribeSpeaker } = await import('@/lib/services/tribe-auth');
    await requireTribeSpeaker(userId, payload.tribeId);
  }

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + payload.deadlineDays);

  const { createProposal: fn } = await import('@/lib/services/voting-service');
  return fn({
    title: payload.title,
    description: payload.description,
    createdBy: userId,
    tribeId: payload.tribeId ?? null,
    deadline,
    options: payload.options,
  });
}

export async function castVote(proposalId: string, optionId: string): Promise<void> {
  const userId = await requireAuth();

  // Feature gate: require coop_voting feature from a PAID subscription
  // Earned memberships do NOT grant voting rights — you must pay to govern.
  const { hasFeature } = await import('@/lib/services/subscription-guard');
  if (!(await hasFeature(userId, 'coop_voting'))) {
    throw new Error('Voting requires a paid Co-Op membership. Upgrade your plan to participate.');
  }

  // Verify subscription source is 'paid' or 'founding' (not 'earned')
  const { db } = await import('@/db');
  const { subscriptions, users } = await import('@/db/schema');
  const { eq, and } = await import('drizzle-orm');
  const [sub] = await db.select({ source: subscriptions.source })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);
  if (sub?.source === 'earned') {
    throw new Error('Earned memberships do not include voting rights. Upgrade to a paid plan to participate in governance.');
  }

  // Account age check: must be 30+ days old
  const [user] = await db.select({
    createdAt: users.createdAt,
    reputationStatus: users.reputationStatus,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (user?.createdAt) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (user.createdAt > thirtyDaysAgo) {
      throw new Error('Your account must be at least 30 days old to vote.');
    }
  }

  // Reputation check: must be Trusted or higher
  const { meetsReputationGate } = await import('@/lib/constants');
  if (!meetsReputationGate(user?.reputationStatus, 'Trusted')) {
    throw new Error('You must have Trusted reputation or higher to vote. Keep contributing to the community!');
  }

  const { castVote: fn } = await import('@/lib/services/voting-service');
  return fn(proposalId, optionId, userId);
}

export async function closeProposal(proposalId: string): Promise<void> {
  const userId = await requireAuth();

  // Verify the user is the proposal creator or admin
  const { getProposalById: get } = await import('@/lib/services/voting-service');
  const proposal = await get(proposalId);
  if (!proposal) throw new Error('Proposal not found');

  const { db } = await import('@/db');
  const { users } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);

  if (proposal.createdBy !== userId && user?.role !== 'Admin') {
    throw new Error('Only the proposal creator or an admin can close a proposal.');
  }

  const { closeProposal: fn } = await import('@/lib/services/voting-service');
  return fn(proposalId);
}

export async function cancelProposal(proposalId: string): Promise<void> {
  const userId = await requireAuth();

  const { getProposalById: get } = await import('@/lib/services/voting-service');
  const proposal = await get(proposalId);
  if (!proposal) throw new Error('Proposal not found');

  const { db } = await import('@/db');
  const { users } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);

  if (proposal.createdBy !== userId && user?.role !== 'Admin') {
    throw new Error('Only the proposal creator or an admin can cancel a proposal.');
  }

  const { cancelProposal: fn } = await import('@/lib/services/voting-service');
  return fn(proposalId);
}
