import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const scriptPolicy = isProduction ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'";
    // Allow the configured Supabase project (hosted, custom domain, or local) in addition to *.supabase.co.
    let supabaseOrigins = "";
    try {
      const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
      supabaseOrigins = ` ${origin} ${origin.replace(/^http/, "ws")}`;
    } catch {
      supabaseOrigins = "";
    }
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []),
          { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src ${scriptPolicy}; connect-src 'self' https://*.supabase.co wss://*.supabase.co${supabaseOrigins};` },
        ],
      },
    ];
  },
};

export default nextConfig;
