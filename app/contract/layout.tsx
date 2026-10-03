import type { Metadata } from "next";

/** De contractpagina van de klant mag nooit in een zoekmachine belanden. */
export const metadata: Metadata = {
  title: "Uw huurovereenkomst · SMX Rental",
  robots: { index: false, follow: false, nocache: true },
};

export default function ContractLayout({ children }: { children: React.ReactNode }) {
  return children;
}
