import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * Critical journey AUTH GATES only.
 * Does not automate Clerk login (CAPTCHA). Asserts unauthenticated access is
 * blocked plus public /api/health.
 *
 * With format-valid but non-real Clerk keys, `auth.protect()` may 307 to
 * `/sign-in` or to Clerk's handshake URL (`x-clerk-auth-status: handshake`)
 * instead of rendering the protected page. Both count as a closed gate.
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

async function expectAuthGate(request: APIRequestContext, path: string) {
  const response = await request.get(path, {
    maxRedirects: 0,
    headers: { Accept: "text/html" },
  });

  const status = response.status();
  const headers = response.headers();
  const location = headers["location"] ?? "";
  const authStatus = headers["x-clerk-auth-status"] ?? "";
  const authReason = headers["x-clerk-auth-reason"] ?? "";
  const rewrite = headers["x-middleware-rewrite"] ?? "";

  // Anonymous users must not receive the protected app document.
  expect(status, `Protected ${path} must not return 200`).not.toBe(200);

  const redirectedToSignIn =
    [301, 302, 303, 307, 308].includes(status) && /\/sign-in/.test(location);
  const clerkHandshake =
    authStatus === "handshake" || /\/v1\/client\/handshake/.test(location);
  const clerkSignedOutProtect =
    authStatus === "signed-out" &&
    (authReason.includes("protect") ||
      authReason.includes("dev-browser") ||
      /\/sign-in/.test(rewrite) ||
      /clerk_/.test(rewrite));

  expect(
    redirectedToSignIn || clerkHandshake || clerkSignedOutProtect,
    `Expected auth gate for ${path} (status=${status}, location=${location}, auth=${authStatus}/${authReason})`,
  ).toBeTruthy();
}

test.describe("Critical journey auth gates", () => {
  for (const module of PROTECTED_MODULES) {
    test(`${module.name} blocks unauthenticated users`, async ({ request }) => {
      await expectAuthGate(request, module.path);
    });
  }

  test("sign-in is publicly reachable (not protect-blocked)", async ({
    request,
  }) => {
    const response = await request.get("/sign-in", {
      maxRedirects: 0,
      headers: { Accept: "text/html" },
    });

    const status = response.status();
    const headers = response.headers();
    const location = headers["location"] ?? "";
    const authStatus = headers["x-clerk-auth-status"] ?? "";
    const authReason = headers["x-clerk-auth-reason"] ?? "";

    // Public route: never Clerk "protect". With fake keys, handshake 307 is OK.
    expect(authReason.includes("protect")).toBeFalsy();
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
