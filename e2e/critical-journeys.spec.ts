import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * Critical journey AUTH GATES only.
 * Does not automate Clerk login (CAPTCHA).
 *
 * With format-valid but non-real Clerk keys, middleware may:
 * - 307 to `/sign-in`
 * - 307 to Clerk handshake (`x-clerk-auth-status: handshake`)
 * - rewrite to an internal `/clerk_*` path (often surfaces as 404)
 * Either outcome proves the route is not publicly accessible.
 */

const PROTECTED_MODULES: Array<{ name: string; path: string }> = [
  { name: "onboarding", path: "/onboarding" },
  { name: "dashboard", path: "/dashboard" },
  { name: "people", path: "/people" },
  { name: "households", path: "/households" },
  { name: "attendance", path: "/attendance" },
  { name: "visitors", path: "/visitors" },
  { name: "ministries", path: "/ministries" },
  { name: "volunteers", path: "/volunteers" },
  { name: "events", path: "/events" },
  { name: "communications", path: "/communications" },
  { name: "settings", path: "/settings" },
];

async function assertRouteProtected(
  request: APIRequestContext,
  path: string,
) {
  const response = await request.get(path, {
    maxRedirects: 0,
    headers: { Accept: "text/html" },
  });
  const status = response.status();
  const location = response.headers()["location"] ?? "";
  const authStatus = response.headers()["x-clerk-auth-status"] ?? "";
  const authReason = response.headers()["x-clerk-auth-reason"] ?? "";
  const rewrite = response.headers()["x-middleware-rewrite"] ?? "";

  const redirectedToSignIn =
    [301, 302, 303, 307, 308].includes(status) && /\/sign-in/i.test(location);

  const clerkHandshake =
    authStatus === "handshake" || /\/v1\/client\/handshake/.test(location);

  const clerkBlocked =
    authStatus === "signed-out" ||
    /protect|signed-out|dev-browser/i.test(authReason) ||
    /clerk_/i.test(rewrite) ||
    status === 404;

  expect(
    redirectedToSignIn || clerkHandshake || clerkBlocked,
    `Expected ${path} to be auth-protected (status=${status}, location=${location}, auth=${authStatus}/${authReason})`,
  ).toBeTruthy();

  // Must never serve authenticated app shell as a plain 200.
  if (status === 200) {
    expect(authStatus).not.toBe("signed-in");
  }
}

test.describe("Critical journey auth gates", () => {
  for (const module of PROTECTED_MODULES) {
    test(`${module.name} is auth-protected`, async ({ request }) => {
      await assertRouteProtected(request, module.path);
    });
  }

  test("sign-in is publicly reachable or Clerk-handshake", async ({
    request,
  }) => {
    const response = await request.get("/sign-in", {
      maxRedirects: 0,
      headers: { Accept: "text/html" },
    });
    const status = response.status();
    const location = response.headers()["location"] ?? "";
    const authStatus = response.headers()["x-clerk-auth-status"] ?? "";
    const authReason = response.headers()["x-clerk-auth-reason"] ?? "";

    // Public route: never Clerk "protect". With fake keys, handshake 307 is OK.
    expect(authReason.includes("protect")).toBeFalsy();
    expect(status).toBeLessThan(500);
    const publiclyOk =
      status === 200 ||
      (status === 307 &&
        (authStatus === "handshake" ||
          /\/v1\/client\/handshake/.test(location) ||
          /\/sign-in/.test(location)));
    expect(
      publiclyOk,
      `Expected public sign-in access (status=${status}, location=${location}, auth=${authStatus}/${authReason})`,
    ).toBeTruthy();
  });

  test("/api/health responds without auth", async ({ request }) => {
    const response = await request.get("/api/health");
    // Health is public: 200 when DB ready, 503 when not — never auth-blocked.
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("ok");
    expect(body).toHaveProperty("database");
  });
});
