import type { Metadata } from "next";
import ContractFormulier from "@/components/beheer/ContractFormulier";
import KopRegel from "@/components/beheer/KopRegel";

export const runtime = "edge";
export const metadata: Metadata = { title: "Nieuw contract" };

export default function NieuwContract() {
  return (
    <>
      <KopRegel eyebrow="Contracten" titel="Nieuw contract"
        sub="Vul in wat u met de klant heeft afgesproken. Het totaal rekent zich vanzelf uit." />
      <ContractFormulier />
    </>
  );
}
