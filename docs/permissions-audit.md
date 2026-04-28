# Tribes App — Permissions Model Audit Report
**Date:** April 28, 2026  
**Scope:** End-to-end review of content and view permissions across all layers  
**Reviewer:** Automated code analysis (Cline)

---

## Executive Summary

The permissions model is **well-architected and largely sound**. It follows a clear defense-in-depth strategy with five distinct enforcement layers. The core authority hierarchy is logically ordered and consistently applied. Several **gaps and improvement opportunities** are identified below, none of which are critical exploits, but a few represent meaningful hardening opportunities.

**Overall Rating: 🟢 Strong — with 6 notable gaps to address**

---

## Architecture Overview

The system enforces permissions at five layers, from outermost to innermost:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Proxy (proxy.ts)                                      │
│  JWT verification + DB session revocation check + CSRF inject   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Client-Side Guards (AuthGuard, TribeDetailContext)     │
│  UI gating — blocks render, not data                            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Server Actions (shared.ts guards)                     │
│  requireAuth / requireVerifiedEmail / requireAdmin              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Tribe-Level Auth (tribe-auth.ts)                      │
│  platform_admin > founder > speaker > member > guest            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: Data Access Layer (data-access/tribes.ts, services)   │
│  Row-level visibility filtering (private tribe gating)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Proxy / Middleware (`src/proxy.ts`)

### ✅ What's Working Well

| Check | Implementation |
|-------|---------------|
| JWT signature verification | `jwtVerify` with HS256, fail-fast on tampered tokens |
| DB session revocation | Validates `sessions.revokedAt` and `expiresAt` on every request |
| Session sliding window | 7-day TTL refreshed on each authenticated request |
| CSRF cookie injection | Injected on first authenticated request, `sameSite: strict` |
| Account deletion redirect | Pending-deletion accounts redirected to `/account-recovery` |
| Cookie security | `httpOnly: true`, `secure: true` in production, `sameSite: lax` |

### ⚠️ Gap 1: Public Route Allowlist is Overly Broad

```typescript
// proxy.ts line 28
if (pathname.startsWith('/tribes/') && pathname !== '/tribes/create') return true;
```

**Issue:** The proxy passes ALL `/tribes/[tribeId]/*` sub-routes (settings, manage-members, mod-queue, analytics) through without session verification. These pages rely entirely on client-side `AuthGuard` and server action guards — which is correct, but the proxy could provide an earlier, cheaper rejection for unauthenticated requests to admin sub-routes.

**Risk Level:** Low — server actions enforce auth independently. But unauthenticated users can load the page shell before being redirected.

**Recommendation:** Tighten the allowlist:
```typescript
// Only allow the tribe detail page itself publicly, not admin sub-routes
if (pathname.match(/^\/tribes\/[^/]+$/) || pathname.match(/^\/t\/[^/]+$/)) return true;
```

### ⚠️ Gap 2: DB Fail-Open on Session Check

```typescript
// proxy.ts lines 101-105
} catch (dbErr) {
  // DB unavailable — fail open to avoid locking out all users during
  // transient DB issues. Log for alerting.
  console.error('[proxy] Session DB check failed, failing open:', dbErr);
}
```

**Issue:** If the DB is unavailable, the proxy accepts any valid JWT regardless of revocation status. This is a deliberate trade-off (availability over security), but it means a revoked session can be used during DB outages.

**Risk Level:** Low-Medium — requires both a DB outage AND a compromised/revoked session to be exploitable.

**Recommendation:** Document this trade-off explicitly in the security architecture docs. Consider a short-lived in-memory revocation cache as a middle ground.

---

## Layer 2: Client-Side Guards

### ✅ What's Working Well

**`AuthGuard` component** (`src/components/providers/auth-guard.tsx`):
- Blocks unauthenticated users with a login gate card
- Supports `requiredRole` prop for role-based UI gating
- Admin pages (`/admin/mod-queue`) correctly use `<AuthGuard requiredRole="Admin">`

**`TribeDetailContext`** (`src/app/(app)/tribes/[tribeId]/tribe-detail-context.tsx`):
- Calls `checkTribeAccess()` server-side on load to resolve `TribeAccessLevel`
- Derives `isTribeAdmin` and `isTribeSpeaker` from server-verified access level
- Conditionally fetches moderation reports only for speakers/founders/admins

