"use client";

/** Detailpagina van één contract: gegevens, tijdlijn en de acties. */

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiFout, type ContractDetail as Detail, type VerstuurAntwoord } from "@/lib/contracten/client";
import { datumLang, euro, tijdstip } from "@/lib/contracten/formatteer";
import { Blok, Knop, KnopLink, Melding, StatusLabel } from "./ui";
import Tijdlijn from "./Tijdlijn";
import VerstuurVenster from "./VerstuurVenster";

type Soort = "versturen" | "herinneren" | "definitief";

export default function ContractDetail({ id }: { id: string }) {
  const router = useRouter();
  const zoek = useSearchParams();
  const [data, setData] = useState<Detail | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState<string | null>(null);
  const [venster, setVenster] = useState<{ gegevens: VerstuurAntwoord; soort: Soort } | null>(null);
  const [bevestigVerwijderen, setBevestigVerwijderen] = useState(false);
  const [waarschuwingen, setWaarschuwingen] = useState<string[]>([]);

  const laad = useCallback(async () => {
    try {
      setData(await api.detail(id));
    } catch (e) {
      setFout(e instanceof ApiFout ? e.message : "Kon dit contract niet laden.");
    }
  }, [id]);

  useEffect(() => { laad(); }, [laad]);

  // Melding in het overzicht wegnemen zodra Sjors het contract bekijkt.
  useEffect(() => {
    if (data?.contract.status === "ondertekend" && !data.contract.gezien) {
      api.gezien(id).catch(() => {});
    }
  }, [data, id]);

  const actie = async (naam: string, fn: () => Promise<VerstuurAntwoord>, soort: Soort) => {
    setBezig(naam);
    setFout(null);
    try {
      const gegevens = await fn();
      setVenster({ gegevens, soort });
      await laad();
    } catch (e) {
      setFout(e instanceof ApiFout ? e.message : "Dat lukte niet.");
    } finally {
      setBezig(null);
    }
  };

  // Na "opslaan en versturen" meteen het verstuurvenster tonen.
  const autoVersturen = zoek.get("versturen") === "1";
  useEffect(() => {
    if (!autoVersturen || !data || venster) return;
    router.replace(`/beheer/contract/${id}`);
    if (data.contract.status === "concept") {
      actie("versturen", () => api.versturen(id), "versturen");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoVersturen, data]);

  if (fout && !data) return <Melding toon="fout" titel="Er ging iets mis">{fout}</Melding>;
  if (!data) return <p className="py-10 text-center text-ink/50">Bezig met laden…</p>;

  const c = data.contract;
  const teBewerken = c.status === "concept" || c.status === "verstuurd" || c.status === "geopend";
  const teVersturen = c.status === "concept";
  const teHerinneren = c.status === "verstuurd" || c.status === "geopend";

  return (
    <div className="space-y-5">
      <div>
        <KnopLink href="/beheer" soort="stil" className="-ml-4">← Alle contracten</KnopLink>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-sand-600">
          {[c.tent && "Stretchtent", c.shotjesbar && "Shotjesbar"].filter(Boolean).join(" + ")}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-serif text-4xl font-light leading-tight tracking-tightest text-ink">
            {c.klantNaam || "Naamloos"}
          </h1>
          <StatusLabel status={c.status} opPapier={c.opPapier} />
        </div>
        <p className="mt-2 text-lg text-ink/60">{datumLang(c.feestDatum)}</p>
      </div>

      {fout && <Melding toon="fout">{fout}</Melding>}

      {c.status === "ondertekend" && (
        <Melding toon="goed" titel="Ondertekend door de klant">
          Controleer de gegevens hieronder. Bij goedkeuren komt uw handtekening
          erbij, maken we de PDF en sturen we die naar de klant en naar uzelf.
        </Melding>
      )}

      {waarschuwingen.length > 0 && (
        <Melding toon="waarschuwing" titel="Goedgekeurd, maar let hier even op">
          <ul className="list-disc space-y-0.5 pl-5">
            {waarschuwingen.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </Melding>
      )}

      <div className="flex flex-wrap gap-2">
        {teVersturen && (
          <Knop bezig={bezig === "versturen"}
            onClick={() => actie("versturen", () => api.versturen(id), "versturen")}>
            Versturen via WhatsApp
          </Knop>
        )}
        {teHerinneren && (
          <Knop bezig={bezig === "herinneren"}
            onClick={() => actie("herinneren", () => api.herinneren(id), "herinneren")}>
            Herinnering sturen
          </Knop>
        )}
        {teBewerken && <KnopLink href={`/beheer/contract/${id}/bewerken`}>Bewerken</KnopLink>}
        {c.status === "ondertekend" && (
          <Knop bezig={bezig === "goedkeuren"}
            onClick={async () => {
              setBezig("goedkeuren");
              setFout(null);
              setWaarschuwingen([]);
              try {
                const res = await api.goedkeuren(id);
                setWaarschuwingen(res.waarschuwingen);
                await laad();
              } catch (e) {
                setFout(e instanceof ApiFout ? e.message : "Goedkeuren lukte niet.");
              } finally {
                setBezig(null);
              }
            }}>
            Goedkeuren en afronden
          </Knop>
        )}
        {c.status === "goedgekeurd" && (
          <>
            <a href={`/api/beheer/bestand?key=${encodeURIComponent(c.pdfKey ?? "")}`}
              target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm min-h-[44px]">
              PDF openen
            </a>
            <Knop bezig={bezig === "definitief"}
              onClick={() => actie("definitief", () => api.versturen(id), "definitief")}>
              Link naar de klant sturen
            </Knop>
          </>
        )}
      </div>

      <Blok titel="Wat er gehuurd wordt">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-ink/8">
            {data.overzicht.regels.map((r) => (
              <tr key={r.omschrijving}>
                <td className="py-2.5 pr-4">
                  <span className="font-medium text-ink">{r.omschrijving}</span>
                  <br />
                  <span className="text-ink/50">{r.toelichting}</span>
                </td>
                <td className="whitespace-nowrap py-2.5 pl-3 text-right align-top font-medium tabular-nums">
                  {euro(r.bedragCent)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-ink/15">
              <td className="py-3.5 font-semibold text-ink">
                Totaal <span className="font-normal text-ink/50">(geen btw, KOR)</span>
              </td>
              <td className="whitespace-nowrap py-3.5 text-right align-bottom font-serif text-2xl font-light tabular-nums">
                {euro(data.overzicht.totaalCent)}
              </td>
            </tr>
          </tbody>
        </table>
        {c.afspraken && (
          <p className="mt-4 rounded-xl bg-sand-50 p-3.5 text-sm leading-relaxed text-ink/75">
            <span className="font-semibold text-ink">Bijzondere afspraken: </span>
            {c.afspraken}
          </p>
        )}
      </Blok>

      <Blok titel="Klant en periode">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Paar term="Naam" waarde={c.klantNaam} />
          <Paar term="Telefoon" waarde={c.klantTelefoon} />
          <Paar term="Adres" waarde={[c.klantAdres, c.klantPostcodePlaats].filter(Boolean).join(", ")} />
          <Paar term="E-mail" waarde={c.klantEmail || "— niet opgegeven"} />
          {c.plaatsingsadres && <Paar term="Plaatsingsadres" waarde={c.plaatsingsadres} />}
          <Paar term="Opbouw" waarde={`${datumLang(c.opbouwDatum)}, ${c.opbouwTijd} uur`} />
          <Paar term="Feest" waarde={datumLang(c.feestDatum)} />
          <Paar term="Afbouw" waarde={`${datumLang(c.afbouwDatum)}, ${c.afbouwTijd} uur`} />
        </dl>
      </Blok>

      <Blok titel="Verloop">
        <Tijdlijn contract={c} events={data.events} />
      </Blok>

      <div className="panel">
        <h2 className="font-serif text-2xl font-light tracking-tightest text-ink">Contract verwijderen</h2>
        <p className="mb-5 mt-1 text-sm leading-relaxed text-ink/55">
          Dit verwijdert het contract, de audit-log en alle opgeslagen bestanden.
          Dit kan niet ongedaan gemaakt worden.
        </p>
        {bevestigVerwijderen ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink">Zeker weten?</span>
            <Knop soort="gevaar" bezig={bezig === "verwijderen"}
              onClick={async () => {
                setBezig("verwijderen");
                try { await api.verwijder(id); router.push("/beheer"); }
                catch (e) {
                  setFout(e instanceof ApiFout ? e.message : "Verwijderen lukte niet.");
                  setBezig(null);
                }
              }}>
              Ja, definitief verwijderen
            </Knop>
            <Knop soort="stil" onClick={() => setBevestigVerwijderen(false)}>Nee, laat staan</Knop>
          </div>
        ) : (
          <Knop soort="gevaar" onClick={() => setBevestigVerwijderen(true)}>Verwijderen</Knop>
        )}
      </div>

      <p className="pb-4 text-center text-xs text-ink/40">
        Aangemaakt op {tijdstip(c.createdAt)} · huurvoorwaarden {c.voorwaardenVersie}
      </p>

      {venster && (
        <VerstuurVenster gegevens={venster.gegevens} soort={venster.soort}
          sluit={() => { setVenster(null); laad(); }} />
      )}
    </div>
  );
}

function Paar({ term, waarde }: { term: string; waarde: string }) {
  return (
    <div>
      <dt className="text-ink/50">{term}</dt>
      <dd className="font-medium text-ink">{waarde || "–"}</dd>
    </div>
  );
}
