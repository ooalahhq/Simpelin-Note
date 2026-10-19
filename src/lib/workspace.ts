"use client";
import { useEffect, useRef, useState } from "react";
import db from "./db";
import { createWorkspace, readPreferences, type Workspace } from "./model";
export type WorkspaceUpdate = (change: (draft: Workspace) => void) => void;

let pendingWrites: Promise<void> = Promise.resolve();
export function flushWorkspaceWrites() {
  return pendingWrites;
}
export function useWorkspace() {
  const [state, setState] = useState<Workspace | null>(null);
  const [status, setStatus] = useState("Memuat…");
  const [error, setError] = useState("");
  const current = useRef<Workspace | null>(null);
  const queue = useRef(Promise.resolve());
  const generation = useRef(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await pendingWrites;
        const saved = await db.workspace.get("main");
        const data = saved?.data || createWorkspace();
        data.preferences = readPreferences(data.preferences);
        if (!saved) await db.workspace.put({ id: "main", data });
        if (alive) {
          current.current = data;
          setState(data);
          setStatus("Tersimpan di perangkat");
        }
      } catch {
        if (alive)
          setError(
            "Penyimpanan browser tidak dapat dibuka. Izinkan IndexedDB lalu muat ulang.",
          );
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  function update(change: (draft: Workspace) => void) {
    if (!current.current) return;
    const next = structuredClone(current.current);
    change(next);
    current.current = next;
    setState(next);
    setStatus("Menyimpan…");
    const tick = ++generation.current;
    queue.current = pendingWrites = pendingWrites
      .catch(() => {})
      .then(async () => {
        try {
          await db.workspace.put({ id: "main", data: next });
          if (tick === generation.current) {
            setStatus("Tersimpan di perangkat");
            setError("");
          }
        } catch {
          setStatus("Belum tersimpan");
          setError(
            "Catatan belum tersimpan. Penyimpanan mungkin penuh; ekspor cadangan sebelum menutup aplikasi.",
          );
        }
      });
  }
  return { state, update, status, error, flush: () => queue.current, current };
}
