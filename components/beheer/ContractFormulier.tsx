"use client";

/**
 * Formulier voor een nieuw contract én voor bewerken. Het totaal rekent mee
 * tijdens het invullen, maar is nadrukkelijk een voorbeeld: de server rekent
 * bij het opslaan opnieuw en dat bedrag telt.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TARIEVEN } from "@/lib/prijzen";
import { berekenOverzicht } from "@/lib/contracten/regels";
import { euro, schuifDatum } from "@/lib/contracten/formatteer";
import { api, ApiFout, type FormulierInvoer } from "@/lib/contracten/client";
import type { Contract } from "@/lib/contracten/types";
import { Blok, Knop, KnopLink, Melding, Veld, invoerKlasse } from "./ui";

const LEEG: FormulierInvoer = {
  klantNaam: "", klantAdres: "", klantPostcodePlaats: "", klantTelefoon: "",
  klantEmail: "", plaatsingsadres: "",
  feestDatum: "", opbouwDatum: "", opbouwTijd: "19:00", afbouwDatum: "", afbouwTijd: "11:00",
  extraDagen: 0, verlichting: false, zijwanden: 0, klinkers: false, shotjesbar: false,
  transportEuro: 0, afspraken: "",
};

function uitContract(c: Contract): FormulierInvoer {
  const { transportCent, ...rest } = c;
  return { ...LEEG, ...rest, transportEuro: transportCent / 100 };
}

export default function ContractFormulier({ bestaand }: { bestaand?: Contract }) {
  const router = useRouter();
  const [f, setF] = useState<FormulierInvoer>(bestaand ? uitContract(bestaand) : LEEG);
  const [fouten, setFouten] = useState<string[]>([]);
  const [bezig, setBezig] = useState<null | "concept" | "versturen">(null);

  const zet = <K extends keyof FormulierInvoer>(k: K, v: FormulierInvoer[K]) =>
    setF((o) => ({ ...o, [k]: v }));

  const overzicht = useMemo(
    () => berekenOverzicht({ ...f, transportCent: Math.round((f.transportEuro || 0) * 100) }),
    [f]
  );

  /** Feestdatum invullen zet op- en afbouw automatisch, maar overschrijft niets. */
  const kiesFeestdatum = (datum: string) => {
    setF((o) => ({
      ...o,
      feestDatum: datum,
      opbouwDatum: o.opbouwDatum || schuifDatum(datum, -1),
      afbouwDatum: o.afbouwDatum || schuifDatum(datum, 1 + (Number(o.extraDagen) || 0)),
    }));
  };

  /** Vult ontbrekende datums alsnog aan, zodat de server ze niet hoeft af te keuren. */
  const compleet = (): FormulierInvoer => ({
    ...f,
    opbouwDatum: f.opbouwDatum || schuifDatum(f.feestDatum, -1),
    afbouwDatum: f.afbouwDatum || schuifDatum(f.feestDatum, 1 + (Number(f.extraDagen) || 0)),
  });

  const opslaan = async (daarna: "concept" | "versturen") => {
    const lokaal: string[] = [];
    if (!f.klantNaam.trim()) lokaal.push("Vul de naam van de klant in.");
    if (!f.klantTelefoon.trim()) lokaal.push("Vul een telefoonnummer in — dat is nodig voor WhatsApp.");
    if (!f.feestDatum) lokaal.push("Vul de datum van het feest in.");
    if (lokaal.length) {
      setFouten(lokaal);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      return;
    }

    setFouten([]);
    setBezig(daarna);
    try {
      const invoer = compleet();
      const res = bestaand
        ? await api.wijzig(bestaand.id, invoer)
        : await api.maak(invoer);
      router.push(
        `/beheer/contract/${res.contract.id}${daarna === "versturen" ? "?versturen=1" : ""}`
      );
    } catch (e) {
      setFouten([e instanceof ApiFout ? e.message : "Er ging iets mis bij het opslaan."]);
      setBezig(null);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-5 pb-36">
      <Blok titel="Klant">
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld label="Naam">
            <input className={invoerKlasse} value={f.klantNaam}
              onChange={(e) => zet("klantNaam", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="Telefoon" hint="voor WhatsApp">
            <input className={invoerKlasse} type="tel" value={f.klantTelefoon}
              onChange={(e) => zet("klantTelefoon", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="Adres">
            <input className={invoerKlasse} value={f.klantAdres}
              onChange={(e) => zet("klantAdres", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="Postcode en plaats">
            <input className={invoerKlasse} value={f.klantPostcodePlaats}
              onChange={(e) => zet("klantPostcodePlaats", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="E-mail" hint="voor het definitieve contract">
            <input className={invoerKlasse} type="email" value={f.klantEmail}
              onChange={(e) => zet("klantEmail", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="Plaatsingsadres" hint="alleen als dit anders is">
            <input className={invoerKlasse} value={f.plaatsingsadres}
              onChange={(e) => zet("plaatsingsadres", e.target.value)} autoComplete="off" />
          </Veld>
        </div>
      </Blok>

      <Blok titel="Data en tijden">
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld label="Datum feest">
            <input className={invoerKlasse} type="date" value={f.feestDatum}
              onChange={(e) => kiesFeestdatum(e.target.value)} />
          </Veld>
          <div className="hidden sm:block" />
          <Veld label="Opbouw datum">
            <input className={invoerKlasse} type="date" value={f.opbouwDatum}
              onChange={(e) => zet("opbouwDatum", e.target.value)} />
          </Veld>
          <Veld label="Opbouw tijd">
            <input className={invoerKlasse} type="time" value={f.opbouwTijd}
              onChange={(e) => zet("opbouwTijd", e.target.value)} />
          </Veld>
          <Veld label="Afbouw datum">
            <input className={invoerKlasse} type="date" value={f.afbouwDatum}
              onChange={(e) => zet("afbouwDatum", e.target.value)} />
          </Veld>
          <Veld label="Afbouw tijd">
            <input className={invoerKlasse} type="time" value={f.afbouwTijd}
              onChange={(e) => zet("afbouwTijd", e.target.value)} />
          </Veld>
        </div>
        <p className="mt-3 text-sm text-ink/55">
          Vul eerst de feestdatum in: opbouw (dag ervoor) en afbouw (dag erna)
          worden dan vanzelf gezet. Daarna kunt u ze nog aanpassen.
        </p>
      </Blok>

      <Blok titel="Wat huurt de klant?">
        <div className="divide-y divide-ink/8">
          <Regel label="Stretchtent 7,5 × 10 m" bedrag={euro(TARIEVEN.tent)}>
            <span className="text-sm text-ink/45">altijd inbegrepen</span>
          </Regel>

          <Regel label="Extra huurdagen" hint={`${euro(TARIEVEN.extraDag)} per dag`}>
            <Aantal waarde={f.extraDagen} max={7}
              aan={(n) => setF((o) => ({
                ...o,
                extraDagen: n,
                // afbouw volgt het aantal extra dagen, zolang die afgeleid was
                afbouwDatum: o.feestDatum && o.afbouwDatum === schuifDatum(o.feestDatum, 1 + (Number(o.extraDagen) || 0))
                  ? schuifDatum(o.feestDatum, 1 + n)
                  : o.afbouwDatum,
              }))} />
          </Regel>

          <Regel label="Sfeerverlichting" hint={`${euro(TARIEVEN.verlichting)}, extra dagen gratis`}>
            <Schakelaar aan={f.verlichting} zet={(v) => zet("verlichting", v)} label="Sfeerverlichting" />
          </Regel>

          <Regel label="Zijwanden 10 m"
            hint={`${euro(TARIEVEN.zijwand)} per stuk, ${euro(TARIEVEN.zijwandExtraDag)} per extra dag, max. 2`}>
            <Aantal waarde={f.zijwanden} max={2} aan={(n) => zet("zijwanden", n)} />
          </Regel>

          <Regel label="Toeslag klinkers of bestrating" hint={euro(TARIEVEN.klinkers)}>
            <Schakelaar aan={f.klinkers} zet={(v) => zet("klinkers", v)} label="Toeslag klinkers" />
          </Regel>

          <Regel label="Shotjesbar" hint={`${euro(TARIEVEN.shotjesbar)} per weekend`}>
            <Schakelaar aan={f.shotjesbar} zet={(v) => zet("shotjesbar", v)} label="Shotjesbar" />
          </Regel>

          <Regel label="Transportkosten" hint="bedrag uit de calculator op de site">
            <div className="flex items-center gap-2">
              <span className="text-ink/50">€</span>
              <input type="number" min={0} step={1} inputMode="numeric"
                className={`${invoerKlasse} w-28 text-right`}
                value={f.transportEuro}
                onChange={(e) => zet("transportEuro", Math.max(0, Number(e.target.value) || 0))} />
            </div>
          </Regel>
        </div>
      </Blok>

      <Blok titel="Bijzondere afspraken">
        <p className="mb-2 text-sm text-ink/55">
          Bijvoorbeeld plaatsing op klinkers of afwijkende tijden. Laat leeg als
          er niets bijzonders is — dit komt letterlijk in het contract.
        </p>
        <textarea rows={3} className={invoerKlasse} value={f.afspraken}
          onChange={(e) => zet("afspraken", e.target.value)} />
      </Blok>

      {fouten.length > 0 && (
        <Melding toon="fout" titel="Nog even dit:">
          <ul className="list-disc space-y-0.5 pl-5">
            {fouten.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Melding>
      )}

      {/* Totaalbalk blijft onderin staan */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <span className="text-sm text-ink/55">Totaal</span>{" "}
            <span className="font-serif text-2xl font-light tracking-tight text-ink">
              {euro(overzicht.totaalCent)}
            </span>
            <span className="ml-2 text-xs text-ink/45">geen btw, KOR</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <KnopLink href={bestaand ? `/beheer/contract/${bestaand.id}` : "/beheer"} soort="stil">
              Annuleren
            </KnopLink>
            <Knop soort="rand" bezig={bezig === "concept"} disabled={bezig !== null}
              onClick={() => opslaan("concept")}>
              Opslaan
            </Knop>
            <Knop bezig={bezig === "versturen"} disabled={bezig !== null}
              onClick={() => opslaan("versturen")}>
              Opslaan en versturen
            </Knop>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Regel({
  label, hint, bedrag, children,
}: { label: string; hint?: string; bedrag?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-ink">{label}</p>
        {hint && <p className="text-sm text-ink/50">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {bedrag && <span className="text-sm font-semibold text-ink/70">{bedrag}</span>}
        {children}
      </div>
    </div>
  );
}

function Aantal({ waarde, max, aan }: { waarde: number; max: number; aan: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <StapKnop label="Eén minder" uit={waarde <= 0} aan={() => aan(Math.max(0, waarde - 1))}>−</StapKnop>
      <span className="w-7 text-center text-base font-semibold tabular-nums">{waarde}</span>
      <StapKnop label="Eén meer" uit={waarde >= max} aan={() => aan(Math.min(max, waarde + 1))}>+</StapKnop>
    </div>
  );
}

function StapKnop({
  children, aan, uit, label,
}: { children: React.ReactNode; aan: () => void; uit: boolean; label: string }) {
  return (
    <button type="button" onClick={aan} disabled={uit} aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white text-xl text-ink transition-colors hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-30">
      {children}
    </button>
  );
}

function Schakelaar({ aan, zet, label }: { aan: boolean; zet: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={aan} aria-label={label}
      onClick={() => zet(!aan)}
      className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${aan ? "bg-ink" : "bg-ink/15"}`}>
      <span className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${aan ? "translate-x-5" : ""}`} />
    </button>
  );
}
