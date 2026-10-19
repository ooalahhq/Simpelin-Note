import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getSchema, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { markdownDocument } from "../src/lib/markdown";
import { textOf } from "../src/lib/model";

function all(node: JSONContent): JSONContent[] {
  return [node, ...(node.content || []).flatMap(all)];
}
const schema = getSchema([StarterKit, TableKit]);
it("preserves headings and nested bold/italic/code/link marks instead of showing Markdown delimiters", () => {
  const doc = markdownDocument(
    "# **Jaringan**\n\n**TCP** membawa *data* dengan **urutan *terjamin***. Gunakan `curl -I` dan [referensi](https://example.com). **`HTTP`** mengatur pesan.",
  );
  schema.nodeFromJSON(doc).check();
  const nodes = all(doc);
  expect(doc.content?.[0].type).toBe("heading");
  expect(nodes.find((n) => n.text === "TCP")?.marks).toEqual([
    { type: "bold" },
  ]);
  expect(nodes.find((n) => n.text === "terjamin")?.marks).toEqual([
    { type: "bold" },
    { type: "italic" },
  ]);
  expect(nodes.find((n) => n.text === "HTTP")?.marks).toEqual([
    { type: "code" },
  ]);
  expect(nodes.find((n) => n.text === "curl -I")?.marks).toEqual([
    { type: "code" },
  ]);
  expect(nodes.find((n) => n.text === "referensi")?.marks?.[0]).toMatchObject({
    type: "link",
    attrs: { href: "https://example.com/", rel: "noopener noreferrer" },
  });
  expect(textOf(doc)).not.toMatch(/\*\*|`|\]\(/);
});

it("keeps nested lists, ordered-list starts, paragraphs, blockquotes and hard breaks valid in the editor schema", () => {
  const doc = markdownDocument(
    "3. Transport\n   - TCP\n   - UDP\n4. Aplikasi\n\n> **Pelengkap materi:** Penjelasan.\n>\n> Paragraf berikutnya.\n\nBaris satu  \nBaris dua.",
  );
  schema.nodeFromJSON(doc).check();
  expect(doc.content?.[0]).toMatchObject({
    type: "orderedList",
    attrs: { start: 3 },
  });
  expect(all(doc).filter((n) => n.type === "bulletList")).toHaveLength(1);
  expect(all(doc).find((n) => n.type === "blockquote")?.content).toHaveLength(
    2,
  );
  expect(all(doc).some((n) => n.type === "hardBreak")).toBe(true);
});

it("renders comparison tables as editable table nodes with inline formatting", () => {
  const doc = markdownDocument(
    "| Protokol | Sifat |\n| :--- | ---: |\n| **TCP** | Berurutan |\n| UDP | Datagram |",
  );
  schema.nodeFromJSON(doc).check();
  const table = doc.content?.[0];
  expect(table?.type).toBe("table");
  expect(table?.content).toHaveLength(3);
  expect(table?.content?.[0].content?.map((n) => n.type)).toEqual([
    "tableHeader",
    "tableHeader",
  ]);
  expect(
    table?.content?.[1].content?.[0].content?.[0].content?.[0],
  ).toMatchObject({ text: "TCP", marks: [{ type: "bold" }] });
  expect(table?.content?.[1].content?.[1].content?.[0].attrs?.textAlign).toBe(
    "right",
  );
  expect(textOf(doc)).not.toContain("|");
});

it("preserves fenced and unfinished code blocks verbatim, including blank lines and language", () => {
  const code = "curl -I https://example.com\n\n# <header> &amp;";
  const doc = markdownDocument(
    "```bash\n" + code + "\n```\n\n~~~python\nprint('hello')",
  );
  schema.nodeFromJSON(doc).check();
  expect(doc.content?.[0]).toEqual({
    type: "codeBlock",
    attrs: { language: "bash" },
    content: [{ type: "text", text: code }],
  });
  expect(doc.content?.[1].attrs?.language).toBe("python");
  expect(doc.content?.[1].content?.[0].text).toBe("print('hello')");
});

it("treats raw HTML as text, strips unsafe link targets and never loads model-generated images", () => {
  const doc = markdownDocument(
    "<script>alert(1)</script>\n\n[bahaya](javascript:alert%281%29) ![diagram](https://evil.test/tracker.png) &lt;b&gt;teks&lt;/b&gt;",
  );
  schema.nodeFromJSON(doc).check();
  const nodes = all(doc);
  expect(nodes.some((n) => n.type === "image")).toBe(false);
  expect(
    nodes.flatMap((n) => n.marks || []).some((m) => m.type === "link"),
  ).toBe(false);
  expect(textOf(doc)).toContain("<script>alert(1)</script>");
  expect(textOf(doc)).toContain("<b>teks</b>");
  expect(JSON.stringify(doc)).not.toContain("tracker.png");
});

it("does not turn extra blank lines into blank editor paragraphs between list items", () => {
  const doc = markdownDocument("## Inti\n\n\n- **Satu**\n\n\n- Dua\n\n\n");
  schema.nodeFromJSON(doc).check();
  expect(doc.content).toHaveLength(2);
  const list = doc.content?.[1];
  expect(list?.content).toHaveLength(2);
  expect(list?.content?.every((item) => item.content?.length === 1)).toBe(true);
  expect(
    all(doc).filter((n) => n.type === "paragraph" && !n.content?.length),
  ).toHaveLength(0);
});

it("converts the target learning handout fixture to a valid document without losing any OSI rows", () => {
  const source = readFileSync(
    new URL("./fixtures/study-summary.md", import.meta.url),
    "utf8",
  );
  const doc = markdownDocument(source);
  schema.nodeFromJSON(doc).check();
  expect(all(doc).find((n) => n.type === "table")?.content).toHaveLength(8);
  expect(textOf(doc)).toContain("Cek pemahaman");
  expect(textOf(doc)).toContain("Pelengkap materi");
  expect(textOf(doc)).toContain("Physical");
});
