import { beforeEach, describe, it, expect, vi } from "vitest";
import {
  rememberKey,
  unlockKey,
  hasRememberedKey,
  forgetKey,
} from "../src/lib/key-vault";
let storage: Map<string, string>;
beforeEach(() => {
  storage = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => storage.get(k) || null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  });
});
describe("client key encryption", () => {
  it("stores ciphertext and decrypts only with the right passphrase", async () => {
    await rememberKey("sk-private-very-secret", "my-long-passphrase");
    expect(hasRememberedKey()).toBe(true);
    expect(JSON.stringify([...storage])).not.toContain(
      "sk-private-very-secret",
    );
    expect(await unlockKey("my-long-passphrase")).toBe(
      "sk-private-very-secret",
    );
    await expect(unlockKey("wrong-passphrase")).rejects.toThrow("Passphrase");
    forgetKey();
    expect(hasRememberedKey()).toBe(false);
  });
  it("refuses a short passphrase before storing anything", async () => {
    await expect(rememberKey("sk-secret", "short")).rejects.toThrow(
      "10 karakter",
    );
    expect(storage.size).toBe(0);
  });
});
