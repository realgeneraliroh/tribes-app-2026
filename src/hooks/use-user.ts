
"use client";

import { MOCK_USER_ROLE } from '@/lib/data';
import type { UserRole } from '@/lib/types';

interface UseUserOutput {
  role: UserRole;
  // In the future, we can add more user properties here
  // e.g., name: string; email: string; etc.
}

/**
 * A centralized hook to get the current user's information.
 * This simulates fetching user data from an authentication context.
 * All role-based logic in the app should use this hook as the source of truth.
 *
 * @returns {UseUserOutput} The current user's role and other details.
 */
export function useUser(): UseUserOutput {
  // In a real app, this would be replaced with a call to a real
  // authentication context provider (e.g., from Firebase Auth, Clerk, etc.)
  // const { user } = useAuth();
  // return { role: user.role };

  // For our prototype, we'll return the mock role.
  return {
    role: MOCK_USER_ROLE,
  };
}
