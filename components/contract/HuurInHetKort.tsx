/** "Uw huur in het kort" — data, adres, producten met bedragen en het totaal. */

import { euro } from "@/lib/prijzen";
import { datumLang } from "@/lib/contracten/formatteer";
import type { KlantContract } from "@/lib/contracten/types";

export default function HuurInHetKort({ contract }: { contract: KlantContract }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-sand-50 p-5 sm:p-7">
      <dl className="space-y-3.5">
        <Regel term="Opbouw" waarde={`${datumLang(contract.opbouwDatum)}, ${contract.opbouwTijd} uur`} />
        <Regel term="Uw feest" waarde={datumLang(contract.feestDatum)} />
        <Regel term="Afbouw" waarde={`${datumLang(contract.afbouwDatum)}, ${contract.afbouwTijd} uur`} />
        <Regel term="Adres" waarde={contract.adres || "—"} />
      </dl>

      <table className="mt-6 w-full border-t border-ink/15">
        <tbody>
          {contract.overzicht.regels.map((r) => (
            <tr key={r.omschrijving} className="border-b border-ink/10">
              <td className="py-3.5 pr-4 align-top">
                <span className="font-semibold text-ink">{r.omschrijving}</span>
                <br />
                <span className="text-[17px] text-ink/60">{r.toelichting}</span>
              </td>
              <td className="whitespace-nowrap py-3.5 text-right align-top font-semibold tabular-nums text-ink">
                {euro(r.bedragCent)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-4 pr-4 align-bottom">
              <span className="text-[21px] font-semibold text-ink">Totaal</span>
              <br />
              <span className="text-[16px] text-ink/60">er wordt geen btw gerekend</span>
            </td>
            <td className="whitespace-nowrap py-4 text-right align-bottom">
              <span className="font-serif text-[30px] font-light tracking-tight text-ink">
                {euro(contract.overzicht.totaalCent)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4 text-[18px] leading-relaxed text-ink/75">
        U betaalt pas na afloop. U ontvangt daarvoor een factuur.
      </p>

      {contract.afspraken && (
        <p className="mt-4 rounded-xl border border-ink/10 bg-white p-4 text-[18px] leading-relaxed text-ink/80">
          <span className="font-semibold text-ink">Bijzondere afspraken: </span>
          {contract.afspraken}
        </p>
      )}
    </div>
  );
}

function Regel({ term, waarde }: { term: string; waarde: string }) {
  return (
    <div className="sm:flex sm:gap-4">
      <dt className="text-[17px] font-medium uppercase tracking-wide text-sand-600 sm:w-32 sm:shrink-0">
        {term}
      </dt>
      <dd className="text-[19px] font-medium text-ink">{waarde}</dd>
    </div>
  );
}
