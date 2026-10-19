"use client";
import { BookOpen, ArrowUpRight, Search } from "lucide-react";
import { textOf, type Note, type Workspace } from "@/lib/model";
import { Modal } from "../ui";
export default function SearchDialog({
  state,
  query,
  onQueryChange,
  onClose,
  onSelect,
}: {
  state: Pick<Workspace, "notes" | "categories">;
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onSelect: (note: Note) => void;
}) {
  const normalized = query.toLocaleLowerCase();
  const results = state.notes
    .filter((note) =>
      `${note.title} ${textOf(note.content)}`
        .toLocaleLowerCase()
        .includes(normalized),
    )
    .slice(0, 30);
  return (
    <Modal title="Cari catatan" onClose={onClose}>
      <label className="search-input">
        <Search size={18} />
        <input
          autoFocus
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Judul atau isi catatan…"
          aria-label="Cari catatan"
        />
      </label>
      <div className="search-results">
        {results.map((note) => (
          <button key={note.id} onClick={() => onSelect(note)}>
            <BookOpen size={17} />
            <span>
              <strong>{note.title || "Tanpa judul"}</strong>
              <small>
                {
                  state.categories.find(
                    (category) => category.id === note.categoryId,
                  )?.title
                }
              </small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        ))}
        {!results.length && (
          <p className="muted">Belum ada catatan yang cocok.</p>
        )}
      </div>
    </Modal>
  );
}
