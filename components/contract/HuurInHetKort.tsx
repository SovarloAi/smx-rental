/** "Uw huur in het kort" — data, adres, producten met bedragen en het totaal. */

import { euro } from "@/lib/prijzen";
import { datumLang } from "@/lib/contracten/formatteer";
import type { KlantContract } from "@/lib/contracten/types";

export default function HuurInHetKort({ contract }: { contract: KlantContract }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-sand-50 p-4 sm:p-7">
      <dl className="space-y-3.5">
        <Regel term="Opbouw" waarde={`${datumLang(contract.opbouwDatum)}, ${contract.opbouwTijd} uur`} />
        <Regel term="Uw feest" waarde={datumLang(contract.feestDatum)} />
        <Regel term="Afbouw" waarde={`${datumLang(contract.afbouwDatum)}, ${contract.afbouwTijd} uur`} />
        <Regel term="Adres" waarde={contract.adres || "—"} />
      </dl>

      {/* table-fixed houdt de tabel binnen de breedte van een smal scherm; zonder
          dat eist de inhoud meer ruimte dan er is en schuift de pagina opzij. */}
      <table className="mt-6 w-full table-fixed border-t border-ink/15">
        <tbody>
          {contract.overzicht.regels.map((r) => (
            <tr key={r.omschrijving} className="border-b border-ink/10">
              <td className="py-3.5 pr-2 align-top [overflow-wrap:anywhere] sm:pr-4">
                <span className="font-semibold text-ink">{r.omschrijving}</span>
                <br />
                <span className="text-[17px] text-ink/60">{r.toelichting}</span>
              </td>
              <td className="w-[88px] whitespace-nowrap py-3.5 text-right align-top font-semibold tabular-nums text-ink sm:w-[104px]">
                {euro(r.bedragCent)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-4 pr-2 align-bottom [overflow-wrap:anywhere] sm:pr-4">
              <span className="text-[21px] font-semibold text-ink">Totaal</span>
              <br />
              <span className="text-[16px] text-ink/60">er wordt geen btw gerekend</span>
            </td>
            <td className="w-[88px] whitespace-nowrap py-4 text-right align-bottom sm:w-[104px]">
              <span className="font-serif text-[26px] font-light tracking-tight text-ink sm:text-[30px]">
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
