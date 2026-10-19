import type { AnimationPreferences, Preset } from "@/lib/model";
export type EffectKind =
  | "typing"
  | "enter"
  | "heading"
  | "highlight"
  | "node"
  | "complete"
  | "panel"
  | "summary";
export type EffectEvent = {
  kind: EffectKind;
  x: number;
  y: number;
  seed?: number;
  speed?: number;
};
export const motionPresets: Record<
  Preset,
  {
    name: string;
    duration: number;
    spread: number;
    count: number;
    description: string;
  }
> = {
  "Impact Deluxe": {
    name: "Ember Nova",
    duration: 1120,
    spread: 150,
    count: 42,
    description: "Api · rune cast, lidah api berpilin, bara dengan gravitasi",
  },
  "Fluid Ink": {
    name: "Sylvan Bloom",
    duration: 1280,
    spread: 125,
    count: 34,
    description: "Hutan · heliks daun, pusaran hijau, bintang yang mekar",
  },
  "Pixel Burst": {
    name: "Crystal Break",
    duration: 980,
    spread: 155,
    count: 36,
    description: "Kristal · pecahan bersudut, kilatan es, serpihan jatuh",
  },
  "Digital Glitch": {
    name: "Rune Fracture",
    duration: 1040,
    spread: 145,
    count: 32,
    description: "Arcane · segel pecah, rune berpindah, jejak berundak",
  },
  "Arc Energy": {
    name: "Astral Arc",
    duration: 1200,
    spread: 160,
    count: 38,
    description: "Astral · pita cahaya melengkung, orbit, inti bintang",
  },
};
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function allowed(
  kind: EffectKind,
  p: AnimationPreferences,
  osReduced: boolean,
) {
  if (p.reduced || osReduced || p.intensity <= 0) return false;
  if (kind === "typing") return p.typing;
  if (kind === "enter") return p.enter;
  if (kind === "node" || kind === "complete") return p.timeline;
  if (kind === "summary") return p.summary;
  return p.panel;
}
export function budget(kind: EffectKind, p: AnimationPreferences, quality = 1) {
  return Math.max(
    0,
    Math.round(
      motionPresets[p.preset].count *
        (p.intensity / 100) *
        quality *
        (kind === "typing" ? 0.18 : p.focus ? 0.45 : 1),
    ),
  );
}
