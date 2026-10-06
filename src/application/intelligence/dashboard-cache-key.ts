/**
 * BUG-006: Dashboard `unstable_cache` must be keyed by user as well as org/role.
 * Greeting and other contextual fields are user-specific; omitting userId
 * leaked User A's greeting to User B for ~45s.
 */
export function executiveDashboardCacheKey(input: {
  organizationId: string;
  role: string;
  userId: string;
}): string[] {
  return [
    "executive-dashboard",
    input.organizationId,
    input.role,
    input.userId,
  ];
}
