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
  title: "SMX Rental — Luxe stretchtent verhuur in Limburg",
  description:
    "Stretchtent 7,5 × 10 meter, op- en afbouw inbegrepen. Transparante prijzen, geen verrassingen. Werkgebied: Limburg, Brabant, Gelderland en grensregio's.",
  metadataBase: new URL("https://smxrental.com"),
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "SMX Rental — Uw feest. Onder onze tent.",
    description:
      "Luxe stretchtent verhuur uit Neer, Limburg. Bereken direct uw prijs.",
    type: "website",
    locale: "nl_NL",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#CBB897",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-white text-ink antialiased selection:bg-sand-200 selection:text-ink">
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
