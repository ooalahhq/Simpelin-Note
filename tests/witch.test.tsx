// @vitest-environment jsdom
import "./setup-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import OoalahWitch from "../src/components/OoalahWitch";

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
function loadSprite() {
  fireEvent.load(document.querySelector(".witch-atlas")!);
}
function tip() {
  return screen.queryByLabelText("Tip Ooalah witch", {
    selector: ".is-visible aside",
  });
}

it("waits before peeking, introduces herself once, then hides and rotates useful tips after a cooldown", () => {
  render(<OoalahWitch />);
  advance(20_000);
  expect(tip()).toBeNull();
  loadSprite();
  advance(13_999);
  expect(tip()).toBeNull();
  advance(1);
  expect(tip()?.textContent).toContain("Hai, aku Ooalah witch.");
  expect(tip()?.textContent).toContain("Ctrl + K");
  expect(document.querySelector(".witch-peek.is-waving")).toBeTruthy();
  advance(9_000);
  expect(tip()).toBeNull();
  expect(
    document.querySelector(".witch-peek")?.getAttribute("aria-hidden"),
  ).toBe("true");
  expect(screen.queryByRole("button")).toBeNull();
  advance(140_999);
  expect(tip()).toBeNull();
  advance(1);
  expect(tip()?.textContent).toContain("/code");
  expect(tip()?.textContent).not.toContain("Hai, aku");
});

it("postpones a pending tip until typing has stopped and withdraws immediately when input resumes", () => {
  render(
    <>
      <textarea aria-label="Catatan" />
      <OoalahWitch />
    </>,
  );
  loadSprite();
  advance(12_000);
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "a" });
  advance(7_999);
  expect(tip()).toBeNull();
  advance(1);
  expect(tip()).toBeTruthy();
  fireEvent.input(screen.getByRole("textbox"), {
    target: { value: "Lanjut menulis" },
  });
  expect(tip()).toBeNull();
  advance(30_000);
  expect(tip()).toBeNull();
});

it("waits until an IME composition ends before starting the idle delay", () => {
  render(
    <>
      <div contentEditable aria-label="Editor" />
      <OoalahWitch />
    </>,
  );
  loadSprite();
  advance(12_000);
  const editor = screen.getByLabelText("Editor");
  fireEvent.compositionStart(editor);
  advance(30_000);
  expect(tip()).toBeNull();
  fireEvent.compositionEnd(editor);
  advance(7_999);
  expect(tip()).toBeNull();
  advance(1);
  expect(tip()).toBeTruthy();
});

it("waits for a visible sidebar and pauses tips during focus mode or a settings dialog", () => {
  const view = render(<OoalahWitch active={false} />);
  loadSprite();
  advance(60_000);
  expect(
    localStorage.getItem("simpelin-ooalah-witch-introduced-v1"),
  ).toBeNull();
  view.rerender(<OoalahWitch paused />);
  advance(60_000);
  expect(tip()).toBeNull();
  view.rerender(<OoalahWitch />);
  advance(14_000);
  expect(tip()).toBeTruthy();
  view.rerender(<OoalahWitch paused />);
  expect(tip()).toBeNull();
  advance(200_000);
  expect(tip()).toBeNull();
  view.rerender(<OoalahWitch />);
  advance(13_999);
  expect(tip()).toBeNull();
  advance(1);
  expect(tip()).toBeTruthy();
  view.rerender(<OoalahWitch active={false} />);
  expect(tip()).toBeNull();
});

it("lets tips be dismissed, preserves cooldown across remounts and caps appearances at three per browser session", () => {
  const view = render(<OoalahWitch />);
  loadSprite();
  advance(14_000);
  fireEvent.click(
    screen.getByRole("button", { name: "Tutup tip Ooalah witch" }),
  );
  expect(tip()).toBeNull();
  view.unmount();
  const second = render(<OoalahWitch />);
  loadSprite();
  advance(149_999);
  expect(tip()).toBeNull();
  advance(1);
  expect(tip()?.textContent).toContain("/code");
  advance(150_000);
  expect(tip()?.textContent).toContain("Ekspor cadangan");
  advance(600_000);
  expect(tip()).toBeNull();
  second.unmount();
  render(<OoalahWitch />);
  loadSprite();
  advance(600_000);
  expect(tip()).toBeNull();
});

it("does not spend a tip while the browser tab is hidden and waits again on return", () => {
  render(<OoalahWitch />);
  loadSprite();
  advance(7_000);
  const visibility = vi.spyOn(document, "visibilityState", "get");
  visibility.mockReturnValue("hidden");
  fireEvent(document, new Event("visibilitychange"));
  advance(60_000);
  expect(tip()).toBeNull();
  expect(sessionStorage.getItem("simpelin-ooalah-witch-tips-v1")).toBeNull();
  visibility.mockReturnValue("visible");
  fireEvent(document, new Event("visibilitychange"));
  advance(13_999);
  expect(tip()).toBeNull();
  advance(1);
  expect(tip()).toBeTruthy();
  visibility.mockReturnValue("hidden");
  fireEvent(document, new Event("visibilitychange"));
  expect(tip()).toBeNull();
});

it("keeps a tip readable while hovered or keyboard focused, supports Escape and skips sprite motion when reduced", () => {
  render(<OoalahWitch reduced />);
  loadSprite();
  advance(14_000);
  expect(tip()).toBeTruthy();
  expect(
    document.querySelector(".witch-peek")?.getAttribute("data-reduced"),
  ).toBe("true");
  expect(document.querySelector(".is-waving")).toBeNull();
  const root = document.querySelector(".witch-peek")!;
  fireEvent.pointerEnter(root);
  advance(20_000);
  expect(tip()).toBeTruthy();
  fireEvent.pointerLeave(root);
  const close = screen.getByRole("button", { name: "Tutup tip Ooalah witch" });
  act(() => close.focus());
  advance(20_000);
  expect(tip()).toBeTruthy();
  fireEvent.keyDown(close, { key: "Escape" });
  expect(tip()).toBeNull();
});

it("defers to native dialogs and clears all pending timers when unmounted", () => {
  const view = render(<OoalahWitch />);
  loadSprite();
  const dialog = document.createElement("dialog");
  document.body.append(dialog);
  dialog.showModal();
  advance(14_000);
  expect(tip()).toBeNull();
  dialog.remove();
  advance(30_000);
  expect(tip()).toBeTruthy();
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
