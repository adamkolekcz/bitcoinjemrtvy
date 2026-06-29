import type { NextConfig } from "next";
import redirectsData from "./src/data/redirects.json";

const isDev = process.env.NODE_ENV === "development";
// React v dev módu potřebuje eval() pro HMR/debugging — v produkci nikdy.
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`;
// Společné CSP direktivy bez frame-ancestors (ta se liší podle routy).
const baseCsp = `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://va.vercel-scripts.com; form-action 'self'; base-uri 'self'; object-src 'none';`;
// Hlavní web: nikdo nesmí framovat (anti-clickjacking).
const strictCsp = `${baseCsp} frame-ancestors 'none';`;
// Embed widgety: framovat smí kdokoliv — to je smysl embedu.
const embedCsp = `${baseCsp} frame-ancestors *;`;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["recharts"],
  },
  async redirects() {
    return redirectsData;
  },
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];
    return [
      {
        // Vše kromě embed widgetů: přísné hlavičky, web nelze framovat.
        source: "/((?!embed/counter|embed/stats).*)",
        headers: [
          ...common,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: strictCsp },
        ],
      },
      {
        // Embed widgety musí jít vložit přes <iframe> na cizí weby → bez X-Frame-Options.
        source: "/embed/:widget(counter|stats)",
        headers: [
          ...common,
          { key: "Content-Security-Policy", value: embedCsp },
        ],
      },
    ];
  },
};

export default nextConfig;
