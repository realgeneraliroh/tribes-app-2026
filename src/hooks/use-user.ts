
"use client";

/**
 * @fileoverview Drop-in re-export of useUser from the centralized UserProvider.
 * 
 * All existing consumers (`import { useUser } from '@/hooks/use-user'`) continue
 * to work without any import changes. The actual user fetch now happens once in
 * <UserProvider> at the (app)/layout.tsx level.
 */

export { useUser } from '@/components/providers/user-provider';
