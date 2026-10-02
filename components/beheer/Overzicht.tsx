"use client";

/** Overzicht van alle contracten, gesorteerd op feestdatum. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiFout } from "@/lib/contracten/client";
import { datumKort, euro, dagenTot } from "@/lib/contracten/formatteer";
import type { Contract } from "@/lib/contracten/types";
import { KnopLink, Melding, StatusLabel } from "./ui";

export default function Overzicht() {
  const [contracten, setContracten] = useState<Contract[] | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    api.lijst()
      .then((d) => setContracten(d.contracten))
      .catch((e) => setFout(e instanceof ApiFout ? e.message : "Kon de contracten niet laden."));
  }, []);

  const tellers = useMemo(() => {
    const c = contracten ?? [];
    return {
      keuren: c.filter((x) => x.status === "ondertekend").length,
      wacht: c.filter((x) => x.status === "verstuurd" || x.status === "geopend").length,
      concept: c.filter((x) => x.status === "concept").length,
      rond: c.filter((x) => x.status === "goedgekeurd").length,
    };
  }, [contracten]);

  const nieuwGetekend = (contracten ?? []).filter((c) => c.status === "ondertekend" && !c.gezien);

  if (fout) {
    return <Melding toon="fout" titel="Er ging iets mis">{fout}</Melding>;
  }

  if (!contracten) {
    return <p className="py-10 text-center text-ink/50">Bezig met laden…</p>;
  }

  return (
    <div className="space-y-5">
      {nieuwGetekend.map((c) => (
        <div key={c.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
          <p className="text-sm font-medium text-emerald-900">
            {c.klantNaam} heeft het contract ondertekend.
          </p>
          <KnopLink href={`/beheer/contract/${c.id}`} soort="primair">
            Bekijken en goedkeuren
          </KnopLink>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Teller label="Te keuren" waarde={tellers.keuren} nadruk={tellers.keuren > 0} />
        <Teller label="Wacht op handtekening" waarde={tellers.wacht} />
        <Teller label="Concept" waarde={tellers.concept} />
        <Teller label="Rond" waarde={tellers.rond} />
      </div>

      {contracten.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white px-6 py-12 text-center">
          <p className="font-medium text-ink">Er staan nog geen contracten.</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink/55">
            Maak er een aan zodra u met een klant rond bent over datum en prijs.
          </p>
          <div className="mt-5">
            <KnopLink href="/beheer/nieuw" soort="primair">Nieuw contract</KnopLink>
          </div>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {contracten.map((c) => <Kaart key={c.id} contract={c} />)}
        </ul>
      )}
    </div>
  );
}

function Teller({ label, waarde, nadruk }: { label: string; waarde: number; nadruk?: boolean }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${nadruk ? "border-emerald-200 bg-emerald-50" : "border-ink/10 bg-white"}`}>
      <p className={`font-serif text-2xl font-light ${nadruk ? "text-emerald-800" : "text-ink"}`}>{waarde}</p>
      <p className="text-xs leading-tight text-ink/55">{label}</p>
    </div>
  );
}

function Kaart({ contract: c }: { contract: Contract }) {
  const dagen = dagenTot(c.opbouwDatum);
  const binnenkort =
    dagen !== null && dagen >= 0 && dagen <= 14 &&
    (c.status === "verstuurd" || c.status === "geopend" || c.status === "concept");

  return (
    <li>
      <Link href={`/beheer/contract/${c.id}`}
        className="block rounded-2xl border border-ink/10 bg-white px-4 py-3.5 transition-colors hover:border-ink/25 hover:bg-sand-50/60">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{c.klantNaam || "Naamloos"}</p>
            <p className="truncate text-sm text-ink/55">
              {datumKort(c.feestDatum)}
              {c.klantPostcodePlaats && ` · ${c.klantPostcodePlaats}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-semibold tabular-nums text-ink/70">{euro(c.totaalCent)}</span>
            <StatusLabel status={c.status} opPapier={c.opPapier} />
          </div>
        </div>
        {binnenkort && (
          <p className="mt-2 text-xs font-medium text-amber-800">
            {dagen === 0 ? "Opbouw is vandaag" : dagen === 1 ? "Opbouw is morgen" : `Opbouw over ${dagen} dagen`}
            {" — nog niet ondertekend"}
          </p>
        )}
      </Link>
    </li>
  );
}
