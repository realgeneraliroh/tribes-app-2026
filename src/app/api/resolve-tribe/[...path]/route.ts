import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tribes } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Resolves a legacy tribe ID to its slug and issues a 301 redirect.
 * Handles: /api/resolve-tribe/tribe-XXXX → 301 /t/{slug}
 * Handles: /api/resolve-tribe/tribe-XXXX/settings → 301 /t/{slug}/settings
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const tribeId = path[0]; // "tribe-1777069855376"
  const suffix = path.length > 1 ? '/' + path.slice(1).join('/') : '';

  // Look up the tribe's slug
  const rows = await db
    .select({ slug: tribes.slug, id: tribes.id })
    .from(tribes)
    .where(eq(tribes.id, tribeId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.redirect(new URL('/tribes', request.url), 302);
  }

  // If slug exists, redirect to /t/{slug}
  if (row.slug) {
    return NextResponse.redirect(
      new URL(`/t/${row.slug}${suffix}`, request.url),
      301
    );
  }

  // Fallback: tribe exists but has no slug yet — render the old route
  return NextResponse.redirect(
    new URL(`/tribes/${tribeId}${suffix}`, request.url),
    302
  );
}
