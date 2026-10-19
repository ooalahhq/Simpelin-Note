import { test, expect } from "./fixture";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function configureProvider(page: Page) {
  await page.getByRole("button", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("tab", { name: "AI Provider" }).click();
  await page.getByLabel("ID model", { exact: true }).fill("test-model");
  await page
    .getByLabel("API key", { exact: true })
    .fill("test-private-key-123");
  await page.getByRole("button", { name: "Aktifkan pengaturan" }).click();
  await page.getByRole("button", { name: "Tutup dialog" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Jaringan Komputer", exact: true }),
  ).toBeVisible();
});
test("rich text, Enter, undo, focus and durable reload", async ({ page }) => {
  const editor = page.getByRole("textbox", { name: "Isi catatan" });
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("Catatan uji tersimpan");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Baris sesudah impact");
  await expect(editor).toContainText("Baris sesudah impact");
  await page
    .getByRole("button", { name: "Perbesar editor", exact: true })
    .click();
  await expect(page.locator(".note-panel")).toHaveClass(/expanded/);
  await expect(editor).toContainText("Catatan uji tersimpan");
  await page.keyboard.press("Escape");
  await expect(page.locator(".note-panel")).not.toHaveClass(/expanded/);
  await expect(
    page.locator(".save-indicator").getByRole("status"),
  ).toContainText("Tersimpan");
  await page.reload();
  await expect(editor).toContainText("Baris sesudah impact");
});
test("group/category CRUD, move and safe deletion with undo", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Tambah group", exact: true })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Nama group" }).fill("Bootcamp");
  await page.getByRole("button", { name: "Tambahkan", exact: true }).click();
  await page
    .getByRole("button", { name: "Kelola Bootcamp", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Nama group" }).fill("Bootcamp Web");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await page
    .getByRole("button", { name: "Kelola Basis Data", exact: true })
    .click();
  await page
    .getByLabel("Group", { exact: true })
    .selectOption({ label: "Bootcamp Web" });
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await page
    .getByRole("button", { name: "Kelola Bootcamp Web", exact: true })
    .click();
  await page.getByRole("button", { name: "Hapus group", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Hapus group?" }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "Hapus group?" })
    .getByRole("button", { name: "Hapus", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Kelola Bootcamp Web", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Urungkan", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Kelola Bootcamp Web", exact: true }),
  ).toBeVisible();
});
test("only timeline adds material; delete and restore a note", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Tambah pertemuan", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Tambah pertemuan", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Judul catatan" }).fill("Node baru");
  await page
    .getByRole("textbox", { name: "Isi catatan" })
    .fill("Isi node baru");
  await page
    .getByRole("button", { name: "Kelola catatan aktif", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hapus catatan", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Hapus catatan?" })
    .getByRole("button", { name: "Hapus", exact: true })
    .click();
  await page.getByRole("button", { name: "Urungkan", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "P4 · Node baru", exact: true }),
  ).toBeVisible();
});
test("summary request excludes prior results and keeps terminal add last", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/ai", async (route) => {
    const data = route.request().postDataJSON();
    expect(data.text).not.toContain("OLD SUMMARY MARKER");
    calls++;
    await route.fulfill({
      json: {
        text: "# Gambaran umum\nOLD SUMMARY MARKER\nRingkasan protokol dari catatan.",
      },
    });
  });
  await configureProvider(page);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "AI Summary" }).click();
    await page
      .getByRole("button", { name: "Buat Summary", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Judul catatan" }),
    ).toHaveValue(`Summary ${i + 1}`);
  }
  expect(calls).toBe(2);
  const raw = await page.evaluate(() => JSON.stringify(localStorage));
  expect(raw).not.toContain("test-private-key-123");
  await page
    .getByRole("button", { name: "Tambah pertemuan", exact: true })
    .click();
  const last = page.locator(".timeline-track > *");
  await expect(last.nth((await last.count()) - 1)).toHaveClass("timeline-add");
  await expect(page.locator(".timeline-item").nth(3)).not.toHaveClass(
    /summary-node/,
  );
  await expect(page.locator(".timeline-item").nth(4)).toHaveClass(
    /summary-node/,
  );
});
test("AI failure never creates a fake summary", async ({ page }) => {
  await page.route("**/api/ai", (r) =>
    r.fulfill({ status: 429, json: { error: "Kuota provider habis." } }),
  );
  await configureProvider(page);
  await page.getByRole("button", { name: "AI Summary" }).click();
  await page.getByRole("button", { name: "Buat Summary", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Kuota provider habis.");
  await expect(page.locator(".summary-node")).toHaveCount(0);
});
test("Motion Lab shares actual editable input and can switch every preset", async ({
  page,
}) => {
  await page.goto("/motion-lab");
  await expect(page.getByRole("heading", { name: "Motion Lab" })).toBeVisible();
  const editor = page.getByRole("textbox", { name: "Editor Motion Lab" });
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("Efek nyata");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Tetap lancar");
  await expect(editor).toContainText("Tetap lancar");
  await page.keyboard.press("Enter");
  await expect(page.locator(".effects-overlay canvas")).toHaveCount(1);
  for (const name of [
    "Fluid Ink",
    "Pixel Burst",
    "Digital Glitch",
    "Arc Energy",
    "Impact Deluxe",
  ]) {
    await page.getByLabel("Preset animasi", { exact: true }).selectOption(name);
    await page
      .getByRole("button", { name: "Replay enter", exact: true })
      .click();
  }
  await page.getByRole("switch", { name: /Reduced motion/ }).check();
  await expect(page.locator(".effects-overlay")).toBeHidden();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(editor).not.toContainText("Tetap lancar");
});
test("image upload, caption and ZIP round-trip retain assets", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Upload gambar", exact: true })
    .click();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6EAAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
  await expect(page.locator(".asset-figure img")).toBeVisible();
  await page.getByLabel("Keterangan gambar").fill("Gambar pengujian");
  await page.getByRole("button", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("tab", { name: "Data lokal" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor", exact: true }).click();
  const file = await download;
  const path = await file.path();
  expect(path).toBeTruthy();
  await page.locator(".settings-body input[type=file]").setInputFiles(path!);
  await expect(
    page.getByRole("heading", { name: "Periksa cadangan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ganti dengan cadangan ini" }).click();
  await expect(page.getByText("Cadangan berhasil diimpor.")).toBeVisible();
  await page.getByRole("button", { name: "Tutup dialog" }).click();
  await expect(page.locator(".asset-figure img")).toBeVisible();
  await expect(page.getByLabel("Keterangan gambar")).toHaveValue(
    "Gambar pengujian",
  );
  await page.reload();
  await expect(page.locator(".asset-figure img")).toBeVisible();
});
test("keyboard shortcuts, slash code and offline editing", async ({
  page,
  context,
}) => {
  await page.keyboard.press("Control+k");
  await page.getByRole("textbox", { name: "Cari catatan" }).fill("Protokol");
  await expect(page.locator(".search-results button")).toHaveCount(1);
  await page.keyboard.press("Escape");
  const editor = page.getByRole("textbox", { name: "Isi catatan" });
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/code");
  await expect(
    page.getByRole("listbox", { name: "Slash commands" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await page.keyboard.type("const local = true");
  await expect(editor.locator(".code-block").last()).toContainText(
    "const local = true",
  );
  await context.setOffline(true);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type(" // offline");
  await expect(editor).toContainText("offline");
  await context.setOffline(false);
});
for (const width of [320, 375, 414, 768])
  test(`responsive ${width}px without horizontal document overflow`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("heading", { name: "Jaringan Komputer", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Buka navigasi", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Pengaturan", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Pengaturan", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Pengaturan" }),
    ).toBeVisible();
    await testInfo.attach(`settings-${width}px`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("generated tables and inline formatting survive a real editor reload", async ({
  page,
}) => {
  const markdown = await readFile("tests/fixtures/study-summary.md", "utf8");
  await page.route("**/api/ai", (route) =>
    route.fulfill({ json: { text: markdown } }),
  );
  await configureProvider(page);
  await page.getByRole("button", { name: "AI Summary", exact: true }).click();
  await page.getByRole("button", { name: "Buat Summary", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Isi catatan" });
  await expect(
    editor.getByRole("heading", {
      name: "Memahami jaringan komputer",
      exact: true,
    }),
  ).toBeVisible();
  await expect(editor.getByRole("row")).toHaveCount(8);
  await expect(editor.locator("strong").first()).toHaveText("Protokol");
  await expect(
    page.locator(".save-indicator").getByRole("status"),
  ).toContainText("Tersimpan");
  await page.reload();
  await expect(editor.getByRole("row")).toHaveCount(8);
  await expect(editor).toContainText("Cek pemahaman");
});
