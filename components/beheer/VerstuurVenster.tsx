"use client";

/**
 * Venster met het kant-en-klare WhatsApp-bericht. Sjors verstuurt zelf vanuit
 * zijn eigen WhatsApp; wij leveren alleen de tekst en de link.
 */

import { useEffect, useRef, useState } from "react";
import type { VerstuurAntwoord } from "@/lib/contracten/client";
import { Knop, Melding } from "./ui";

export default function VerstuurVenster({
  gegevens, soort, sluit,
}: { gegevens: VerstuurAntwoord; soort: "versturen" | "herinneren" | "definitief"; sluit: () => void }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  const sluitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    sluitRef.current?.focus();
    const opToets = (e: KeyboardEvent) => e.key === "Escape" && sluit();
    window.addEventListener("keydown", opToets);
    const vorige = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", opToets);
      document.body.style.overflow = vorige;
    };
  }, [sluit]);

  const titel = {
    versturen: "Contract versturen",
    herinneren: "Herinnering sturen",
    definitief: "Definitief contract sturen",
  }[soort];

  const kopieer = async () => {
    try {
      await navigator.clipboard.writeText(gegevens.tekst);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch {
      setGekopieerd(false);
    }
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-label={titel}
      onClick={(e) => e.target === e.currentTarget && sluit()}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}>
        <h2 className="font-serif text-2xl font-light tracking-tight text-ink">{titel}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/60">
          De status is bijgewerkt. Verstuur het bericht nu zelf via WhatsApp.
        </p>

        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-ink/10 bg-sand-50 p-4 font-sans text-sm leading-relaxed text-ink/85">
          {gegevens.tekst}
        </pre>

        {!gegevens.waUrl && (
          <div className="mt-3">
            <Melding toon="waarschuwing">
              Er staat geen telefoonnummer bij deze klant, dus ik kan geen
              WhatsApp-link maken. Kopieer de tekst en verstuur hem handmatig.
            </Melding>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {gegevens.waUrl && (
            <a href={gegevens.waUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]">
              Openen in WhatsApp
            </a>
          )}
          <Knop soort="rand" onClick={kopieer}>
            {gekopieerd ? "Gekopieerd" : "Tekst kopiëren"}
          </Knop>
          <Knop soort="stil" onClick={sluit} ref={sluitRef}>
            Sluiten
          </Knop>
        </div>

        <p className="mt-4 break-all text-xs text-ink/45">
          Link voor de klant: {gegevens.link}
        </p>
      </div>
    </div>
  );
}
