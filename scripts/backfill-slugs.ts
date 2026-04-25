#!/usr/bin/env tsx
/**
 * @fileoverview Backfill slugs for existing tribes that don't have one.
 *
 * Usage: npx tsx scripts/backfill-slugs.ts
 *
 * This script:
 * 1. Fetches all tribes with NULL slug
 * 2. Generates a unique slug from the tribe name
 * 3. Updates the row
 *
 * Safe to run multiple times (idempotent).
 */

import { db } from '../src/db';
import { tribes } from '../src/db/schema';
import { isNull, eq } from 'drizzle-orm';
import { slugify } from '../src/lib/slugify';

async function backfillSlugs() {
  console.log('🔍 Finding tribes without slugs...');

  const rows = await db
    .select({ id: tribes.id, name: tribes.name, slug: tribes.slug })
    .from(tribes)
    .where(isNull(tribes.slug));

  console.log(`   Found ${rows.length} tribes needing slugs.`);

  if (rows.length === 0) {
    console.log('✅ All tribes already have slugs. Nothing to do.');
    return;
  }

  // Build a set of existing slugs to avoid collisions
  const existingRows = await db
    .select({ slug: tribes.slug })
    .from(tribes);
  const usedSlugs = new Set(existingRows.map(r => r.slug).filter(Boolean));

  let updated = 0;
  for (const row of rows) {
    const base = slugify(row.name) || 'tribe';
    let candidate = base;
    let suffix = 2;

    while (usedSlugs.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix++;
    }

    await db.update(tribes).set({ slug: candidate }).where(eq(tribes.id, row.id));
    usedSlugs.add(candidate);
    console.log(`   ✓ ${row.id} → /t/${candidate}`);
    updated++;
  }

  console.log(`\n✅ Backfilled ${updated} tribe slug(s).`);
}

backfillSlugs().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