### ⚠️ Gap 3: Client-Side Role Check is UI-Only (Not a Security Boundary)

```typescript
// admin/mod-queue/page.tsx lines 98-101
useEffect(() => {
  const canAccess = role === 'Admin';
  setHasAccess(canAccess);
}, [role]);
```

**Issue:** The `role` value comes from `useUser()` which reads from a client-side context populated by a server action. The actual security enforcement happens in `getActiveGlobalReports()` → `requireAdmin()`. The client-side check is purely UX. This is architecturally correct but should be clearly documented — the client check is cosmetic, not a security boundary.

**Risk Level:** None — server actions enforce independently. But the pattern could mislead future developers into thinking the client check is sufficient.

**Recommendation:** Add a comment to `AuthGuard` and admin pages clarifying: "This is a UX gate only. Security is enforced server-side in the action layer."

---

## Layer 3: Server Action Guards (`src/lib/actions/shared.ts`)

### ✅ What's Working Well

The guard hierarchy is clean and well-composed:

```
getCurrentUserId()          → reads JWT session (no auth required)
    ↓
requireAuth()               → validates CSRF + checks session + checks platform ban
    ↓
requireVerifiedEmail()      → requireAuth() + checks emailVerified flag
    ↓
requireAdmin()              → requireAuth() + checks users.role === 'Admin'
```

**Ban enforcement** is correctly placed in `requireAuth()` — every authenticated action checks the platform ban before proceeding.

**CSRF validation** is integrated into `requireAuth()` — all mutations go through CSRF validation.

**Email verification gate** is applied to content creation (posts, comments, tribe creation, events) but NOT to read operations — this is the correct philosophy.

### ✅ Action-Level Permission Matrix

| Action | Guard Used | Correct? |
|--------|-----------|----------|
| `createRingPost` | `requireVerifiedEmail` | ✅ |
| `createTribePost` | `requireVerifiedEmail` | ✅ |
| `createComment` | `requireVerifiedEmail` | ✅ |
| `editPost` | `requireAuth` + owner check | ✅ |
| `deleteOwnPost` | `requireAuth` + owner check | ✅ |
| `toggleVibe` | `requireAuth` | ✅ |
| `reportPost` | `requireAuth` | ✅ |
| `dismissReport` | `requireAuth` + `requireTribeSpeaker` | ✅ |
| `removePost` | `requireAuth` + `requireTribeSpeaker` | ✅ |
| `escalateReport` | `requireAdmin` | ✅ |
| `banUser` | `requireAdmin` | ✅ |
| `banMemberFromTribe` | `requireAuth` + `requireTribeFounder` | ✅ |
| `sendMessage` | `requireAuth` + bond ownership + bond status | ✅ |
| `getMessagesForBond` | `requireAuth` | ⚠️ See Gap 4 |
| `getPostKeyGrants` | `requireAuth` | ✅ |
| `createTribe` | `requireVerifiedEmail` + subscription guard | ✅ |
| `updateTribeSettings` | `requireAuth` + `requireTribeFounder` | ✅ |
| `updateMemberRole` | `requireAuth` + `requireTribeFounder` | ✅ |
| `approveJoinRequest` | `requireAuth` + `requireTribeSpeaker` | ✅ |
| `getTribeAnalytics` | `requireAuth` + `requireTribeSpeaker` | ✅ |
| `getAdvancedTribeAnalytics` | `requireAuth` + `requireTribeSpeaker` + feature gate | ✅ |
| `getActiveGlobalReports` | `requireAdmin` | ✅ |
| `getActiveReportsForTribe` | `requireAuth` + `requireTribeSpeaker` | ✅ |
| `searchAll` | None (public) | ✅ intentional |
| `getUnifiedFeedAction` | `getCurrentUserId` (soft) | ✅ returns [] if unauthed |

### ⚠️ Gap 4: `getMessagesForBond` Does Not Verify Bond Ownership

```typescript
// content-actions.ts line 901-904
export async function getMessagesForBond(bondId: string, limit?: number, beforeTimestamp?: Date) {
  const userId = await requireAuth();
  const { getMessages: fn } = await import('@/lib/services/message-service');
  return fn(bondId, userId, limit, beforeTimestamp);
}
```

