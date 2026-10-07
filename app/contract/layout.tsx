import type { Metadata } from "next";

/**
 * De contractpagina van de klant mag nooit in een zoekmachine belanden.
 *
 * De voorvertoning krijgt wel een eigen beeld en tekst. Zonder dit erfde de
 * link die de klant via WhatsApp binnenkrijgt de banner en de verkooptekst van
 * de homepage ("Bereken direct uw prijs"), terwijl er een contract achter zit.
 * De tekst blijft met opzet algemeen: in een voorvertoning hoort niets te
 * staan wat alleen voor deze klant bestemd is.
 */
export const metadata: Metadata = {
  title: "Uw huurovereenkomst · SMX Rental",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Uw huurovereenkomst · SMX Rental",
    description:
      "Open deze link om uw huurovereenkomst rustig door te lezen en digitaal te ondertekenen. Het duurt ongeveer vijf minuten.",
    siteName: "SMX Rental",
    type: "website",
    locale: "nl_NL",
    images: [
      {
        url: "/og-contract.jpg",
        width: 1200,
        height: 630,
        alt: "SMX Rental — uw huurovereenkomst",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Uw huurovereenkomst · SMX Rental",
    description:
      "Open deze link om uw huurovereenkomst door te lezen en digitaal te ondertekenen.",
    images: ["/og-contract.jpg"],
  },
};

export default function ContractLayout({ children }: { children: React.ReactNode }) {
  return children;
}
