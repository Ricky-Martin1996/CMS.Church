import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Request-scoped memoization helpers.
 * React `cache()` dedupes work within a single RSC/request tree.
 */

export { cache };

/**
 * Build a short-lived org-scoped cache for expensive read models.
 * Mutations should call `revalidateTag` / `revalidatePath` as they already do.
 */
export function cachedOrgQuery<TArgs extends unknown[], TResult>(
  keyParts: string[],
  fn: (...args: TArgs) => Promise<TResult>,
  options?: { revalidateSeconds?: number; tags?: string[] }
) {
  const revalidate = options?.revalidateSeconds ?? 60;
  return (...args: TArgs) => {
    const orgId = String(args[0] ?? "unknown");
    const cached = unstable_cache(
      () => fn(...args),
      [...keyParts, orgId, ...args.slice(1).map(String)],
      {
        revalidate,
        tags: [
          `org:${orgId}`,
          ...keyParts.map((k) => `org:${orgId}:${k}`),
          ...(options?.tags ?? []),
        ],
      }
    );
    return cached();
  };
}
