// @vitest-environment jsdom
import "./setup-dom";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement, forwardRef, useImperativeHandle } from "react";
import db from "../src/lib/db";
import { flushWorkspaceWrites } from "../src/lib/workspace";
import { createWorkspace, newNote } from "../src/lib/model";
import WorkspaceApp from "../src/components/WorkspaceApp";
import MotionLab from "../src/components/MotionLab";
import { Modal } from "../src/components/ui";
import { FantasyMotionProvider } from "../src/features/motion/FantasyTransitions";
vi.mock("next/link", () => ({
  default: (props: Record<string, unknown>) => createElement("a", props),
}));
vi.mock("../src/features/motion/EffectsOverlay", () => ({
  EffectsOverlay: forwardRef(function MockOverlay(_props, ref) {
    useImperativeHandle(ref, () => ({ emit: vi.fn(), reset: vi.fn() }));
    return null;
  }),
}));
beforeEach(async () => {
  await flushWorkspaceWrites();
  localStorage.clear();
  await db.workspace.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function app() {
  render(<WorkspaceApp />);
  await screen.findByRole(
    "textbox",
    { name: "Isi catatan" },
    { timeout: 3000 },
  );
}
function animation() {
  return { cancel: vi.fn(), onfinish: null as null | (() => void) };
}
it("switches categories with notes without replacing the editable DOM; autosave does not restart the transition", async () => {
  const state = createWorkspace();
  const target = state.categories.find((c) => c.title === "Basis Data")!;
  state.notes.push(newNote(target.id, "Relasi"));
  await db.workspace.put({ id: "main", data: state });
  await app();
  expect(document.querySelector(".sidebar .witch-peek")).toBeNull();
  expect(document.querySelector(".workspace > .witch-peek")).toBeTruthy();
  const editor = screen.getByRole("textbox", { name: "Isi catatan" });
  const body = document.querySelector<HTMLElement>(".note-body")!;
  const mock = vi.fn(() => animation() as unknown as Animation);
  body.animate = mock;
  fireEvent.click(screen.getByRole("button", { name: "Basis Data" }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("textbox", {
          name: "Judul catatan",
        }) as HTMLInputElement
      ).value,
    ).toBe("Relasi"),
  );
  expect(screen.getByRole("textbox", { name: "Isi catatan" })).toBe(editor);
  expect(mock).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByRole("textbox", { name: "Judul catatan" }), {
    target: { value: "Relasi data" },
  });
  expect(mock).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Jaringan Komputer" }));
  expect(screen.getByRole("textbox", { name: "Isi catatan" })).toBe(editor);
  expect(mock).toHaveBeenCalledTimes(2);
});
it("skips spatial transitions when panel effects are disabled", async () => {
  const state = createWorkspace();
  state.preferences.panel = false;
  await db.workspace.put({ id: "main", data: state });
  await app();
  const body = document.querySelector<HTMLElement>(".note-body")!;
  const mock = vi.fn(() => animation() as unknown as Animation);
  body.animate = mock;
  fireEvent.click(
    screen.getByRole("button", { name: "P1 · Pengantar jaringan" }),
  );
  expect(mock).not.toHaveBeenCalled();
});
it("switches settings tabs by keyboard, animates the existing panel and preserves provider draft fields", async () => {
  await app();
  fireEvent.click(screen.getByRole("button", { name: "Pengaturan" }));
  const panel = screen.getByRole("tabpanel");
  const mock = vi.fn(() => animation() as unknown as Animation);
  panel.animate = mock;
  fireEvent.keyDown(screen.getByRole("tab", { name: "Visual & Focus" }), {
    key: "ArrowRight",
  });
  fireEvent.change(screen.getByLabelText("ID model"), {
    target: { value: "my-model" },
  });
  fireEvent.keyDown(screen.getByRole("tab", { name: "AI Provider" }), {
    key: "ArrowRight",
  });
  fireEvent.keyDown(screen.getByRole("tab", { name: "Data lokal" }), {
    key: "ArrowLeft",
  });
  expect((screen.getByLabelText("ID model") as HTMLInputElement).value).toBe(
    "my-model",
  );
  expect(screen.getByRole("tabpanel")).toBe(panel);
  expect(mock).toHaveBeenCalledTimes(3);
});
it("finishes a dialog exit before invoking close, and cancels the animation on teardown", () => {
  const onClose = vi.fn();
  const onBeforeClose = vi.fn();
  render(
    <Modal title="Transisi" onClose={onClose} onBeforeClose={onBeforeClose}>
      <p>Isi</p>
    </Modal>,
  );
  const dialog = screen.getByRole("dialog") as HTMLDialogElement;
  const current = animation();
  dialog.animate = vi.fn(() => current as unknown as Animation);
  fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
  expect(onClose).not.toHaveBeenCalled();
  expect(onBeforeClose).toHaveBeenCalledTimes(1);
  act(() => current.onfinish?.());
  expect(onClose).toHaveBeenCalledTimes(1);
  cleanup();
  expect(current.cancel).toHaveBeenCalled();
});
it("closes dialogs immediately when motion is disabled", () => {
  const onClose = vi.fn();
  render(
    <FantasyMotionProvider enabled={false}>
      <Modal title="Tanpa motion" onClose={onClose}>
        <p>Isi</p>
      </Modal>
    </FantasyMotionProvider>,
  );
  const dialog = screen.getByRole("dialog") as HTMLDialogElement;
  dialog.animate = vi.fn();
  fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
  expect(dialog.animate).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
});
it("keeps Motion Lab copy functional", async () => {
  render(<MotionLab />);
  await screen.findByRole("heading", { name: "Motion Lab" });
  expect(
    screen.queryByText(
      /Bengkel sihir pixel|BUKU PERJALANANMU|Halaman pertama, ide pertama/,
    ),
  ).toBeNull();
  expect(
    screen.getByRole("textbox", { name: "Editor Motion Lab" }),
  ).toBeTruthy();
});
