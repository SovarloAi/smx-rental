"use client";

/**
 * De pagina die de klant via zijn eigen link opent: lezen, controleren en
 * ondertekenen. Bewust sober en groot opgezet — veel van onze klanten zijn
 * ouder en weinig digitaal. Geen account, geen wachtwoord, geen code.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { naamMetHoofdletters, voornaam } from "@/lib/contracten/formatteer";
import { productOmschrijving } from "@/lib/contracten/producten";
import { VERHUURDER } from "@/lib/contracten/voorwaarden";
import type { Artikel } from "@/lib/contracten/voorwaarden";
import type { KlantContract } from "@/lib/contracten/types";
import Handtekeningvak, { type HandtekeningHandle } from "./Handtekeningvak";
import HuurInHetKort from "./HuurInHetKort";
import VoorwaardenUitklapbaar from "./VoorwaardenUitklapbaar";

type Gegevens = {
  contract: KlantContract;
  voorwaarden: { versie: string; artikelen: Artikel[]; checks: string[] };
};

/** Een melding onder het formulier: of er ontbreekt iets, of het versturen ging mis. */
type Melding = {
  soort: "invoer" | "versturen";
  regels: string[];
  /** Bij een verouderd contract verversen we zelf; dan geen knop "Opnieuw proberen". */
  wachtOpVerversen?: boolean;
};

export default function KlantPagina({ token }: { token: string }) {
  const [data, setData] = useState<Gegevens | null>(null);
  const [laadfout, setLaadfout] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/contract/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()) as Gegevens;
      })
      .then(setData)
      .catch(() => setLaadfout("niet-gevonden"));
  }, [token]);

  if (laadfout) return <Omhulsel><NietGevonden /></Omhulsel>;
  if (!data) return <Omhulsel><p className="klant-body py-16 text-center text-ink/55">Bezig met laden…</p></Omhulsel>;

  const { contract } = data;

  if (contract.status === "concept") {
    return (
      <Omhulsel>
        <h1 className="font-serif text-[34px] font-light leading-tight tracking-tightest text-ink">
          Dit contract is nog niet verstuurd
        </h1>
        <p className="klant-lead mt-4">
          Wij maken uw huurovereenkomst nog klaar. U krijgt bericht zodra hij
          klaarstaat.
        </p>
      </Omhulsel>
    );
  }

  if (contract.status === "ondertekend" || contract.status === "goedgekeurd") {
    return <Omhulsel><Bedankt contract={contract} /></Omhulsel>;
  }

  return <Omhulsel><Ondertekenen token={token} gegevens={data} /></Omhulsel>;
}

/* ------------------------------------------------------------------ */

function Omhulsel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-white">
      <header className="border-b border-ink/10 bg-[#CBB897]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3.5">
          <Image src="/smx-logo-transparant.png" alt="" width={311} height={308}
            priority className="h-11 w-auto" />
          <span className="sr-only">SMX Rental</span>
          <span className="text-[17px] font-medium tracking-tight text-ink/70">
            Stretchtent verhuur · Neer
          </span>
        </div>
      </header>
      <main className="klant-body mx-auto max-w-2xl px-5 py-8 sm:py-12">{children}</main>
      <footer className="mx-auto max-w-2xl px-5 pb-12 text-[16px] leading-relaxed text-ink/55">
        {VERHUURDER.naam} · {VERHUURDER.adres}, {VERHUURDER.postcodePlaats} ·{" "}
        {VERHUURDER.telefoon} · {VERHUURDER.email} · KvK {VERHUURDER.kvk}
      </footer>
    </div>
  );
}

