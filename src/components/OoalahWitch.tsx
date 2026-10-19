"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const INTRO_KEY = "simpelin-ooalah-witch-introduced-v1";
const VISIT_KEY = "simpelin-ooalah-witch-tips-v1";
const FIRST_DELAY = 14_000;
const IDLE_DELAY = 8_000;
const COOLDOWN = 150_000;
const TIP_DURATION = 9_000;
const TIPS = [
  "Tekan Ctrl + K atau ⌘ K untuk mencari catatan.",
  "Ketik /code di awal paragraf, lalu Enter untuk membuat blok kode.",
  "Ekspor cadangan lewat Pengaturan → Data lokal agar catatanmu punya salinan.",
];
type Visit = { count: number; nextAt: number; lastTyped: number };
function readVisit(): Visit {
  try {
    const saved = JSON.parse(sessionStorage.getItem(VISIT_KEY) || "null");
    if (
      saved &&
      Number.isInteger(saved.count) &&
      saved.count >= 0 &&
      saved.count <= TIPS.length &&
      Number.isFinite(saved.nextAt)
    )
      return { count: saved.count, nextAt: saved.nextAt, lastTyped: 0 };
  } catch {
    /* A blocked store must not prevent the companion from working. */
  }
  return { count: 0, nextAt: 0, lastTyped: 0 };
}

export default function OoalahWitch({
  active = true,
  reduced = false,
  paused = false,
}: {
  active?: boolean;
  reduced?: boolean;
  paused?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const visit = useRef<Visit | null>(null);
  const dismiss = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [waving, setWaving] = useState(false);
  const [tip, setTip] = useState<{ text: string; introduce: boolean } | null>(
    null,
  );
  const shown = visible && active && !paused;

  useEffect(() => {
    if (!active || paused || !ready) return;
    const element = root.current!;
    const current = (visit.current ??= readVisit());
    if (!current.nextAt) current.nextAt = Date.now() + FIRST_DELAY;
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let showing = false;
    let hovering = false;
    let composing = false;
    function hide() {
      clearTimeout(hideTimer);
      showing = false;
      setVisible(false);
      setWaving(false);
    }
    function schedule(minimum = 0) {
      clearTimeout(showTimer);
      if (
        current.count >= TIPS.length ||
        composing ||
        document.visibilityState === "hidden"
      )
        return;
      showTimer = setTimeout(
        show,
        Math.max(
          minimum,
          current.nextAt - Date.now(),
          current.lastTyped + IDLE_DELAY - Date.now(),
        ),
      );
    }
    function armHide() {
      clearTimeout(hideTimer);
      if (!showing || hovering || element.contains(document.activeElement))
        return;
      hideTimer = setTimeout(hide, TIP_DURATION);
    }
    function show() {
      if (document.visibilityState === "hidden") return;
      // Native dialogs also block tips when this component is used on its own.
      if (showing || document.querySelector("dialog[open]")) {
        schedule(30_000);
        return;
      }
      let introduce: boolean;
      try {
        introduce = localStorage.getItem(INTRO_KEY) !== "yes";
        localStorage.setItem(INTRO_KEY, "yes");
      } catch {
        introduce = current.count === 0;
      }
      setTip({ text: TIPS[current.count], introduce });
      current.count += 1;
      current.nextAt = Date.now() + COOLDOWN;
      try {
        sessionStorage.setItem(
          VISIT_KEY,
          JSON.stringify({ count: current.count, nextAt: current.nextAt }),
        );
      } catch {
        /* In-memory cooldown still applies. */
      }
      showing = true;
      setVisible(true);
      setWaving(!reduced);
      armHide();
      schedule();
    }
    function onEditing(event: Event) {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        hide();
        return;
      }
      const target = event.target;
      if (
        !(target instanceof Element) ||
        !target.closest("input, textarea, [contenteditable='true']")
      )
        return;
      if (event.type === "compositionstart") composing = true;
      if (event.type === "compositionend") composing = false;
      current.lastTyped = Date.now();
      hide();
      schedule();
    }
    function onVisibility() {
      hide();
      clearTimeout(showTimer);
      if (document.visibilityState !== "hidden") schedule(FIRST_DELAY);
    }
    function enter() {
      hovering = true;
      clearTimeout(hideTimer);
    }
    function leave() {
      hovering = false;
      armHide();
    }
    function focusIn() {
      clearTimeout(hideTimer);
    }
    function focusOut(event: FocusEvent) {
      if (!element.contains(event.relatedTarget as Node | null)) {
        // Focus has not moved yet during focusout; check it after dispatch.
        clearTimeout(hideTimer);
        hideTimer = setTimeout(armHide, 0);
      }
    }
    const editingEvents = [
      "keydown",
      "beforeinput",
      "input",
      "paste",
      "compositionstart",
      "compositionend",
    ];
    editingEvents.forEach((name) =>
      document.addEventListener(name, onEditing, true),
    );
    document.addEventListener("visibilitychange", onVisibility);
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("focusin", focusIn);
    element.addEventListener("focusout", focusOut);
    dismiss.current = hide;
    schedule(FIRST_DELAY);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      editingEvents.forEach((name) =>
        document.removeEventListener(name, onEditing, true),
      );
      document.removeEventListener("visibilitychange", onVisibility);
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("focusin", focusIn);
      element.removeEventListener("focusout", focusOut);
      hide();
      dismiss.current = () => {};
    };
  }, [active, paused, ready, reduced]);

  return (
    <div
      ref={root}
      className={`witch-peek ${ready ? "is-ready" : ""} ${shown ? "is-visible" : ""} ${shown && waving && !reduced ? "is-waving" : ""}`}
      data-reduced={reduced ? "true" : "false"}
      aria-hidden={!shown}
      inert={!shown}
    >
      <span className="witch-frame" aria-hidden="true">
        <img
          className="witch-atlas"
          src="/characters/ooalah-witch-sprites.png"
          alt=""
          width="1536"
          height="1024"
          draggable={false}
          onLoad={() => setReady(true)}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) setWaving(false);
          }}
        />
      </span>
      {tip && (
        <aside className="witch-greeting" aria-label="Tip Ooalah witch">
          <div role="status" aria-live="polite">
            <p className="witch-tip-name">
              {tip.introduce ? (
                <>
                  Hai, aku <strong>Ooalah witch</strong>.
                </>
              ) : (
                <strong>Ooalah witch</strong>
              )}
            </p>
            <p>{tip.text}</p>
          </div>
          <button
            type="button"
            className="witch-dismiss"
            aria-label="Tutup tip Ooalah witch"
            onClick={() => dismiss.current()}
          >
            <X size={14} />
          </button>
        </aside>
      )}
    </div>
  );
}
