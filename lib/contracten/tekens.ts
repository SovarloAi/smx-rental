/**
 * Welke tekens mogen in een contract staan?
 *
 * De PDF gebruikt Helvetica en dat lettertype kan alleen WinAnsi aan: Latin-1
 * plus een handvol typografische tekens (€, – , —, ‘ ’ “ ”, …, •, ™). Emoji en
 * andere tekens daarbuiten kan het niet tekenen.
 *
 * Zouden we die pas in de PDF weglaten, dan tekent de klant voor tekst die op
 * zijn scherm wél stond. Daarom halen we ze er bij het opslaan al uit: wat
 * opgeslagen is, is wat de klant ziet, is wat in de PDF staat.
 */

const WINANSI_EXTRA =
  "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

const TOEGESTAAN = `\\u0020-\\u007e\\u00a0-\\u00ff${WINANSI_EXTRA}`;

/**
 * Alles wat Helvetica niet kan tekenen, stuurtekens inbegrepen. De PDF
 * gebruikt dit als laatste vangnet, nadat regeleindes al een spatie zijn
 * geworden.
 */
export const BUITEN_WINANSI = new RegExp(`[^${TOEGESTAAN}]`, "g");

/** Zelfde set, maar regeleindes blijven staan. */
const BUITEN_WINANSI_MET_REGELS = new RegExp(`[^\\n${TOEGESTAAN}]`, "g");

/**
 * Haalt bij het opslaan de tekens weg die niet in de PDF kunnen. Een emoji
 * bestaat uit twee halve tekens (surrogaten); die vallen er ieder apart uit,
 * wat voor weghalen precies goed is.
 */
export function alleenPdfTekens(waarde: string): string {
  return waarde.replace(BUITEN_WINANSI_MET_REGELS, "");
}
