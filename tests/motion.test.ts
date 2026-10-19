import { describe, it, expect } from "vitest";
import {
  allowed,
  budget,
  seeded,
  motionPresets,
} from "../src/features/motion/presets";
import { defaultPreferences, presets } from "../src/lib/model";
describe("motion safeguards", () => {
  it("prioritizes OS reduced motion and disabled intensity", () => {
    expect(allowed("enter", defaultPreferences, true)).toBe(false);
    expect(
      allowed("typing", { ...defaultPreferences, intensity: 0 }, false),
    ).toBe(false);
    expect(
      allowed("typing", { ...defaultPreferences, typing: false }, false),
    ).toBe(false);
  });
  it("scales particle budgets with quality and intensity", () => {
    expect(budget("enter", { ...defaultPreferences, intensity: 0 })).toBe(0);
    expect(budget("enter", defaultPreferences, 0.4)).toBeLessThan(
      budget("enter", defaultPreferences),
    );
    expect(budget("typing", defaultPreferences)).toBeLessThan(
      budget("enter", defaultPreferences),
    );
  });
  it("replays deterministic compositions for every preset", () => {
    const a = seeded(42),
      b = seeded(42);
    expect(Array.from({ length: 20 }, a)).toEqual(
      Array.from({ length: 20 }, b),
    );
    expect(presets.every((p) => motionPresets[p].duration > 0)).toBe(true);
  });
});
