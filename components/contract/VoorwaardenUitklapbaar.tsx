/**
 * De huurvoorwaarden als één tikbare regel, direct boven het akkoordvinkje.
 *
 * Uitgeschreven besloegen de voorwaarden ruim twintig schermen op een telefoon,
 * waardoor het vinkje praktisch onvindbaar werd. Ingeklapt staat alles binnen
 * handbereik; wie wil lezen tikt de regel open en krijgt de tekst op dezelfde
 * plek, in een vak met een eigen scrollbalk. Geen pop-up en geen nieuw
 * tabblad: de klant raakt het formulier nooit kwijt.
 *
 * Bewust <details>/<summary>: dat werkt ook zonder JavaScript, is met het
 * toetsenbord te bedienen en meldt zelf aan een schermlezer of het open staat.
 */

import type { Artikel } from "@/lib/contracten/voorwaarden";
import Voorwaarden from "./Voorwaarden";

export default function VoorwaardenUitklapbaar({
  artikelen,
}: {
  artikelen: readonly Artikel[];
}) {
  return (
    <details className="group overflow-hidden rounded-xl border-2 border-ink/20 bg-white">
      <summary
        className="flex min-h-[56px] cursor-pointer select-none list-none items-center gap-3 px-4 py-3.5 text-[17px] font-semibold text-ink sm:text-[18px] transition-colors hover:bg-sand-50 [&::-webkit-details-marker]:hidden"
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className="h-5 w-5 flex-none text-ink/50 transition-transform duration-200 group-open:rotate-90"
        >
          <path
            d="M7 4l7 6-7 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Lees de algemene voorwaarden</span>
      </summary>
      <div className="max-h-[300px] overflow-y-auto border-t-2 border-ink/15 bg-sand-50 px-4 py-5 sm:max-h-[420px] sm:px-5">
        <Voorwaarden artikelen={artikelen} compact />
      </div>
    </details>
  );
}
