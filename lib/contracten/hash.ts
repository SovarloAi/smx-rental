/**
 * Documenthash: een SHA-256 over de exacte inhoud van het contract op het
 * moment van ondertekenen. Hiermee is later aantoonbaar dat de tekst niet is
 * gewijzigd.
 *
 * De payload wordt deterministisch opgebouwd (vaste sleutelvolgorde), zodat
 * dezelfde inhoud altijd dezelfde hash geeft.
 */

import { voorwaardenVoor } from "./voorwaarden";
import { berekenOverzicht } from "./regels";
import type { Contract } from "./types";

export function canoniekePayload(c: Contract): string {
  // Alleen de artikelen die bij dít contract horen: dat is wat de klant
  // gelezen en ondertekend heeft.
  const v = voorwaardenVoor(c.voorwaardenVersie, c);
  const overzicht = berekenOverzicht(c);

  return JSON.stringify({
    klant: {
      naam: c.klantNaam,
      adres: c.klantAdres,
      postcodePlaats: c.klantPostcodePlaats,
      telefoon: c.klantTelefoon,
      email: c.klantEmail,
    },
    plaatsingsadres: c.plaatsingsadres,
    periode: [c.opbouwDatum, c.opbouwTijd, c.feestDatum, c.afbouwDatum, c.afbouwTijd],
    regels: overzicht.regels.map((r) => [r.omschrijving, r.toelichting, r.bedragCent]),
    totaalCent: overzicht.totaalCent,
    afspraken: c.afspraken,
    producten: { tent: c.tent, shotjesbar: c.shotjesbar },
    voorwaarden: { versie: v.versie, artikelen: v.artikelen, checks: v.checks },
  });
}

export async function documentHash(c: Contract): Promise<string> {
  const data = new TextEncoder().encode(canoniekePayload(c));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
