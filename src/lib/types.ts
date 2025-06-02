
/**
 * @fileOverview Defines shared TypeScript types for the application.
 */

/**
 * Defines the different user roles within the Tribes.app system.
 * - Admin: Site administrators with broad powers.
 * - Creator: Users who can create and manage tribes, organize events, and potentially monetize content.
 * - Speaker: (Moderator) Users elected or appointed to moderate tribes and assist in content promotion.
 * - Human: Regular default users who can create simple tribes, manage family, and connections.
 * - Bot: API-driven interfaces with specific rulesets, distinct from human users.
 */
export type UserRole = "Admin" | "Creator" | "Speaker" | "Human" | "Bot";

// Example of how UserRole might be used on a conceptual user object:
/*
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  // ... other profile properties
}
*/

// Other shared types can be added here as the application grows.
// For instance, if the Bond interface (currently in /src/app/(app)/bonds/page.tsx)
// needs to be used in more places, it could be centralized here.
