"use client";
import { presets, type AnimationPreferences } from "@/lib/model";
import { motionPresets } from "@/features/motion/presets";
import { Field, Toggle } from "./ui";
export default function AnimationSettings({
  value,
  onChange,
}: {
  value: AnimationPreferences;
  onChange: (next: AnimationPreferences) => void;
}) {
  const set = <K extends keyof AnimationPreferences>(
    key: K,
    v: AnimationPreferences[K],
  ) => onChange({ ...value, [key]: v });
  return (
    <div className="animation-settings">
      <Field
        label="Preset animasi"
        hint={motionPresets[value.preset].description}
      >
        <select
          value={value.preset}
          onChange={(e) =>
            set("preset", e.target.value as AnimationPreferences["preset"])
          }
        >
          {presets.map((p) => (
            <option key={p} value={p}>
              {motionPresets[p].name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label={`Intensitas · ${value.intensity}%`}
        hint="0% mematikan seluruh efek visual."
      >
        <input
          aria-label="Intensitas"
          type="range"
          min="0"
          max="100"
          value={value.intensity}
          onChange={(e) => set("intensity", Number(e.target.value))}
        />
      </Field>
      <div className="settings-divider" />
      <Toggle
        label="Typing FX"
        detail="Bara atau debu sihir mengikuti posisi kursor."
        checked={value.typing}
        onChange={(v) => set("typing", v)}
      />
      <Toggle
        label="Enter Impact"
        detail="Cast spell pixel setiap membuat baris baru."
        checked={value.enter}
        onChange={(v) => set("enter", v)}
      />
      <Toggle
        label="Timeline FX"
        checked={value.timeline}
        onChange={(v) => set("timeline", v)}
      />
      <Toggle
        label="Editor & panel FX"
        checked={value.panel}
        onChange={(v) => set("panel", v)}
      />
      <Toggle
        label="AI Summary FX"
        checked={value.summary}
        onChange={(v) => set("summary", v)}
      />
      <Field label="Impact shake">
        <select
          value={value.shake}
          onChange={(e) =>
            set("shake", e.target.value as AnimationPreferences["shake"])
          }
        >
          <option value="off">Off</option>
          <option value="subtle">Subtle</option>
          <option value="strong">Strong</option>
        </select>
      </Field>
      <Toggle
        label="Sound feedback"
        detail="Suara singkat pada impact; mati secara default."
        checked={value.sound}
        onChange={(v) => set("sound", v)}
      />
      {value.sound && (
        <Field label={`Volume · ${value.volume}%`}>
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="100"
            value={value.volume}
            onChange={(e) => set("volume", Number(e.target.value))}
          />
        </Field>
      )}
      <div className="settings-divider" />
      <Toggle
        label="Focus mode"
        detail="Kurangi partikel dan gerakan sekunder."
        checked={value.focus}
        onChange={(v) => set("focus", v)}
      />
      <Toggle
        label="Reduced motion"
        detail="Matikan VFX dan shake. Preferensi OS selalu dihormati."
        checked={value.reduced}
        onChange={(v) => set("reduced", v)}
      />
    </div>
  );
}
