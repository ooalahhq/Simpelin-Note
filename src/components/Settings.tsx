"use client";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  useFantasyTransition,
  useFantasyMotion,
} from "@/features/motion/FantasyTransitions";
import {
  SlidersHorizontal,
  Sparkles,
  HardDrive,
  ArrowUpRight,
  Download,
  Upload,
  Check,
  KeyRound,
} from "lucide-react";
import type { Workspace, AnimationPreferences } from "@/lib/model";
import {
  aiRequest,
  providerNames,
  type AIConfig,
  type Provider,
} from "@/lib/ai";
import {
  forgetKey,
  hasRememberedKey,
  rememberKey,
  unlockKey,
} from "@/lib/key-vault";
import {
  download,
  exportBackup,
  previewBackup,
  type ImportPreview,
} from "@/lib/backup";
import { Modal, Field, Spinner, Toggle } from "./ui";
import AnimationSettings from "./AnimationSettings";
export default function Settings({
  state,
  onClose,
  onPreferences,
  config,
  onConfig,
  onImport,
  initialTab = "visual",
}: {
  state: Workspace;
  onClose: () => void;
  onPreferences: (v: AnimationPreferences) => void;
  config: AIConfig;
  onConfig: (v: AIConfig) => void;
  onImport: (p: ImportPreview) => Promise<void>;
  initialTab?: "visual" | "ai" | "data";
}) {
  const [tab, setTab] = useState(initialTab);
  const bodyRef = useFantasyTransition<HTMLDivElement>(tab, "tab");
  const motionEnabled = useFantasyMotion();
  const [draft, setDraft] = useState(config);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [remembered, setRemembered] = useState(() => hasRememberedKey());
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const close = () => {
    controller.current?.abort();
    onClose();
  };
  async function save() {
    setError("");
    setMessage("");
    try {
      if (remember) {
        if (!draft.key) throw new Error("Masukkan API key terlebih dahulu.");
        await rememberKey(draft.key, passphrase);
        setRemembered(true);
      }
      onConfig(draft);
      localStorage.setItem(
        "simpelin-ai-preferences",
        JSON.stringify({ provider: draft.provider, model: draft.model }),
      );
      setPassphrase("");
      setMessage(
        remember
          ? "Pengaturan tersimpan; key dienkripsi."
          : "Pengaturan aktif; key hanya tersimpan di memori sesi ini.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function test() {
    setBusy(true);
    setError("");
    setMessage("");
    const c = new AbortController();
    controller.current = c;
    try {
      await aiRequest(draft, "Uji koneksi", c.signal, "test", () =>
        setMessage(
          "Mencoba ulang uji koneksi dengan batas output lebih besar…",
        ),
      );
      setMessage("Koneksi berhasil. Provider dan model dapat diakses.");
    } catch (e) {
      setMessage("");
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Pengaturan"
      onClose={close}
      onBeforeClose={() => controller.current?.abort()}
      wide
    >
      <div
        className="settings-tabs"
        role="tablist"
        aria-label="Bagian pengaturan"
      >
        {(
          [
            { id: "visual", label: "Visual & Focus", icon: SlidersHorizontal },
            { id: "ai", label: "AI Provider", icon: Sparkles },
            { id: "data", label: "Data lokal", icon: HardDrive },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="settings-tab-content"
            id={`settings-tab-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onKeyDown={(e) => {
              const choices = ["visual", "ai", "data"] as const;
              const index = choices.indexOf(tab);
              const next =
                e.key === "ArrowRight"
                  ? choices[(index + 1) % 3]
                  : e.key === "ArrowLeft"
                    ? choices[(index + 2) % 3]
                    : e.key === "Home"
                      ? choices[0]
                      : e.key === "End"
                        ? choices[2]
                        : null;
              if (next) {
                e.preventDefault();
                setTab(next);
                setMessage("");
                setError("");
                document.getElementById(`settings-tab-${next}`)?.focus();
              }
            }}
            onClick={() => {
              setTab(t.id);
              setMessage("");
              setError("");
            }}
          >
            <t.icon size={16} />
            {t.label}
            {tab === t.id && (
              <motion.span
                layoutId="settings-tab-rune"
                className="settings-tab-rune"
                aria-hidden="true"
                transition={{
                  duration: motionEnabled ? 0.28 : 0,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            )}
          </button>
        ))}
      </div>
      <div
        ref={bodyRef}
        className="settings-body"
        role="tabpanel"
        id="settings-tab-content"
        aria-labelledby={`settings-tab-${tab}`}
      >
        {tab === "visual" && (
          <>
            <AnimationSettings
              value={state.preferences}
              onChange={onPreferences}
            />
            <a href="/motion-lab" className="lab-link">
              Coba semua efek di Motion Lab <ArrowUpRight size={15} />
            </a>
          </>
        )}
        {tab === "ai" && (
          <>
            <p className="muted">
              Gunakan API key milikmu. Catatan hanya dikirim setelah kamu
              memilih Buat Summary.
            </p>
            <Field label="Provider">
              <select
                value={draft.provider}
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    provider: e.target.value as Provider,
                    model: "",
                    key: "",
                  });
                  setMessage("");
                }}
              >
                {Object.entries(providerNames).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="ID model"
              hint="Masukkan ID model yang tersedia pada akun providermu."
            >
              <input
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder="ID model dari provider"
                autoComplete="off"
              />
            </Field>
            <Field
              label="API key"
              hint="Key melewati proxy server Simpelin untuk request ini, lalu diteruskan ke provider. Server tidak menyimpan key atau materi."
            >
              <input
                type="password"
                value={draft.key}
                onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                placeholder="Key milikmu"
                autoComplete="off"
              />
            </Field>
            <Toggle
              label="Remember key"
              detail="Enkripsi dengan passphrase. Penyimpanan browser tetap memiliki risiko pada perangkat bersama."
              checked={remember}
              onChange={setRemember}
            />
            {(remember || remembered) && (
              <Field
                label="Passphrase"
                hint="Minimal 10 karakter; tidak disimpan oleh aplikasi."
              >
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  autoComplete="off"
                />
              </Field>
            )}
            {remembered && (
              <div className="key-actions">
                <button
                  className="button secondary"
                  disabled={!passphrase || busy}
                  onClick={async () => {
                    try {
                      const key = await unlockKey(passphrase);
                      setDraft({ ...draft, key });
                      setPassphrase("");
                      setMessage(
                        "Key terbuka. Klik Aktifkan pengaturan untuk menggunakannya.",
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <KeyRound size={14} />
                  Buka key tersimpan
                </button>
                <button
                  className="text-button danger"
                  onClick={() => {
                    forgetKey();
                    setRemembered(false);
                    setMessage("Key terenkripsi telah dihapus.");
                  }}
                >
                  Lupakan key
                </button>
              </div>
            )}
            <div className="privacy-note">
              <InfoSmall />
              Penggunaan AI mengikuti tarif provider. Uji koneksi juga mengirim
              request kecil. Output terpotong dicoba ulang maksimal sekali;
              percobaan ulang juga dapat dikenai biaya.
            </div>
            <div className="modal-actions">
              <button
                className="button secondary"
                disabled={busy || !draft.key || !draft.model}
                onClick={test}
              >
                {busy ? <Spinner /> : null}Uji koneksi
              </button>
              <button className="button primary" onClick={save} disabled={busy}>
                Aktifkan pengaturan
              </button>
            </div>
          </>
        )}
        {tab === "data" && (
          <>
            <div className="data-intro">
              <HardDrive size={28} />
              <h3>Penyimpanan lokal</h3>
              <p>
                Catatan tersimpan di browser ini. Ekspor cadangan sebelum
                membersihkan data browser atau berganti perangkat.
              </p>
            </div>
            <div className="data-action">
              <div>
                <strong>Ekspor cadangan</strong>
                <p>ZIP berisi catatan dan gambar. API key tidak disertakan.</p>
              </div>
              <button
                className="button secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    download(
                      await exportBackup(state),
                      `simpelin-${new Date().toISOString().slice(0, 10)}.zip`,
                    );
                    setMessage("Cadangan siap diunduh.");
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Download size={15} />
                Ekspor
              </button>
            </div>
            <div className="data-action">
              <div>
                <strong>Impor cadangan</strong>
                <p>Periksa isi cadangan sebelum mengganti ruang belajar.</p>
              </div>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                <Upload size={15} />
                Impor
              </button>
            </div>
            <input
              hidden
              ref={input}
              type="file"
              accept=".zip"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true);
                setError("");
                try {
                  setPreview(await previewBackup(f));
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
            {preview && (
              <div className="import-preview">
                <h3>Periksa cadangan</h3>
                <p>
                  {preview.state.groups.length} group ·{" "}
                  {preview.state.categories.length} kategori ·{" "}
                  {preview.state.notes.length} catatan · {preview.assets.length}{" "}
                  gambar
                </p>
                <p>
                  Impor akan mengganti catatan saat ini. Ekspor cadangan
                  terlebih dahulu. Setelah impor tersedia tindakan Urungkan.
                </p>
                <div className="modal-actions">
                  <button
                    className="button secondary"
                    onClick={() => setPreview(null)}
                  >
                    Batal
                  </button>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await onImport(preview);
                        setPreview(null);
                        setMessage("Cadangan berhasil diimpor.");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Ganti dengan cadangan ini
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {busy && tab === "data" && (
          <p className="status-line">
            <Spinner />
            Memproses cadangan…
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success status-line" role="status">
            <Check size={15} />
            {message}
          </p>
        )}
      </div>
    </Modal>
  );
}
function InfoSmall() {
  return <span aria-hidden="true">↗</span>;
}
