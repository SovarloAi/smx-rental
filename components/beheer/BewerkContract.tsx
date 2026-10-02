"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFout } from "@/lib/contracten/client";
import type { Contract } from "@/lib/contracten/types";
import { Melding } from "./ui";
import ContractFormulier from "./ContractFormulier";

export default function BewerkContract({ id }: { id: string }) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    api.detail(id)
      .then((d) => {
        // Een ondertekend contract staat vast; terug naar de detailpagina.
        if (d.contract.status === "ondertekend" || d.contract.status === "goedgekeurd") {
          router.replace(`/beheer/contract/${id}`);
          return;
        }
        setContract(d.contract);
      })
      .catch((e) => setFout(e instanceof ApiFout ? e.message : "Kon dit contract niet laden."));
  }, [id, router]);

  if (fout) return <Melding toon="fout" titel="Er ging iets mis">{fout}</Melding>;
  if (!contract) return <p className="py-10 text-center text-ink/50">Bezig met laden…</p>;

  return (
    <>
      <h1 className="font-serif text-3xl font-light tracking-tight text-ink">Contract bewerken</h1>
      <p className="mb-6 mt-1.5 text-ink/60">
        Wijzigingen gelden meteen voor de link die de klant al heeft.
      </p>
      <ContractFormulier bestaand={contract} />
    </>
  );
}
