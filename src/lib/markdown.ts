import type { JSONContent } from "@tiptap/core";
import { Lexer, type Token, type MarkedToken, type Tokens } from "marked";
import { decodeHTML } from "entities";
import { document, paragraph } from "./model";
import { cleanDocument, safeUrl } from "./security";

type Marks = NonNullable<JSONContent["marks"]>;
function textNode(text: string, marks: Marks = []): JSONContent[] {
  return text
    ? [{ type: "text", text, ...(marks.length ? { marks } : {}) }]
    : [];
}
function inline(tokens: Token[], marks: Marks = [], depth = 0): JSONContent[] {
  if (depth > 20) throw new Error("Format Markdown terlalu bertingkat.");
  return (tokens as MarkedToken[]).flatMap((token): JSONContent[] => {
    switch (token.type) {
      case "strong":
      case "em":
      case "del": {
        const type =
          token.type === "strong"
            ? "bold"
            : token.type === "em"
              ? "italic"
              : "strike";
        return inline(
          token.tokens,
          marks.some((mark) => mark.type === type)
            ? marks
            : [...marks, { type }],
          depth + 1,
        );
      }
      case "link": {
        const href = safeUrl(decodeHTML(token.href));
        return inline(
          token.tokens,
          href ? [...marks, { type: "link", attrs: { href } }] : marks,
          depth + 1,
        );
      }
      case "codespan":
        // Tiptap's code mark excludes other marks, including surrounding emphasis.
        return textNode(token.text, [{ type: "code" }]);
      case "br":
        return [{ type: "hardBreak" }];
      case "text":
        return token.tokens
          ? inline(token.tokens, marks, depth + 1)
          : textNode(decodeHTML(token.text).replace(/\n/g, " "), marks);
      case "escape":
        return textNode(token.text, marks);
      case "html":
        // HTML stays literal text: no DOM parser or HTML insertion is ever used.
        return textNode(token.raw, marks);
      case "image":
        // Generated remote images are text descriptions, never network-loaded assets.
        return textNode(
          `[Gambar: ${decodeHTML(token.text || "tanpa keterangan")}]`,
          marks,
        );
      default:
        return textNode(token.raw, marks);
    }
  });
}
function inlineParagraph(tokens: Token[], align?: string | null): JSONContent {
  return {
    type: "paragraph",
    ...(align ? { attrs: { textAlign: align } } : {}),
    content: inline(tokens),
  };
}
function listItem(item: Tokens.ListItem, depth: number): JSONContent {
  const content = blocks(item.tokens, depth + 1);
  if (content[0]?.type !== "paragraph") content.unshift(paragraph());
  return { type: "listItem", content };
}
function blocks(tokens: Token[], depth = 0): JSONContent[] {
  if (depth > 20) throw new Error("Format Markdown terlalu bertingkat.");
  const result: JSONContent[] = [];
  for (const token of tokens as MarkedToken[]) {
    switch (token.type) {
      case "space":
      case "def":
        break;
      case "heading":
        result.push({
          type: "heading",
          attrs: { level: Math.min(3, token.depth) },
          content: inline(token.tokens),
        });
        break;
      case "paragraph":
      case "text":
        result.push(
          inlineParagraph(token.tokens || Lexer.lexInline(token.text)),
        );
        break;
      case "list":
        result.push({
          type: token.ordered ? "orderedList" : "bulletList",
          ...(token.ordered ? { attrs: { start: token.start || 1 } } : {}),
          content: token.items.map((item) => listItem(item, depth)),
        });
        break;
      case "blockquote":
        result.push({
          type: "blockquote",
          content: document(...blocks(token.tokens, depth + 1)).content,
        });
        break;
      case "code":
        result.push({
          type: "codeBlock",
          attrs: { language: token.lang?.split(/\s+/)[0] || "plaintext" },
          ...(token.text ? { content: textNode(token.text) } : {}),
        });
        break;
      case "hr":
        result.push({ type: "horizontalRule" });
        break;
      case "table": {
        const row = (
          cells: Tokens.TableCell[],
          header: boolean,
        ): JSONContent => ({
          type: "tableRow",
          content: cells.map((cell, index) => ({
            type: header ? "tableHeader" : "tableCell",
            content: [inlineParagraph(cell.tokens, token.align[index])],
          })),
        });
        result.push({
          type: "table",
          content: [
            row(token.header, true),
            ...token.rows.map((cells) => row(cells, false)),
          ],
        });
        break;
      }
      default:
        result.push({ type: "paragraph", content: textNode(token.raw) });
    }
  }
  return result;
}
/** Convert Markdown tokens directly to editable, sanitized Tiptap JSON. */
export function markdownDocument(text: string): JSONContent {
  return cleanDocument(document(...blocks(Lexer.lex(text, { gfm: true }))));
}
