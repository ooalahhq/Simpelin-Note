import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  globalTimeout: 10 * 60 * 1000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 12000 },
  use: {
    baseURL: process.env.SIMPELIN_LIVE
      ? "http://127.0.0.1:3040"
      : "https://simpelin.test",
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
        (!process.env.CI && existsSync("/opt/google/chrome/chrome")
          ? "/opt/google/chrome/chrome"
          : undefined),
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Requests must reach Playwright's route mocks, including /api/ai.
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
