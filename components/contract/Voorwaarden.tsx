/**
 * De huurvoorwaarden, volledig uitgeschreven. Bewust niet uitklapbaar: de klant
 * moet gewoon kunnen doorscrollen en meelezen zonder ergens op te hoeven tikken.
 */

import type { Artikel } from "@/lib/contracten/voorwaarden";

export default function Voorwaarden({ artikelen }: { artikelen: readonly Artikel[] }) {
  return (
    <div className="rounded-2xl border border-ink/15 bg-white px-5 py-6 sm:px-7">
      {artikelen.map((a, i) => (
        <section key={a.kop} className={i > 0 ? "mt-7 border-t border-ink/10 pt-7" : ""}>
          <h3 className="font-semibold text-[20px] leading-snug text-ink">
            <span className="text-ink/45">Artikel {i + 1}</span>
            <br />
            {a.kop}
          </h3>
          <ol className="mt-3 list-decimal space-y-3 pl-6 text-[18px] leading-[1.6] text-ink/85 marker:font-semibold marker:text-ink/40">
            {a.leden.map((lid, j) => <li key={j}>{lid}</li>)}
          </ol>
        </section>
      ))}
    </div>
  );
}
