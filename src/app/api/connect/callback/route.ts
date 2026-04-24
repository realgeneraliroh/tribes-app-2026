import { NextRequest, NextResponse } from 'next/server';

/**
 * Stripe Connect onboarding callback.
 * After the tribe owner completes Stripe onboarding, they're redirected here.
 * We sync the account status and redirect back to tribe settings.
 */
export async function GET(request: NextRequest) {
  const tribeId = request.nextUrl.searchParams.get('tribeId');
  if (!tribeId) {
    return NextResponse.redirect(new URL('/tribes', request.url));
  }

  try {
    const { syncConnectAccountStatus } = await import('@/lib/services/commerce-service');
    await syncConnectAccountStatus(tribeId);
  } catch (e) {
    console.error('[Connect Callback] Failed to sync account status:', e);
  }

  // Redirect back to tribe settings with success indicator
  return NextResponse.redirect(
    new URL(`/tribes/${tribeId}/settings?connect=success`, request.url)
  );
}
