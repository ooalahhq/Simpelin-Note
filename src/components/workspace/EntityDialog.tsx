"use client";
import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Pencil } from "lucide-react";
import { id, move, type Workspace } from "@/lib/model";
import type { WorkspaceUpdate } from "@/lib/workspace";
import { Modal, Field } from "../ui";
export type EntityTarget = {
  kind: "group" | "category" | "note";
  id?: string;
  groupId?: string;
};
export default function EntityDialog({
  manager: m,
  state,
  update,
  onClose,
  onDelete,
}: {
  manager: EntityTarget;
  state: Workspace;
  update: WorkspaceUpdate;
  onClose: () => void;
  onDelete: (kind: EntityTarget["kind"], id: string) => void;
}) {
  const entity =
    m.kind === "group"
      ? state.groups.find((g) => g.id === m.id)
      : m.kind === "category"
        ? state.categories.find((c) => c.id === m.id)
        : state.notes.find((n) => n.id === m.id);
  const [title, setTitle] = useState(entity?.title || "");
  const [groupId, setGroupId] = useState(
    m.kind === "category"
      ? state.categories.find((c) => c.id === m.id)?.groupId ||
          m.groupId ||
          state.groups[0]?.id ||
          ""
      : "",
  );
  const label =
    m.kind === "group"
      ? "group"
      : m.kind === "category"
        ? "kategori"
        : "catatan";
  function reorder(direction: number) {
    update((s) => {
      if (m.kind === "group") {
        const index = s.groups.findIndex((g) => g.id === m.id);
        s.groups = move(
          s.groups,
          index,
          Math.min(s.groups.length - 1, Math.max(0, index + direction)),
        );
      } else if (m.kind === "category") {
        const c = s.categories.find((c) => c.id === m.id)!;
        const filtered = s.categories.filter((x) => x.groupId === c.groupId);
        const from = filtered.findIndex((x) => x.id === m.id);
        const reordered = move(
          filtered,
          from,
          Math.min(filtered.length - 1, Math.max(0, from + direction)),
        );
        let i = 0;
        s.categories = s.categories.map((x) =>
          x.groupId === c.groupId ? reordered[i++] : x,
        );
      } else {
        const note = s.notes.find((n) => n.id === m.id)!;
        const filtered = s.notes.filter(
          (n) => n.categoryId === note.categoryId && n.type === note.type,
        );
        const from = filtered.findIndex((n) => n.id === m.id);
        const reordered = move(
          filtered,
          from,
          Math.min(filtered.length - 1, Math.max(0, from + direction)),
        );
        let i = 0;
        s.notes = s.notes.map((n) =>
          n.categoryId === note.categoryId && n.type === note.type
            ? reordered[i++]
            : n,
        );
      }
    });
  }
  return (
    <Modal title={`${m.id ? "Kelola" : "Tambah"} ${label}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          update((s) => {
            const now = Date.now();
            if (m.kind === "group") {
              if (m.id) {
                const g = s.groups.find((g) => g.id === m.id)!;
                g.title = title.trim();
                g.updatedAt = now;
              } else
                s.groups.push({
                  id: id(),
                  title: title.trim(),
                  collapsed: false,
                  createdAt: now,
                  updatedAt: now,
                });
            } else if (m.kind === "category") {
              if (m.id) {
                const c = s.categories.find((c) => c.id === m.id)!;
                c.title = title.trim();
                c.groupId = groupId;
                c.updatedAt = now;
              } else {
                const c = {
                  id: id(),
                  groupId,
                  title: title.trim(),
                  createdAt: now,
                  updatedAt: now,
                };
                s.categories.push(c);
                s.selectedCategoryId = c.id;
                s.selectedNoteId = "";
                const g = s.groups.find((g) => g.id === groupId);
                if (g) g.collapsed = false;
              }
            } else {
              const n = s.notes.find((n) => n.id === m.id)!;
              n.title = title.trim();
              n.updatedAt = now;
            }
          });
          onClose();
        }}
      >
        <Field label={`Nama ${label}`}>
          <input
            autoFocus
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={
              m.kind === "group"
                ? "Semester 3"
                : m.kind === "category"
                  ? "Nama mata kuliah"
                  : "Judul catatan"
            }
          />
        </Field>
        {m.kind === "category" && (
          <Field label="Group">
            <select
              required
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              {state.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </Field>
        )}
        {m.id && (
          <div className="entity-tools">
            <span>Urutan {label}</span>
            <button
              type="button"
              className="button secondary"
              onClick={() => reorder(-1)}
            >
              <ArrowUp size={14} />
              Sebelumnya
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => reorder(1)}
            >
              <ArrowDown size={14} />
              Sesudahnya
            </button>
          </div>
        )}
        <div className="modal-actions">
          {m.id && (
            <button
              type="button"
              className="text-button danger"
              onClick={() => onDelete(m.kind, m.id!)}
            >
              <Trash2 size={14} />
              Hapus {label}
            </button>
          )}
          <button type="button" className="button secondary" onClick={onClose}>
            Batal
          </button>
          <button className="button primary">
            <Pencil size={14} />
            {m.id ? "Simpan" : "Tambahkan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
