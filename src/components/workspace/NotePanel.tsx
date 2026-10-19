"use client";
import { motion } from "motion/react";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Minimize2,
  Maximize2,
  MoreHorizontal,
  Check,
} from "lucide-react";
import type { Note, AnimationPreferences } from "@/lib/model";
import type { WorkspaceUpdate } from "@/lib/workspace";
import type { EffectKind } from "@/features/motion/presets";
import type { EntityTarget } from "./EntityDialog";
import NoteEditor, { type EditorEffect } from "../NoteEditor";
import { IconButton } from "../ui";
import FantasySurface from "./FantasySurface";
export default function NotePanel({
  selected,
  noteNumber,
  wordCount,
  preferences,
  reduced,
  focus,
  status,
  update,
  onManage,
  onEmit,
  onToggleFocus,
  onReady,
  onEffect,
}: {
  selected: Note;
  noteNumber: number;
  wordCount: number;
  preferences: AnimationPreferences;
  reduced: boolean;
  focus: boolean;
  status: string;
  update: WorkspaceUpdate;
  onManage: (target: EntityTarget) => void;
  onEmit: (kind: EffectKind, element?: HTMLElement | null) => void;
  onToggleFocus: (element: HTMLElement) => void;
  onReady: (focus: () => void) => void;
  onEffect: EditorEffect;
}) {
  return (
    <motion.section
      layout={preferences.panel && !reduced}
      className={`note-panel ${focus ? "expanded" : ""}`}
      aria-label="Editor catatan"
      data-impact-surface
    >
      <div className="note-heading">
        <div className="note-identity">
          <span
            className={`note-badge ${selected.type === "summary" ? "summary-badge" : ""}`}
          >
            {selected.type === "summary" ? (
              <Sparkles size={13} />
            ) : (
              <BookOpen size={13} />
            )}{" "}
            {selected.type === "summary"
              ? "SUMMARY"
              : `P${noteNumber.toString().padStart(2, "0")}`}
          </span>
          <input
            aria-label="Judul catatan"
            value={selected.title}
            onChange={(e) => {
              const value = e.target.value;
              update((s) => {
                const n = s.notes.find((n) => n.id === selected.id);
                if (n) {
                  n.title = value;
                  n.updatedAt = Date.now();
                }
              });
            }}
            placeholder="Tanpa judul"
            maxLength={200}
          />
        </div>
        <div className="note-actions">
          <IconButton
            label={
              selected.complete ? "Tandai belum selesai" : "Tandai selesai"
            }
            aria-pressed={selected.complete}
            className={selected.complete ? "done" : ""}
            onClick={(e) => {
              update((s) => {
                const n = s.notes.find((n) => n.id === selected.id)!;
                n.complete = !n.complete;
                n.updatedAt = Date.now();
              });
              if (!selected.complete) onEmit("complete", e.currentTarget);
            }}
          >
            <CheckCircle2 size={17} />
          </IconButton>
          <IconButton
            label={focus ? "Kecilkan editor" : "Perbesar editor"}
            onClick={(e) => {
              onToggleFocus(e.currentTarget);
            }}
          >
            {focus ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </IconButton>
          <IconButton
            label="Kelola catatan aktif"
            onClick={() => onManage({ kind: "note", id: selected.id })}
          >
            <MoreHorizontal size={18} />
          </IconButton>
        </div>
      </div>
      <FantasySurface identity={selected.id} kind="note" className="note-body">
        <span
          className="fantasy-reveal"
          data-fantasy-reveal
          aria-hidden="true"
        />
        <NoteEditor
          noteId={selected.id}
          content={selected.content}
          onReady={(fn) => {
            onReady(fn);
          }}
          onChange={(content) => {
            const noteId = selected.id;
            update((s) => {
              const n = s.notes.find((n) => n.id === noteId);
              if (n) {
                n.content = content;
                n.updatedAt = Date.now();
              }
            });
          }}
          onEffect={(kind, x, y) => onEffect(kind, x, y)}
        />
        <footer className="editor-footer">
          <span className="save-indicator">
            <Check size={12} />
            <span role="status">{status}</span>
          </span>
          <span>
            {wordCount} kata
            <span className="footer-separator">·</span>
            <span className="desktop-hint">
              Ketik <kbd>/</kbd> untuk blok
            </span>
          </span>
        </footer>
      </FantasySurface>
    </motion.section>
  );
}
