import { defineConfig } from "@playwright/test";
import shared from "./playwright.config";

/** Production-server integration tests, runnable from any supported shell. */
export default defineConfig({
  ...shared,
  use: { ...shared.use, baseURL: "http://127.0.0.1:3040" },
  webServer: {
    command: "npm run start -- --port 3040",
    url: "http://127.0.0.1:3040",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
