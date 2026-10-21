import { textOf, type Note } from "./model";
export { markdownDocument } from "./markdown";
export type Provider = "openai" | "gemini" | "anthropic" | "custom";
export type AIConfig = {
  provider: Provider;
  model: string;
  key: string;
  baseUrl?: string;
};
export const providerNames: Record<Provider, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  anthropic: "Anthropic",
  custom: "Custom",
};
export function isLocalAIBaseUrl(baseUrl?: string) {
  if (!baseUrl) return false;
  try {
    const host = new URL(baseUrl).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".lan") ||
      host.endsWith(".internal") ||
      !host.includes(".") ||
      host === "host.docker.internal" ||
      host === "gateway.docker.internal" ||
      host === "::1" ||
      /^f[cd][0-9a-f]{2}:/i.test(host) ||
      host.startsWith("fe80:")
    )
      return true;
    const octets = host.split(".").map(Number);
    if (
      octets.length !== 4 ||
      octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
    )
      return false;
    const [first, second] = octets;
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  } catch {
    return false;
  }
}
export function materialContext(notes: Note[]) {
  return notes
    .filter((n) => n.type === "note")
    .map(
      (n, i) =>
        `## P${i + 1} · ${n.title || "Tanpa judul"}\n${textOf(n.content)}`,
    )
    .join("\n\n");
}
export function splitContext(text: string, max = 12000) {
  const chunks: string[] = [];
  let left = text;
  while (left.length > max) {
    let cut = left.lastIndexOf("\n", max);
    if (cut < max * 0.5) cut = max;
    chunks.push(left.slice(0, cut));
    left = left.slice(cut).trimStart();
  }
  if (left) chunks.push(left);
  return chunks;
}
export async function aiRequest(
  config: AIConfig,
  text: string,
  signal: AbortSignal,
  stage: "chunk" | "final" | "test" = "final",
  onRetry?: () => void,
  topic = "",
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    signal.throwIfAborted();
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...config,
        text,
        stage,
        topic,
        expanded: attempt === 1,
      }),
      signal,
    });
    const data = await response.json();
    if (!response.ok) {
      if (
        response.status === 422 &&
        data.code === "OUTPUT_TRUNCATED" &&
        attempt === 0
      ) {
        onRetry?.();
        continue;
      }
      throw new Error(data.error || "Layanan AI belum merespons. Coba lagi.");
    }
    if (typeof data.text !== "string" || !data.text.trim())
      throw new Error("Provider mengembalikan hasil kosong. Coba lagi.");
    return data.text as string;
  }
  throw new Error("Output AI belum selesai. Coba lagi.");
}
export async function summarize(
  config: AIConfig,
  notes: Note[],
  signal: AbortSignal,
  onProgress: (label: string) => void,
  topic = "",
) {
  let contexts = splitContext(materialContext(notes));
  if (!contexts.length) throw new Error("Belum ada materi untuk dirangkum.");
  let round = 0;
  while (contexts.length > 1) {
    const results: string[] = [];
    for (let i = 0; i < contexts.length; i++) {
      onProgress(
        `Merangkum bagian ${i + 1} dari ${contexts.length}${round ? " · tahap lanjutan" : ""}`,
      );
      results.push(
        await aiRequest(
          config,
          contexts[i],
          signal,
          "chunk",
          () =>
            onProgress(
              `Mencoba ulang bagian ${i + 1} dengan batas output lebih besar…`,
            ),
          topic,
        ),
      );
    }
    const merged = results.join("\n\n");
    const next = splitContext(merged);
    if (++round > 6 || (next.length >= contexts.length && round > 2))
      throw new Error(
        "Materi belum dapat digabung dalam batas konteks. Catatan tetap aman; gunakan model dengan ringkasan lebih ringkas.",
      );
    contexts = next;
  }
  onProgress("Menyusun ringkasan akhir…");
  return aiRequest(
    config,
    contexts[0],
    signal,
    "final",
    () =>
      onProgress(
        "Mencoba ulang ringkasan akhir dengan batas output lebih besar…",
      ),
    topic,
  );
}
