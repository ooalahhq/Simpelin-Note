import { describe, it, expect } from "vitest";
import {
  createWorkspace,
  newNote,
  nodesFor,
  move,
  restoreDeleted,
  nextSummaryNumber,
  textOf,
} from "../src/lib/model";
describe("workspace invariants", () => {
  it("inserts new material ahead of every summary and keeps permanent IDs", () => {
    const s = createWorkspace();
    const category = s.selectedCategoryId;
    const summary = newNote(category, "Summary 1", "summary");
    s.notes.push(summary);
    const latest = newNote(category);
    s.notes.push(latest);
    const ordered = nodesFor(s, category);
    expect(ordered.at(-1)?.id).toBe(summary.id);
    expect(ordered.at(-2)?.id).toBe(latest.id);
    expect(new Set(ordered.map((n) => n.id)).size).toBe(5);
  });
  it("reorders without mutating the original array", () => {
    const initial = ["a", "b", "c"];
    expect(move(initial, 2, 0)).toEqual(["c", "a", "b"]);
    expect(initial).toEqual(["a", "b", "c"]);
  });
  it("preserves code fences and labels images honestly in AI context", () => {
    expect(
      textOf({
        type: "codeBlock",
        attrs: { language: "js" },
        content: [{ type: "text", text: "const x = 1" }],
      }),
    ).toContain("```js\nconst x = 1");
    expect(textOf({ type: "image", attrs: { alt: "Diagram" } })).toContain(
      "tidak dianalisis",
    );
  });
});

it("restores original order without losing edits made after deletion", () => {
  const before = [
    { id: "a", title: "old" },
    { id: "b", title: "deleted" },
    { id: "c", title: "unchanged" },
  ];
  const current = [
    { id: "a", title: "edited" },
    { id: "c", title: "unchanged" },
    { id: "d", title: "new" },
  ];
  expect(restoreDeleted(current, before, new Set(["b"]))).toEqual([
    { id: "a", title: "edited" },
    before[1],
    before[2],
    current[2],
  ]);
});

it("keeps summary numbering monotonic after rename or deletion", () => {
  const s = createWorkspace();
  const category = s.categories[0];
  category.summarySequence = 4;
  s.notes.push(newNote(category.id, "My renamed summary", "summary"));
  expect(nextSummaryNumber(s, category.id)).toBe(5);
  s.notes = s.notes.filter((n) => n.type !== "summary");
  expect(nextSummaryNumber(s, category.id)).toBe(5);
});

it("does not share mutable motion preferences between workspaces", () => {
  const first = createWorkspace();
  const second = createWorkspace();
  first.preferences.panel = false;
  expect(second.preferences.panel).toBe(true);
});
