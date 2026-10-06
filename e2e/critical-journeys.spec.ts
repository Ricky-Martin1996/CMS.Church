import { expect, test } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const consoleErrors: string[] = [];
const networkFailures: string[] = [];
const performance: Array<{ route: string; ttfbMs: number; loadMs: number }> =
  [];

test.beforeEach(async ({ page }, testInfo) => {
  consoleErrors.length = 0;
  networkFailures.length = 0;
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(`[${testInfo.title}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(`[${testInfo.title}] pageerror: ${err.message}`);
  });
  page.on("requestfailed", (req) => {
    // Clerk/CDN aborts are noisy; keep document-level failures.
    const url = req.url();
    if (url.includes("clerk") || url.includes("cloudflare")) return;
    networkFailures.push(
      `[${testInfo.title}] ${req.failure()?.errorText ?? "failed"} ${url}`
    );
  });
});

test.afterEach(async ({}, testInfo) => {
  mkdirSync("qa-report", { recursive: true });
  writeFileSync(
    join("qa-report", `meta-${testInfo.title.replace(/\W+/g, "_")}.json`),
    JSON.stringify({ consoleErrors: [...consoleErrors], networkFailures: [...networkFailures] }, null, 2)
  );
});

test.afterAll(async () => {
  mkdirSync("qa-report", { recursive: true });
  writeFileSync(
    join("qa-report", "performance.json"),
    JSON.stringify(performance, null, 2)
  );
});

async function measure(page: import("@playwright/test").Page, route: string) {
  const start = Date.now();
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  const loadMs = Date.now() - start;
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming | undefined;
    return {
      ttfbMs: nav ? Math.round(nav.responseStart) : 0,
      loadMs: nav ? Math.round(nav.loadEventEnd) : 0,
    };
  });
  performance.push({
    route,
    ttfbMs: timing.ttfbMs || Math.round(loadMs / 2),
    loadMs: timing.loadMs || loadMs,
  });
  return response;
}

test.describe("Critical journeys — public / auth gates", () => {
  test("health API is healthy", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBeTruthy();
    expect(body.database).toBe("connected");
    expect(body.migrations).toBeGreaterThanOrEqual(1);
  });

  test("Authentication — unauthenticated users see sign-in", async ({
    page,
  }) => {
    await measure(page, "/sign-in");
    await expect(page.getByText(/sign in/i).first()).toBeVisible();
    mkdirSync("qa-report/screenshots", { recursive: true });
    await page.screenshot({
      path: "qa-report/screenshots/auth-sign-in.png",
      fullPage: true,
    });
  });

  test("Onboarding — requires authentication", async ({ page }) => {
    await measure(page, "/onboarding");
    await expect(page).toHaveURL(/sign-in/);
    await page.screenshot({
      path: "qa-report/screenshots/onboarding-redirect.png",
      fullPage: true,
    });
  });

  test("Dashboard — requires authentication", async ({ page }) => {
    await measure(page, "/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Members — requires authentication", async ({ page }) => {
    await measure(page, "/people");
    await expect(page).toHaveURL(/sign-in/);
    await page.screenshot({
      path: "qa-report/screenshots/members-auth-gate.png",
      fullPage: true,
    });
  });

  test("Households — requires authentication", async ({ page }) => {
    await measure(page, "/households");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Attendance — requires authentication", async ({ page }) => {
    await measure(page, "/attendance");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Visitors — requires authentication", async ({ page }) => {
    await measure(page, "/visitors");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Events — requires authentication", async ({ page }) => {
    await measure(page, "/events");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Volunteers — requires authentication", async ({ page }) => {
    await measure(page, "/volunteers");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Communications — requires authentication", async ({ page }) => {
    await measure(page, "/communications");
    await expect(page).toHaveURL(/sign-in/);
  });
});
