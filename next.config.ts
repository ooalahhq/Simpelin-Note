import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  // Use the compiler API for consistent TypeScript diagnostics across platforms.
  experimental: { useTypeScriptCli: false },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
