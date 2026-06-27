import type { MetadataRoute } from "next";

/** Web App Manifest — voor "toevoegen aan beginscherm" (Android) + themakleur. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SMX Rental — Stretchtent verhuur",
    short_name: "SMX Rental",
    description:
      "Luxe stretchtent verhuur in Limburg. Stretchtent huren met op- en afbouw inbegrepen.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#CBB897",
    lang: "nl",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
