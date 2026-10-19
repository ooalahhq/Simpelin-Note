"use client";
import type { ReactNode } from "react";
import { useFantasyTransition } from "@/features/motion/FantasyTransitions";
export default function FantasySurface({
  identity,
  kind,
  className,
  children,
}: {
  identity: string;
  kind: "note" | "category";
  className: string;
  children: ReactNode;
}) {
  const ref = useFantasyTransition<HTMLDivElement>(identity, kind);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
