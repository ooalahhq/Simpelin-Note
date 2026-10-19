import { afterEach, expect, it, vi } from "vitest";
import { POST } from "../src/app/api/ai/route";

afterEach(() => vi.unstubAllGlobals());
const payload = {
  provider: "openai",
  model: "test-model",
  key: "test-key-only",
  text: "Tes koneksi",
  stage: "test",
};
const accepted: {
  name: string;
  url: string;
  headers: Record<string, string>;
}[] = [
  {
    name: "direct localhost",
    url: "http://localhost:3040/api/ai",
    headers: { origin: "http://localhost:3040" },
  },
  {
    name: "LAN IP with Next bound to all interfaces",
    url: "http://0.0.0.0:3040/api/ai",
    headers: { origin: "http://192.168.0.10:3040", host: "192.168.0.10:3040" },
  },
  {
    name: "HTTPS reverse proxy",
    url: "http://localhost:3040/api/ai",
    headers: {
      origin: "https://notes.example.test",
      host: "localhost:3040",
      "x-forwarded-host": "notes.example.test",
      "x-forwarded-proto": "https",
    },
  },
  {
    name: "TLS termination preserving Host",
    url: "http://localhost:3040/api/ai",
    headers: {
      origin: "https://notes.example.test",
      host: "notes.example.test",
      "x-forwarded-proto": "https",
    },
  },
  {
    name: "forwarded chain uses the first public authority",
    url: "http://localhost:3040/api/ai",
    headers: {
      origin: "https://notes.example.test:8443",
      "x-forwarded-host": "notes.example.test:8443, internal:3040",
      "x-forwarded-proto": "https, http",
    },
  },
  {
    name: "IPv6 LAN",
    url: "http://localhost:3040/api/ai",
    headers: { origin: "http://[::1]:3040", host: "[::1]:3040" },
  },
];
it.each(accepted)(
  "allows $name and reaches the provider",
  async ({ url, headers }) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "OK" } }] }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await POST(
      new Request(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }),
    );
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ text: "OK" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  },
);

const rejected: { name: string; headers: Record<string, string> }[] = [
  {
    name: "foreign origin",
    headers: { origin: "https://evil.test", host: "notes.example.test" },
  },
  {
    name: "different port",
    headers: {
      origin: "http://notes.example.test:3041",
      host: "notes.example.test:3040",
    },
  },
  {
    name: "different scheme",
    headers: {
      origin: "https://notes.example.test",
      host: "notes.example.test",
    },
  },
  { name: "null origin", headers: { origin: "null" } },
  {
    name: "internal URL bypassing the public Host",
    headers: { origin: "http://localhost:3040", host: "notes.example.test" },
  },
  {
    name: "internal Host bypassing forwarded Host",
    headers: {
      origin: "http://localhost:3040",
      host: "localhost:3040",
      "x-forwarded-host": "notes.example.test",
      "x-forwarded-proto": "https",
    },
  },
  {
    name: "host suffix spoofing",
    headers: {
      origin: "http://notes.example.test.evil.test",
      host: "notes.example.test",
    },
  },
  {
    name: "malformed forwarded authority",
    headers: {
      origin: "https://evil.test",
      "x-forwarded-host": "notes.example.test@evil.test",
      "x-forwarded-proto": "https",
    },
  },
  {
    name: "invalid forwarded protocol",
    headers: {
      origin: "https://notes.example.test",
      "x-forwarded-host": "notes.example.test",
      "x-forwarded-proto": "ftp",
    },
  },
  {
    name: "cross-site Fetch Metadata",
    headers: {
      origin: "http://localhost:3040",
      "sec-fetch-site": "cross-site",
    },
  },
];
it.each(rejected)(
  "rejects $name before any provider request",
  async ({ headers }) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await POST(
      new Request("http://localhost:3040/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }),
    );
    expect(result.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  },
);
