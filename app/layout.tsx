import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smxrental.com"),
  title: {
    default: "SMX Rental — Stretchtent verhuur in Limburg | Stretchtent huren",
    template: "%s | SMX Rental",
  },
  description:
    "SMX Rental verhuurt luxe stretchtenten in Limburg. Stretchtent van 7,5 × 10 meter voor 70–100 gasten, op- en afbouw inbegrepen, transparante prijzen. Stretchtent huren in Neer en omgeving — bereken direct uw prijs.",
  keywords: [
    "smxrental",
    "smx rental",
    "stretchtent verhuur Limburg",
    "stretchtent huren",
    "stretchtent verhuur",
    "stretchtent huren Limburg",
    "tent huren feest",
    "feesttent huren Limburg",
    "stretchtent Neer",
    "partytent verhuur Limburg",
  ],
  applicationName: "SMX Rental",
  authors: [{ name: "SMX Rental" }],
  creator: "SMX Rental",
  publisher: "SMX Rental",
  category: "Tentverhuur",
  alternates: {
    canonical: "/",
  },
  // Statische icons uit /public (Edge-/Cloudflare-veilig — geen runtime-route).
  // favicon.ico blijft in app/ en wordt automatisch geserveerd.
  icons: {
    icon: { url: "/icon.png", type: "image/png", sizes: "512x512" },
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "SMX Rental — Stretchtent verhuur in Limburg",
    description:
      "Luxe stretchtent huren in Limburg: 7,5 × 10 meter, op- en afbouw inbegrepen, vaste prijzen. Bereken direct uw prijs bij SMX Rental.",
    url: "https://smxrental.com",
    siteName: "SMX Rental",
    type: "website",
    locale: "nl_NL",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "SMX Rental — stretchtent verhuur in Limburg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SMX Rental — Stretchtent verhuur in Limburg",
    description:
      "Luxe stretchtent huren in Limburg: 7,5 × 10 meter, op- en afbouw inbegrepen, vaste prijzen.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#CBB897",
};

/** Structured data (JSON-LD) — helpt Google SMX Rental als lokaal
 *  verhuurbedrijf te begrijpen (rich results, lokale vindbaarheid). */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://smxrental.com/#business",
  name: "SMX Rental",
  description:
    "Luxe stretchtent verhuur uit Neer, Limburg. Stretchtent van 7,5 × 10 meter voor 70–100 gasten, op- en afbouw inbegrepen.",
  url: "https://smxrental.com",
  logo: "https://smxrental.com/icon.png",
  image: "https://smxrental.com/og.png",
  telephone: "+31620651528",
  email: "smxrental@gmail.com",
  priceRange: "€€",
  currenciesAccepted: "EUR",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Engelmanstraat 23",
    addressLocality: "Neer",
    addressRegion: "Limburg",
    postalCode: "6086",
    addressCountry: "NL",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 51.2717,
    longitude: 5.9836,
  },
  areaServed: [
    { "@type": "AdministrativeArea", name: "Limburg" },
    { "@type": "AdministrativeArea", name: "Noord-Brabant" },
    { "@type": "AdministrativeArea", name: "Gelderland" },
  ],
  identifier: {
    "@type": "PropertyValue",
    name: "KvK",
    value: "99015951",
  },
  makesOffer: {
    "@type": "Offer",
    priceCurrency: "EUR",
    price: "550",
    itemOffered: {
      "@type": "Service",
      name: "Stretchtent verhuur (7,5 × 10 meter)",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-white text-ink antialiased selection:bg-sand-200 selection:text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
