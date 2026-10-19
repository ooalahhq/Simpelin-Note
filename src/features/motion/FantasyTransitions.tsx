"use client";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
const FantasyMotionContext = createContext(true);
export function FantasyMotionProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <FantasyMotionContext.Provider value={enabled}>
      {children}
    </FantasyMotionContext.Provider>
  );
}
export function useFantasyMotion() {
  return useContext(FantasyMotionContext);
}
export type TransitionKind = "note" | "category" | "tab";
export function transitionFrames(kind: TransitionKind): Keyframe[] {
  const x = kind === "note" ? 12 : kind === "category" ? 8 : 0;
  const y = kind === "tab" ? 7 : 2;
  return [
    { opacity: 0.25, transform: `translate(${x}px, ${y}px) scale(.995)` },
    { opacity: 1, transform: "translate(0, 0) scale(1)" },
  ];
}
/** Identity changes animate the existing element; content edits never remount the editor. */
export function useFantasyTransition<T extends HTMLElement>(
  identity: string,
  kind: TransitionKind,
): RefObject<T | null> {
  const ref = useRef<T>(null),
    previous = useRef(identity);
  const enabled = useFantasyMotion();
  useLayoutEffect(() => {
    if (previous.current === identity) return;
    previous.current = identity;
    const element = ref.current;
    if (
      !enabled ||
      !element ||
      typeof element.animate !== "function" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const reveal = element.querySelector<HTMLElement>("[data-fantasy-reveal]");
    const animation = element.animate(transitionFrames(kind), {
      duration: kind === "tab" ? 260 : 380,
      easing: "cubic-bezier(.16,1,.3,1)",
    });
    const sweep = reveal?.animate?.(
      [
        { opacity: 0, transform: "translateX(-105%) scaleX(.65)" },
        {
          opacity: 0.65,
          transform: "translateX(-25%) scaleX(1)",
          offset: 0.35,
        },
        { opacity: 0, transform: "translateX(105%) scaleX(.7)" },
      ],
      { duration: 540, easing: "cubic-bezier(.16,1,.3,1)" },
    );
    return () => {
      animation.cancel();
      sweep?.cancel();
    };
  }, [identity, kind, enabled]);
  return ref;
}
