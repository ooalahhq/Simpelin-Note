"use client";
import type { RefObject } from "react";
import { motion } from "motion/react";
import { Sparkles, Check, MoreHorizontal, Plus } from "lucide-react";
import type { Note } from "@/lib/model";
import type { EntityTarget } from "./EntityDialog";
import FantasySurface from "./FantasySurface";
export default function NoteTimeline({
  notes,
  selectedId,
  categoryId,
  summaryBusy,
  activeButton,
  onChoose,
  onManage,
  onAdd,
}: {
  notes: Note[];
  selectedId: string;
  categoryId: string;
  summaryBusy: boolean;
  activeButton: RefObject<HTMLButtonElement | null>;
  onChoose: (note: Note, element: HTMLElement) => void;
  onManage: (target: EntityTarget) => void;
  onAdd: (element: HTMLElement) => void;
}) {
  const material = notes.filter((note) => note.type === "note");
  return (
    <section
      className={`timeline ${summaryBusy ? "is-summarizing" : ""}`}
      aria-label="Timeline pertemuan"
    >
      <FantasySurface
        identity={categoryId}
        kind="category"
        className="timeline-track"
      >
        {notes.map((n, index) => {
          const num = material.findIndex((x) => x.id === n.id) + 1;
          return (
            <div
              className={`timeline-item ${selectedId === n.id ? "active" : ""} ${n.complete ? "complete" : ""} ${n.type === "summary" ? "summary-node" : ""}`}
              key={n.id}
            >
              <span className="timeline-connector" />
              <button
                ref={n.id === selectedId ? activeButton : undefined}
                className="timeline-node-button"
                onClick={(e) => onChoose(n, e.currentTarget)}
                aria-label={`${n.type === "summary" ? n.title : `P${num} · ${n.title || "Tanpa judul"}`}`}
                aria-pressed={n.id === selectedId}
              >
                <span className="node-orb">
                  {n.type === "summary" ? (
                    <Sparkles size={17} />
                  ) : n.complete ? (
                    <Check size={16} />
                  ) : (
                    <span>{num.toString().padStart(2, "0")}</span>
                  )}
                  {selectedId === n.id && (
                    <motion.span
                      layoutId="node-selection"
                      className="node-selection"
                    />
                  )}
                </span>
                <strong>
                  {n.type === "summary" ? n.title : `Pertemuan ${num}`}
                </strong>
                <small>
                  {n.type === "summary"
                    ? "Ringkasan kategori"
                    : n.title || "Tanpa judul"}
                </small>
              </button>
              <button
                className="node-manage"
                aria-label={`Kelola ${n.type === "summary" ? n.title : `P${num}`}`}
                onClick={() => onManage({ kind: "note", id: n.id })}
              >
                <MoreHorizontal size={14} />
              </button>
              {index === notes.length - 1 && (
                <span className="timeline-end-connector" />
              )}
            </div>
          );
        })}
        <div className="timeline-add">
          <button
            className="add-node"
            aria-label="Tambah pertemuan"
            onClick={(e) => onAdd(e.currentTarget)}
          >
            <Plus size={21} />
          </button>
          <small>Catatan baru</small>
        </div>
      </FantasySurface>
    </section>
  );
}
