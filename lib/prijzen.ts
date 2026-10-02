/**
 * Tarieven van SMX Rental — één bron van waarheid.
 *
 * Alle bedragen staan in **centen** (integer). Zo rekenen we nooit met floats.
 * `lib/transport.ts` her-exporteert de euro-varianten die de publieke
 * configurator al gebruikte, zodat die ongewijzigd blijft werken.
 *
 * SMX Rental valt onder de kleineondernemersregeling (KOR): geen btw.
 */

export const CENT = 100;

export const TARIEVEN = {
  /** Stretchtent 7,5 × 10 m, weekendtarief incl. op- en afbouw. */
  tent: 550 * CENT,
  /** Extra huurdag. */
  extraDag: 75 * CENT,
  /** Sfeerverlichting per weekend; extra dagen gratis. */
  verlichting: 30 * CENT,
  /** Zijwand 10 m, per stuk per weekend (maximaal 2). */
  zijwand: 50 * CENT,
  /** Toeslag per zijwand per extra dag. */
  zijwandExtraDag: 10 * CENT,
  /** Toeslag plaatsing op klinkers of bestrating (extra opbouwtijd). */
  klinkers: 75 * CENT,
  /** Shotjesbar per weekend. */
  shotjesbar: 380 * CENT,
} as const;

export const MAX_ZIJWANDEN = 2;

/** Vaste vermelding bij elk totaal. */
export const KOR_TEKST = "geen btw, KOR";

/** Formatteert centen als "€ 1.234" of "€ 1.234,50". */
export function euro(cent: number): string {
  const bedrag = cent / 100;
  return (
    "€ " +
    bedrag.toLocaleString("nl-NL", {
      minimumFractionDigits: cent % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}
