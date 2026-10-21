"use client";
import WorkspaceSidebar from "./workspace/WorkspaceSidebar";
import NoteTimeline from "./workspace/NoteTimeline";
import NotePanel from "./workspace/NotePanel";
import SearchDialog from "./workspace/SearchDialog";
import EntityDialog, { type EntityTarget } from "./workspace/EntityDialog";
import FantasySurface from "./workspace/FantasySurface";
import FantasyScenery from "./FantasyScenery";
import OoalahWitch from "./OoalahWitch";
import { FantasyMotionProvider } from "@/features/motion/FantasyTransitions";
import { useEffect, useRef, useState } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Check,
  Menu,
  FolderOpen,
  Trash2,
  X,
  Layers2,
} from "lucide-react";
import { motionPresets } from "@/features/motion/presets";
import { useWorkspace } from "@/lib/workspace";
import {
  newNote,
  nodesFor,
  restoreDeleted,
  nextSummaryNumber,
  textOf,
  type Note,
} from "@/lib/model";
import { isLocalAIBaseUrl, markdownDocument, type AIConfig } from "@/lib/ai";
import { applyBackup, type ImportPreview } from "@/lib/backup";
import {
  EffectsOverlay,
  type EffectsHandle,
} from "@/features/motion/EffectsOverlay";
import { IconButton, Modal, Spinner } from "./ui";
import Settings from "./Settings";
import SummaryDialog from "./SummaryDialog";
export default function WorkspaceApp() {
  const { state, update, status, error, flush, current } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [focus, setFocus] = useState(false);
  const [settings, setSettings] = useState<"visual" | "ai" | "data" | null>(
    null,
  );
  const [summary, setSummary] = useState(false);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [manager, setManager] = useState<EntityTarget | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  const [search, setSearch] = useState<string | null>(null);
  const [undoLabel, setUndoLabel] = useState("");
  const undoAction = useRef<(() => void) | null>(null);
  const [config, setConfig] = useState<AIConfig>({
    provider: "openai",
    model: "",
    key: "",
  });
  const fx = useRef<EffectsHandle>(null);
  const osReduced = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = matchMedia("(min-width: 769px)");
    const refresh = () => setDesktop(media.matches);
    refresh();
    media.addEventListener("change", refresh);
    return () => media.removeEventListener("change", refresh);
  }, []);
  const focusEditor = useRef<() => void>(() => {});
  const activeButton = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    try {
      const meta = JSON.parse(
        localStorage.getItem("simpelin-ai-preferences") || "null",
      );
      if (
        meta &&
        ["openai", "gemini", "anthropic", "custom"].includes(
          meta.provider,
        )
      )
        setConfig({
          provider: meta.provider,
          model: typeof meta.model === "string" ? meta.model : "",
          baseUrl: typeof meta.baseUrl === "string" ? meta.baseUrl : "",
          key:
            meta.provider === "custom" && isLocalAIBaseUrl(meta.baseUrl)
              ? "default"
              : "",
        });
    } catch {
      /* Invalid preferences are ignored. */
    }
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || document.querySelector("dialog[open]")) return;
      if (e.key === "Escape") {
        setFocus(false);
        setMobile(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch("");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    activeButton.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: osReduced || state?.preferences.reduced ? "instant" : "smooth",
    });
  }, [state?.selectedNoteId, osReduced, state?.preferences.reduced]);
  function emit(
    kind: Parameters<EffectsHandle["emit"]>[0]["kind"],
    element?: HTMLElement | null,
  ) {
    const rect = element?.getBoundingClientRect();
    fx.current?.emit({
      kind,
      x: rect ? rect.left + rect.width / 2 : innerWidth * 0.55,
      y: rect ? rect.top + rect.height / 2 : innerHeight * 0.4,
    });
  }
  function selectCategory(categoryId: string) {
    update((s) => {
      s.selectedCategoryId = categoryId;
      s.selectedNoteId = nodesFor(s, categoryId)[0]?.id || "";
    });
    setMobile(false);
    setFocus(false);
  }
  function addNote(element: HTMLElement) {
    if (!state?.selectedCategoryId) return;
    const note = newNote(state.selectedCategoryId);
    update((s) => {
      s.notes.push(note);
      s.selectedNoteId = note.id;
    });
    emit("node", element);
    setTimeout(() => focusEditor.current(), 50);
  }
  function chooseNode(note: Note, element?: HTMLElement) {
    update((s) => {
      s.selectedNoteId = note.id;
      s.selectedCategoryId = note.categoryId;
    });
    emit("node", element);
  }
  function setUndo(label: string, action: () => void) {
    setUndoLabel(label);
    undoAction.current = action;
  }
  function removeEntity(kind: EntityTarget["kind"], entityId: string) {
    if (!state) return;
    const group = state.groups.find((g) => g.id === entityId);
    const category = state.categories.find((c) => c.id === entityId);
    const note = state.notes.find((n) => n.id === entityId);
    const categories = state.categories.filter((c) =>
      kind === "group" ? c.groupId === entityId : c.id === entityId,
    );
    const categoryIds = categories.map((c) => c.id);
    const notes = state.notes.filter((n) =>
      kind === "note" ? n.id === entityId : categoryIds.includes(n.categoryId),
    );
    setConfirm({
      title: `Hapus ${kind === "group" ? "group" : kind === "category" ? "kategori" : "catatan"}?`,
      description: `${group?.title || category?.title || note?.title || "Tanpa judul"}${kind !== "note" ? ` beserta ${notes.length} catatan dan referensi gambarnya akan dihapus dari ruang belajar.` : " akan dihapus."} Kamu bisa mengurungkannya.`,
      action: () => {
        update((s) => {
          if (kind === "group")
            s.groups = s.groups.filter((g) => g.id !== entityId);
          if (kind !== "note")
            s.categories = s.categories.filter(
              (c) => !categoryIds.includes(c.id),
            );
          s.notes = s.notes.filter(
            (n) => !notes.some((old) => old.id === n.id),
          );
          if (!s.categories.some((c) => c.id === s.selectedCategoryId))
            s.selectedCategoryId = s.categories[0]?.id || "";
          if (!s.notes.some((n) => n.id === s.selectedNoteId))
            s.selectedNoteId = nodesFor(s, s.selectedCategoryId)[0]?.id || "";
        });
        setUndo("Dihapus dari ruang belajar", () =>
          update((s) => {
            if (kind === "group")
              s.groups = restoreDeleted(
                s.groups,
                state.groups,
                new Set([entityId]),
              );
            if (kind !== "note")
              s.categories = restoreDeleted(
                s.categories,
                state.categories,
                new Set(categoryIds),
              );
            s.notes = restoreDeleted(
              s.notes,
              state.notes,
              new Set(notes.map((n) => n.id)),
            );
          }),
        );
        setManager(null);
        setConfirm(null);
      },
    });
  }
  async function importData(preview: ImportPreview) {
    const previous = structuredClone(current.current!);
    await flush();
    await applyBackup(preview);
    update((s) => Object.assign(s, preview.state));
    setUndo("Cadangan diimpor", () =>
      update((s) => Object.assign(s, previous)),
    );
  }
  if (!state)
    return (
      <main className="app-loading">
        <div className="brand">
          <span className="brand-mark">
            <Layers2 size={22} />
          </span>
          Simpelin<span className="brand-dot">.</span>
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : (
          <p>
            <Spinner />
            Memuat catatan…
          </p>
        )}
      </main>
    );
  const category = state.categories.find(
    (c) => c.id === state.selectedCategoryId,
  );
  const group = state.groups.find((g) => g.id === category?.groupId);
  const notes = nodesFor(state, state.selectedCategoryId);
  const selected = notes.find((n) => n.id === state.selectedNoteId);
  const material = notes.filter((n) => n.type === "note");
  const noteNumber =
    selected?.type === "note"
      ? material.findIndex((n) => n.id === selected.id) + 1
      : 0;
  const wordCount = selected
    ? textOf(selected.content).trim().split(/\s+/).filter(Boolean).length
    : 0;
  const reduced = !!osReduced || state.preferences.reduced;
  return (
    <MotionConfig
      reducedMotion={reduced ? "always" : "never"}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
    >
      <FantasyMotionProvider
        enabled={
          state.preferences.panel && !reduced && state.preferences.intensity > 0
        }
      >
        <div
          className={`workspace ${collapsed ? "sidebar-collapsed" : ""} ${mobile ? "mobile-open" : ""} ${reduced ? "reduce-motion" : ""}`}
        >
          <FantasyScenery />
          {mobile && (
            <button
              className="mobile-backdrop"
              aria-label="Tutup navigasi"
              onClick={() => setMobile(false)}
            />
          )}
          <WorkspaceSidebar
            state={state}
            update={update}
            collapsed={collapsed}
            reduced={reduced}
            onToggle={() => setCollapsed(!collapsed)}
            onClose={() => setMobile(false)}
            onSearch={() => setSearch("")}
            onManage={setManager}
            onSelectCategory={selectCategory}
            onSummary={() => setSummary(true)}
            onSettings={() => setSettings("visual")}
          />
          <OoalahWitch
            active={desktop || mobile}
            reduced={reduced}
            paused={
              state.preferences.focus ||
              focus ||
              !!settings ||
              summary ||
              !!manager ||
              !!confirm ||
              search !== null
            }
          />
          <main className="main-workspace">
            <header className="topbar">
              <div className="breadcrumb">
                <IconButton
                  label="Buka navigasi"
                  className="mobile-menu"
                  onClick={() => setMobile(true)}
                >
                  <Menu size={19} />
                </IconButton>
                <BookOpen size={15} />
                <span>{group?.title || "Ruang belajar"}</span>
                <ChevronRight size={12} />
                <strong>{category?.title || "Catatanmu"}</strong>
              </div>
              <button
                className="quiet-button"
                onClick={() => setSettings("visual")}
              >
                <span className="preset-dot" />
                {motionPresets[state.preferences.preset].name}
                <ChevronDown size={13} />
              </button>
            </header>
            <div className="workspace-content">
              <FantasySurface
                identity={state.selectedCategoryId}
                kind="category"
                className="category-header"
              >
                <div>
                  <h1>{category?.title || "Catatan"}</h1>
                </div>
                {category && (
                  <IconButton
                    label="Kelola kategori aktif"
                    className="header-more"
                    onClick={() =>
                      setManager({ kind: "category", id: category.id })
                    }
                  >
                    <MoreHorizontal size={22} />
                  </IconButton>
                )}
              </FantasySurface>
              {category ? (
                <>
                  <NoteTimeline
                    notes={notes}
                    selectedId={selected?.id || ""}
                    categoryId={state.selectedCategoryId}
                    summaryBusy={summaryBusy}
                    activeButton={activeButton}
                    onChoose={chooseNode}
                    onManage={setManager}
                    onAdd={addNote}
                  />
                  {focus && (
                    <button
                      className="focus-backdrop"
                      aria-label="Keluar mode fokus"
                      onClick={() => setFocus(false)}
                    />
                  )}
                  {selected ? (
                    <NotePanel
                      selected={selected}
                      noteNumber={noteNumber}
                      wordCount={wordCount}
                      preferences={state.preferences}
                      reduced={reduced}
                      focus={focus}
                      status={status}
                      update={update}
                      onManage={setManager}
                      onEmit={emit}
                      onToggleFocus={(element) => {
                        setFocus(!focus);
                        emit("panel", element);
                        requestAnimationFrame(() => focusEditor.current());
                      }}
                      onReady={(fn) => {
                        focusEditor.current = fn;
                      }}
                      onEffect={(kind, x, y) =>
                        fx.current?.emit({ kind, x, y })
                      }
                    />
                  ) : (
                    <div className="empty-state">
                      <BookOpen size={34} />
                      <h2>Belum ada catatan</h2>
                      <p>
                        Tekan + di ujung timeline untuk membuat catatan
                        pertemuan.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <FolderOpen size={36} />
                  <h2>Belum ada kategori</h2>
                  <p>
                    Buat group dan kategori untuk mengumpulkan materi yang
                    saling berhubungan.
                  </p>
                  <button
                    className="button primary"
                    onClick={() =>
                      setManager({
                        kind: state.groups.length ? "category" : "group",
                        groupId: state.groups[0]?.id,
                      })
                    }
                  >
                    <Plus size={16} />
                    {state.groups.length ? "Tambah kategori" : "Tambah group"}
                  </button>
                </div>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </main>
          {undoLabel && (
            <div className="undo-toast" role="status">
              <Check size={16} />
              <span>{undoLabel}</span>
              <button
                onClick={() => {
                  undoAction.current?.();
                  undoAction.current = null;
                  setUndoLabel("");
                }}
              >
                Urungkan
              </button>
              <IconButton
                label="Tutup notifikasi"
                onClick={() => setUndoLabel("")}
              >
                <X size={14} />
              </IconButton>
            </div>
          )}
          {settings && (
            <Settings
              state={state}
              initialTab={settings}
              onClose={() => setSettings(null)}
              onPreferences={(v) =>
                update((s) => {
                  s.preferences = v;
                })
              }
              config={config}
              onConfig={setConfig}
              onImport={importData}
            />
          )}
          {summary && (
            <SummaryDialog
              state={state}
              config={config}
              onClose={() => setSummary(false)}
              onConfigure={() => {
                setSummary(false);
                setSettings("ai");
              }}
              onBusy={setSummaryBusy}
              onSuccess={(text, categoryId, sources) => {
                if (
                  !current.current?.categories.some((c) => c.id === categoryId)
                )
                  return;
                const count = nextSummaryNumber(current.current, categoryId);
                const n = newNote(categoryId, `Summary ${count}`, "summary");
                n.content = markdownDocument(text);
                n.sources = sources.map((x) => ({
                  id: x.id,
                  updatedAt: x.updatedAt,
                }));
                update((s) => {
                  const category = s.categories.find(
                    (c) => c.id === categoryId,
                  )!;
                  category.summarySequence = count;
                  category.updatedAt = Date.now();
                  s.notes.push(n);
                  s.selectedCategoryId = categoryId;
                  s.selectedNoteId = n.id;
                });
                setTimeout(() => emit("summary", activeButton.current), 120);
              }}
            />
          )}
          {manager && (
            <EntityDialog
              manager={manager}
              state={state}
              update={update}
              onClose={() => setManager(null)}
              onDelete={removeEntity}
            />
          )}
          {confirm && (
            <Modal title={confirm.title} onClose={() => setConfirm(null)}>
              <p>{confirm.description}</p>
              <div className="modal-actions">
                <button
                  className="button secondary"
                  onClick={() => setConfirm(null)}
                >
                  Batal
                </button>
                <button className="button destructive" onClick={confirm.action}>
                  <Trash2 size={15} />
                  Hapus
                </button>
              </div>
            </Modal>
          )}
          {search !== null && (
            <SearchDialog
              state={state}
              query={search}
              onQueryChange={setSearch}
              onClose={() => setSearch(null)}
              onSelect={(note) => {
                chooseNode(note);
                setSearch(null);
                setMobile(false);
              }}
            />
          )}
          <EffectsOverlay ref={fx} preferences={state.preferences} />
        </div>
      </FantasyMotionProvider>
    </MotionConfig>
  );
}
