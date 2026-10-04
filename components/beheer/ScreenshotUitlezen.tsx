"use client";

/**
 * Screenshot van het websiteformulier of een WhatsApp-gesprek uitlezen, zodat
 * het contractformulier alvast gevuld wordt. De afbeelding wordt niet bewaard:
 * hij gaat één keer naar de server en daarna weg.
 */

import { useRef, useState } from "react";
import { ApiFout } from "@/lib/contracten/client";
import { Knop, Melding } from "./ui";

export type UitgelezenVelden = Record<string, string | number | boolean>;

export default function ScreenshotUitlezen({
  klaar,
}: { klaar: (velden: UitgelezenVelden) => void }) {
  const invoer = useRef<HTMLInputElement>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [gelukt, setGelukt] = useState<number | null>(null);

  const verwerk = async (bestand: File) => {
    setFout(null);
    setGelukt(null);
    setBezig(true);
    try {
      const body = new FormData();
      body.append("afbeelding", bestand);
      const res = await fetch("/api/beheer/uitlezen", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as
        | { velden?: UitgelezenVelden; fout?: string }
        | null;
      if (!res.ok) throw new ApiFout(data?.fout ?? "Uitlezen lukte niet.", res.status);

      const velden = data?.velden ?? {};
      const aantal = Object.keys(velden).length;
      if (aantal === 0) {
        setFout("Ik kon er niets uit halen. Vul het formulier handmatig in.");
      } else {
        setGelukt(aantal);
        klaar(velden);
      }
    } catch (e) {
      setFout(e instanceof ApiFout ? e.message : "Uitlezen lukte niet.");
    } finally {
      setBezig(false);
      if (invoer.current) invoer.current.value = "";
    }
  };

  return (
    <section className="panel border-dashed">
      <h2 className="font-serif text-2xl font-light tracking-tightest text-ink">
        Sneller invullen
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-ink/55">
        Heeft u een schermafbeelding van de aanvraag op de site of van het
        WhatsApp-gesprek? Upload die, dan vul ik het formulier alvast in. U
        controleert daarna alles zelf. De afbeelding wordt niet bewaard.
      </p>

      <input ref={invoer} type="file" accept="image/png,image/jpeg,image/gif,image/webp"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) verwerk(f); }} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Knop soort="rand" bezig={bezig} onClick={() => invoer.current?.click()}>
          {bezig ? "Bezig met uitlezen…" : "Schermafbeelding kiezen"}
        </Knop>
        {gelukt !== null && (
          <span className="text-sm font-medium text-emerald-700">
            {gelukt} {gelukt === 1 ? "veld" : "velden"} ingevuld — controleer ze hieronder.
          </span>
        )}
      </div>

      {fout && <div className="mt-4"><Melding toon="fout">{fout}</Melding></div>}
    </section>
  );
}
