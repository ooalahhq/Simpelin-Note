import { describe, it, expect } from "vitest";
import { safeUrl, cleanDocument, validateWorkspace } from "../src/lib/security";
import { createWorkspace } from "../src/lib/model";
describe("untrusted content", () => {
  it("rejects executable link protocols", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,test")).toBeNull();
    expect(safeUrl("https://example.com")).toBe("https://example.com/");
  });
  it("strips arbitrary attributes and unsafe links", () => {
    const n = cleanDocument({
      type: "text",
      text: "safe",
      attrs: { onload: "bad" },
      marks: [{ type: "link", attrs: { href: "javascript:bad" } }],
    });
    expect(JSON.stringify(n)).not.toContain("javascript");
    expect(n.attrs).toBeUndefined();
  });
  it("rejects orphaned category and duplicate IDs", () => {
    const s = createWorkspace();
    s.categories[0].groupId = "missing";
    expect(() => validateWorkspace(s)).toThrow();
    const x = createWorkspace();
    x.notes[0].id = x.groups[0].id;
    expect(() => validateWorkspace(x)).toThrow();
  });
  it("accepts a valid seeded workspace", () =>
    expect(validateWorkspace(createWorkspace()).notes).toHaveLength(3));
});
