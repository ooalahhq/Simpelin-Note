"use client";
import { useEffect, useState } from "react";
import {
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Check, Copy } from "lucide-react";
import db from "@/lib/db";
function AssetView({ node, updateAttributes, selected }: NodeViewProps) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    let url = "";
    db.assets.get(node.attrs.assetId).then((asset) => {
      if (asset && alive) {
        url = URL.createObjectURL(asset.blob);
        setSrc(url);
      }
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [node.attrs.assetId]);
  return (
    <NodeViewWrapper
      as="figure"
      className={`asset-figure ${selected ? "selected" : ""}`}
      style={{ width: `${node.attrs.width || 100}%` }}
    >
      {src ? (
        <img
          src={src}
          alt={node.attrs.alt || "Gambar catatan"}
          draggable={false}
        />
      ) : (
        <div className="image-missing">Memuat gambar…</div>
      )}
      <input
        className="image-caption"
        aria-label="Keterangan gambar"
        placeholder="Tambahkan keterangan gambar…"
        value={node.attrs.caption || ""}
        onChange={(e) =>
          updateAttributes({ caption: e.target.value, alt: e.target.value })
        }
      />
      {selected && (
        <label className="image-resize">
          Ukuran
          <input
            aria-label="Ukuran gambar"
            type="range"
            min="20"
            max="100"
            value={node.attrs.width || 100}
            onChange={(e) =>
              updateAttributes({ width: Number(e.target.value) })
            }
          />
        </label>
      )}
    </NodeViewWrapper>
  );
}
export const AssetImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      assetId: { default: null },
      caption: { default: "" },
      width: { default: 100 },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(AssetView);
  },
});
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      kind: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-kind"),
      },
    };
  },
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "true",
        "data-kind": HTMLAttributes.kind,
      }),
      0,
    ];
  },
});
function CodeView({ node, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  return (
    <NodeViewWrapper className="code-block">
      <div className="code-header" contentEditable={false}>
        <select
          aria-label="Bahasa kode"
          value={node.attrs.language || "plaintext"}
          onChange={(e) => updateAttributes({ language: e.target.value })}
        >
          {[
            "plaintext",
            "javascript",
            "typescript",
            "python",
            "bash",
            "html",
            "css",
            "sql",
            "java",
            "cpp",
            "json",
          ].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(node.textContent);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}{" "}
          {copied ? "Disalin" : "Salin"}
        </button>
      </div>
      <pre>
        <NodeViewContent as="div" className="code-content" />
      </pre>
    </NodeViewWrapper>
  );
}
export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeView);
  },
}).configure({ lowlight: createLowlight(common) });
