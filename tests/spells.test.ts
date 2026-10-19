import { describe, it, expect } from "vitest";
import {
  spellPhase,
  spellParticleAt,
  renderSpell,
  type SpellBurst,
} from "../src/features/motion/SpellChoreography";
import { seeded, motionPresets } from "../src/features/motion/presets";
import { presets } from "../src/lib/model";
import type { Painter, Palette } from "../src/features/motion/ParticleRenderer";
const palette: Palette = {
  core: 1,
  bright: 2,
  ink: 3,
  shard: 4,
  leaf: 5,
  leafDark: 6,
  frost: 7,
  frostDark: 8,
  rune: 9,
  runeDark: 10,
};
function burst(
  preset: SpellBurst["preset"] = "Impact Deluxe",
  kind: SpellBurst["kind"] = "enter",
): SpellBurst {
  const random = seeded(42);
  return {
    preset,
    kind,
    x: 200,
    y: 200,
    start: 0,
    duration: 1200,
    count: 12,
    spread: 140,
    intensity: 0.65,
    shards: Array.from({ length: 12 }, () => ({
      angle: random() * Math.PI * 2,
      length: 0.5 + random() * 0.5,
      delay: random() * 0.12,
      size: 2 + random(),
      spin: random() > 0.5 ? 1 : -1,
    })),
  };
}
function recorder() {
  const dots: number[][] = [];
  const painter: Painter = {
    name: "recorder",
    dot: (...args) => {
      dots.push(args.slice(0, 5) as number[]);
    },
    clear: () => {},
    line: () => {},
    ring: () => {},
    render: () => {},
    resize: () => {},
    destroy: () => {},
  };
  return { dots, painter };
}
describe("fantasy spell choreography", () => {
  it("separates a charge, release, follow-through and ember tail", () => {
    expect([0, 0.14, 0.4, 0.9].map(spellPhase)).toEqual([
      "charge",
      "release",
      "follow-through",
      "embers",
    ]);
  });
  it("fires embers upward then lets gravity turn them downward", () => {
    const b = burst();
    const particle = {
      angle: -Math.PI / 2,
      length: 1,
      delay: 0,
      size: 2,
      spin: 1,
    };
    const peak = spellParticleAt(b, particle, 0.45);
    const tail = spellParticleAt(b, particle, 0.95);
    expect(peak.y).toBeLessThan(b.y);
    expect(tail.y).toBeGreaterThan(peak.y);
  });
  it("converges summary particles to the origin before releasing outward", () => {
    const b = burst("Impact Deluxe", "summary"),
      p = b.shards[0];
    const distance = (t: number) => {
      const pos = spellParticleAt(b, p, t);
      return Math.hypot(pos.x - b.x, pos.y - b.y);
    };
    expect(distance(0.5)).toBeLessThan(distance(0.1));
    expect(distance(0.85)).toBeGreaterThan(distance(0.5));
  });
  it("gives different elemental trajectories to the same particle", () => {
    const p = burst().shards[0];
    const positions = presets.map((preset) =>
      JSON.stringify(spellParticleAt(burst(preset), p, 0.4)),
    );
    expect(new Set(positions).size).toBe(5);
  });
  it("renders finite bounded pixel geometry and repeatable replay for every spell", () => {
    for (const preset of presets) {
      const b = burst(preset);
      const one = recorder(),
        two = recorder();
      for (const t of [0, 0.05, 0.2, 0.5, 0.8, 0.99]) {
        renderSpell(b, t, one.painter, palette);
        renderSpell(b, t, two.painter, palette);
      }
      expect(one.dots).toEqual(two.dots);
      expect(one.dots.length).toBeGreaterThan(50);
      for (const [x, y, size, , alpha] of one.dots) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(Math.abs(x - b.x)).toBeLessThan(350);
        expect(Math.abs(y - b.y)).toBeLessThan(350);
        expect(size).toBeGreaterThan(0);
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }
    }
  });
  it("does no drawing after a burst finishes", () => {
    const r = recorder();
    renderSpell(burst(), 1, r.painter, palette);
    expect(r.dots).toHaveLength(0);
  });
  it("keeps persisted preset IDs while exposing fantasy names", () => {
    expect(motionPresets["Impact Deluxe"].name).toBe("Ember Nova");
    expect(motionPresets["Pixel Burst"].name).toBe("Crystal Break");
  });
});
