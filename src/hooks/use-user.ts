
"use client";

import { mockUserProfile } from '@/lib/data';
import type { UserProfile, UserRole } from '@/lib/types';

interface UseUserOutput {
  role: UserRole;
  user: UserProfile;
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
  // const { user: authUser } = useAuth();
  // return { role: authUser.role, user: authUser };

  // For our prototype, we'll return the mock user profile.
  return {
    role: mockUserProfile.role,
    user: mockUserProfile,
  };
}
