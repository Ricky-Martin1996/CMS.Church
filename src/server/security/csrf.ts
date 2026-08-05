import { AppError } from "@/server/errors";

/**
 * CSRF hardening for cookie-authenticated mutating API routes.
 * Browser clients send Origin; cross-site origins are rejected.
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return;

  const allowed = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      allowed.add(new URL(appUrl).origin);
    } catch {
      // ignore malformed env
    }
  }

  try {
    allowed.add(new URL(req.url).origin);
  } catch {
    // ignore
  }

  if (allowed.size === 0) return;

  if (!allowed.has(origin)) {
    throw new AppError("Cross-origin request blocked", "FORBIDDEN", 403);
  }
}