**Issue:** The action calls `requireAuth()` but does not verify that `userId` is a participant in `bondId` before passing to the service. The security depends entirely on `message-service.getMessages()` enforcing this. This is a **trust-the-service** pattern that should be verified.

**Risk Level:** Medium — if `message-service.getMessages()` doesn't filter by userId, any authenticated user could read any bond's messages by guessing a bondId.

**Recommendation:** Add an explicit bond ownership check in the action:
```typescript
export async function getMessagesForBond(bondId: string, ...) {
  const userId = await requireAuth();
  // Verify caller is a participant in this bond
  const [bond] = await db.select().from(bonds)
    .where(and(eq(bonds.id, bondId), eq(bonds.userId, userId))).limit(1);
  if (!bond) throw new Error('Bond not found or access denied.');
  return fn(bondId, userId, limit, beforeTimestamp);
}
```

---

## Layer 4: Tribe-Level Authority (`src/lib/services/tribe-auth.ts`)

### ✅ What's Working Well

The authority waterfall is clean and well-documented:

```
platform_admin  → full access to everything
    ↓
founder         → full tribe governance (settings, ban, appoint speakers)
    ↓
speaker         → moderation + representation (dismiss reports, approve joins)
    ↓
member          → participation only (post, comment, vibe)
    ↓
guest           → read-only (public tribes only)
```

**Dual founder detection** is correctly implemented — checks both `tribes.createdBy` AND `tribeMembers.role === 'founder'`, preventing a founder from losing access if they're also listed as a member.

**Exported guard functions** (`requireTribeSpeaker`, `requireTribeFounder`) are used consistently across all tribe mutation actions.

### ⚠️ Gap 5: `regenerateInviteToken` Uses Inline Auth Instead of `tribe-auth.ts`

```typescript
// tribe-actions.ts lines 47-53
const [membership] = await db.select({ role: tribeMembers.role })
  .from(tribeMembers)
  .where(and(eq(tribeMembers.tribeId, tribeId), eq(tribeMembers.userId, userId)))
  .limit(1);

if (!membership || !['founder', 'speaker'].includes(membership.role || '')) {
  throw new Error('Only tribe founders and speakers can regenerate invite links');
}
```

**Issue:** This function bypasses `tribe-auth.ts` and implements its own inline role check. It also misses the `platform_admin` case — a platform admin cannot regenerate invite tokens even though they should be able to.

**Risk Level:** Low — the check is functionally correct for normal users, but inconsistent with the authority model.

**Recommendation:** Replace with:
```typescript
const { requireTribeSpeaker } = await import('@/lib/services/tribe-auth');
await requireTribeSpeaker(userId, tribeId);
```

---

## Layer 5: Data Access Layer

### ✅ What's Working Well

**`getViewerTribeIds()`** in `data-access/tribes.ts` is the canonical private-tribe visibility resolver:
- Guests → public tribes only
- Authenticated users → public tribes + their private memberships
- Platform admins → all tribes

This function is called by `getTribeById`, `getTribeBySlug`, `findTribeByName`, and `getTribes` — all tribe read paths are gated.

**`getPostsForTribe()`** in `content-actions.ts` correctly calls `getTribeById` with the viewer's userId before fetching posts, ensuring private tribe content is gated.

**`getCommentsForPost()`** correctly resolves the parent post's tribe and gates on private tribe membership before returning comments.

**Feed service** (`feed-service.ts`) correctly:
- Filters journal posts to own-only
- Filters inner_circle posts to inner-circle bond targets only
- Filters my_people posts to all active bond targets
- Filters tribe posts to user's tribe memberships
- Enforces bond status (active/fading only — dormant/expired bonds lose content access)
- Applies blocked user filtering at every ring level

### ⚠️ Gap 6: Mood Stream Posts Have No Visibility Gating

```typescript
// feed-service.ts lines 291-293
async function fetchMoodStreamPosts(...): Promise<CommunicationItem[]> {
  const tagRows = await db.select().from(postMoodTags);
  const postIds = [...new Set(tagRows.map(t => t.postId))];
```

