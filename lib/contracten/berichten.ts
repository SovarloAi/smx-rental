/**
 * De WhatsApp-berichten die Sjors vanuit zijn eigen WhatsApp verstuurt.
 *
 * We leveren zowel de kale tekst (om te kopiëren) als een wa.me-link met het
 * bericht er al in. Nederlandse 06-nummers worden omgezet naar 316...
 */

import type { Contract } from "./types";
import { VERHUURDER } from "./voorwaarden";

/** WhatsApp-nummer van SMX Rental zelf (voor "laat het Sjors weten"). */
export const EIGEN_WHATSAPP = "31620651528";

/** Zet een Nederlands telefoonnummer om naar internationaal formaat zonder +. */
export function waNummer(invoer: string): string {
  let d = (invoer || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "31" + d.slice(1);
  return d;
}

export function klantLink(token: string, basis: string): string {
  return `${basis}/contract/${token}`;
}

export function definitiefLink(token: string, basis: string): string {
  return `${basis}/contract/${token}/definitief`;
}

function datumLang(datum: string): string {
  if (!datum) return "uw feestdatum";
  return new Date(`${datum}T12:00:00Z`).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function voornaam(naam: string): string {
  return (naam || "").trim().split(" ")[0] || "";
}

export type BerichtSoort = "versturen" | "herinneren" | "definitief";

/**
 * Bouwt het bericht plus de wa.me-link. Geen telefoonnummer? Dan alleen tekst,
 * zodat Sjors hem nog steeds kan kopiëren.
 */
export function whatsappBericht(
  contract: Contract,
  soort: BerichtSoort,
  basis: string
): { tekst: string; waUrl: string | null } {
  const naam = voornaam(contract.klantNaam);
  const aanhef = naam ? `Goedendag ${naam}` : "Goedendag";
  const link =
    soort === "definitief"
      ? definitiefLink(contract.token, basis)
      : klantLink(contract.token, basis);

  let tekst: string;
  if (soort === "versturen") {
    tekst =
      `${aanhef}, hierbij de huurovereenkomst voor de stretchtent op ` +
      `${datumLang(contract.feestDatum)}.\n\n` +
      `U kunt hem hier rustig doorlezen en ondertekenen:\n${link}\n\n` +
      `Het duurt ongeveer vijf minuten. Vragen? Bel of app gerust.\n\n` +
      `Met vriendelijke groet,\nSjors — ${VERHUURDER.naam}`;
  } else if (soort === "herinneren") {
    tekst =
      `${aanhef}, een kleine herinnering aan de huurovereenkomst voor ` +
      `${datumLang(contract.feestDatum)}.\n\n` +
      `U kunt hem hier ondertekenen:\n${link}\n\n` +
      `Lukt het niet of heeft u vragen? Laat het mij weten.\n\n` +
      `Met vriendelijke groet,\nSjors — ${VERHUURDER.naam}`;
  } else {
    tekst =
      `${aanhef}, de huurovereenkomst is door ons beiden ondertekend.\n\n` +
      `U kunt hem hier bekijken en als PDF bewaren:\n${link}\n\n` +
      `Met vriendelijke groet,\nSjors — ${VERHUURDER.naam}`;
  }

  const nummer = waNummer(contract.klantTelefoon);
  const waUrl = nummer
    ? `https://wa.me/${nummer}?text=${encodeURIComponent(tekst)}`
    : null;

  return { tekst, waUrl };
}
