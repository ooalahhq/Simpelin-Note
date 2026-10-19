"use client";
import type { ReactNode } from "react";
import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Highlighter,
  Link2,
  ImagePlus,
  ChevronDown,
  Quote,
  Code2,
  Info,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo2,
  Redo2,
} from "lucide-react";
import { IconButton } from "../ui";
export default function EditorToolbar({
  editor,
  onEffect,
  onSetLink,
  onUpload,
}: {
  editor: Editor | null;
  onEffect: (kind: "heading" | "highlight") => void;
  onSetLink: (href: string) => void;
  onUpload: () => void;
}) {
  const selection = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            task: e.isActive("taskList"),
            code: e.isActive("codeBlock"),
            quote: e.isActive("blockquote"),
            highlight: e.isActive("highlight"),
            link: e.isActive("link"),
            heading: e.getAttributes("heading").level || 0,
          }
        : null,
  });
  const toolbar = (
    label: string,
    icon: ReactNode,
    action: () => void,
    active = false,
  ) => (
    <IconButton
      label={label}
      className={active ? "is-active" : ""}
      aria-pressed={active}
      onClick={action}
    >
      {icon}
    </IconButton>
  );
  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Format catatan">
      <select
        aria-label="Gaya teks"
        value={selection?.heading || 0}
        onChange={(e) => {
          const level = Number(e.target.value);
          if (level)
            editor
              ?.chain()
              .focus()
              .toggleHeading({ level: level as 1 | 2 | 3 })
              .run();
          else editor?.chain().focus().setParagraph().run();
          onEffect("heading");
        }}
      >
        <option value="0">Teks biasa</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>
      <span className="toolbar-divider" />
      {toolbar(
        "Tebal",
        <Bold size={16} />,
        () => {
          editor?.chain().focus().toggleBold().run();
        },
        selection?.bold,
      )}
      {toolbar(
        "Miring",
        <Italic size={16} />,
        () => {
          editor?.chain().focus().toggleItalic().run();
        },
        selection?.italic,
      )}
      {toolbar(
        "Garis bawah",
        <Underline size={16} />,
        () => {
          editor?.chain().focus().toggleUnderline().run();
        },
        selection?.underline,
      )}
      {toolbar(
        "Coret",
        <Strikethrough size={16} />,
        () => {
          editor?.chain().focus().toggleStrike().run();
        },
        selection?.strike,
      )}
      <span className="toolbar-divider" />
      {toolbar(
        "Daftar poin",
        <List size={17} />,
        () => {
          editor?.chain().focus().toggleBulletList().run();
        },
        selection?.bullet,
      )}
      {toolbar(
        "Daftar nomor",
        <ListOrdered size={17} />,
        () => {
          editor?.chain().focus().toggleOrderedList().run();
        },
        selection?.ordered,
      )}
      {toolbar(
        "Checklist",
        <ListChecks size={17} />,
        () => {
          editor?.chain().focus().toggleTaskList().run();
        },
        selection?.task,
      )}
      <span className="toolbar-divider" />
      {toolbar(
        "Highlight",
        <Highlighter size={16} />,
        () => {
          editor?.chain().focus().toggleHighlight({ color: "#ead9a3" }).run();
          onEffect("highlight");
        },
        selection?.highlight,
      )}
      {toolbar(
        "Tautan",
        <Link2 size={16} />,
        () => onSetLink(editor?.getAttributes("link").href || "https://"),
        selection?.link,
      )}
      {toolbar("Upload gambar", <ImagePlus size={17} />, () => onUpload())}
      <details className="more-tools">
        <summary aria-label="Format lainnya">
          <ChevronDown size={16} />
        </summary>
        <div className="tool-menu">
          {toolbar(
            "Kutipan",
            <Quote size={16} />,
            () => {
              editor?.chain().focus().toggleBlockquote().run();
            },
            selection?.quote,
          )}
          {toolbar(
            "Blok kode",
            <Code2 size={16} />,
            () => {
              editor?.chain().focus().toggleCodeBlock().run();
            },
            selection?.code,
          )}
          {toolbar("Callout info", <Info size={16} />, () => {
            editor
              ?.chain()
              .focus()
              .insertContent({
                type: "callout",
                attrs: { kind: "info" },
                content: [{ type: "paragraph" }],
              })
              .run();
          })}
          <select
            aria-label="Jenis callout"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value)
                editor
                  ?.chain()
                  .focus()
                  .insertContent({
                    type: "callout",
                    attrs: { kind: e.target.value },
                    content: [{ type: "paragraph" }],
                  })
                  .run();
              e.target.value = "";
            }}
          >
            <option value="">Callout…</option>
            <option value="info">Info</option>
            <option value="important">Penting</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
          </select>
          {toolbar("Rata kiri", <AlignLeft size={16} />, () => {
            editor?.chain().focus().setTextAlign("left").run();
          })}
          {toolbar("Rata tengah", <AlignCenter size={16} />, () => {
            editor?.chain().focus().setTextAlign("center").run();
          })}
          {toolbar("Rata kanan", <AlignRight size={16} />, () => {
            editor?.chain().focus().setTextAlign("right").run();
          })}
          {toolbar("Divider", <Minus size={16} />, () => {
            editor?.chain().focus().setHorizontalRule().run();
          })}
          <label className="color-picker">
            Warna teks
            <input
              aria-label="Warna teks"
              type="color"
              defaultValue="#725321"
              onChange={(e) =>
                editor?.chain().focus().setColor(e.target.value).run()
              }
            />
          </label>
          {toolbar("Undo", <Undo2 size={16} />, () => {
            editor?.chain().focus().undo().run();
          })}
          {toolbar("Redo", <Redo2 size={16} />, () => {
            editor?.chain().focus().redo().run();
          })}
        </div>
      </details>
    </div>
  );
}