function NietGevonden() {
  return (
    <>
      <h1 className="font-serif text-[34px] font-light leading-tight tracking-tightest text-ink">
        Dit contract is niet gevonden
      </h1>
      <p className="klant-lead mt-4">
        Controleer of u de volledige link heeft geopend. Lukt het niet, bel dan
        even met Sjors.
      </p>
      <p className="mt-7">
        <a href="tel:+31620651528" className="btn-klant-rand">Bel {VERHUURDER.telefoon}</a>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Ondertekenen({ token, gegevens }: { token: string; gegevens: Gegevens }) {
  const { contract, voorwaarden } = gegevens;
  const pad = useRef<HandtekeningHandle>(null);
  const foutRef = useRef<HTMLDivElement>(null);

  const [telefoon, setTelefoon] = useState(contract.klantTelefoon);
  const [email, setEmail] = useState(contract.klantEmail);
  const [naam, setNaam] = useState(naamMetHoofdletters(contract.klantNaam));
  const [plaats, setPlaats] = useState(
    (contract.adres.match(/\d{4}\s?[A-Za-z]{2}\s+(.+)$/)?.[1] ?? "").trim()
  );
  const [akkoord, setAkkoord] = useState<boolean[]>(voorwaarden.checks.map(() => false));
  const [heeftHandtekening, setHeeftHandtekening] = useState(false);
  // Twee soorten meldingen, want ze vragen iets anders van de klant. "invoer"
  // betekent: er ontbreekt nog iets op het formulier. "versturen" betekent:
  // alles was ingevuld, maar het wegsturen lukte niet — dan helpt alleen het
  // nog eens proberen.
  const [melding, setMelding] = useState<Melding | null>(null);
  const [bezig, setBezig] = useState(false);
  const [klaar, setKlaar] = useState<KlantContract | null>(null);

  useEffect(() => {
    if (melding) foutRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [melding]);

  // Zodra de klant iets aanpast, halen we de invoermelding weg. Anders blijft
  // er rood op het scherm staan over dingen die net zijn ingevuld. Een
  // verzendfout blijft wél staan: daar verandert het invullen niets aan.
  useEffect(() => {
    setMelding((m) => (m?.soort === "invoer" ? null : m));
  }, [akkoord, naam, plaats, heeftHandtekening]);

  // Na het versturen vervangt de bevestiging het formulier. De klant staat dan
  // onderaan de pagina, dus zonder deze sprong zou hij de bevestiging niet
  // zien en denken dat er niets gebeurd is.
  useEffect(() => {
    if (klaar) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [klaar]);

  if (klaar) return <Bedankt contract={klaar} />;

  const versturen = async () => {
    const mist: string[] = [];
    voorwaarden.checks.forEach((t, i) => { if (!akkoord[i]) mist.push(`Vink aan: ${t}`); });
    if (!naam.trim()) mist.push("Vul uw volledige naam in.");
    if (!plaats.trim()) mist.push("Vul de plaats in.");
    if (pad.current?.leeg() !== false) mist.push("Zet uw handtekening in het vak.");
    if (mist.length) { setMelding({ soort: "invoer", regels: mist }); return; }

    setMelding(null);
    setBezig(true);
    try {
      const res = await fetch(`/api/contract/${token}/ondertekenen`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          naam: naam.trim(), plaats: plaats.trim(),
          telefoon: telefoon.trim(), email: email.trim(),
          handtekeningPng: pad.current?.dataUrl(), akkoord,
          versie: contract.versie,
        }),
      });
      const antwoord = (await res.json().catch(() => null)) as
        | { ok?: boolean; fout?: string; fouten?: string[]; verouderd?: boolean } | null;

      // Het contract is tussendoor gewijzigd: opnieuw laden, zodat de klant de
      // actuele gegevens ziet voordat hij tekent.
      if (res.status === 409 && antwoord?.verouderd) {
        setMelding({
          soort: "versturen",
          regels: [antwoord.fout ?? "Dit contract is zojuist aangepast."],
          wachtOpVerversen: true,
        });
        setBezig(false);
        setTimeout(() => window.location.reload(), 2500);
        return;
      }

      if (!res.ok) {
        // Een lijstje met ontbrekende velden hoort bij het formulier; al het
        // andere is iets wat aan onze kant misging.
        setMelding(
          antwoord?.fouten
            ? { soort: "invoer", regels: antwoord.fouten }
            : {
                soort: "versturen",
                regels: [
                  antwoord?.fout ??
                    "Het versturen lukte niet. Dat ligt niet aan u — probeer het nog een keer.",
                ],
              }
        );
        setBezig(false);
        return;
      }
      setKlaar({
        ...contract,
        status: "ondertekend",
        signerNaam: naam.trim(),
        // De klant kan zijn e-mailadres net hebben gecorrigeerd; de bevestiging
        // moet het adres noemen waar de PDF straks echt heen gaat.
        klantEmail: email.trim(),
        signedAt: new Date().toISOString(),
      });
    } catch {
      setMelding({
        soort: "versturen",
        regels: ["Er is even geen verbinding. Controleer uw internet en probeer het opnieuw."],
      });
      setBezig(false);
    }
  };

  return (
    <>
      <h1 className="font-serif text-[34px] font-light leading-tight tracking-tightest text-ink sm:text-[40px]">
        Goedendag {voornaam(contract.klantNaam)},
      </h1>
      <p className="klant-lead mt-4">
        Hieronder staat uw huurovereenkomst voor {productOmschrijving(contract)}.
        Leest u alles rustig door en zet onderaan uw handtekening.
      </p>

      <section className="mt-10">
        <h2 className="klant-h2">Uw huur in het kort</h2>
        <div className="mt-4"><HuurInHetKort contract={contract} /></div>
      </section>

      <section className="mt-10">
        <h2 className="klant-h2">Uw gegevens</h2>
        <p className="mt-2 text-ink/70">Klopt dit nog?</p>
        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="mb-2 block font-semibold text-ink">Telefoonnummer</span>
            <input className="klant-input" type="tel" inputMode="tel" value={telefoon}
              onChange={(e) => setTelefoon(e.target.value)} autoComplete="tel" />
          </label>
          <label className="block">
            <span className="mb-2 block font-semibold text-ink">
              E-mailadres{" "}
              <span className="font-normal text-ink/55">hierop ontvangt u het contract</span>
            </span>
            <input className="klant-input" type="email" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="klant-h2">Ondertekenen</h2>

        <p className="mt-3 text-ink/70">
          Bij deze huur horen onze algemene voorwaarden. U kunt ze hieronder
          openen en rustig doorlezen.
        </p>
        <div className="mt-3">
          <VoorwaardenUitklapbaar artikelen={voorwaarden.artikelen} />
        </div>

        <div className="mt-5 space-y-3">
          {voorwaarden.checks.map((tekst, i) => (
            <label key={i}
              className={`flex min-h-[56px] cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-colors ${
                akkoord[i] ? "border-ink bg-sand-50" : "border-ink/20 bg-white hover:border-ink/40"
              }`}>
              <input type="checkbox" checked={akkoord[i]}
                onChange={(e) => setAkkoord((a) => a.map((v, j) => (j === i ? e.target.checked : v)))}
                className="mt-0.5 h-7 w-7 flex-none cursor-pointer accent-[#0A0A0A]" />
              <span className="text-[18px] leading-relaxed text-ink">{tekst}</span>
            </label>
          ))}
        </div>

        <div className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block font-semibold text-ink">Uw volledige naam</span>
            <input className="klant-input" value={naam} onChange={(e) => setNaam(e.target.value)}
              autoComplete="name" />
          </label>
          <label className="block">
            <span className="mb-2 block font-semibold text-ink">Plaats</span>
            <input className="klant-input" value={plaats} onChange={(e) => setPlaats(e.target.value)}
              autoComplete="address-level2" />
          </label>
        </div>

        <p className="mb-3 mt-7 font-semibold text-ink">
          Zet hieronder uw handtekening
        </p>
        <Handtekeningvak ref={pad} onVerandering={setHeeftHandtekening} />

        <div ref={foutRef} className="scroll-mt-10">
          {melding?.soort === "invoer" && (
            <div role="alert" className="mt-7 rounded-xl border-2 border-red-300 bg-red-50 p-5">
              <p className="text-[19px] font-semibold text-red-900">Nog niet alles is ingevuld:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6 text-[18px] leading-relaxed text-red-900">
                {melding.regels.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          {melding?.soort === "versturen" && (
            <div role="alert" className="mt-7 rounded-xl border-2 border-red-300 bg-red-50 p-5">
              <p className="text-[19px] font-semibold text-red-900">Het versturen is niet gelukt</p>
              {melding.regels.map((f) => (
                <p key={f} className="mt-2 text-[18px] leading-relaxed text-red-900">{f}</p>
              ))}
              <p className="mt-3 text-[17px] leading-relaxed text-red-900/85">
                Alles wat u heeft ingevuld staat er nog, ook uw handtekening.
              </p>
              {!melding.wachtOpVerversen && (
                <p className="mt-4">
                  <button type="button" onClick={versturen} disabled={bezig} className="btn-klant-rand">
                    Opnieuw proberen
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8">
          <button type="button" onClick={versturen} disabled={bezig} className="btn-klant">
            {bezig ? "Bezig met versturen…" : "Contract ondertekenen"}
          </button>
        </div>

        <p className="mt-5 text-center text-[17px] text-ink/60">
          Vragen? Bel Sjors op{" "}
          <a href="tel:+31620651528" className="font-semibold text-ink underline underline-offset-4">
            {VERHUURDER.telefoon}
          </a>
        </p>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Bedankt({ contract }: { contract: KlantContract }) {
  const af = contract.status === "goedgekeurd";
  const email = contract.klantEmail?.trim();

  // De stappen hieronder beschrijven wat er na het ondertekenen echt gebeurt:
  // Sjors krijgt een melding, keurt het contract goed, en pas dán wordt de
  // PDF gemaakt en gemaild (zie app/api/beheer/contracten/[id]/goedkeuren).
  const stappen = [
    "Sjors krijgt direct bericht en kijkt uw overeenkomst na.",
    "Hij zet er zijn eigen handtekening onder.",
    email
      ? `U ontvangt de volledige overeenkomst daarna als PDF per e-mail op ${email}.`
      : "Daarna neemt Sjors contact met u op om u de overeenkomst toe te sturen.",
  ];

  return (
    <>
      <div className="text-center">
        <svg viewBox="0 0 84 84" aria-hidden className="mx-auto h-24 w-24">
          <circle cx="42" cy="42" r="40" fill="none" stroke="#2E6A4D" strokeWidth="4" />
          <path d="M25 43l11 11 23-25" fill="none" stroke="#2E6A4D" strokeWidth="5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="mt-6 font-serif text-[34px] font-light leading-tight tracking-tightest text-ink sm:text-[40px]">
          {af ? "Uw contract is definitief" : "Uw contract is ontvangen"}
        </h1>
        <p className="klant-lead mx-auto mt-4 max-w-lg">
          {af
            ? "Uw huurovereenkomst is door ons beiden ondertekend."
            : `Dank u wel${
                voornaam(contract.signerNaam || contract.klantNaam)
                  ? `, ${voornaam(contract.signerNaam || contract.klantNaam)}`
                  : ""
              }. Wij hebben uw ondertekende huurovereenkomst goed ontvangen.`}
        </p>
      </div>

      {!af && (
        <section className="mt-9 rounded-2xl border border-ink/15 bg-sand-50 p-5 sm:p-7">
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">
            Wat gebeurt er nu?
          </h2>
          <ol className="mt-4 space-y-4">
            {stappen.map((stap, i) => (
              <li key={stap} className="flex gap-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink text-[17px] font-semibold text-white">
                  {i + 1}
                </span>
                <span className="pt-1 text-[18px] leading-relaxed text-ink/85">{stap}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[18px] leading-relaxed text-ink">
            U hoeft verder niets te doen.
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="klant-h2">Uw huur in het kort</h2>
        <div className="mt-4"><HuurInHetKort contract={contract} /></div>
      </section>

      <p className="mt-9 text-center text-[17px] text-ink/60">
        Vragen? Bel Sjors op{" "}
        <a href="tel:+31620651528" className="font-semibold text-ink underline underline-offset-4">
          {VERHUURDER.telefoon}
        </a>
      </p>
    </>
  );
}
