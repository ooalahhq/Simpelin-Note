import type { JSONContent } from "@tiptap/core";
import type { Workspace } from "./model";
export function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
const nodes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "callout",
  "codeBlock",
  "image",
  "horizontalRule",
  "hardBreak",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
]);
const marks = new Set([
  "bold",
  "italic",
  "strike",
  "underline",
  "code",
  "highlight",
  "textStyle",
  "link",
]);
export function cleanDocument(value: unknown, depth = 0): JSONContent {
  if (depth > 30 || !value || typeof value !== "object")
    throw new Error("Struktur dokumen tidak valid.");
  const node = value as JSONContent;
  if (!node.type || !nodes.has(node.type))
    throw new Error("Jenis blok dokumen tidak didukung.");
  const attrs: Record<string, unknown> = {};
  if (node.type === "heading")
    attrs.level = [1, 2, 3].includes(node.attrs?.level) ? node.attrs?.level : 2;
  if (node.type === "callout")
    attrs.kind = ["info", "important", "warning", "success"].includes(
      node.attrs?.kind,
    )
      ? node.attrs?.kind
      : "info";
  if (node.type === "taskItem") attrs.checked = !!node.attrs?.checked;
  if (node.type === "orderedList")
    attrs.start = Math.max(1, Number(node.attrs?.start) || 1);
  if (node.type === "tableCell" || node.type === "tableHeader") {
    // Generated/imported tables use a simple rectangular grid, with no arbitrary styles.
    attrs.colspan = 1;
    attrs.rowspan = 1;
    attrs.colwidth = null;
  }
  if (node.type === "codeBlock")
    attrs.language = String(node.attrs?.language || "plaintext")
      .replace(/[^\w+-]/g, "")
      .slice(0, 30);
  if (node.type === "image") {
    const assetId = String(node.attrs?.assetId || "");
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(assetId))
      throw new Error("Referensi gambar tidak valid.");
    attrs.assetId = assetId;
    attrs.src = "";
    attrs.alt = String(node.attrs?.alt || "").slice(0, 300);
    attrs.caption = String(node.attrs?.caption || "").slice(0, 500);
    attrs.width = Math.min(100, Math.max(20, Number(node.attrs?.width) || 100));
  }
  if (
    ["paragraph", "heading"].includes(node.type || "") &&
    ["left", "center", "right", "justify"].includes(node.attrs?.textAlign)
  )
    attrs.textAlign = node.attrs?.textAlign;
  const result: JSONContent = {
    type: node.type,
    ...(Object.keys(attrs).length ? { attrs } : {}),
  };
  if (node.type === "text") {
    if (typeof node.text !== "string") throw new Error("Teks tidak valid.");
    result.text = node.text;
  }
  if (node.content) {
    if (!Array.isArray(node.content) || node.content.length > 50000)
      throw new Error("Dokumen terlalu besar.");
    result.content = node.content.map((n) => cleanDocument(n, depth + 1));
  }
  if (node.marks)
    result.marks = node.marks
      .filter((m) => m.type && marks.has(m.type))
      .map((m) => {
        if (m.type === "link") {
          const href = safeUrl(m.attrs?.href || "");
          return href
            ? {
                type: "link",
                attrs: { href, target: "_blank", rel: "noopener noreferrer" },
              }
            : { type: "bold" };
        }
        if (m.type === "highlight" || m.type === "textStyle") {
          const color = String(m.attrs?.color || "");
          return {
            type: m.type,
            attrs: /^#[0-9a-f]{6}$/i.test(color) ? { color } : {},
          };
        }
        return { type: m.type };
      });
  return result;
}
export function validateWorkspace(value: unknown): Workspace {
  if (!value || typeof value !== "object")
    throw new Error("Cadangan tidak valid.");
  const s = structuredClone(value) as Workspace;
  if (
    s.version !== 1 ||
    !Array.isArray(s.groups) ||
    !Array.isArray(s.categories) ||
    !Array.isArray(s.notes) ||
    s.notes.length > 10000
  )
    throw new Error("Versi atau isi cadangan tidak didukung.");
  const ids = new Set<string>();
  for (const item of [...s.groups, ...s.categories, ...s.notes]) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) ||
      ids.has(item.id) ||
      typeof item.title !== "string" ||
      item.title.length > 500 ||
      !Number.isFinite(item.createdAt) ||
      !Number.isFinite(item.updatedAt)
    )
      throw new Error("ID, judul, atau tanggal cadangan tidak valid.");
    ids.add(item.id);
  }
  const groups = new Set(s.groups.map((g) => g.id));
  const cats = new Set(s.categories.map((c) => c.id));
  for (const c of s.categories) {
    c.summarySequence =
      Number.isSafeInteger(c.summarySequence) && Number(c.summarySequence) >= 0
        ? c.summarySequence
        : 0;
    if (!groups.has(c.groupId)) throw new Error("Kategori tanpa group.");
  }
  for (const n of s.notes) {
    if (!cats.has(n.categoryId) || !["note", "summary"].includes(n.type))
      throw new Error("Relasi catatan tidak valid.");
    n.content = cleanDocument(n.content);
    if (n.content.type !== "doc") throw new Error("Akar dokumen tidak valid.");
  }
  if (s.selectedCategoryId && !cats.has(s.selectedCategoryId))
    s.selectedCategoryId = s.categories[0]?.id || "";
  if (
    !s.notes.some(
      (n) => n.id === s.selectedNoteId && n.categoryId === s.selectedCategoryId,
    )
  )
    s.selectedNoteId =
      s.notes.find((n) => n.categoryId === s.selectedCategoryId)?.id || "";
  return s;
}
