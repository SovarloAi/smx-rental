"use client";

/** Overzicht van alle contracten, gesorteerd op feestdatum. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiFout } from "@/lib/contracten/client";
import { datumKort, euro, dagenTot } from "@/lib/contracten/formatteer";
import type { Contract } from "@/lib/contracten/types";
import { KnopLink, Melding, StatusLabel } from "./ui";
import KopRegel from "./KopRegel";

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
      <KopRegel eyebrow="Beheer" titel="Contracten"
        sub="Gesorteerd op feestdatum. Tik op een contract om het te openen." />

      {nieuwGetekend.map((c) => (
        <div key={c.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm shadow-sand-600/5">
          <p className="text-[15px] font-medium text-emerald-900">
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
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white px-6 py-14 text-center">
          <p className="font-serif text-2xl font-light tracking-tightest text-ink">Er staan nog geen contracten.</p>
          <p className="mx-auto mt-2 max-w-sm text-ink/55">
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
    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm shadow-sand-600/5 ${
      nadruk ? "border-emerald-200 bg-emerald-50" : "border-ink/8 bg-white"
    }`}>
      <p className={`font-serif text-3xl font-light tracking-tightest ${nadruk ? "text-emerald-800" : "text-ink"}`}>
        {waarde}
      </p>
      <p className="mt-0.5 text-xs leading-tight text-ink/55">{label}</p>
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
        className="block rounded-2xl border border-ink/8 bg-white px-5 py-4 shadow-sm shadow-sand-600/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-sand-300 hover:shadow-lg hover:shadow-sand-600/10">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-ink">{c.klantNaam || "Naamloos"}</p>
            <p className="truncate text-sm text-ink/55">
              {datumKort(c.feestDatum)}
              {c.klantPostcodePlaats && ` · ${c.klantPostcodePlaats}`}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink/45">
              {[c.tent && "Stretchtent", c.shotjesbar && "Shotjesbar"].filter(Boolean).join(" + ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-semibold tabular-nums text-ink/70">{euro(c.totaalCent)}</span>
            <StatusLabel status={c.status} opPapier={c.opPapier} />
          </div>
        </div>
        {binnenkort && (
          <p className="mt-2 text-xs font-semibold text-sand-600">
            {dagen === 0 ? "Opbouw is vandaag" : dagen === 1 ? "Opbouw is morgen" : `Opbouw over ${dagen} dagen`}
            {" — nog niet ondertekend"}
          </p>
        )}
      </Link>
    </li>
  );
}
