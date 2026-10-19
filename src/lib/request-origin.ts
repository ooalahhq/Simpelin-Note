/** Resolve the public origin like Next's host handling, including reverse proxies. */
export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  // Non-browser clients may omit Origin; the API still requires a BYOK payload.
  if (!origin) return true;
  try {
    const internal = new URL(request.url);
    // The ingress proxy must overwrite forwarded headers with its public host/proto.
    // Prefer the public authority rather than accepting the internal URL as an alias.
    const host = (
      request.headers.get("x-forwarded-host")?.split(",")[0] ??
      request.headers.get("host") ??
      internal.host
    ).trim();
    const protocol = (
      request.headers.get("x-forwarded-proto")?.split(",")[0] ??
      internal.protocol.slice(0, -1)
    ).trim();
    if (
      !host ||
      /[\s/\\?#@]/.test(host) ||
      !["http", "https"].includes(protocol)
    )
      return false;
    const publicOrigin = new URL(`${protocol}://${host}`).origin;
    return origin === publicOrigin;
  } catch {
    return false;
  }
}
