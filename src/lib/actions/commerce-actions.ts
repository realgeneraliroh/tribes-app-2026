'use server';

import { requireAuth } from './shared';

// ======== CONNECT ONBOARDING ========

/**
 * Initiates Stripe Connect onboarding for a tribe.
 * Returns the Stripe-hosted onboarding URL.
 */
export async function startConnectOnboarding(tribeId: string): Promise<{ url: string }> {
  const userId = await requireAuth();

  // Auth: only tribe founders can connect payments
  const { requireTribeFounder } = await import('@/lib/services/tribe-auth');
  await requireTribeFounder(userId, tribeId);

  // Feature gate: commerce requires org tier
  const { hasFeature } = await import('@/lib/services/subscription-guard');
  const has = await hasFeature(userId, 'commerce_5pct');
  if (!has) {
    throw new Error('Commerce requires an Organization tier membership. Upgrade to accept payments.');
  }

  const { createConnectAccount } = await import('@/lib/services/commerce-service');

  // Determine fee based on plan
  const { getUserPlan } = await import('@/lib/services/subscription-guard');
  const plan = await getUserPlan(userId);
  const feePercent = plan.id === 'org_enterprise' ? 2 : plan.id === 'org_pro' ? 3 : 5;

  const { url } = await createConnectAccount(userId, tribeId, feePercent);
  return { url };
}

/**
 * Checks/syncs the Connect account status for a tribe.
 */
export async function refreshConnectStatus(tribeId: string) {
  const userId = await requireAuth();
  const { requireTribeSpeaker } = await import('@/lib/services/tribe-auth');
  await requireTribeSpeaker(userId, tribeId);

  const { syncConnectAccountStatus, getConnectedAccount } = await import('@/lib/services/commerce-service');
  await syncConnectAccountStatus(tribeId);
  return getConnectedAccount(tribeId);
}

// ======== PAYMENTS ========

/**
 * Creates a payment to a tribe and returns the Stripe client secret.
 */
export async function createPayment(tribeId: string, amountCents: number, description?: string) {
  const userId = await requireAuth();
  const { createTribePayment } = await import('@/lib/services/commerce-service');
  return createTribePayment(tribeId, userId, amountCents, description);
}

// ======== READ ========

export async function getConnectAccount(tribeId: string) {
  const { getConnectedAccount } = await import('@/lib/services/commerce-service');
  return getConnectedAccount(tribeId);
}

export async function getTransactions(tribeId: string) {
  const userId = await requireAuth();
  const { requireTribeSpeaker } = await import('@/lib/services/tribe-auth');
  await requireTribeSpeaker(userId, tribeId);
  const { getTribeTransactions } = await import('@/lib/services/commerce-service');
  return getTribeTransactions(tribeId);
}

export async function getRevenueStats(tribeId: string) {
  const userId = await requireAuth();
  const { requireTribeSpeaker } = await import('@/lib/services/tribe-auth');
  await requireTribeSpeaker(userId, tribeId);
  const { getTransactionStats } = await import('@/lib/services/commerce-service');
  return getTransactionStats(tribeId);
}
