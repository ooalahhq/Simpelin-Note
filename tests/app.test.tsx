// @vitest-environment jsdom
import "./setup-dom";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { createElement, forwardRef, useImperativeHandle } from "react";
import db from "../src/lib/db";
import { flushWorkspaceWrites } from "../src/lib/workspace";
import WorkspaceApp from "../src/components/WorkspaceApp";
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
  await db.assets.clear();
});
afterEach(() => cleanup());
async function app() {
  render(<WorkspaceApp />);
  await screen.findByRole(
    "heading",
    { name: "Jaringan Komputer" },
    { timeout: 3000 },
  );
  await screen.findByRole(
    "textbox",
    { name: "Isi catatan" },
    { timeout: 3000 },
  );
}
describe("actual application DOM and IndexedDB", () => {
  it("renders selected seeded material and persists title edits across remount", async () => {
    await app();
    expect(
      screen.getByRole("textbox", { name: "Isi catatan" }).textContent,
    ).toContain("TCP dan UDP");
    fireEvent.change(screen.getByRole("textbox", { name: "Judul catatan" }), {
      target: { value: "Judul permanen" },
    });
    await waitFor(async () =>
      expect(
        (await db.workspace.get("main"))?.data.notes.find(
          (n) => n.title === "Judul permanen",
        ),
      ).toBeTruthy(),
    );
    cleanup();
    await app();
    expect(
      (
        screen.getByRole("textbox", {
          name: "Judul catatan",
        }) as HTMLInputElement
      ).value,
    ).toBe("Judul permanen");
  });
  it("creates material only at the terminal timeline control", async () => {
    await app();
    expect(
      screen.getAllByRole("button", { name: "Tambah pertemuan" }),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Tambah pertemuan" }));
    await waitFor(() =>
      expect(
        (
          screen.getByRole("textbox", {
            name: "Judul catatan",
          }) as HTMLInputElement
        ).value,
      ).toBe(""),
    );
    expect(
      screen.getByRole("button", { name: "P4 · Tanpa judul" }),
    ).toBeTruthy();
    await waitFor(async () =>
      expect((await db.workspace.get("main"))?.data.notes).toHaveLength(4),
    );
  });
  it("creates a group and category through the real dialog forms", async () => {
    await app();
    fireEvent.click(screen.getAllByRole("button", { name: "Tambah group" })[0]);
    fireEvent.change(screen.getByLabelText("Nama group"), {
      target: { value: "Bootcamp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tambahkan" }));
    expect(
      screen.getByRole("button", { name: "Kelola Bootcamp" }),
    ).toBeTruthy();
    const group = screen
      .getByRole("button", { name: "Kelola Bootcamp" })
      .closest(".group")!;
    fireEvent.click(
      within(group as HTMLElement).getByRole("button", {
        name: "Tambah kategori",
      }),
    );
    fireEvent.change(screen.getByLabelText("Nama kategori"), {
      target: { value: "React" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tambahkan" }));
    expect(screen.getByRole("heading", { name: "React" })).toBeTruthy();
    expect(screen.getByText("Belum ada catatan")).toBeTruthy();
  });
  it("requires delete confirmation and restores notes via Undo", async () => {
    await app();
    fireEvent.click(
      screen.getByRole("button", { name: "Kelola catatan aktif" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Hapus catatan" }));
    expect(screen.getByRole("dialog", { name: "Hapus catatan?" })).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "P3 · Protokol jaringan",
      }),
    ).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Hapus catatan?" })).getByRole(
        "button",
        { name: "Hapus" },
      ),
    );
    expect(
      screen.queryByRole("button", {
        name: "P3 · Protokol jaringan",
      }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Urungkan" }));
    expect(
      screen.getByRole("button", {
        name: "P3 · Protokol jaringan",
      }),
    ).toBeTruthy();
  });
  it("maximizes in place without replacing the editable DOM", async () => {
    await app();
    const editor = screen.getByRole("textbox", { name: "Isi catatan" });
    fireEvent.click(screen.getByRole("button", { name: "Perbesar editor" }));
    expect(document.querySelector(".note-panel.expanded")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Isi catatan" })).toBe(editor);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.querySelector(".note-panel.expanded")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Isi catatan" })).toBe(editor);
  });
  it("applies a real editor bold command to the selected document", async () => {
    await app();
    const bold = screen.getByRole("button", { name: "Tebal" });
    fireEvent.click(bold);
    await waitFor(() => expect(bold.getAttribute("aria-pressed")).toBe("true"));
  });
  it("persists animation settings and leaves raw key out of storage", async () => {
    await app();
    fireEvent.click(screen.getByRole("button", { name: "Pengaturan" }));
    fireEvent.change(screen.getByLabelText(/Preset animasi/), {
      target: { value: "Arc Energy" },
    });
    await waitFor(async () =>
      expect((await db.workspace.get("main"))?.data.preferences.preset).toBe(
        "Arc Energy",
      ),
    );
    fireEvent.click(screen.getByRole("tab", { name: "AI Provider" }));
    fireEvent.change(screen.getByLabelText(/ID model/), {
      target: { value: "test-model" },
    });
    fireEvent.change(screen.getByLabelText(/API key/), {
      target: { value: "private-test-key-123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Aktifkan pengaturan" }),
    );
    await screen.findByText(
      "Pengaturan aktif; key hanya tersimpan di memori sesi ini.",
    );
    expect(JSON.stringify(localStorage)).not.toContain("private-test-key-123");
    expect(
      JSON.stringify((await db.workspace.get("main"))?.data),
    ).not.toContain("private-test-key-123");
  });
  it("persists and restores a keyless local Custom provider selection", async () => {
    await app();
    fireEvent.click(screen.getByRole("button", { name: "Pengaturan" }));
    fireEvent.click(screen.getByRole("tab", { name: "AI Provider" }));
    fireEvent.change(screen.getByLabelText("Provider"), {
      target: { value: "custom" },
    });
    fireEvent.change(screen.getByLabelText("Base URL"), {
      target: { value: "http://192.168.1.20:1234/v1" },
    });
    fireEvent.change(screen.getByLabelText(/ID model/), {
      target: { value: "local-model" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Aktifkan pengaturan" }),
    );

    await screen.findByText(
      "Pengaturan aktif; key hanya tersimpan di memori sesi ini.",
    );
    expect(JSON.parse(localStorage.getItem("simpelin-ai-preferences")!)).toEqual({
      provider: "custom",
      model: "local-model",
      baseUrl: "http://192.168.1.20:1234/v1",
    });

    fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
    cleanup();
    await app();
    fireEvent.click(screen.getByRole("button", { name: "Pengaturan" }));
    fireEvent.click(screen.getByRole("tab", { name: "AI Provider" }));
    expect((screen.getByLabelText("Provider") as HTMLSelectElement).value).toBe(
      "custom",
    );
    expect((screen.getByLabelText(/ID model/) as HTMLInputElement).value).toBe(
      "local-model",
    );
    expect((screen.getByLabelText("Base URL") as HTMLInputElement).value).toBe(
      "http://192.168.1.20:1234/v1",
    );
    expect((screen.getByLabelText(/API key/) as HTMLInputElement).value).toBe(
      "",
    );
    fireEvent.click(screen.getByRole("button", { name: /AI Summary/ }));
    expect(screen.getByText(/Custom · local-model/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Buat Summary/ }).hasAttribute("disabled"),
    ).toBe(false);
  });
});

it("keeps native Enter splitting while triggering the caret effect", async () => {
  const { default: NoteEditor } = await import("../src/components/NoteEditor");
  const onEffect = vi.fn(),
    onChange = vi.fn();
  render(
    <NoteEditor
      noteId="keyboard-test"
      content={{
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Catatan" }] },
        ],
      }}
      onChange={onChange}
      onEffect={onEffect}
    />,
  );
  const editor = await screen.findByRole("textbox", { name: "Isi catatan" });
  fireEvent.focus(editor);
  fireEvent.keyDown(editor, {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
  });
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(onChange.mock.calls.at(-1)?.[0].content).toHaveLength(2);
  expect(onEffect).toHaveBeenCalledWith(
    "enter",
    expect.any(Number),
    expect.any(Number),
  );
});

it("generates an editable study summary with real headings, bold and tables, then preserves it after reload", async () => {
  const { readFileSync } = await import("node:fs");
  // Hand-authored target output: this checks rendering/storage, not live model quality.
  const markdown = readFileSync("tests/fixtures/study-summary.md", "utf8");
  const request = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify({ text: markdown })));
  try {
    await app();
    fireEvent.click(screen.getByRole("button", { name: "Pengaturan" }));
    fireEvent.click(screen.getByRole("tab", { name: "AI Provider" }));
    fireEvent.change(screen.getByLabelText("Provider"), {
      target: { value: "anthropic" },
    });
    fireEvent.change(screen.getByLabelText(/ID model/), {
      target: { value: "claude-test" },
    });
    fireEvent.change(screen.getByLabelText(/API key/), {
      target: { value: "test-key-only" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Aktifkan pengaturan" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
    fireEvent.click(screen.getByRole("button", { name: "AI Summary" }));
    const dialog = screen.getByRole("dialog", { name: "AI Summary" });
    expect(dialog.textContent).toContain("Pelengkap materi");
    fireEvent.click(screen.getByRole("button", { name: "Buat Summary" }));
    await waitFor(
      () =>
        expect(
          (
            screen.getByRole("textbox", {
              name: "Judul catatan",
            }) as HTMLInputElement
          ).value,
        ).toBe("Summary 1"),
      { timeout: 3000 },
    );
    const editor = screen.getByRole("textbox", { name: "Isi catatan" });
    expect(
      await within(editor).findByRole("heading", {
        name: "Memahami jaringan komputer",
        level: 1,
      }),
    ).toBeTruthy();
    expect(within(editor).getAllByRole("row")).toHaveLength(8);
    expect(editor.querySelector("strong")?.textContent).toBe("Protokol");
    expect(editor.textContent).not.toContain("**");
    expect(JSON.parse(String(request.mock.calls[0][1]?.body)).topic).toBe(
      "Jaringan Komputer",
    );
    await waitFor(async () =>
      expect(
        (await db.workspace.get("main"))?.data.notes
          .find((n) => n.type === "summary")
          ?.content.content?.some((n) => n.type === "table"),
      ).toBe(true),
    );
    await flushWorkspaceWrites();
    cleanup();
    await app();
    const reloaded = screen.getByRole("textbox", { name: "Isi catatan" });
    expect(
      await within(reloaded).findByRole("heading", {
        name: "Memahami jaringan komputer",
        level: 1,
      }),
    ).toBeTruthy();
    expect(within(reloaded).getAllByRole("row")).toHaveLength(8);
    expect(reloaded.textContent).toContain("Cek pemahaman");
  } finally {
    request.mockRestore();
  }
});
