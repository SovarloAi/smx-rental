import type { MetadataRoute } from "next";

const BASE_URL = "https://smxrental.com";

/** Sitemap voor smxrental.com (one-page site met ankersecties). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/#over-ons`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/#configurator`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/#shotjesbar`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/#reviews`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
