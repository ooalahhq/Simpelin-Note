import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const test = base.extend({
  context: async ({ context, baseURL }, provideContext) => {
    if (baseURL === "https://simpelin.test") {
      const root = path.resolve(".browser-fixture");
      await context.route("https://simpelin.test/**", async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.startsWith("/api/")) {
          await route.fulfill({
            status: 503,
            json: { error: "Provider tidak dipanggil oleh fixture browser." },
          });
          return;
        }
        const target =
          url.pathname === "/" || url.pathname === "/motion-lab"
            ? "/index.html"
            : url.pathname;
        const file = path.resolve(root, "." + target);
        if (!file.startsWith(root + path.sep)) {
          await route.abort();
          return;
        }
        try {
          const body = await readFile(file);
          const extension = path.extname(file);
          const mime: Record<string, string> = {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".woff2": "font/woff2",
            ".woff": "font/woff",
            ".png": "image/png",
            ".svg": "image/svg+xml",
          };
          await route.fulfill({
            body,
            contentType: mime[extension] || "application/octet-stream",
          });
        } catch {
          await route.fulfill({ status: 404, body: "Not found" });
        }
      });
    }
    await provideContext(context);
  },
});
export { expect };
