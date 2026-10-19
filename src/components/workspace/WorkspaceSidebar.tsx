"use client";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Settings2,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ArrowUpRight,
  FolderOpen,
  SlidersHorizontal,
  HardDrive,
  X,
  Layers2,
} from "lucide-react";
import type { Workspace } from "@/lib/model";
import type { WorkspaceUpdate } from "@/lib/workspace";
import type { EntityTarget } from "./EntityDialog";
import { IconButton } from "../ui";
export default function WorkspaceSidebar({
  state,
  update,
  collapsed,
  reduced,
  onToggle,
  onClose,
  onSearch,
  onManage,
  onSelectCategory,
  onSummary,
  onSettings,
}: {
  state: Pick<Workspace, "groups" | "categories" | "selectedCategoryId">;
  update: WorkspaceUpdate;
  collapsed: boolean;
  reduced: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSearch: () => void;
  onManage: (target: EntityTarget) => void;
  onSelectCategory: (id: string) => void;
  onSummary: () => void;
  onSettings: () => void;
}) {
  return (
    <aside className="sidebar" aria-label="Navigasi catatan">
      <div className="sidebar-brand">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Layers2 size={21} />
          </span>
          <span className="brand-name">
            Simpelin<span className="brand-dot">.</span>
          </span>
        </Link>
        <IconButton
          label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
          className="collapse-sidebar"
          onClick={() => onToggle()}
        >
          {collapsed ? (
            <PanelLeftOpen size={17} />
          ) : (
            <PanelLeftClose size={17} />
          )}
        </IconButton>
        <IconButton
          label="Tutup navigasi"
          className="mobile-close"
          onClick={() => onClose()}
        >
          <X size={18} />
        </IconButton>
      </div>
      <button className="sidebar-search" onClick={() => onSearch()}>
        <Search size={16} />
        <span>Cari catatan</span>
        <kbd>⌘ K</kbd>
      </button>
      <div className="sidebar-label">
        <span>RUANG BELAJAR</span>
        <IconButton
          label="Tambah group"
          onClick={() => onManage({ kind: "group" })}
        >
          <Plus size={15} />
        </IconButton>
      </div>
      <nav className="group-list">
        {state.groups.map((g) => (
          <div className="group" key={g.id}>
            <div className="group-heading">
              <button
                className="group-toggle"
                aria-expanded={!g.collapsed}
                onClick={() =>
                  update((s) => {
                    const found = s.groups.find((x) => x.id === g.id)!;
                    found.collapsed = !found.collapsed;
                    found.updatedAt = Date.now();
                  })
                }
              >
                {g.collapsed ? (
                  <ChevronRight size={15} />
                ) : (
                  <ChevronDown size={15} />
                )}
                <FolderOpen size={16} />
                <span>{g.title}</span>
              </button>
              <IconButton
                label={`Kelola ${g.title}`}
                className="group-more"
                onClick={() => onManage({ kind: "group", id: g.id })}
              >
                <MoreHorizontal size={16} />
              </IconButton>
            </div>
            {!g.collapsed && (
              <div className="category-list">
                {state.categories
                  .filter((c) => c.groupId === g.id)
                  .map((c, index) => (
                    <motion.div
                      initial={reduced ? false : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.025,
                        duration: 0.18,
                      }}
                      className={`category-row ${state.selectedCategoryId === c.id ? "selected" : ""}`}
                      key={c.id}
                    >
                      <button
                        className="category-link"
                        aria-current={
                          state.selectedCategoryId === c.id ? "page" : undefined
                        }
                        onClick={() => onSelectCategory(c.id)}
                      >
                        <span className="category-dot" />
                        <span>{c.title}</span>
                        {state.selectedCategoryId === c.id && (
                          <ChevronRight size={13} />
                        )}
                      </button>
                      <IconButton
                        label={`Kelola ${c.title}`}
                        className="category-more"
                        onClick={() => onManage({ kind: "category", id: c.id })}
                      >
                        <MoreHorizontal size={15} />
                      </IconButton>
                    </motion.div>
                  ))}
                <button
                  className="add-category"
                  onClick={() => onManage({ kind: "category", groupId: g.id })}
                >
                  <Plus size={14} />
                  <span>Tambah kategori</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>
      <button className="add-group" onClick={() => onManage({ kind: "group" })}>
        <Plus size={16} />
        <span>Tambah group</span>
      </button>
      <div className="sidebar-bottom">
        <button
          className="ai-button"
          onClick={() => onSummary()}
          disabled={!state.categories.length}
        >
          <span className="ai-symbol">
            <Sparkles size={19} />
          </span>
          <span>
            <strong>AI Summary</strong>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <div className="sidebar-utilities">
          <button onClick={() => onSettings()}>
            <Settings2 size={16} />
            <span>Pengaturan</span>
          </button>
          <Link href="/motion-lab" title="Motion Lab">
            <SlidersHorizontal size={16} />
          </Link>
        </div>
        <div className="local-status">
          <span />
          <span>Tersimpan lokal</span>
          <HardDrive size={12} />
        </div>
      </div>
    </aside>
  );
}
