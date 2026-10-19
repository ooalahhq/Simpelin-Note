const storageKey = "simpelin-encrypted-key-v1";
const bytes = (value: Uint8Array) => Array.from(value);
async function derive(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function rememberKey(key: string, passphrase: string) {
  if (passphrase.length < 10)
    throw new Error("Gunakan passphrase minimal 10 karakter.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const derived = await derive(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derived,
    new TextEncoder().encode(key),
  );
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      version: 1,
      salt: bytes(salt),
      iv: bytes(iv),
      cipher: bytes(new Uint8Array(encrypted)),
    }),
  );
}
export async function unlockKey(passphrase: string) {
  const payload = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (!payload || payload.version !== 1)
    throw new Error("Tidak ada key tersimpan.");
  try {
    const key = await derive(passphrase, new Uint8Array(payload.salt));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
      key,
      new Uint8Array(payload.cipher),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Passphrase tidak cocok. Coba lagi.");
  }
}
export function hasRememberedKey() {
  return !!localStorage.getItem(storageKey);
}
export function forgetKey() {
  localStorage.removeItem(storageKey);
}
