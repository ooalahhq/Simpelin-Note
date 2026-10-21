import { NextResponse } from "next/server";
import { aiInstruction, aiPrompt } from "../../../lib/ai-prompts";
import { isLocalAIBaseUrl } from "../../../lib/ai";
import { isSameOriginRequest } from "../../../lib/request-origin";
export const runtime = "nodejs";
export const maxDuration = 120;
function isValidCustomBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !!url.hostname &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Body kosong.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 100000) {
      await reader.cancel();
      throw new Error("Permintaan terlalu besar.");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
  }
  return JSON.parse(new TextDecoder().decode(all));
}
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json(
      { error: "Origin tidak diizinkan." },
      { status: 403 },
    );
  try {
    const body = await readBody(request);
    const {
      provider,
      model,
      key,
      baseUrl,
      text,
      stage,
      expanded = false,
      topic = "",
    } = body;
    if (
      !["openai", "gemini", "anthropic", "custom"].includes(provider) ||
      typeof key !== "string" ||
      (!(provider === "custom" && isLocalAIBaseUrl(baseUrl)) &&
        key.length < 1) ||
      key.length > 1024 ||
      (provider === "custom" &&
        (typeof baseUrl !== "string" ||
          baseUrl.length > 2048 ||
          !isValidCustomBaseUrl(baseUrl))) ||
      typeof model !== "string" ||
      !/^[a-zA-Z0-9._:-]{1,100}$/.test(model) ||
      typeof text !== "string" ||
      text.length > 18000 ||
      !text.trim() ||
      !["chunk", "final", "test"].includes(stage) ||
      typeof expanded !== "boolean" ||
      typeof topic !== "string" ||
      topic.length > 500
    )
      return NextResponse.json(
        { error: "Provider, model, key, atau materi tidak valid." },
        { status: 400 },
      );
    const instruction = aiInstruction(stage);
    const prompt = aiPrompt(text, stage, topic);
    let endpoint: string, headers: Record<string, string>, payload: unknown;
    // Keep requests bounded, with one larger budget available for truncation recovery.
    const tokens =
      stage === "test" ? (expanded ? 1024 : 256) : expanded ? 8192 : 4096;
    if (provider === "openai") {
      endpoint = "https://api.openai.com/v1/chat/completions";
      headers = { Authorization: `Bearer ${key}` };
      payload = {
        model,
        messages: [
          { role: "system", content: instruction },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: tokens,
      };
    } else if (provider === "anthropic") {
      endpoint = "https://api.anthropic.com/v1/messages";
      headers = { "x-api-key": key, "anthropic-version": "2023-06-01" };
      payload = {
        model,
        system: instruction,
        messages: [{ role: "user", content: prompt }],
        max_tokens: tokens,
      };
    } else if (provider === "custom") {
      const base = new URL(baseUrl);
      const path = base.pathname.replace(/\/+$/, "");
      endpoint = `${base.origin}${path}${/\/v1$/i.test(path) ? "" : "/v1"}/chat/completions`;
      headers =
        key && key !== "default" ? { Authorization: `Bearer ${key}` } : {};
      payload = {
        model,
        messages: [
          { role: "system", content: instruction },
          { role: "user", content: prompt },
        ],
        max_tokens: tokens,
        stream: false,
      };
    } else {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      headers = { "x-goog-api-key": key };
      payload = {
        systemInstruction: { parts: [{ text: instruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: tokens },
      };
    }
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(90000),
    ]);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
      signal,
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) {
      const status = response.status;
      return NextResponse.json(
        {
          error:
            status === 401 || status === 403
              ? "Key ditolak provider. Periksa key, izin, dan model di Pengaturan."
              : status === 429
                ? "Batas request atau kuota provider tercapai. Periksa saldo lalu coba lagi."
                : status === 404
                  ? "Model tidak ditemukan. Periksa ID model di Pengaturan."
                  : "Provider belum dapat memproses request. Periksa model dan coba lagi.",
        },
        { status: status >= 400 && status < 500 ? status : 502 },
      );
    }
    const data = await response.json();
    let output = "";
    let truncated = false;
    if (provider === "openai" || provider === "custom") {
      output = data.choices?.[0]?.message?.content || "";
      truncated = data.choices?.[0]?.finish_reason === "length";
    } else if (provider === "anthropic") {
      output =
        data.content
          ?.filter((v: { type: string }) => v.type === "text")
          .map((v: { text: string }) => v.text)
          .join("\n") || "";
      truncated = data.stop_reason === "max_tokens";
    } else {
      output =
        data.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text || "")
          .join("\n") || "";
      truncated = data.candidates?.[0]?.finishReason === "MAX_TOKENS";
    }
    if (truncated)
      return NextResponse.json(
        {
          code: "OUTPUT_TRUNCATED",
          error:
            stage === "test"
              ? "Uji koneksi masih mencapai batas output model. Periksa ID model di Pengaturan."
              : "Output AI masih mencapai batas token. Kurangi panjang materi atau periksa batas output model; tidak ada Summary dibuat.",
        },
        { status: 422 },
      );
    if (!output.trim())
      return NextResponse.json(
        {
          error:
            "Provider mengembalikan hasil kosong. Periksa dukungan model dan coba lagi.",
        },
        { status: 502 },
      );
    return NextResponse.json(
      { text: output },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name)
            ? "Request dibatalkan atau melewati batas waktu. Catatan tetap aman."
            : "Permintaan tidak dapat diproses. Periksa koneksi dan format pengaturan.",
      },
      { status: 400 },
    );
  }
}
