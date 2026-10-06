import { expect, test, type Page } from "@playwright/test";

/**
 * Critical journey AUTH GATES only.
 * Does not automate Clerk login (CAPTCHA). Asserts unauthenticated redirects
 * and the public /api/health readiness probe.
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

async function expectRedirectedToSignIn(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/sign-in/);
}

test.describe("Critical journey auth gates", () => {
  for (const module of PROTECTED_MODULES) {
    test(`${module.name} redirects unauthenticated users to sign-in`, async ({
      page,
    }) => {
      await expectRedirectedToSignIn(page, module.path);
    });
  }

  test("sign-in is publicly reachable", async ({ page }) => {
    const response = await page.goto("/sign-in", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.ok() || response?.status() === 200).toBeTruthy();
    await expect(page).toHaveURL(/\/sign-in/);
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
