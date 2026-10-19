"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { AnimationPreferences } from "@/lib/model";
import { MotionDirector, type MotionStats } from "./MotionDirector";
import type { EffectEvent } from "./presets";
export type EffectsHandle = {
  emit: (event: EffectEvent) => void;
  reset: () => void;
};
export const EffectsOverlay = forwardRef<
  EffectsHandle,
  { preferences: AnimationPreferences; onStats?: (stats: MotionStats) => void }
>(function EffectsOverlay({ preferences, onStats }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const director = useRef<MotionDirector | null>(null);
  const settings = useRef(preferences);
  settings.current = preferences;
  const report = useRef(onStats);
  report.current = onStats;
  useImperativeHandle(
    ref,
    () => ({
      emit: (event) => {
        void director.current?.emit(event);
      },
      reset: () => director.current?.reset(),
    }),
    [],
  );
  useEffect(() => {
    if (!host.current) return;
    const d = new MotionDirector(
      host.current,
      () => settings.current,
      (s) => report.current?.(s),
    );
    director.current = d;
    return () => {
      d.destroy();
      director.current = null;
    };
  }, []);
  return <div className="effects-overlay" ref={host} aria-hidden="true" />;
});
