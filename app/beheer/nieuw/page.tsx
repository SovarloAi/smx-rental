import type { Metadata } from "next";
import ContractFormulier from "@/components/beheer/ContractFormulier";

export const runtime = "edge";
export const metadata: Metadata = { title: "Nieuw contract" };

export default function NieuwContract() {
  return (
    <>
      <h1 className="font-serif text-3xl font-light tracking-tight text-ink">Nieuw contract</h1>
      <p className="mb-6 mt-1.5 text-ink/60">
        Vul in wat u met de klant heeft afgesproken. Het totaal rekent zich vanzelf uit.
      </p>
      <ContractFormulier />
    </>
  );
}
