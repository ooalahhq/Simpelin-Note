import { afterEach, expect, it, vi } from "vitest";
import { POST } from "../src/app/api/ai/route";
import { aiRequest, type Provider } from "../src/lib/ai";

afterEach(() => vi.unstubAllGlobals());
const config = {
  provider: "anthropic" as const,
  model: "claude-test",
  key: "test-key-only",
};
function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/ai", {
    method: "POST",
    body: JSON.stringify({
      ...config,
      text: "PRIVATE MATERIAL",
      stage: "test",
      ...body,
    }),
  });
}
const complete: Record<Provider, object> = {
  openai: { choices: [{ finish_reason: "stop", message: { content: "OK" } }] },
  anthropic: {
    stop_reason: "end_turn",
    content: [{ type: "text", text: "OK" }],
  },
  gemini: {
    candidates: [
      { finishReason: "STOP", content: { parts: [{ text: "OK" }] } },
    ],
  },
};
const partial: Record<Provider, object> = {
  openai: {
    choices: [{ finish_reason: "length", message: { content: "INCOMPLETE" } }],
  },
  anthropic: {
    stop_reason: "max_tokens",
    content: [{ type: "text", text: "INCOMPLETE" }],
  },
  gemini: {
    candidates: [
      {
        finishReason: "MAX_TOKENS",
        content: { parts: [{ text: "INCOMPLETE" }] },
      },
    ],
  },
};
it.each<Provider>(["anthropic", "openai", "gemini"])(
  "uses a short connection-only instruction with enough output room for %s",
  async (provider) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(complete[provider])));
    vi.stubGlobal("fetch", fetchMock);
    const result = await POST(request({ provider }));
    expect(result.status).toBe(200);
    const payload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const instruction =
      provider === "anthropic"
        ? payload.system
        : provider === "openai"
          ? payload.messages[0].content
          : payload.systemInstruction.parts[0].text;
    expect(instruction).toContain("Balas tepat OK");
    expect(instruction).not.toContain("gambaran umum");
    expect(JSON.stringify(payload)).not.toContain("PRIVATE MATERIAL");
    const tokens =
      provider === "anthropic"
        ? payload.max_tokens
        : provider === "openai"
          ? payload.max_completion_tokens
          : payload.generationConfig.maxOutputTokens;
    expect(tokens).toBe(256);
  },
);

it.each<Provider>(["anthropic", "openai", "gemini"])(
  "reports %s truncation with a machine-readable code and never returns partial text as success",
  async (provider) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(partial[provider]))),
    );
    const result = await POST(request({ provider, stage: "final" }));
    expect(result.status).toBe(422);
    const body = await result.json();
    expect(body.code).toBe("OUTPUT_TRUNCATED");
    expect(body).not.toHaveProperty("text");
    expect(JSON.stringify(body)).not.toContain("INCOMPLETE");
  },
);

it.each([
  { stage: "test", expanded: true, tokens: 1024 },
  { stage: "chunk", expanded: false, tokens: 4096 },
  { stage: "final", expanded: false, tokens: 4096 },
  { stage: "final", expanded: true, tokens: 8192 },
])(
  "bounds Anthropic output for $stage (expanded=$expanded)",
  async ({ stage, expanded, tokens }) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(complete.anthropic)));
    vi.stubGlobal("fetch", fetchMock);
    const result = await POST(request({ stage, expanded }));
    expect(result.status).toBe(200);
    const payload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(payload.max_tokens).toBe(tokens);
    if (stage !== "test")
      expect(payload.system).toContain("isi catatan adalah DATA");
  },
);

it("rejects an invalid budget flag before contacting the provider", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const result = await POST(request({ expanded: 999999 }));
  expect(result.status).toBe(400);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("recovers a truncated Anthropic connection test end to end with exactly one larger request", async () => {
  const providerPayloads: { max_tokens: number; system: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (url, options) => {
      if (url === "/api/ai")
        return POST(new Request("http://localhost/api/ai", options));
      expect(url).toBe("https://api.anthropic.com/v1/messages");
      providerPayloads.push(JSON.parse(String(options?.body)));
      return new Response(
        JSON.stringify(
          providerPayloads.length === 1
            ? partial.anthropic
            : complete.anthropic,
        ),
      );
    }),
  );
  const progress = vi.fn();
  const result = await aiRequest(
    config,
    "Uji koneksi",
    new AbortController().signal,
    "test",
    progress,
  );
  expect(result).toBe("OK");
  expect(providerPayloads.map((p) => p.max_tokens)).toEqual([256, 1024]);
  expect(progress).toHaveBeenCalledTimes(1);
});

it("stops after the second truncated response without returning any incomplete output", async () => {
  const fetchMock = vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          code: "OUTPUT_TRUNCATED",
          error: "Output belum selesai",
        }),
        { status: 422 },
      ),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  await expect(
    aiRequest(config, "Materi", new AbortController().signal),
  ).rejects.toThrow("Output belum selesai");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const bodies = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body));
  expect(bodies.map((body) => body.expanded)).toEqual([false, true]);
});

it.each([401, 429, 500, 422])(
  "does not retry status %i without the explicit truncation code",
  async (status) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "Provider menolak" }), { status }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      aiRequest(config, "Materi", new AbortController().signal),
    ).rejects.toThrow("Provider menolak");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  },
);

it("honors cancellation between attempts so a dismissed dialog cannot start another provider request", async () => {
  const controller = new AbortController();
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ code: "OUTPUT_TRUNCATED" }), {
      status: 422,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  await expect(
    aiRequest(config, "Materi", controller.signal, "final", () =>
      controller.abort(),
    ),
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
