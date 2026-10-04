"use client";

/**
 * Sjors' eigen handtekening, die onder elk goedgekeurd contract komt. Uploaden
 * is de eerste optie — hij heeft hem al als afbeelding. Tekenen kan ook, voor
 * als hij hem ooit opnieuw wil zetten vanaf zijn telefoon.
 */

import { useEffect, useRef, useState } from "react";
import { api, ApiFout } from "@/lib/contracten/client";
import Handtekeningvak, { type HandtekeningHandle } from "@/components/contract/Handtekeningvak";
import { Blok, Knop, Melding } from "./ui";

export default function EigenHandtekening() {
  const [gezet, setGezet] = useState<boolean | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [modus, setModus] = useState<"geen" | "uploaden" | "tekenen">("geen");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [gelukt, setGelukt] = useState(false);
  const bestandRef = useRef<HTMLInputElement>(null);
  const pad = useRef<HandtekeningHandle>(null);
  const [heeftTekening, setHeeftTekening] = useState(false);
  // Verandert na elke opslag, zodat de browser de nieuwe afbeelding ophaalt.
  const [versie, setVersie] = useState(0);

  const laad = () =>
    api.eigenHandtekening()
      .then((d) => { setGezet(d.gezet); setKey(d.key ?? null); })
      .catch((e) => setFout(e instanceof ApiFout ? e.message : "Kon de instelling niet laden."));

  useEffect(() => { laad(); }, []);

  const naOpslaan = async () => {
    setGelukt(true);
    setModus("geen");
    setVersie((v) => v + 1);
    await laad();
    setTimeout(() => setGelukt(false), 3500);
  };

  const uploaden = async (bestand: File) => {
    setFout(null); setBezig(true);
    try {
      const body = new FormData();
      body.append("afbeelding", bestand);
      const res = await fetch("/api/beheer/instellingen/handtekening", { method: "POST", body });
      const d = (await res.json().catch(() => null)) as { fout?: string } | null;
      if (!res.ok) throw new ApiFout(d?.fout ?? "Uploaden lukte niet.", res.status);
      await naOpslaan();
    } catch (e) {
      setFout(e instanceof ApiFout ? e.message : "Uploaden lukte niet.");
    } finally {
      setBezig(false);
      if (bestandRef.current) bestandRef.current.value = "";
    }
  };

  const tekeningOpslaan = async () => {
    setFout(null); setBezig(true);
    try {
      await api.zetEigenHandtekening(pad.current?.dataUrl() ?? "");
      await naOpslaan();
    } catch (e) {
      setFout(e instanceof ApiFout ? e.message : "Opslaan lukte niet.");
    } finally {
      setBezig(false);
    }
  };

  const verwijderen = async () => {
    setBezig(true);
    try {
      await fetch("/api/beheer/instellingen/handtekening", { method: "DELETE" });
      await laad();
    } finally {
      setBezig(false);
    }
  };

  return (
    <Blok titel="Mijn handtekening"
      hint="Deze komt onder elk contract dat u goedkeurt. U hoeft hem maar één keer te zetten.">
      {gezet === null && <p className="text-ink/55">Bezig met laden…</p>}

      {gezet && modus === "geen" && (
        <div className="space-y-4">
          <div className="inline-block rounded-xl border border-ink/12 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/beheer/bestand?key=${encodeURIComponent(key ?? "")}&v=${versie}`}
              alt="Uw opgeslagen handtekening" className="h-20 w-auto" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Knop soort="rand" onClick={() => setModus("uploaden")}>Vervangen door een afbeelding</Knop>
            <Knop soort="rand" onClick={() => setModus("tekenen")}>Opnieuw tekenen</Knop>
            <Knop soort="gevaar" bezig={bezig} onClick={verwijderen}>Verwijderen</Knop>
          </div>
        </div>
      )}

      {gezet === false && modus === "geen" && (
        <div className="space-y-4">
          <Melding toon="waarschuwing">
            Er staat nog geen handtekening. Zolang die ontbreekt kunt u een
            contract niet goedkeuren.
          </Melding>
          <div className="flex flex-wrap gap-2">
            <Knop onClick={() => setModus("uploaden")}>Afbeelding uploaden</Knop>
            <Knop soort="rand" onClick={() => setModus("tekenen")}>Zelf tekenen</Knop>
          </div>
        </div>
      )}

      {modus === "uploaden" && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink/70">
            Kies een PNG of JPG van uw handtekening. Een afbeelding met een
            doorzichtige of witte achtergrond werkt het mooist in de PDF.
          </p>
          <input ref={bestandRef} type="file" accept="image/png,image/jpeg" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploaden(f); }} />
          <div className="flex flex-wrap gap-2">
            <Knop bezig={bezig} onClick={() => bestandRef.current?.click()}>Bestand kiezen</Knop>
            <Knop soort="stil" onClick={() => setModus("geen")}>Annuleren</Knop>
          </div>
        </div>
      )}

      {modus === "tekenen" && (
        <div className="space-y-4">
          <Handtekeningvak ref={pad} onVerandering={setHeeftTekening} />
          <div className="flex flex-wrap gap-2">
            <Knop bezig={bezig} disabled={!heeftTekening} onClick={tekeningOpslaan}>Opslaan</Knop>
            <Knop soort="stil" onClick={() => setModus("geen")}>Annuleren</Knop>
          </div>
        </div>
      )}

      {gelukt && <div className="mt-4"><Melding toon="goed">Uw handtekening is opgeslagen.</Melding></div>}
      {fout && <div className="mt-4"><Melding toon="fout">{fout}</Melding></div>}
    </Blok>
  );
}
