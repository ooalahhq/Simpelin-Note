import { describe, it, expect, vi, afterEach } from "vitest";
import {
  materialContext,
  splitContext,
  markdownDocument,
  summarize,
} from "../src/lib/ai";
import { createWorkspace, newNote } from "../src/lib/model";
import { POST } from "../src/app/api/ai/route";
afterEach(() => vi.unstubAllGlobals());
describe("AI integrity", () => {
  it("excludes prior summaries from context", () => {
    const s = createWorkspace();
    const summary = newNote(
      s.selectedCategoryId,
      "SECRET OLD SUMMARY",
      "summary",
    );
    expect(materialContext([...s.notes, summary])).not.toContain(
      "SECRET OLD SUMMARY",
    );
  });
  it("chunks without dropping the final material", () => {
    const value = "a".repeat(30000) + "FINAL";
    expect(splitContext(value).join("")).toBe(value);
  });
  it("returns structured text rather than executing generated HTML", () => {
    expect(
      markdownDocument(
        "# Judul\n<script>alert(1)</script>\n```js\nlet x=1\n```",
      ).content?.[1].content?.[0].text,
    ).toContain("<script>");
  });
  it("rejects arbitrary provider/model targets before any fetch", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const r = await POST(
      new Request("http://localhost/api/ai", {
        method: "POST",
        body: JSON.stringify({
          provider: "http://evil.test",
          key: "12345678",
          model: "../../secret",
          text: "hello",
          stage: "final",
        }),
      }),
    );
    expect(r.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("propagates failure without synthesizing summary output", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: "kuota" }), { status: 429 }),
        ),
    );
    await expect(
      summarize(
        { provider: "openai", model: "test", key: "test" },
        createWorkspace().notes,
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow("kuota");
  });
});
