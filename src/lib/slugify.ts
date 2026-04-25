/**
 * @fileoverview URL-safe slug generation for tribes.
 *
 * Slugs are immutable once set — renaming a tribe does NOT change its URL.
 * Collisions are resolved with a numeric suffix (e.g. "moore-family-2").
 */

import { db } from '@/db';
import { tribes } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Convert a human string to a URL-safe slug.
 *
 * "Moore Family"     → "moore-family"
 * "AI Innovators"    → "ai-innovators"
 * "Trïbe (Official!)" → "tribe-official"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')                    // Decompose accents
    .replace(/[\u0300-\u036f]/g, '')     // Strip diacritics
    .replace(/[^a-z0-9]+/g, '-')        // Non-alphanumeric → hyphens
    .replace(/^-+|-+$/g, '')            // Trim leading/trailing hyphens
    .slice(0, 60);                       // Max length
}

/**
 * Generate a unique slug for a tribe name.
 * If "moore-family" is taken, tries "moore-family-2", "moore-family-3", etc.
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'tribe';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await db
      .select({ id: tribes.id })
      .from(tribes)
      .where(eq(tribes.slug, candidate))
      .limit(1);

    if (existing.length === 0) return candidate;

    candidate = `${base}-${suffix}`;
    suffix++;
  }
}
