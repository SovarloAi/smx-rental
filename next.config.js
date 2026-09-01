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

module.exports = nextConfig;
