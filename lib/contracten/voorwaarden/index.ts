/**
 * Register van voorwaardenversies. Elk contract bewaart zijn eigen versie, zodat
 * een latere tekstwijziging bestaande contracten niet verandert.
 *
 * Vanaf v2 is elk artikel gelabeld met het product waar het bij hoort. Een
 * contract toont alleen de artikelen die van toepassing zijn: een
 * Shotjesbar-contract krijgt geen bepalingen over tentdoek en spanlijnen.
 */
import * as v1 from "./v1";
import * as v2 from "./v2";
import * as v3 from "./v3";
import * as v4 from "./v4";
import type { Artikel, Doelgroep } from "./v3";

export type { Artikel, Doelgroep };
export type VoorwaardenVersie = "v1" | "v2" | "v3" | "v4";

export type Voorwaarden = {
  versie: VoorwaardenVersie;
  artikelen: readonly Artikel[];
  checks: readonly { tekst: string; voor: Doelgroep }[];
};

/** v1 kende nog geen labels; alles gold altijd. */
const v1Vertaald: Voorwaarden = {
  versie: "v1",
  artikelen: v1.ARTIKELEN.map(([kop, leden]) => ({ kop, voor: "altijd" as const, leden })),
  checks: v1.CHECKS.map((tekst) => ({ tekst, voor: "altijd" as const })),
};

const REGISTER: Record<VoorwaardenVersie, Voorwaarden> = {
  v1: v1Vertaald,
  v2: { versie: "v2", artikelen: v2.ARTIKELEN, checks: v2.CHECKS },
  v3: { versie: "v3", artikelen: v3.ARTIKELEN, checks: v3.CHECKS },
  v4: { versie: "v4", artikelen: v4.ARTIKELEN, checks: v4.CHECKS },
};

/** De versie die nieuwe contracten krijgen. */
export const HUIDIGE_VERSIE: VoorwaardenVersie = "v4";

export function voorwaarden(versie: string): Voorwaarden {
  const gevonden = REGISTER[versie as VoorwaardenVersie];
  if (!gevonden) throw new Error(`Onbekende voorwaardenversie: ${versie}`);
  return gevonden;
}

/** Hoort dit artikel of vinkje bij de gehuurde producten? */
function vanToepassing(voor: Doelgroep, producten: { tent: boolean; shotjesbar: boolean }) {
  if (voor === "altijd") return true;
  if (voor === "tent") return producten.tent;
  return producten.shotjesbar;
}

/**
 * De artikelen en vinkjes die bij dít contract horen, in volgorde. Dit is ook
 * precies wat in de documenthash en in de PDF belandt.
 */
export function voorwaardenVoor(
  versie: string,
  producten: { tent: boolean; shotjesbar: boolean }
): { versie: VoorwaardenVersie; artikelen: Artikel[]; checks: string[] } {
  const v = voorwaarden(versie);
  return {
    versie: v.versie,
    artikelen: v.artikelen.filter((a) => vanToepassing(a.voor, producten)),
    checks: v.checks.filter((c) => vanToepassing(c.voor, producten)).map((c) => c.tekst),
  };
}

export { VERHUURDER } from "./v1";
