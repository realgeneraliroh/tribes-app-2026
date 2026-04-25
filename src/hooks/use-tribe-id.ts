/**
 * @fileoverview Hook to resolve a tribe from either a slug or tribeId URL param.
 * Used by sub-pages (settings, analytics, manage-members, mod-queue) that need
 * to work under both /tribes/[tribeId] (legacy) and /t/[slug] (new) routes.
 */

'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTribeBySlug, getTribeById } from '@/lib/actions/tribe-actions';

/**
 * Resolves the effective tribeId from URL params.
 * Supports both `/tribes/[tribeId]` and `/t/[slug]` routes.
 */
export function useTribeIdFromParams(): { tribeId: string; isResolving: boolean } {
  const params = useParams();
  const slugParam = params.slug as string | undefined;
  const tribeIdParam = params.tribeId as string | undefined;
  const [resolvedId, setResolvedId] = useState(tribeIdParam || '');
  const [isResolving, setIsResolving] = useState(!!slugParam && !tribeIdParam);

  useEffect(() => {
    if (slugParam && !tribeIdParam) {
      setIsResolving(true);
      getTribeBySlug(slugParam).then(tribe => {
        if (tribe) setResolvedId(tribe.id);
        setIsResolving(false);
      }).catch(() => setIsResolving(false));
    }
  }, [slugParam, tribeIdParam]);

  return { tribeId: resolvedId || tribeIdParam || '', isResolving };
}
