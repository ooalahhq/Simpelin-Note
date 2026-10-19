"use client";
import FantasyScenery from "./FantasyScenery";
import { useRef, useState } from "react";
import Link from "next/link";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCcw,
  Play,
  Layers2,
  Activity,
} from "lucide-react";
import NoteEditor from "./NoteEditor";
import AnimationSettings from "./AnimationSettings";
import {
  EffectsOverlay,
  type EffectsHandle,
} from "@/features/motion/EffectsOverlay";
import { defaultPreferences, document, paragraph } from "@/lib/model";
import type { JSONContent } from "@tiptap/core";
import type { MotionStats } from "@/features/motion/MotionDirector";
import type { EffectKind } from "@/features/motion/presets";
import { motionPresets } from "@/features/motion/presets";
import { IconButton } from "./ui";
export default function MotionLab() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [content, setContent] = useState<JSONContent>(() =>
    document(paragraph("Ketik di sini, lalu tekan Enter.")),
  );
  const [expanded, setExpanded] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stats, setStats] = useState<MotionStats>({
    fps: 0,
    active: 0,
    renderer: "Menyiapkan renderer…",
    quality: 1,
    duration: 0,
  });
  const [version, setVersion] = useState(0);
  const [last, setLast] = useState<EffectKind>("enter");
  const [labNodes, setLabNodes] = useState(3);
  const [complete, setComplete] = useState(false);
  const fx = useRef<EffectsHandle>(null);
  const stage = useRef<HTMLDivElement>(null);
  const osReduced = useReducedMotion();
  const reduced = !!osReduced || preferences.reduced;
  function trigger(kind: EffectKind) {
    const rect = stage.current?.getBoundingClientRect();
    setLast(kind);
    fx.current?.emit({
      kind,
      x: rect ? rect.left + rect.width * 0.5 : innerWidth / 2,
      y: rect ? rect.top + 150 : innerHeight / 2,
      speed,
      seed: 42,
    });
  }
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <main className={`motion-lab ${reduced ? "reduce-motion" : ""}`}>
        <FantasyScenery />
        <header className="lab-topbar">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Layers2 size={20} />
            </span>
            Simpelin<span className="brand-dot">.</span>
          </Link>
          <Link href="/" className="button secondary">
            <ArrowLeft size={15} />
            Kembali ke catatan
          </Link>
        </header>
        <div className="lab-intro">
          <h1>Motion Lab</h1>
          <p className="lab-credit">Made by Phya</p>
          <span className="lab-local-note">Preview terpisah dari catatan.</span>
        </div>
        <div className="lab-layout">
          <aside className="lab-controls">
            <div className="lab-controls-heading">
              <SlidersLabel />
              <h2>Pengaturan efek</h2>
            </div>
            <AnimationSettings value={preferences} onChange={setPreferences} />
          </aside>
          <section className="lab-preview">
            <div className="lab-preview-heading">
              <div>
                <h2>{motionPresets[preferences.preset].name}</h2>
                <p>{motionPresets[preferences.preset].description}</p>
              </div>
              <span className="live-pill">
                <span />
                Preview langsung
              </span>
            </div>
            <div className="lab-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setLabNodes((n) => Math.min(n + 1, 8));
                  trigger("node");
                }}
              >
                <Plus size={15} />
                Tambah Node
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setComplete(!complete);
                  trigger("complete");
                }}
              >
                <CheckCircle2 size={15} />
                Node Complete
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setExpanded(!expanded);
                  trigger("panel");
                }}
              >
                {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                Maximize
              </button>
              <button
                className="button secondary"
                onClick={() => trigger("summary")}
              >
                <Sparkles size={15} />
                AI Summary Success
              </button>
            </div>
            <div className="lab-stage" ref={stage}>
              <div className="lab-timeline">
                {Array.from({ length: labNodes }, (_, i) => (
                  <div className="lab-timeline-node" key={i}>
                    <span>
                      {i === labNodes - 1 && complete ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <span className="rune-number">{i + 1}</span>
                      )}
                    </span>
                    <small>P{i + 1}</small>
                  </div>
                ))}
              </div>
              <motion.div
                layout={!reduced}
                className={`note-panel lab-note ${expanded ? "lab-note-expanded" : ""}`}
                data-impact-surface
              >
                <div className="note-heading">
                  <span className="note-badge">PLAYGROUND</span>
                  <span className="muted">Ketik sesuatu. Tekan Enter.</span>
                  <IconButton
                    label="Ubah ukuran preview"
                    onClick={() => {
                      setExpanded(!expanded);
                      trigger("panel");
                    }}
                  >
                    {expanded ? (
                      <Minimize2 size={16} />
                    ) : (
                      <Maximize2 size={16} />
                    )}
                  </IconButton>
                </div>
                <NoteEditor
                  mini
                  noteId={`lab-${version}`}
                  content={content}
                  onChange={setContent}
                  onEffect={(kind, x, y) => {
                    setLast(kind);
                    fx.current?.emit({ kind, x, y, speed, seed: 42 });
                  }}
                />
                <footer className="editor-footer">
                  <kbd>↵ Enter</kbd>
                </footer>
              </motion.div>
            </div>
            <div className="lab-playback">
              <button className="button primary" onClick={() => trigger(last)}>
                <Play size={14} />
                Replay {last}
              </button>
              <select
                aria-label="Kecepatan replay"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value="1">Kecepatan 1×</option>
                <option value="0.5">Slow motion 0.5×</option>
                <option value="0.25">Slow motion 0.25×</option>
              </select>
              <button
                className="text-button"
                onClick={() => {
                  fx.current?.reset();
                  setContent(
                    document(paragraph("Ketik di sini, lalu tekan Enter.")),
                  );
                  setVersion((v) => v + 1);
                  setLabNodes(3);
                  setComplete(false);
                  setExpanded(false);
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
            <div className="performance-hint">
              <Activity size={15} />
              <span>{stats.renderer}</span>
              <span>
                {stats.active
                  ? `${stats.fps} FPS saat efek`
                  : "Idle · render loop berhenti"}
              </span>
              <span>
                {Math.round(stats.duration)} ms · {stats.active} partikel ·
                kualitas {Math.round(stats.quality * 100)}%
              </span>
            </div>
            {reduced && (
              <p className="privacy-note">
                Reduced motion aktif{osReduced ? " dari preferensi OS" : ""}.
                VFX dan shake dinonaktifkan; input tetap berjalan.
              </p>
            )}
            <p className="lab-honest-note">
              AI Summary Success hanya simulasi visual di playground ini. Di
              aplikasi, efek sukses menunggu hasil provider.
            </p>
            <Link href="/" className="lab-link">
              Kembali ke catatan <ArrowUpRight size={14} />
            </Link>
            <p className="muted">
              Preset aplikasi diatur terpisah melalui Pengaturan → Visual &
              Focus.
            </p>
          </section>
        </div>
        <EffectsOverlay ref={fx} preferences={preferences} onStats={setStats} />
      </main>
    </MotionConfig>
  );
}
function SlidersLabel() {
  return <span className="small-spark">✧</span>;
}
