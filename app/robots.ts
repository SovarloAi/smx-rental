import type { MetadataRoute } from "next";

/** Robots-regels voor smxrental.com — staat crawlen toe en wijst naar de sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://smxrental.com/sitemap.xml",
    host: "https://smxrental.com",
  };
}
