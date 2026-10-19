"use client";
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { type JSONContent } from "@tiptap/core";
import { AssetImage, Callout, CodeBlock } from "./editor/nodes";
import EditorToolbar from "./editor/EditorToolbar";
import { slashItems } from "./editor/slash-commands";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Code2 } from "lucide-react";
import { saveImageAsset } from "@/lib/db";
import { id } from "@/lib/model";
import { safeUrl } from "@/lib/security";
import { Modal, Field } from "./ui";
export type EditorEffect = (
  event: "typing" | "enter" | "heading" | "highlight",
  x: number,
  y: number,
) => void;
export default function NoteEditor({
  noteId,
  content,
  onChange,
  onEffect,
  mini = false,
  onReady,
}: {
  noteId: string;
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  onEffect?: EditorEffect;
  mini?: boolean;
  onReady?: (focus: () => void) => void;
}) {
  const callbacks = useRef({ onChange, onEffect });
  callbacks.current = { onChange, onEffect };
  const [error, setError] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [slash, setSlash] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const slashRef = useRef({ query: "", index: 0 });
  const upload = useRef<HTMLInputElement>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const currentId = useRef(noteId);
  async function insertImage(file: File) {
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      ) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("Gunakan PNG, JPEG, WebP, atau GIF maksimal 8 MB.");
      return;
    }
    try {
      const targetNoteId = currentId.current;
      const assetId = id();
      await saveImageAsset(file, assetId);
      if (currentId.current !== targetNoteId) return;
      editorRef.current
        ?.chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { assetId, src: "", alt: file.name, caption: "", width: 100 },
        })
        .run();
      setError("");
    } catch {
      setError("Gambar belum tersimpan. Periksa ruang penyimpanan browser.");
    }
  }
  function effect(type: Parameters<EditorEffect>[0]) {
    const e = editorRef.current;
    if (!e) return;
    try {
      const coords = e.view.coordsAtPos(e.state.selection.from);
      callbacks.current.onEffect?.(type, coords.left, coords.bottom);
    } catch {
      /* Selection may be outside the viewport. */
    }
  }
  function executeSlash(command: string) {
    const e = editorRef.current;
    if (!e) return;
    const { from, $from } = e.state.selection;
    e.chain()
      .focus()
      .deleteRange({ from: from - $from.parentOffset, to: from })
      .run();
    setSlash("");
    slashRef.current.query = "";
    switch (command) {
      case "code":
        e.chain().focus().toggleCodeBlock().run();
        break;
      case "quote":
        e.chain().focus().toggleBlockquote().run();
        break;
      case "important":
      case "warning":
        e.chain()
          .focus()
          .insertContent({
            type: "callout",
            attrs: { kind: command },
            content: [{ type: "paragraph" }],
          })
          .run();
        break;
      case "image":
        upload.current?.click();
        break;
      case "link":
        setLink("https://");
        break;
    }
  }
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: {
          openOnClick: true,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
          isAllowedUri: (url) => !!safeUrl(url),
        },
      }),
      TableKit.configure({ table: { resizable: false, renderWrapper: true } }),
      Placeholder.configure({
        placeholder: mini
          ? "Ketik lalu tekan Enter…"
          : "Tulis catatan… Ketik / untuk blok.",
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      AssetImage,
      Callout,
      CodeBlock,
    ],
    content,
    editorProps: {
      attributes: {
        class: "rich-editor",
        role: "textbox",
        "aria-label": mini ? "Editor Motion Lab" : "Isi catatan",
        "aria-multiline": "true",
      },
      handleDOMEvents: {
        beforeinput: (view, event) => {
          const input = event as InputEvent;
          if (input.isComposing || view.composing) return false;
          if (input.inputType === "insertText") effect("typing");
          if (["insertParagraph", "insertLineBreak"].includes(input.inputType))
            effect("enter");
          return false;
        },
      },
      handleKeyDown: (view, event) => {
        if (event.isComposing || view.composing) return false;
        const options = slashItems.filter((i) =>
          i.id.startsWith(slashRef.current.query.slice(1)),
        );
        if (slashRef.current.query && options.length) {
          if (event.key === "Escape") {
            setSlash("");
            slashRef.current.query = "";
            return true;
          }
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            const n =
              (slashRef.current.index +
                (event.key === "ArrowDown" ? 1 : -1) +
                options.length) %
              options.length;
            slashRef.current.index = n;
            setSlashIndex(n);
            return true;
          }
          if (event.key === "Enter") {
            executeSlash(options[slashRef.current.index % options.length].id);
            return true;
          }
        }
        // ProseMirror handles hardware Enter during keydown and may suppress beforeinput.
        // Observe the event, then leave its normal list/code/paragraph behavior intact.
        if (event.key === "Enter") effect("enter");
        return false;
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files || []).find((f) =>
          f.type.startsWith("image/"),
        );
        if (file) {
          void insertImage(file);
          return true;
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        const file = event.dataTransfer?.files[0];
        if (file && !moved) {
          event.preventDefault();
          const position = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          if (position)
            editorRef.current?.commands.setTextSelection(position.pos);
          void insertImage(file);
          return true;
        }
        return false;
      },
      transformPastedHTML: (html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc
          .querySelectorAll("script,style,iframe,object,img")
          .forEach((n) => n.remove());
        return doc.body.innerHTML;
      },
    },
    onUpdate: ({ editor: e }) => {
      callbacks.current.onChange(e.getJSON());
      const { $from } = e.state.selection;
      const text = $from.parent.textContent;
      const query = /^\/[a-z]*$/.test(text) ? text : "";
      setSlash(query);
      setSlashIndex(0);
      slashRef.current = { query, index: 0 };
    },
  });
  editorRef.current = editor;
  useEffect(() => {
    if (editor && currentId.current !== noteId) {
      currentId.current = noteId;
      editor.commands.setContent(content, { emitUpdate: false });
      setSlash("");
      slashRef.current.query = "";
    }
  }, [noteId, editor, content]);
  useEffect(() => {
    if (editor) onReady?.(() => editor.commands.focus());
  }, [editor, onReady]);
  const options = slashItems.filter((i) => i.id.startsWith(slash.slice(1)));
  return (
    <div className={`editor-inner ${mini ? "mini" : ""}`}>
      {!mini && (
        <EditorToolbar
          editor={editor}
          onEffect={effect}
          onSetLink={setLink}
          onUpload={() => upload.current?.click()}
        />
      )}
      <div className="editor-scroll">
        <EditorContent editor={editor} />
        {slash && options.length > 0 && (
          <div
            className="slash-menu"
            role="listbox"
            aria-label="Slash commands"
          >
            {options.map((item, index) => (
              <button
                key={item.id}
                role="option"
                aria-selected={index === slashIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeSlash(item.id)}
              >
                <Code2 size={17} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
                <kbd>↵</kbd>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="file"
        ref={upload}
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void insertImage(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p className="error inline-error" role="alert">
          {error}
          <button onClick={() => setError("")}>Tutup</button>
        </p>
      )}
      {link !== null && (
        <Modal title="Tambahkan tautan" onClose={() => setLink(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const href = safeUrl(link);
              if (href) {
                editor
                  ?.chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href })
                  .run();
                setLink(null);
              } else
                setError(
                  "Gunakan URL https://, http://, atau mailto: yang valid.",
                );
            }}
          >
            <Field label="URL">
              <input
                autoFocus
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </Field>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  editor?.chain().focus().unsetLink().run();
                  setLink(null);
                }}
              >
                Hapus tautan
              </button>
              <button className="button primary">Simpan tautan</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
