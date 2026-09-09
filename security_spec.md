# Security Specification: Agente 077 - Rogue Espionage

## 1. Data Invariants
- **User Profile Ownership**: A user document in `/users/{userId}` can only be created and updated by the authenticated user whose `request.auth.uid == userId`.
- **Immutable User Identity**: `id` and `createdAt` can never be modified after document creation.
- **Strict Size Limits**: User display names must not exceed 64 characters; avatar URLs must not exceed 500 characters.
- **Leaderboard Run Authorship**: Any leaderboard entry in `/leaderboard/{runId}` must have `userId == request.auth.uid`. Runs cannot be edited or overwritten once created (immutable terminal runs).
- **Default Deny**: All unmapped collections or paths return `PERMISSION_DENIED`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Profile Creation**: Write to `/users/abc` with `request.auth = null`.
2. **Identity Spoofing Profile**: User `uid_alice` writes to `/users/uid_bob`.
3. **Ghost Field Injection**: User writes to `/users/{uid}` with unexpected field `isAdmin: true`.
4. **Oversized Display Name**: Profile creation with 500-char `displayName`.
5. **Client-Forced Server Timestamp Manipulation**: Write `createdAt: 1000` instead of `request.time`.
6. **Immutable ID Overwrite**: Update profile attempting to change `id: "hacked"`.
7. **Leaderboard Identity Spoofing**: User `uid_alice` creates a run with `userId: "uid_bob"`.
8. **Leaderboard Run Mutability**: User attempts to update or alter an existing leaderboard score.
9. **Leaderboard Run Deletion**: Non-admin or attacker attempts to delete another player's leaderboard entry.
10. **Path Poisoning**: Target document ID containing invalid characters `../etc/passwd` or oversized ID (>128 chars).
11. **Negative Numeric Stats Attack**: Profile update setting `highestFloor: -99` or `totalRads: -500`.
12. **Blind List Query Scraping**: Unauthenticated attempt to dump `/users` or write without query constraints.
