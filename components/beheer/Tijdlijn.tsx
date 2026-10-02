"use client";

/** Tijdlijn van een contract: klaargemaakt → verstuurd → geopend → ondertekend
 *  → goedgekeurd, met de bewijsgegevens eronder. */

import { tijdstip } from "@/lib/contracten/formatteer";
import type { Contract, ContractEvent } from "@/lib/contracten/types";

const STAPPEN = [
  { sleutel: "createdAt", label: "Klaargemaakt" },
  { sleutel: "sentAt", label: "Verstuurd" },
  { sleutel: "openedAt", label: "Geopend door de klant" },
  { sleutel: "signedAt", label: "Ondertekend" },
  { sleutel: "approvedAt", label: "Goedgekeurd" },
] as const;

export default function Tijdlijn({
  contract, events,
}: { contract: Contract; events: ContractEvent[] }) {
  const herinnering = [...events].reverse().find((e) => e.type === "herinnering");

  return (
    <div>
      <ol className="space-y-0">
        {STAPPEN.map((stap, i) => {
          const wanneer = contract[stap.sleutel] as string | null;
          const gedaan = Boolean(wanneer);
          const laatste = i === STAPPEN.length - 1;
          return (
            <li key={stap.sleutel} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${
                    gedaan ? "bg-ink ring-ink/10" : "bg-ink/15 ring-transparent"
                  }`}
                />
                {!laatste && (
                  <span aria-hidden className={`w-px flex-1 ${gedaan ? "bg-ink/20" : "bg-ink/8"}`} />
                )}
              </div>
              <div className={`pb-5 ${gedaan ? "" : "opacity-45"}`}>
                <p className="text-sm font-medium text-ink">{stap.label}</p>
                <p className="text-sm text-ink/55">
                  {gedaan ? tijdstip(wanneer) : "nog niet"}
                  {stap.sleutel === "signedAt" && contract.opPapier && gedaan && " · op papier"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {herinnering && (
        <p className="-mt-1 text-sm text-ink/55">
          Laatste herinnering verstuurd op {tijdstip(herinnering.at)}.
        </p>
      )}

      {contract.signedAt && !contract.opPapier && (
        <div className="mt-4 rounded-xl border border-ink/10 bg-sand-50 p-4 text-sm leading-relaxed text-ink/70">
          <p className="mb-1.5 font-semibold text-ink">Bewijs van ondertekening</p>
          <dl className="space-y-0.5">
            <Rij term="Naam" waarde={contract.signerNaam} />
            <Rij term="Plaats" waarde={contract.signerPlaats} />
            <Rij term="Tijdstip" waarde={tijdstip(contract.signedAt)} />
            <Rij term="IP-adres" waarde={contract.signedIp} />
            <Rij term="Apparaat" waarde={contract.signedUserAgent} />
          </dl>
          <p className="mt-2 break-all">
            <span className="text-ink/50">Vingerafdruk contracttekst (SHA-256):</span>
            <br />
            <code className="text-xs">{contract.documentHash}</code>
          </p>
        </div>
      )}
    </div>
  );
}

function Rij({ term, waarde }: { term: string; waarde: string | null }) {
  if (!waarde) return null;
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-ink/50">{term}:</dt>
      <dd className="min-w-0 break-words">{waarde}</dd>
    </div>
  );
}
