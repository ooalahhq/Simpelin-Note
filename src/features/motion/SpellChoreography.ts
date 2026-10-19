import type { AnimationPreferences } from "@/lib/model";
import type { EffectEvent } from "./presets";
import type { Painter, Palette } from "./ParticleRenderer";
export type SpellParticle = {
  angle: number;
  length: number;
  delay: number;
  size: number;
  spin: number;
};
export type SpellBurst = EffectEvent & {
  start: number;
  duration: number;
  count: number;
  spread: number;
  preset: AnimationPreferences["preset"];
  intensity: number;
  shards: SpellParticle[];
};
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const out = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
const pixel = (v: number, step = 2) => Math.round(v / step) * step;
export function spellPhase(t: number) {
  return t < 0.09
    ? "charge"
    : t < 0.28
      ? "release"
      : t < 0.72
        ? "follow-through"
        : "embers";
}
export function spellColors(preset: SpellBurst["preset"], c: Palette) {
  switch (preset) {
    case "Fluid Ink":
      return { light: c.leaf, dark: c.leafDark, hot: c.bright };
    case "Pixel Burst":
      return { light: c.frost, dark: c.frostDark, hot: c.bright };
    case "Digital Glitch":
      return { light: c.rune, dark: c.runeDark, hot: c.bright };
    case "Arc Energy":
      return { light: c.core, dark: c.frost, hot: c.bright };
    default:
      return { light: c.core, dark: c.ink, hot: c.bright };
  }
}
/** Particle position is sampled from absolute progress, so slow replay and frame drops do not alter trajectories. */
export function spellParticleAt(b: SpellBurst, p: SpellParticle, t: number) {
  const progress = clamp(t),
    a = p.angle;
  let x: number, y: number;
  const span = b.spread * p.length;
  if (b.kind === "summary" && progress < 0.52) {
    const q = out(progress / 0.52);
    const r = span * (1 - q);
    const theta = a + progress * 4;
    return {
      x: pixel(b.x + Math.cos(theta) * r),
      y: pixel(b.y + Math.sin(theta) * r * 0.55 - 18 * (1 - q)),
    };
  }
  const u = b.kind === "summary" ? clamp((progress - 0.52) / 0.48) : progress;
  if (b.kind === "typing") {
    x = Math.cos(a) * span * u + 12 * u * u;
    y = -span * (0.7 + p.length) * u + span * 0.9 * u * u;
  } else if (
    b.kind === "node" ||
    b.kind === "heading" ||
    b.kind === "highlight"
  ) {
    x = span * u * (p.spin > 0 ? 1 : -1);
    y = Math.sin(u * Math.PI) * -span * 0.25 + Math.sin(a) * 12 * u;
  } else if (b.kind === "complete") {
    x = Math.cos(a) * span * 0.38 * Math.sin(u * Math.PI);
    y = -span * u * 1.35 + Math.sin(a) * 8;
  } else
    switch (b.preset) {
      case "Fluid Ink": {
        const theta = a + u * 5 * p.spin;
        const r = span * Math.sin(u * Math.PI * 0.85);
        x = Math.cos(theta) * r;
        y = Math.sin(theta) * r * 0.45 - span * u * 0.75;
        break;
      }
      case "Pixel Burst": {
        const v = u * 1.8 - u * u * 0.7;
        x = Math.cos(a) * span * v;
        y = Math.sin(a) * span * v * 0.75 + span * 0.8 * u * u;
        break;
      }
      case "Digital Glitch": {
        const q = Math.floor(u * 14) / 14;
        x = Math.cos(a) * span * q;
        y = Math.sin(a) * span * q * 0.7 - 24 * q + Math.sin(q * 12 + a) * 8;
        break;
      }
      case "Arc Energy": {
        const theta = a + u * 4.8 * p.spin;
        const r = span * (0.2 + u * 0.8);
        x = Math.cos(theta) * r * u;
        y = Math.sin(theta) * r * 0.48 - span * u * 0.6;
        break;
      }
      default: {
        const v = (1 - Math.exp(-u * 3)) * 1.35;
        x = Math.cos(a) * span * v;
        y = -Math.abs(Math.sin(a)) * span * v + span * 1.15 * u * u;
      }
    }
  return { x: pixel(b.x + x), y: pixel(b.y + y) };
}
function glow(
  p: Painter,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number,
) {
  p.dot(
    pixel(x),
    pixel(y),
    Math.max(1, pixel(size * 2.6)),
    color,
    alpha * 0.07,
    true,
  );
  p.dot(
    pixel(x),
    pixel(y),
    Math.max(1, pixel(size * 1.6)),
    color,
    alpha * 0.19,
    true,
  );
}
function star(
  p: Painter,
  x: number,
  y: number,
  r: number,
  color: number,
  alpha: number,
) {
  const size = Math.max(2, pixel(r));
  for (let i = -size; i <= size; i += 2) {
    const h = Math.max(1, pixel((size - Math.abs(i)) * 0.3));
    p.dot(pixel(x + i), pixel(y), h, color, alpha, true);
    p.dot(pixel(x), pixel(y + i), h, color, alpha, true);
  }
}
function ellipse(
  p: Painter,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation: number,
  color: number,
  alpha: number,
  gaps = false,
) {
  const steps = Math.min(64, Math.max(20, Math.round(rx * 0.7)));
  for (let i = 0; i < steps; i++) {
    if (gaps && i % 6 > 3) continue;
    const a = (i / steps) * Math.PI * 2 + rotation;
    p.dot(
      pixel(x + Math.cos(a) * rx),
      pixel(y + Math.sin(a) * ry),
      1,
      color,
      alpha,
      true,
    );
  }
}
function diamond(
  p: Painter,
  x: number,
  y: number,
  r: number,
  color: number,
  alpha: number,
) {
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const ax = x + Math.cos(a) * r,
      ay = y + Math.sin(a) * r;
    const bx = x + Math.cos(a + Math.PI / 2) * r,
      by = y + Math.sin(a + Math.PI / 2) * r;
    const n = Math.max(3, Math.round(r / 3));
    for (let j = 0; j < n; j++)
      p.dot(
        pixel(ax + ((bx - ax) * j) / n),
        pixel(ay + ((by - ay) * j) / n),
        1,
        color,
        alpha,
        true,
      );
  }
}
export function renderSpell(b: SpellBurst, t: number, p: Painter, c: Palette) {
  if (t < 0 || t >= 1) return;
  const small = b.kind === "typing",
    colors = spellColors(b.preset, c);
  const phase = spellPhase(t);
  const intensity = b.intensity;
  const centerX = pixel(b.x),
    centerY = pixel(b.y);
  const release = out((t - 0.09) / 0.3);
  const alpha = clamp((1 - t) * 1.5) * intensity;
  if (!small) {
    if (phase === "charge") {
      const charge = t / 0.09;
      ellipse(
        p,
        centerX,
        centerY,
        30 * (1 - charge) + 5,
        12 * (1 - charge) + 3,
        charge * Math.PI,
        colors.light,
        charge * intensity,
      );
      star(p, centerX, centerY, 3 + charge * 8, colors.hot, charge * intensity);
    } else {
      const casting = clamp(1 - (t - 0.09) / 0.58) * intensity;
      ellipse(
        p,
        centerX,
        centerY + 5,
        12 + release * b.spread * 0.62,
        4 + release * b.spread * 0.18,
        t * 0.6,
        colors.light,
        casting * 0.75,
        true,
      );
      ellipse(
        p,
        centerX,
        centerY + 5,
        9 + release * b.spread * 0.47,
        3 + release * b.spread * 0.13,
        -t * 0.5,
        colors.dark,
        casting * 0.55,
      );
      if (b.preset === "Digital Glitch" || b.preset === "Pixel Burst")
        diamond(
          p,
          centerX,
          centerY,
          release * b.spread * 0.48,
          colors.light,
          casting * 0.65,
        );
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + t * 0.8;
        const x = centerX + Math.cos(a) * (16 + release * 42);
        const y = centerY + 5 + Math.sin(a) * (7 + release * 12);
        diamond(p, x, y, 3, colors.hot, casting * 0.7);
      }
      if (t < 0.29) {
        const flash = Math.sin(clamp((t - 0.09) / 0.2) * Math.PI);
        glow(p, centerX, centerY, 20 * flash, colors.light, flash * intensity);
        star(p, centerX, centerY, 26 * flash, colors.hot, flash * intensity);
      }
    }
  }
  // A rising flame ribbon has its own timing, rather than sharing the radial particle envelope.
  if (!small && b.preset === "Impact Deluxe" && t > 0.12 && t < 0.76) {
    const u = (t - 0.12) / 0.64;
    const h = b.spread * 0.7 * Math.sin(u * Math.PI);
    const strands = b.count > 24 ? 3 : b.count > 12 ? 2 : 1;
    const ribbonSteps = b.count > 24 ? 15 : 10;
    for (let strand = 0; strand < strands; strand++) {
      for (let j = 0; j < ribbonSteps; j++) {
        const q = j / ribbonSteps;
        const twist = Math.sin(q * 7 + u * 9 + strand * 2.1) * (1 - q) * 15;
        const x = centerX + twist + (strand - 1) * 12 * (1 - q) + u * 18;
        const y = centerY - h * q * (0.8 + strand * 0.12);
        const size = Math.max(
          1,
          pixel(Math.pow(1 - q, 0.7) * 11 * (1 - u * 0.65)),
        );
        glow(p, x, y, size + 2, colors.dark, alpha * 0.85);
        p.dot(pixel(x), pixel(y), size, colors.dark, alpha * 0.52, true);
        p.dot(
          pixel(x - 1),
          pixel(y),
          Math.max(1, pixel(size * 0.64)),
          colors.light,
          alpha * 0.8,
          true,
        );
        if (q < 0.65)
          p.dot(
            pixel(x),
            pixel(y + 1),
            Math.max(1, pixel(size * 0.28)),
            colors.hot,
            alpha * 0.7,
            true,
          );
      }
    }
  }

  if (b.kind === "summary" && t > 0.48 && t < 0.77) {
    star(
      p,
      centerX,
      centerY,
      Math.sin(((t - 0.48) / 0.29) * Math.PI) * 35,
      colors.hot,
      alpha,
    );
  }
  for (let i = 0; i < b.count; i++) {
    const shard = b.shards[i];
    const onset = small ? 0 : 0.085 + shard.delay;
    const life = clamp((t - onset) / (1 - onset));
    if (t < onset || life >= 1) continue;
    const position = spellParticleAt(b, shard, life);
    const brightness = small
      ? Math.pow(1 - life, 1.8)
      : Math.sin((Math.min(1, life * 5) * Math.PI) / 2) *
        Math.pow(1 - life, 1.25);
    const flicker =
      phase === "embers"
        ? Math.floor((life + shard.length) * 22) % 3 === 0
          ? 0.3
          : 1
        : 1;
    const opacity = brightness * intensity * flicker;
    const size = Math.max(1, pixel(shard.size * (0.4 + (1 - life) * 0.6)));
    const color =
      i % 5 === 0 ? colors.hot : i % 3 === 0 ? colors.dark : colors.light;
    // Sampled trails inherit the same curvature and gravity without accumulating frame-time drift.
    for (let j = 3; j > 0; j--) {
      const trail = spellParticleAt(b, shard, Math.max(0, life - j * 0.025));
      p.dot(
        trail.x,
        trail.y,
        Math.max(1, size - j * 0.45),
        color,
        opacity * (1 - j / 4) * 0.32,
        true,
      );
    }
    if (i % 4 === 0) glow(p, position.x, position.y, size + 1, color, opacity);
    p.dot(position.x, position.y, size, color, opacity, true);
    if (i % 7 === 0 && !small)
      star(p, position.x, position.y, size * 2, colors.hot, opacity * 0.8);
  }
}
