"use client";

/** Het afgeronde contract: bekijken en als PDF bewaren. */

import { useEffect, useState } from "react";
import Image from "next/image";
import { datumLang, voornaam } from "@/lib/contracten/formatteer";
import { productOmschrijving } from "@/lib/contracten/producten";
import { VERHUURDER } from "@/lib/contracten/voorwaarden";
import type { Artikel } from "@/lib/contracten/voorwaarden";
import type { KlantContract } from "@/lib/contracten/types";
import HuurInHetKort from "./HuurInHetKort";
import Voorwaarden from "./Voorwaarden";

type Gegevens = {
  contract: KlantContract;
  voorwaarden: { versie: string; artikelen: Artikel[]; checks: string[] };
};

export default function DefinitiefContract({ token }: { token: string }) {
  const [data, setData] = useState<Gegevens | null>(null);
  const [fout, setFout] = useState(false);

  useEffect(() => {
    fetch(`/api/contract/${token}`)
      .then(async (r) => { if (!r.ok) throw new Error(); return (await r.json()) as Gegevens; })
      .then(setData)
      .catch(() => setFout(true));
  }, [token]);

  return (
    <div className="min-h-[100svh] bg-white">
      <header className="border-b border-ink/10 bg-[#CBB897]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3.5">
          <Image src="/smx-logo-transparant.png" alt="" width={311} height={308} priority className="h-11 w-auto" />
          <span className="text-[17px] font-medium tracking-tight text-ink/70">
            Stretchtent verhuur · Neer
          </span>
        </div>
      </header>

      <main className="klant-body mx-auto max-w-2xl px-5 py-8 sm:py-12">
        {fout && (
          <>
            <h1 className="font-serif text-[34px] font-light leading-tight tracking-tightest text-ink">
              Dit contract is niet gevonden
            </h1>
            <p className="klant-lead mt-4">
              Controleer of u de volledige link heeft geopend. Lukt het niet, bel dan even met Sjors.
            </p>
            <p className="mt-7">
              <a href="tel:+31620651528" className="btn-klant-rand">Bel {VERHUURDER.telefoon}</a>
            </p>
          </>
        )}

        {!fout && !data && <p className="py-16 text-center text-ink/55">Bezig met laden…</p>}

        {data && data.contract.status !== "goedgekeurd" && (
          <>
            <h1 className="font-serif text-[34px] font-light leading-tight tracking-tightest text-ink">
              Het contract is nog niet definitief
            </h1>
            <p className="klant-lead mt-4">
              Sjors kijkt uw ondertekende contract na. U krijgt bericht zodra het
              door ons beiden is ondertekend.
            </p>
          </>
        )}

        {data && data.contract.status === "goedgekeurd" && (
          <>
            <h1 className="font-serif text-[34px] font-light leading-tight tracking-tightest text-ink">
              Uw huurovereenkomst
            </h1>
            <p className="klant-lead mt-4">
              Goedendag {voornaam(data.contract.klantNaam)}, hieronder staat de
              overeenkomst voor {productOmschrijving(data.contract)} op{" "}
              {datumLang(data.contract.feestDatum)}. Hij is door ons beiden ondertekend.
            </p>

            <p className="mt-7">
              <a href={`/api/contract/${token}/bestand`} target="_blank" rel="noopener noreferrer"
                className="btn-klant">
                Contract als PDF openen
              </a>
            </p>

            <section className="mt-12">
              <h2 className="klant-h2">Uw huur in het kort</h2>
              <div className="mt-4"><HuurInHetKort contract={data.contract} /></div>
            </section>

            <section className="mt-10">
              <h2 className="klant-h2">Huurvoorwaarden</h2>
              <div className="mt-4"><Voorwaarden artikelen={data.voorwaarden.artikelen} /></div>
            </section>

            <section className="mt-10">
              <h2 className="klant-h2">Ondertekening</h2>
              <div className="mt-4 rounded-2xl border border-ink/15 bg-sand-50 p-5 text-[18px] leading-relaxed sm:p-7">
                <p>
                  <strong>Huurder:</strong>{" "}
                  {data.contract.opPapier
                    ? "op papier ondertekend"
                    : `${data.contract.signerNaam ?? ""}${data.contract.signerPlaats ? `, ${data.contract.signerPlaats}` : ""}` +
                      (data.contract.signedAt
                        ? ` — ${new Date(data.contract.signedAt).toLocaleDateString("nl-NL")}`
                        : "")}
                </p>
                <p className="mt-2">
                  <strong>Verhuurder:</strong> {VERHUURDER.ondertekenaar}, {VERHUURDER.plaats}
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-2xl px-5 pb-12 text-[16px] leading-relaxed text-ink/55">
        {VERHUURDER.naam} · {VERHUURDER.adres}, {VERHUURDER.postcodePlaats} ·{" "}
        {VERHUURDER.telefoon} · {VERHUURDER.email} · KvK {VERHUURDER.kvk}
      </footer>
    </div>
  );
}
