import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "qa-report/html", open: "never" }],
    ["json", { outputFile: "qa-report/results.json" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? "npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        // Format-valid fake Clerk keys so middleware can redirect without
        // real credentials. (pk_test_xxxxxxxx is rejected by Clerk SDK.)
        env: {
          ...process.env,
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
            !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("xxxx")
              ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
              : "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k",
          CLERK_SECRET_KEY:
            process.env.CLERK_SECRET_KEY &&
            !process.env.CLERK_SECRET_KEY.includes("xxxx")
              ? process.env.CLERK_SECRET_KEY
              : "sk_test_c2tfZXhhbXBsZV9zZWNyZXRfa2V5X2Zvcl9sb2NhbF9lMmVfb25seSEh",
        },
      },
});
