import JSZip from "jszip";
import db from "./db";
import { readPreferences, id, type Workspace } from "./model";
import { validateWorkspace } from "./security";
function assetIds(state: Workspace) {
  const ids = new Set<string>();
  const visit = (node: {
    type?: string;
    attrs?: Record<string, unknown>;
    content?: unknown[];
  }) => {
    if (node.type === "image" && typeof node.attrs?.assetId === "string")
      ids.add(node.attrs.assetId);
    node.content?.forEach((n) => visit(n as typeof node));
  };
  state.notes.forEach((n) => visit(n.content));
  return ids;
}
export async function exportBackup(state: Workspace) {
  const zip = new JSZip();
  const safe: Workspace = {
    version: 1,
    groups: state.groups,
    categories: state.categories,
    notes: state.notes,
    selectedCategoryId: state.selectedCategoryId,
    selectedNoteId: state.selectedNoteId,
    preferences: state.preferences,
  };
  zip.file("manifest.json", JSON.stringify(safe));
  for (const assetId of assetIds(state)) {
    const asset = await db.assets.get(assetId);
    if (!asset)
      throw new Error(
        "Ada gambar yang tidak ditemukan. Cadangan dibatalkan agar tidak kehilangan aset.",
      );
    zip.file(`assets/${assetId}`, await asset.blob.arrayBuffer());
    zip.file(
      `assets/${assetId}.json`,
      JSON.stringify({ type: asset.blob.type, name: asset.name }),
    );
  }
  return zip.generateAsync({ type: "blob" });
}
export type ImportPreview = {
  state: Workspace;
  assets: { id: string; blob: Blob; name: string; createdAt: number }[];
};
export async function previewBackup(file: File): Promise<ImportPreview> {
  if (file.size > 100 * 1024 * 1024)
    throw new Error("Cadangan maksimal 100 MB.");
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files);
  if (entries.length > 12000)
    throw new Error("Terlalu banyak berkas dalam cadangan.");
  const sizes = entries.reduce(
    (total, entry) =>
      total +
      Number(
        (entry as unknown as { _data?: { uncompressedSize: number } })._data
          ?.uncompressedSize || 0,
      ),
    0,
  );
  if (sizes > 200 * 1024 * 1024) throw new Error("Isi cadangan terlalu besar.");
  const manifest = zip.file("manifest.json");
  if (!manifest) throw new Error("Manifest cadangan tidak ditemukan.");
  const state = validateWorkspace(JSON.parse(await manifest.async("string")));
  state.preferences = readPreferences(state.preferences);
  const assets: ImportPreview["assets"] = [];
  const mapping = new Map<string, string>();
  for (const assetId of assetIds(state)) {
    const entry = zip.file(`assets/${assetId}`);
    const metadata = zip.file(`assets/${assetId}.json`);
    if (!entry || !metadata)
      throw new Error("Cadangan kehilangan berkas gambar.");
    const meta = JSON.parse(await metadata.async("string"));
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        meta.type,
      )
    )
      throw new Error("Format gambar tidak diizinkan.");
    const bytes = await entry.async("uint8array");
    if (bytes.length > 8 * 1024 * 1024)
      throw new Error("Gambar dalam cadangan terlalu besar.");
    const newId = id();
    mapping.set(assetId, newId);
    assets.push({
      id: newId,
      blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: meta.type }),
      name: String(meta.name || "Gambar"),
      createdAt: Date.now(),
    });
  }
  const remap = (node: {
    attrs?: Record<string, unknown>;
    content?: unknown[];
  }) => {
    if (typeof node.attrs?.assetId === "string")
      node.attrs.assetId =
        mapping.get(node.attrs.assetId) || node.attrs.assetId;
    node.content?.forEach((n) => remap(n as typeof node));
  };
  state.notes.forEach((n) => remap(n.content));
  return { state, assets };
}
export async function applyBackup(preview: ImportPreview) {
  await db.transaction("rw", db.workspace, db.assets, async () => {
    await db.assets.bulkPut(preview.assets);
    await db.workspace.put({ id: "main", data: preview.state });
  });
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
