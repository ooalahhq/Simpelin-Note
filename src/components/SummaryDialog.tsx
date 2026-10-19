"use client";
import { useRef, useState, useEffect } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Settings2 } from "lucide-react";
import { type Workspace, type Note, textOf } from "@/lib/model";
import {
  summarize,
  providerNames,
  materialContext,
  type AIConfig,
} from "@/lib/ai";
import { Modal, Field, Spinner } from "./ui";
export default function SummaryDialog({
  state,
  config,
  onClose,
  onConfigure,
  onSuccess,
  onBusy,
}: {
  state: Workspace;
  config: AIConfig;
  onClose: () => void;
  onConfigure: () => void;
  onSuccess: (text: string, categoryId: string, sources: Note[]) => void;
  onBusy: (v: boolean) => void;
}) {
  const [categoryId, setCategoryId] = useState(state.selectedCategoryId);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const busyCallback = useRef(onBusy);
  busyCallback.current = onBusy;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
      busyCallback.current(false);
    };
  }, []);
  const notes = state.notes.filter(
    (n) => n.categoryId === categoryId && n.type === "note",
  );
  const available = notes.some((n) => textOf(n.content).trim());
  const ready = !!config.key && !!config.model;
  async function run() {
    if (busy) return;
    setBusy(true);
    onBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      const result = await summarize(
        config,
        notes,
        controller.current.signal,
        setProgress,
        (
          state.categories.find((category) => category.id === categoryId)
            ?.title || ""
        ).slice(0, 500),
      );
      if (alive.current && !controller.current.signal.aborted) {
        onSuccess(result, categoryId, notes);
        onClose();
      }
    } catch (e) {
      if (alive.current)
        setError(
          controller.current.signal.aborted
            ? "Pembuatan dibatalkan. Catatan tetap aman."
            : (e as Error).message,
        );
    } finally {
      if (alive.current) setBusy(false);
      onBusy(false);
    }
  }
  return (
    <Modal
      title="AI Summary"
      onBeforeClose={() => controller.current?.abort()}
      onClose={() => {
        controller.current?.abort();
        onClose();
      }}
    >
      <div className="summary-symbol">
        <Sparkles size={26} />
      </div>
      <p className="muted">
        Catatan disusun menjadi materi belajar dengan penjelasan bertahap,
        contoh, dan cek pemahaman. Konsep yang masih singkat dilengkapi dengan
        pengetahuan dasar yang relevan dan diberi label Pelengkap materi.
      </p>
      <Field label="Kategori">
        <select
          value={categoryId}
          disabled={busy}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {state.groups.map((g) => (
            <optgroup key={g.id} label={g.title}>
              {state.categories
                .filter((c) => c.groupId === g.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <div className="summary-scope">
        <span>{notes.length} catatan materi</span>
        <span>Summary lama dikecualikan</span>
      </div>
      {ready ? (
        <p className="privacy-note">
          <ShieldCheck size={16} />
          {providerNames[config.provider]} · {config.model}. Perkiraan input
          awal ±
          {Math.ceil(materialContext(notes).length / 3).toLocaleString("id-ID")}{" "}
          token; chunking dan output dapat menambah biaya. Output terpotong
          dicoba ulang maksimal sekali per bagian dengan batas lebih besar;
          percobaan ulang juga dapat dikenai biaya. Tarif mengikuti provider.
        </p>
      ) : (
        <div className="setup-key">
          <p>
            Tambahkan provider, model, dan API key milikmu untuk mulai
            merangkum.
          </p>
          <button className="button secondary" onClick={onConfigure}>
            <Settings2 size={15} />
            Atur AI Provider
          </button>
        </div>
      )}
      {!available && (
        <p className="muted">
          Kategori ini belum memiliki teks materi yang bisa dirangkum.
        </p>
      )}
      {busy && (
        <p className="status-line" role="status">
          <Spinner />
          {progress || "Menghubungi provider…"}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button
          className="button secondary"
          onClick={() => {
            controller.current?.abort();
            onClose();
          }}
        >
          {busy ? "Batalkan proses" : "Batal"}
        </button>
        <button
          className="button primary"
          disabled={busy || !ready || !available}
          onClick={run}
        >
          {busy ? <Spinner /> : <Sparkles size={16} />}Buat Summary
          {!busy && <ArrowRight size={15} />}
        </button>
      </div>
    </Modal>
  );
}
