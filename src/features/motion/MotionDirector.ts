import type { AnimationPreferences } from "@/lib/model";
import {
  allowed,
  budget,
  motionPresets,
  seeded,
  type EffectEvent,
} from "./presets";
import {
  createPainter,
  readPalette,
  type Painter,
  type Palette,
} from "./ParticleRenderer";
import { renderSpell, type SpellBurst } from "./SpellChoreography";
type Burst = SpellBurst;
export type MotionStats = {
  fps: number;
  active: number;
  renderer: string;
  quality: number;
  duration: number;
};
export class MotionDirector {
  private painter?: Painter;
  private palette?: Palette;
  private bursts: Burst[] = [];
  private raf = 0;
  private dead = false;
  private tick = 0;
  private quality = 1;
  private lastTyping = 0;
  private lastImpact = 0;
  private serial = 0;
  private audio?: AudioContext;
  private lastSound = 0;
  private lastReport = 0;
  private ready: Promise<void>;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  constructor(
    private host: HTMLDivElement,
    private settings: () => AnimationPreferences,
    private report?: (s: MotionStats) => void,
  ) {
    this.ready = createPainter(host)
      .then((p) => {
        if (this.dead) {
          p.destroy();
          return;
        }
        this.painter = p;
        this.palette = readPalette();
        this.report?.({
          fps: 0,
          active: 0,
          renderer: p.name,
          quality: 1,
          duration: 0,
        });
      })
      .catch(() => {
        this.report?.({
          fps: 0,
          active: 0,
          renderer: "VFX tidak tersedia pada browser ini",
          quality: 0,
          duration: 0,
        });
      });
    window.addEventListener("resize", this.resize);
  }
  private resize = () => this.painter?.resize();
  async emit(event: EffectEvent) {
    const p = this.settings();
    if (this.dead || !allowed(event.kind, p, this.reduced.matches)) return;
    const now = performance.now();
    if (event.kind === "typing") {
      if (now - this.lastTyping < 36) return;
      this.lastTyping = now;
    } else if (event.kind === "enter") {
      if (now - this.lastImpact < 70) return;
      this.lastImpact = now;
    }
    await this.ready;
    if (this.dead || !this.painter) return;
    const current = this.settings();
    if (!allowed(event.kind, current, this.reduced.matches)) return;
    const preset = motionPresets[p.preset];
    const small = event.kind === "typing";
    const count = Math.round(
      budget(event.kind, p, this.quality) *
        (event.kind === "summary" ? 1.4 : 1),
    );
    const random = seeded(event.seed ?? ++this.serial);
    const strength = p.intensity / 100;
    const duration =
      (small ? 420 : preset.duration * (event.kind === "summary" ? 1.15 : 1)) /
      (event.speed || 1);
    const b: Burst = {
      ...event,
      start: performance.now(),
      duration,
      count,
      spread:
        preset.spread *
        (small ? 0.23 : event.kind === "summary" ? 1.3 : 1) *
        (0.45 + strength * 0.75),
      preset: p.preset,
      intensity: strength,
      shards: Array.from({ length: count }, (_, i) => ({
        angle: (i / Math.max(count, 1)) * Math.PI * 2 + (random() - 0.5) * 0.3,
        length: 0.45 + random() * 0.55,
        delay: random() * 0.12,
        size: 1.3 + random() * 2.2,
        spin: random() > 0.5 ? 1 : -1,
      })),
    };
    this.bursts.push(b);
    if (this.bursts.length > 8) this.bursts.shift();
    if (!small) {
      if ((event.kind === "enter" || event.kind === "summary") && !p.focus) {
        const label = document.createElement("span");
        label.className = "impact-word spell-label";
        label.textContent =
          event.kind === "summary"
            ? "RINGKASAN TERBUKA"
            : motionPresets[p.preset].name.toUpperCase();
        label.style.left = `${Math.max(8, Math.min(innerWidth - 190, event.x + 16))}px`;
        label.style.top = `${Math.max(8, event.y - 58)}px`;
        this.host.appendChild(label);
        const a = label.animate(
          [
            {
              opacity: 0,
              transform: "translate(0, 8px) scale(.8)",
              offset: 0,
            },
            {
              opacity: 0,
              transform: "translate(0, 8px) scale(.8)",
              offset: 0.08,
            },
            {
              opacity: 0.85,
              transform: "translate(0, 0) scale(1)",
              offset: 0.25,
            },
            {
              opacity: 0,
              transform: "translate(0, -18px) scale(1)",
              offset: 1,
            },
          ],
          { duration, fill: "forwards", easing: "steps(12,end)" },
        );
        a.onfinish = () => label.remove();
      }
      if (event.kind === "enter" && p.shake !== "off" && !p.focus) {
        const surface = document.querySelector("[data-impact-surface]");
        const d = (p.shake === "strong" ? 3 : 1.3) * strength;
        surface?.animate(
          [
            { transform: "translate(0,0)" },
            { transform: `translate(${d}px,${-d}px)` },
            { transform: `translate(${-d * 0.6}px,${d * 0.5}px)` },
            { transform: "translate(0,0)" },
          ],
          { duration: 220 / (event.speed || 1) },
        );
      }
      if (p.sound) this.sound(event.kind === "enter" ? 150 : 350, p.volume);
    }
    if (!this.raf) {
      this.tick = performance.now();
      this.raf = requestAnimationFrame(this.draw);
    }
  }
  private sound(hz: number, volume: number) {
    if (volume <= 0) return;
    const now = performance.now();
    if (now - this.lastSound < 120) return;
    this.lastSound = now;
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume();
      const osc = this.audio.createOscillator();
      const gain = this.audio.createGain();
      const t = this.audio.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(hz, t);
      osc.frequency.exponentialRampToValueAtTime(hz * 0.35, t + 0.1);
      gain.gain.setValueAtTime(Math.max(0.0001, (volume / 100) * 0.07), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(gain).connect(this.audio.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch {
      /* Sound is optional and must never interrupt input. */
    }
  }
  private draw = (now: number) => {
    this.raf = 0;
    if (this.dead || !this.painter || !this.palette) return;
    const p = this.settings();
    if (p.reduced || this.reduced.matches || p.intensity <= 0) {
      this.reset();
      return;
    }
    const painter = this.painter,
      c = this.palette;
    const delta = now - this.tick;
    this.tick = now;
    if (delta > 27) this.quality = Math.max(0.35, this.quality - 0.035);
    else this.quality = Math.min(1, this.quality + 0.005);
    this.bursts = this.bursts.filter(
      (b) =>
        now - b.start < b.duration && allowed(b.kind, p, this.reduced.matches),
    );
    painter.clear();
    for (const b of this.bursts) {
      renderSpell(b, Math.max(0, (now - b.start) / b.duration), painter, c);
    }
    painter.render();
    if (now - this.lastReport > 180 || !this.bursts.length) {
      this.report?.({
        fps: delta > 0 ? Math.min(240, Math.round(1000 / delta)) : 60,
        active: this.bursts.reduce((n, b) => n + b.count, 0),
        renderer: painter.name,
        quality: this.quality,
        duration: this.bursts.at(-1)?.duration || 0,
      });
      this.lastReport = now;
    }
    if (this.bursts.length) this.raf = requestAnimationFrame(this.draw);
  };
  reset() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.bursts = [];
    this.painter?.clear();
    this.painter?.render();
    this.host.querySelectorAll(".impact-word").forEach((n) => n.remove());
  }
  destroy() {
    this.dead = true;
    this.reset();
    this.painter?.destroy();
    void this.audio?.close();
    window.removeEventListener("resize", this.resize);
  }
}
