import type { MetadataRoute } from "next";

/**
 * Robots-regels voor smxrental.com. De publieke site mag gecrawld worden; de
 * contractmodule niet — die bevat persoonsgegevens en ondertekenlinks.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/beheer", "/beheer/", "/contract", "/contract/", "/api/"],
    },
    sitemap: "https://smxrental.com/sitemap.xml",
    host: "https://smxrental.com",
  };
}
