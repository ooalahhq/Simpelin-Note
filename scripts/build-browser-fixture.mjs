import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { cp, mkdir, writeFile } from "node:fs/promises";
await mkdir(".browser-fixture", { recursive: true });
await cp("public/characters", ".browser-fixture/characters", {
  recursive: true,
});
await build({
  entryPoints: ["tests/browser-entry.tsx"],
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: ".browser-fixture",
  entryNames: "app",
  chunkNames: "chunks/[name]-[hash]",
  assetNames: "assets/[name]-[hash]",
  loader: { ".woff": "file", ".woff2": "file" },
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    "next/link": fileURLToPath(
      new URL("../tests/browser-link.tsx", import.meta.url),
    ),
  },
  logLevel: "warning",
});
await writeFile(
  ".browser-fixture/index.html",
  '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Simpelin — Browser QA</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>',
);
