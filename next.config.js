/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Cloudflare Pages draait de Next.js image-optimizer niet: elke
    // /_next/image?...&w=640 gaf gewoon het volledige origineel terug. Daardoor
    // haalde een iPad megabytes aan foto's binnen (Safari staakt dan het laden).
    // De bestanden in /public/images zijn nu zelf al op webformaat gezet, dus we
    // serveren ze rechtstreeks — één URL per foto, netjes cachebaar.
    unoptimized: true,
  },
};

// Tijdens `next dev` de Cloudflare-bindings (D1 en R2) beschikbaar maken via
// miniflare, op basis van wrangler.dev.toml. Draait nooit in een productiebuild.
if (process.env.NODE_ENV === "development") {
  const { setupDevPlatform } = require("@cloudflare/next-on-pages/next-dev");
  setupDevPlatform({ configPath: "wrangler.dev.toml" }).catch((err) => {
    console.warn(
      "[contracten] Lokale Cloudflare-bindings niet geladen:",
      err?.message ?? err
    );
  });
}

module.exports = nextConfig;
