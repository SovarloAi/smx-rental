/**
 * Register van voorwaardenversies. Elk contract bewaart zijn eigen versie, zodat
 * een latere tekstwijziging bestaande contracten niet verandert.
 */
import * as v1 from "./v1";

export type VoorwaardenVersie = "v1";

export type Voorwaarden = {
  versie: VoorwaardenVersie;
  artikelen: ReadonlyArray<readonly [string, readonly string[]]>;
  checks: readonly string[];
};

const REGISTER: Record<VoorwaardenVersie, Voorwaarden> = {
  v1: { versie: "v1", artikelen: v1.ARTIKELEN, checks: v1.CHECKS },
};

/** De versie die nieuwe contracten krijgen. */
export const HUIDIGE_VERSIE: VoorwaardenVersie = "v1";

export function voorwaarden(versie: string): Voorwaarden {
  const gevonden = REGISTER[versie as VoorwaardenVersie];
  if (!gevonden) {
    throw new Error(`Onbekende voorwaardenversie: ${versie}`);
  }
  return gevonden;
}

export { VERHUURDER } from "./v1";
