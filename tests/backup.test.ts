import "fake-indexeddb/auto";
import { beforeEach, describe, it, expect } from "vitest";
import JSZip from "jszip";
import db from "../src/lib/db";
import { createWorkspace, document } from "../src/lib/model";
import { exportBackup, previewBackup, applyBackup } from "../src/lib/backup";
import { markdownDocument } from "../src/lib/markdown";
beforeEach(async () => {
  await db.workspace.clear();
  await db.assets.clear();
});
describe("backup integrity and rollback assets", () => {
  it("round-trips all notes and binary images with remapped asset IDs", async () => {
    const s = createWorkspace();
    await db.assets.put({
      id: "image-1",
      blob: new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
        type: "image/png",
      }),
      name: "diagram.png",
      createdAt: Date.now(),
    });
    s.notes[0].content = document({
      type: "image",
      attrs: {
        assetId: "image-1",
        src: "",
        alt: "Diagram",
        caption: "Topologi",
        width: 60,
      },
    });
    const blob = await exportBackup(s);
    const f = new File([blob], "backup.zip");
    const preview = await previewBackup(f);
    expect(preview.state.notes).toHaveLength(3);
    expect(preview.assets).toHaveLength(1);
    expect(preview.assets[0].id).not.toBe("image-1");
    expect(preview.state.notes[0].content.content?.[0].attrs?.assetId).toBe(
      preview.assets[0].id,
    );
    await applyBackup(preview);
    expect(
      (await db.workspace.get("main"))?.data.notes[0].content.content?.[0].attrs
        ?.caption,
    ).toBe("Topologi");
    expect((await db.assets.get("image-1"))?.name).toBe("diagram.png");
    expect((await db.assets.get(preview.assets[0].id))?.blob.size).toBe(8);
  });
  it("round-trips editable summary tables and inline formatting through ZIP", async () => {
    const state = createWorkspace();
    state.notes[0].content = markdownDocument(
      "## Perbandingan\n\n| Protokol | Sifat |\n| --- | --- |\n| **TCP** | Berurutan |\n| UDP | Datagram |",
    );
    const blob = await exportBackup(state);
    const preview = await previewBackup(new File([blob], "study.zip"));
    expect(preview.state.notes[0].content).toEqual(state.notes[0].content);
    await applyBackup(preview);
    expect((await db.workspace.get("main"))?.data.notes[0].content).toEqual(
      state.notes[0].content,
    );
  });
  it("fails clearly when an image is missing rather than silently dropping it", async () => {
    const s = createWorkspace();
    s.notes[0].content = document({
      type: "image",
      attrs: { assetId: "missing" },
    });
    await expect(exportBackup(s)).rejects.toThrow("gambar");
  });
  it("rejects malformed ZIP schema without modifying live state", async () => {
    const s = createWorkspace();
    await db.workspace.put({ id: "main", data: s });
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify({ version: 99 }));
    const bytes = await zip.generateAsync({ type: "uint8array" });
    await expect(
      previewBackup(new File([new Uint8Array(bytes)], "invalid.zip")),
    ).rejects.toThrow();
    expect((await db.workspace.get("main"))?.data.selectedNoteId).toBe(
      s.selectedNoteId,
    );
  });
  it("never exports fields outside the workspace contract", async () => {
    const s = Object.assign(createWorkspace(), {
      key: "secret-key",
      apiKey: "also-secret",
    });
    const blob = await exportBackup(s);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const manifest = await zip.file("manifest.json")!.async("string");
    expect(manifest).not.toContain("secret-key");
    expect(manifest).not.toContain("also-secret");
  });
});