**Issue:** Mood stream posts are fetched without any tribe visibility check. A post from a **private tribe** that gets promoted to a mood stream becomes visible to ALL users (including non-members) via the mood stream feed.

**Risk Level:** Medium-High — this is a genuine content leak. Private tribe content should not be discoverable via mood streams.

**Recommendation:** After fetching posts, filter out posts from private tribes that the viewer is not a member of:
```typescript
// After fetching allPosts, filter private tribe posts
const privateTribePostIds = new Set(
  allPosts
    .filter(p => p.tribeId && !visibleTribeIds.has(p.tribeId))
    .map(p => p.id)
);
const visiblePosts = allPosts.filter(p => !privateTribePostIds.has(p.id));
```

---

## Cross-Cutting Concerns

### ✅ Rate Limiting

Rate limiters are applied to all write operations:
- `postLimiter` → posts, edits, messages
- `commentLimiter` → comments
- `rsvpLimiter` → vibes, RSVPs

### ✅ Subscription Guards

Tribe creation is gated by `canCreateTribe()` subscription check. Advanced analytics are gated by `hasFeature('analytics')`. These are correctly placed in the action layer.

### ✅ E2E Encryption Key Grant Security

`getPostKeyGrants()` correctly:
1. Requires authentication
2. Filters grants to `recipientId === userId` only
3. Validates bond status (active/fading only) before returning wrapped keys
4. Maps author bond IDs to recipient bond IDs (prevents cross-bond key leakage)

### ✅ Bond Status as Content Boundary

Bond expiry/dormancy is consistently enforced as a content access boundary:
- Feed service filters bond targets by `isActiveBond()`
- `sendMessage` rejects messages on dormant/expired bonds
- `getPostKeyGrants` filters to active/fading bonds only

### ✅ Blocked User Filtering

`getBlockedAuthorIds()` is called at the feed service level and applied to all ring post queries and bond message queries.

---

## Summary of Gaps

| # | Gap | Layer | Risk | Effort to Fix |
|---|-----|-------|------|---------------|
| 1 | Proxy allowlist too broad for tribe admin sub-routes | Proxy | Low | Low |
| 2 | DB fail-open on session revocation check | Proxy | Low-Med | Medium |
| 3 | Client-side role check not documented as UX-only | Client | None | Low |
| 4 | `getMessagesForBond` doesn't verify bond ownership in action | Action | Medium | Low |
| 5 | `regenerateInviteToken` bypasses `tribe-auth.ts` | Action | Low | Low |
| 6 | Mood stream posts leak private tribe content | Data Access | **Medium-High** | Medium |

---

## Priority Recommendations

### 🔴 Fix First (Gap 6 — Content Leak)
Private tribe posts promoted to mood streams are visible to non-members. Add viewer-aware tribe visibility filtering to `fetchMoodStreamPosts()`.

### 🟡 Fix Soon (Gap 4 — Bond Message Access)
Verify bond ownership in `getMessagesForBond()` at the action layer, not just trusting the service layer.

### 🟢 Fix When Convenient
- Gap 1: Tighten proxy public route allowlist
- Gap 5: Standardize `regenerateInviteToken` to use `tribe-auth.ts`
- Gap 3: Add documentation comments to admin pages clarifying client vs server security boundaries
- Gap 2: Document the fail-open trade-off in security architecture docs

---

## What's Exceptionally Well Done

1. **`tribe-auth.ts` as a single source of truth** — all tribe-level authorization flows through one file with clear, composable guard functions. This is textbook.

2. **Defense in depth** — every sensitive operation has at least 2 independent enforcement points (proxy + action, or action + service). No single point of failure.

3. **Ban enforcement in `requireAuth()`** — platform bans are checked at the root of every authenticated action, making it impossible to bypass via any code path.

4. **Bond status as a content boundary** — the `computePasskeyStatus()` check is applied consistently across feed, messaging, and key grant retrieval. Dormant bonds truly lose access.

5. **Private tribe visibility resolver** — `getViewerTribeIds()` is a clean, reusable function that correctly handles guests, members, and admins, and is called by all tribe read paths.

6. **E2E key grant scoping** — the `postKeyGrants` system correctly scopes decryption keys to recipients and validates bond status before returning them.

---

*Report generated by automated code analysis. All line references are accurate as of commit `38cc99c`.*
