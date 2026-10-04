"use client";

/**
 * Formulier voor een nieuw contract én voor bewerken.
 *
 * Het totaal rekent mee tijdens het invullen, maar is nadrukkelijk een
 * voorbeeld: de server rekent bij het opslaan opnieuw en dat bedrag telt.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TARIEVEN } from "@/lib/prijzen";
import { berekenOverzicht } from "@/lib/contracten/regels";
import { transportVoorProducten, type TransportResult } from "@/lib/transport";
import { euro, schuifDatum, dagenTot } from "@/lib/contracten/formatteer";
import { api, ApiFout, type FormulierInvoer } from "@/lib/contracten/client";
import type { Contract } from "@/lib/contracten/types";
import { Blok, Knop, KnopLink, Melding, StatusLabel, Veld, invoerKlasse } from "./ui";
import ScreenshotUitlezen, { type UitgelezenVelden } from "./ScreenshotUitlezen";

const LEEG: FormulierInvoer = {
  klantNaam: "", klantAdres: "", klantPostcodePlaats: "", klantTelefoon: "",
  klantEmail: "", plaatsingsadres: "",
  feestDatum: "", opbouwDatum: "", opbouwTijd: "19:00", afbouwDatum: "", afbouwTijd: "11:00",
  tent: true, shotjesbar: false, extraDagen: 0, verlichting: false,
  zijwanden: 0, zijwandExtraDagen: 0, klinkers: false,
  transportEuro: 0, afspraken: "",
};

function uitContract(c: Contract): FormulierInvoer {
  const { transportCent, ...rest } = c;
  return { ...LEEG, ...rest, transportEuro: transportCent / 100 };
}

export default function ContractFormulier({ bestaand }: { bestaand?: Contract }) {
  const router = useRouter();
  const [f, setF] = useState<FormulierInvoer>(bestaand ? uitContract(bestaand) : LEEG);
  const [auto, setAuto] = useState<Set<string>>(new Set());
  const [fouten, setFouten] = useState<string[]>([]);
  const foutRef = useRef<HTMLDivElement>(null);
  const [bezig, setBezig] = useState<null | "concept" | "versturen">(null);

  const zet = <K extends keyof FormulierInvoer>(k: K, v: FormulierInvoer[K]) =>
    setF((o) => ({ ...o, [k]: v }));

  /** Handmatig wijzigen haalt het "automatisch ingevuld"-label weg. */
  const zetHandmatig = <K extends keyof FormulierInvoer>(k: K, v: FormulierInvoer[K]) => {
    zet(k, v);
    setAuto((s) => { if (!s.has(k as string)) return s; const n = new Set(s); n.delete(k as string); return n; });
  };

  const overzicht = useMemo(
    () => berekenOverzicht({ ...f, transportCent: Math.round((f.transportEuro || 0) * 100) }),
    [f]
  );

  /* ---- transport automatisch berekenen ---- */
  const [transport, setTransport] = useState<TransportResult | null>(null);
  const [transportBezig, setTransportBezig] = useState(false);
  const transportHandmatig = useRef(false);

  const postcodeBron = f.plaatsingsadres || f.klantPostcodePlaats;

  useEffect(() => {
    const pc = postcodeBron.match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1];
    if (!pc) { setTransport(null); return; }

    let afgebroken = false;
    setTransportBezig(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/transport?postcode=${pc}`);
        const data = (await res.json()) as TransportResult;
        if (afgebroken) return;
        setTransport(data);
        if (data.ok && !transportHandmatig.current) {
          setF((o) => ({
            ...o,
            transportEuro: transportVoorProducten(data.cost, { tent: o.tent, shotjesbar: o.shotjesbar }),
          }));
          setAuto((s) => new Set(s).add("transportEuro"));
        }
      } catch {
        if (!afgebroken) setTransport(null);
      } finally {
        if (!afgebroken) setTransportBezig(false);
      }
    }, 600);
    return () => { afgebroken = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcodeBron]);

  // Tent + shotjesbar samen betekent dubbel vervoer; herbereken bij wisselen.
  useEffect(() => {
    if (!transport?.ok || transportHandmatig.current) return;
    setF((o) => ({
      ...o,
      transportEuro: transportVoorProducten(transport.cost, { tent: o.tent, shotjesbar: o.shotjesbar }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.tent, f.shotjesbar, transport]);

  /* ---- screenshot ---- */
  const vulAan = (velden: UitgelezenVelden) => {
    setF((o) => {
      const n = { ...o } as Record<string, unknown>;
      for (const [k, v] of Object.entries(velden)) {
        if (k === "feestDatum" && typeof v === "string") {
          n.feestDatum = v;
          if (!o.opbouwDatum) n.opbouwDatum = schuifDatum(v, -1);
          if (!o.afbouwDatum) n.afbouwDatum = schuifDatum(v, 1 + (Number(velden.extraDagen ?? o.extraDagen) || 0));
        } else {
          n[k] = v;
        }
      }
      // De tent staat standaard aan; zag het model alleen een shotjesbar, dan uit.
      if (velden.shotjesbar === true && velden.tent !== true) n.tent = false;
      return n as FormulierInvoer;
    });
    setAuto(new Set(Object.keys(velden)));
    transportHandmatig.current = false;
  };

  /* ---- datums ---- */
  const kiesFeestdatum = (datum: string) => {
    setF((o) => ({
      ...o,
      feestDatum: datum,
      opbouwDatum: o.opbouwDatum || schuifDatum(datum, -1),
      afbouwDatum: o.afbouwDatum || schuifDatum(datum, 1 + (Number(o.extraDagen) || 0)),
    }));
    setAuto((s) => { const n = new Set(s); n.delete("feestDatum"); return n; });
  };

  const compleet = (): FormulierInvoer => ({
    ...f,
    opbouwDatum: f.opbouwDatum || schuifDatum(f.feestDatum, -1),
    afbouwDatum: f.afbouwDatum || schuifDatum(f.feestDatum, 1 + (Number(f.extraDagen) || 0)),
  });

  const opslaan = async (daarna: "concept" | "versturen") => {
    const lokaal: string[] = [];
    if (!f.klantNaam.trim()) lokaal.push("Vul de naam van de klant in.");
    if (!f.klantTelefoon.trim() && !f.klantEmail.trim())
      lokaal.push("Vul een telefoonnummer of een e-mailadres in — anders kunt u het contract niet versturen.");
    if (!f.feestDatum) lokaal.push("Vul de datum van het feest in.");
    if (!f.tent && !f.shotjesbar) lokaal.push("Kies minstens één product.");
    if (lokaal.length) {
      setFouten(lokaal);
      return;
    }

    setFouten([]);
    setBezig(daarna);
    try {
      const res = bestaand
        ? await api.wijzig(bestaand.id, compleet())
        : await api.maak(compleet());
      router.push(`/beheer/contract/${res.contract.id}${daarna === "versturen" ? "?versturen=1" : ""}`);
    } catch (e) {
      setFouten([e instanceof ApiFout ? e.message : "Er ging iets mis bij het opslaan."]);
      setBezig(null);
    }
  };

  const isAuto = (k: string) => auto.has(k);

  const hoofdletter = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

  /**
   * Datums in het verleden blokkeren we niet — een contract achteraf
   * vastleggen moet kunnen — maar een typefout in het jaar is zo gemaakt.
   * Daarom een waarschuwing bij de datums zelf.
   */
  const datumsInHetVerleden = (
    [
      ["de feestdatum", f.feestDatum],
      ["de opbouwdatum", f.opbouwDatum || schuifDatum(f.feestDatum, -1)],
      ["de afbouwdatum", f.afbouwDatum || schuifDatum(f.feestDatum, 1 + (Number(f.extraDagen) || 0))],
    ] as const
  )
    .filter(([, datum]) => {
      const dagen = dagenTot(datum);
      return dagen !== null && dagen < 0;
    })
    .map(([naam]) => naam);

  // De foutmelding midden in beeld zetten; onderaan zou hij deels achter de
  // totaalbalk vallen.
  useEffect(() => {
    if (fouten.length) foutRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [fouten]);

  return (
    <div className="space-y-5 pb-56 sm:pb-40">
      {!bestaand && <ScreenshotUitlezen klaar={vulAan} />}

      <Blok titel="Klant">
        <div className="grid gap-5 sm:grid-cols-2">
          <Veld label="Naam" auto={isAuto("klantNaam")}>
            <input className={invoerKlasse(isAuto("klantNaam"))} value={f.klantNaam}
              onChange={(e) => zetHandmatig("klantNaam", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="Telefoon" hint="voor WhatsApp" auto={isAuto("klantTelefoon")}>
            <input className={invoerKlasse(isAuto("klantTelefoon"))} type="tel" value={f.klantTelefoon}
              onChange={(e) => zetHandmatig("klantTelefoon", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="Adres" auto={isAuto("klantAdres")}>
            <input className={invoerKlasse(isAuto("klantAdres"))} value={f.klantAdres}
              onChange={(e) => zetHandmatig("klantAdres", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="Postcode en plaats" auto={isAuto("klantPostcodePlaats")}>
            <input className={invoerKlasse(isAuto("klantPostcodePlaats"))} value={f.klantPostcodePlaats}
              onChange={(e) => zetHandmatig("klantPostcodePlaats", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="E-mail" hint="voor het definitieve contract" auto={isAuto("klantEmail")}>
            <input className={invoerKlasse(isAuto("klantEmail"))} type="email" value={f.klantEmail}
              onChange={(e) => zetHandmatig("klantEmail", e.target.value)} autoComplete="off" />
          </Veld>
          <Veld label="Plaatsingsadres" hint="alleen als dit anders is" auto={isAuto("plaatsingsadres")}>
            <input className={invoerKlasse(isAuto("plaatsingsadres"))} value={f.plaatsingsadres}
              onChange={(e) => zetHandmatig("plaatsingsadres", e.target.value)} autoComplete="off" />
          </Veld>
        </div>
        <p className="mt-4 text-sm text-ink/55">
          Een telefoonnummer óf een e-mailadres is genoeg. Zonder telefoonnummer
          is er geen WhatsApp-knop, maar kunt u de link kopiëren.
        </p>
      </Blok>

      <Blok titel="Wat huurt de klant?" hint="Minstens één product. De opties eronder horen bij de tent.">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductKaart titel="Stretchtent 7,5 × 10 m" prijs={euro(TARIEVEN.tent)}
            sub={`Extra dag ${euro(TARIEVEN.extraDag)}`}
            aan={f.tent} zet={(v) => zetHandmatig("tent", v)} />
          <ProductKaart titel="Shotjesbar" prijs={euro(TARIEVEN.shotjesbar)}
            sub={`Extra dag ${euro(TARIEVEN.shotjesbarExtraDag)}`}
            aan={f.shotjesbar} zet={(v) => zetHandmatig("shotjesbar", v)} />
        </div>

        <div className="mt-5 divide-y divide-ink/8 border-t border-ink/8">
          <Regel label="Extra huurdagen"
            hint={[
              f.tent ? `tent ${euro(TARIEVEN.extraDag)}/dag` : null,
              f.shotjesbar ? `bar ${euro(TARIEVEN.shotjesbarExtraDag)}/dag` : null,
            ].filter(Boolean).join(" · ") || "kies eerst een product"}>
            <Aantal naam="Extra huurdagen" waarde={f.extraDagen} max={14}
              aan={(n) => setF((o) => ({
                ...o,
                extraDagen: n,
                zijwandExtraDagen: Math.min(o.zijwandExtraDagen, n),
                afbouwDatum: o.feestDatum && o.afbouwDatum === schuifDatum(o.feestDatum, 1 + (Number(o.extraDagen) || 0))
                  ? schuifDatum(o.feestDatum, 1 + n)
                  : o.afbouwDatum,
              }))} />
          </Regel>

          {f.tent && (
            <>
              <Regel label="Sfeerverlichting" hint={`${euro(TARIEVEN.verlichting)} per weekend, extra dagen gratis`}>
                <Schakelaar aan={f.verlichting} zet={(v) => zetHandmatig("verlichting", v)} label="Sfeerverlichting" />
              </Regel>

              <Regel label="Zijwanden 10 m" hint={`${euro(TARIEVEN.zijwand)} per stuk, maximaal 2`}>
                <Aantal naam="Zijwanden" waarde={f.zijwanden} max={2}
                  aan={(n) => setF((o) => ({ ...o, zijwanden: n, zijwandExtraDagen: n === 0 ? 0 : o.zijwandExtraDagen }))} />
              </Regel>

              {f.zijwanden > 0 && (
                <Regel
                  label="Extra dagen zijwanden"
                  hint={
                    f.extraDagen === 0
                      ? "alleen mogelijk als er extra huurdagen zijn"
                      : `${euro(TARIEVEN.zijwandExtraDag)} per zijwand per dag, maximaal ${f.extraDagen}`
                  }>
                  <Aantal naam="Extra dagen zijwanden" waarde={f.zijwandExtraDagen} max={f.extraDagen}
                    aan={(n) => zet("zijwandExtraDagen", n)} />
                </Regel>
              )}

              <Regel label="Toeslag klinkers of bestrating" hint={euro(TARIEVEN.klinkers)}>
                <Schakelaar aan={f.klinkers} zet={(v) => zetHandmatig("klinkers", v)} label="Toeslag klinkers" />
              </Regel>
            </>
          )}
        </div>
      </Blok>

      <Blok titel="Data en tijden" hint="Gelden voor alle gehuurde producten.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Veld label="Datum feest" auto={isAuto("feestDatum")}>
            <input className={invoerKlasse(isAuto("feestDatum"))} type="date" value={f.feestDatum}
              onChange={(e) => kiesFeestdatum(e.target.value)} />
          </Veld>
          <div className="hidden sm:block" />
          <Veld label="Opbouw datum">
            <input className="field-input" type="date" value={f.opbouwDatum}
              onChange={(e) => zet("opbouwDatum", e.target.value)} />
          </Veld>
          <Veld label="Opbouw tijd">
            <input className="field-input" type="time" value={f.opbouwTijd}
              onChange={(e) => zet("opbouwTijd", e.target.value)} />
          </Veld>
          <Veld label="Afbouw datum">
            <input className="field-input" type="date" value={f.afbouwDatum}
              onChange={(e) => zet("afbouwDatum", e.target.value)} />
          </Veld>
          <Veld label="Afbouw tijd">
            <input className="field-input" type="time" value={f.afbouwTijd}
              onChange={(e) => zet("afbouwTijd", e.target.value)} />
          </Veld>
        </div>
        {datumsInHetVerleden.length > 0 && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <strong className="font-semibold">Let op:</strong>{" "}
            {datumsInHetVerleden.length === 1
              ? `${hoofdletter(datumsInHetVerleden[0])} ligt in het verleden.`
              : `${hoofdletter(datumsInHetVerleden.slice(0, -1).join(", "))} en ${
                  datumsInHetVerleden.slice(-1)[0]
                } liggen in het verleden.`}{" "}
            Klopt het jaar? U kunt gewoon doorgaan als dit de bedoeling is.
          </p>
        )}
        <p className="mt-4 text-sm text-ink/55">
          Vul eerst de feestdatum in: opbouw (dag ervoor) en afbouw (dag erna)
          worden dan vanzelf gezet. Daarna kunt u ze nog aanpassen.
        </p>
      </Blok>

      <Blok titel="Transportkosten"
        hint="Wordt berekend met dezelfde formule als de calculator op de site, zodra er een postcode bekend is.">
        <div className="flex flex-wrap items-end gap-5">
          <Veld label="Bedrag" auto={isAuto("transportEuro")}>
            <div className="flex items-center gap-2">
              <span className="text-ink/50">€</span>
              <input type="number" min={0} step={1} inputMode="numeric"
                className={`${invoerKlasse(isAuto("transportEuro"))} w-32 text-right`}
                value={f.transportEuro}
                onChange={(e) => {
                  transportHandmatig.current = true;
                  zetHandmatig("transportEuro", Math.max(0, Number(e.target.value) || 0));
                }} />
            </div>
          </Veld>
          {transportHandmatig.current && transport?.ok && (
            <Knop soort="stil" onClick={() => {
              transportHandmatig.current = false;
              setF((o) => ({ ...o, transportEuro: transportVoorProducten(transport.cost, o) }));
              setAuto((s) => new Set(s).add("transportEuro"));
            }}>
              Terug naar berekend bedrag
            </Knop>
          )}
        </div>

        <div className="mt-4 text-sm leading-relaxed text-ink/60">
          {transportBezig && <p>Bezig met berekenen…</p>}
          {!transportBezig && !postcodeBron.match(/\d{4}/) && (
            <p>Vul een postcode in bij het adres of het plaatsingsadres, dan reken ik het uit.</p>
          )}
          {!transportBezig && transport?.ok && (
            <p>
              {transport.distanceKm} km enkele reis{transport.region ? ` (${transport.region})` : ""} ·
              berekend op <strong className="font-semibold text-ink">{euro(transport.cost * 100)}</strong>
              {f.tent && f.shotjesbar && " · ×2 omdat de Shotjesbar apart vervoerd wordt"}
            </p>
          )}
          {!transportBezig && transport && !transport.ok && (
            <p className="text-red-700">{transport.error}</p>
          )}
        </div>
      </Blok>

      <Blok titel="Bijzondere afspraken"
        hint="Bijvoorbeeld afwijkende tijden. Laat leeg als er niets bijzonders is — dit komt letterlijk in het contract.">
        <textarea rows={3} className={invoerKlasse(isAuto("afspraken"))} value={f.afspraken}
          onChange={(e) => zetHandmatig("afspraken", e.target.value)} />
      </Blok>

      <div ref={foutRef} className="scroll-mt-24">
      {fouten.length > 0 && (
        <Melding toon="fout" titel="Nog even dit:">
          <ul className="list-disc space-y-0.5 pl-5">{fouten.map((t) => <li key={t}>{t}</li>)}</ul>
        </Melding>
      )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="container-x flex max-w-4xl flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <span className="text-sm text-ink/55">Totaal</span>{" "}
            <span className="whitespace-nowrap font-serif text-2xl font-light tracking-tight text-ink">
              {euro(overzicht.totaalCent)}
            </span>
            <span className="ml-2 text-xs text-ink/45">geen btw, KOR</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <KnopLink href={bestaand ? `/beheer/contract/${bestaand.id}` : "/beheer"} soort="stil">
              Annuleren
            </KnopLink>
            <Knop soort="rand" bezig={bezig === "concept"} disabled={bezig !== null}
              onClick={() => opslaan("concept")}>Opslaan</Knop>
            <Knop bezig={bezig === "versturen"} disabled={bezig !== null}
              onClick={() => opslaan("versturen")}>Opslaan en versturen</Knop>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function ProductKaart({
  titel, prijs, sub, aan, zet,
}: { titel: string; prijs: string; sub: string; aan: boolean; zet: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={aan} onClick={() => zet(!aan)}
      className={`rounded-2xl border p-4 text-left transition-all ${
        aan ? "border-ink bg-ink text-white shadow-sm" : "border-ink/12 bg-white hover:border-ink/30 hover:bg-sand-50"
      }`}>
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold tracking-tight">{titel}</span>
        <span aria-hidden
          className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border ${
            aan ? "border-white bg-white text-ink" : "border-ink/25"
          }`}>
          {aan && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </div>
      <p className={`mt-1 text-sm ${aan ? "text-white/70" : "text-ink/55"}`}>
        {prijs} per weekend · {sub}
      </p>
    </button>
  );
}

function Regel({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-ink">{label}</p>
        {hint && <p className="text-sm text-ink/50">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}

/**
 * Stapteller. `naam` komt in het aria-label, zodat een schermlezer (en een
 * test) onderscheid kan maken tussen de verschillende tellers op de pagina.
 */
function Aantal({
  waarde, max, aan, naam,
}: { waarde: number; max: number; aan: (n: number) => void; naam: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <StapKnop label={`${naam}: één minder`} uit={waarde <= 0} aan={() => aan(Math.max(0, waarde - 1))}>−</StapKnop>
      <span className="w-7 text-center text-base font-semibold tabular-nums" aria-label={`${naam}: ${waarde}`}>
        {waarde}
      </span>
      <StapKnop label={`${naam}: één meer`} uit={waarde >= max} aan={() => aan(Math.min(max, waarde + 1))}>+</StapKnop>
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
    <button type="button" role="switch" aria-checked={aan} aria-label={label} onClick={() => zet(!aan)}
      className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${aan ? "bg-ink" : "bg-ink/15"}`}>
      <span className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${aan ? "translate-x-5" : ""}`} />
    </button>
  );
}
