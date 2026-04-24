/**
 * @fileoverview Commerce service — Stripe Connect integration for org tribes.
 * Phase 4B: Enables org-tier tribes to receive payments through the platform
 * with configurable platform fees (5% Base, negotiable Enterprise).
 *
 * Flow:
 *   1. Org tribe owner initiates Stripe Connect onboarding
 *   2. Stripe redirects to callback → we record the connected account
 *   3. Tribe can now create payment links / accept donations
 *   4. Payments split: seller gets (100 - fee)%, platform gets fee%
 */

import { db } from '@/db';
import { connectedAccounts, transactions, tribes } from '@/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import Stripe from 'stripe';

// ── Stripe Client ──

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2025-03-31.basil' as Stripe.LatestApiVersion });
}

// ── Connect Onboarding ──

/**
 * Creates a Stripe Connect account and returns the onboarding URL.
 * The tribe owner completes onboarding on Stripe, then returns to the callback.
 */
export async function createConnectAccount(
  userId: string,
  tribeId: string,
  platformFeePercent: number = 5,
): Promise<{ url: string; accountId: string }> {
  // Check for existing account
  const [existing] = await db.select().from(connectedAccounts)
    .where(eq(connectedAccounts.tribeId, tribeId))
    .limit(1);

  if (existing) {
    // Re-create an onboarding link for incomplete accounts
    if (existing.status !== 'active') {
      const stripe = getStripe();
      const link = await stripe.accountLinks.create({
        account: existing.stripeAccountId,
        refresh_url: `${process.env.APP_URL || 'https://tribes.app'}/tribes/${tribeId}/settings?connect=refresh`,
        return_url: `${process.env.APP_URL || 'https://tribes.app'}/api/connect/callback?tribeId=${tribeId}`,
        type: 'account_onboarding',
      });
      return { url: link.url, accountId: existing.stripeAccountId };
    }
    throw new Error('This tribe already has an active Stripe Connect account.');
  }

  const stripe = getStripe();

  // Create Express account
  const account = await stripe.accounts.create({
    type: 'express',
    metadata: {
      tribeId,
      userId,
    },
  });

  // Record in DB
  await db.insert(connectedAccounts).values({
    id: `ca-${Date.now()}`,
    tribeId,
    userId,
    stripeAccountId: account.id,
    status: 'pending',
    chargesEnabled: false,
    payoutsEnabled: false,
    platformFeePercent,
  });

  // Generate onboarding link
  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.APP_URL || 'https://tribes.app'}/tribes/${tribeId}/settings?connect=refresh`,
    return_url: `${process.env.APP_URL || 'https://tribes.app'}/api/connect/callback?tribeId=${tribeId}`,
    type: 'account_onboarding',
  });

  return { url: link.url, accountId: account.id };
}

/**
 * Called after the Connect onboarding callback — checks account status.
 */
export async function syncConnectAccountStatus(tribeId: string): Promise<void> {
  const [ca] = await db.select().from(connectedAccounts)
    .where(eq(connectedAccounts.tribeId, tribeId))
    .limit(1);
  if (!ca) return;

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(ca.stripeAccountId);

  await db.update(connectedAccounts).set({
    status: account.charges_enabled && account.payouts_enabled ? 'active'
      : account.requirements?.disabled_reason ? 'restricted'
      : 'pending',
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
  }).where(eq(connectedAccounts.tribeId, tribeId));
}

// ── Payments ──

/**
 * Creates a payment intent for a tribe transaction with platform fee split.
 */
export async function createTribePayment(
  tribeId: string,
  buyerId: string,
  amountCents: number,
  description?: string,
): Promise<{ clientSecret: string; transactionId: string }> {
  if (amountCents < 100) throw new Error('Minimum payment is $1.00');

  // Get connected account
  const [ca] = await db.select().from(connectedAccounts)
    .where(and(eq(connectedAccounts.tribeId, tribeId), eq(connectedAccounts.status, 'active')))
    .limit(1);
  if (!ca) throw new Error('This tribe does not have payments enabled.');

  // Get tribe owner
  const [tribe] = await db.select({ createdBy: tribes.createdBy }).from(tribes)
    .where(eq(tribes.id, tribeId)).limit(1);
  if (!tribe?.createdBy) throw new Error('Tribe not found');

  // Calculate fee split
  const feePercent = ca.platformFeePercent ?? 5;
  const platformFeeCents = Math.round(amountCents * (feePercent / 100));
  const sellerAmountCents = amountCents - platformFeeCents;

  const stripe = getStripe();

  // Create payment intent with automatic transfer
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    description: description ?? `Payment to ${tribeId}`,
    application_fee_amount: platformFeeCents,
    transfer_data: {
      destination: ca.stripeAccountId,
    },
    metadata: {
      tribeId,
      buyerId,
    },
  });

  // Record transaction
  const txnId = `txn-${Date.now()}`;
  await db.insert(transactions).values({
    id: txnId,
    tribeId,
    buyerId,
    sellerId: tribe.createdBy,
    amountCents,
    platformFeeCents,
    sellerAmountCents,
    description,
    stripePaymentIntentId: paymentIntent.id,
    status: 'pending',
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    transactionId: txnId,
  };
}

/**
 * Updates transaction status (called from webhook).
 */
export async function updateTransactionStatus(
  stripePaymentIntentId: string,
  status: 'completed' | 'failed' | 'refunded',
): Promise<void> {
  await db.update(transactions).set({ status })
    .where(eq(transactions.stripePaymentIntentId, stripePaymentIntentId));
}

// ── Read Operations ──

export async function getConnectedAccount(tribeId: string) {
  const [ca] = await db.select().from(connectedAccounts)
    .where(eq(connectedAccounts.tribeId, tribeId))
    .limit(1);
  return ca ?? null;
}

export async function getTribeTransactions(tribeId: string, limit = 20) {
  return db.select().from(transactions)
    .where(eq(transactions.tribeId, tribeId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getTransactionStats(tribeId: string) {
  const [result] = await db.select({
    totalRevenue: sql<number>`COALESCE(SUM(${transactions.sellerAmountCents}), 0)`,
    totalFees: sql<number>`COALESCE(SUM(${transactions.platformFeeCents}), 0)`,
    txnCount: count(),
  }).from(transactions)
    .where(and(eq(transactions.tribeId, tribeId), eq(transactions.status, 'completed')));

  return {
    totalRevenueCents: Number(result?.totalRevenue ?? 0),
    totalFeesCents: Number(result?.totalFees ?? 0),
    transactionCount: result?.txnCount ?? 0,
  };
}
