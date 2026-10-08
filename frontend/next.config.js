/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Compiler ─────────────────────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ── Network Security ───────────────────────────────────────────────────
  allowedDevOrigins: [
    "7786d193c0a81e.lhr.life",
    "c89ccbda7f2360.lhr.life",
    "2994f6898e9397.lhr.life",
    "431ab00d5d6f9a24-103-183-240-10.serveousercontent.com",
    "7bd3229be0d745.lhr.life",
    "793fa32bf297a4.lhr.life",
    "10.10.95.60",
    "192.168.137.1",
    "172.16.63.79",
    "172.16.63.125",
    "10.30.112.153",
    "localhost",
  ],

  // ── Turbopack config (Next.js 16 default bundler) ────────────────────
  turbopack: {
    resolveAlias: {
      // Swap full plotly.js (~3MB) for the GL3D-only build (~1.8MB)
      "plotly.js": "plotly.js-gl3d-dist",
    },
  },

  // ── Tree-shake large packages ─────────────────────────────────────────
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // ── HTTP caching headers ─────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)\\.(svg|ico|png|woff2|json)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
