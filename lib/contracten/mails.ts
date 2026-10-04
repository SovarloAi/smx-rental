/**
 * De e-mailteksten. Eenvoudige HTML in de huisstijl, met voor elke mail een
 * platte-tekstversie — sommige mailprogramma's tonen alleen die.
 */

import { euro } from "@/lib/prijzen";
import { datumLang, voornaam } from "./formatteer";
import { productOmschrijving } from "./producten";
import { VERHUURDER } from "./voorwaarden";
import { esc, type MailOpdracht } from "./mail";
import type { Contract } from "./types";

const ZAND = "#CBB897";
const INKT = "#0A0A0A";

function omhulsel(titel: string, inhoud: string): string {
  return `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><title>${esc(titel)}</title></head>
<body style="margin:0;padding:0;background:#FBF9F5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF9F5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#ffffff;border:1px solid #EAE2D1;border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INKT};">
        <tr><td style="background:${ZAND};padding:16px 24px;font-size:15px;font-weight:600;letter-spacing:.02em;">
          SMX&nbsp;Rental <span style="font-weight:400;opacity:.7;">· Stretchtent verhuur</span>
        </td></tr>
        <tr><td style="padding:28px 24px;font-size:16px;line-height:1.6;">${inhoud}</td></tr>
        <tr><td style="border-top:1px solid #EAE2D1;padding:16px 24px;font-size:13px;line-height:1.6;color:#5F5A52;">
          ${esc(VERHUURDER.naam)} · ${esc(VERHUURDER.adres)}, ${esc(VERHUURDER.postcodePlaats)}<br>
          ${esc(VERHUURDER.telefoon)} · ${esc(VERHUURDER.email)} · KvK ${esc(VERHUURDER.kvk)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function knop(href: string, tekst: string): string {
  return `<p style="margin:24px 0;"><a href="${esc(href)}"
    style="display:inline-block;background:${INKT};color:#ffffff;text-decoration:none;
           padding:14px 26px;border-radius:999px;font-weight:600;font-size:15px;">${esc(tekst)}</a></p>`;
}

/** Melding aan Sjors zodra een klant heeft getekend. */
export function mailOndertekend(contract: Contract, beheerUrl: string): MailOpdracht {
  const wat = productOmschrijving(contract);
  const onderwerp = `${contract.signerNaam || contract.klantNaam} heeft het huurcontract ondertekend`;
  const tekst =
    `${contract.signerNaam || contract.klantNaam} heeft het huurcontract voor ${wat} ondertekend.\n\n` +
    `Feestdatum: ${datumLang(contract.feestDatum)}\n` +
    `Totaal: ${euro(contract.totaalCent)}\n\n` +
    `Bekijken en goedkeuren:\n${beheerUrl}\n`;

  return {
    aan: VERHUURDER.email,
    onderwerp,
    tekst,
    html: omhulsel(onderwerp, `
      <p style="margin:0 0 16px;font-size:20px;font-weight:600;">Er is een contract ondertekend</p>
      <p style="margin:0 0 8px;"><strong>${esc(contract.signerNaam || contract.klantNaam)}</strong>
         heeft het huurcontract voor ${esc(wat)} ondertekend.</p>
      <p style="margin:0;color:#5F5A52;">
        Feestdatum: ${esc(datumLang(contract.feestDatum))}<br>
        Totaal: ${esc(euro(contract.totaalCent))}
      </p>
      ${knop(beheerUrl, "Bekijken en goedkeuren")}
    `),
  };
}

/** Het definitieve contract naar de klant, met de PDF als bijlage. */
export function mailDefinitiefNaarKlant(
  contract: Contract,
  pdf: Uint8Array,
  definitiefUrl: string
): MailOpdracht {
  const wat = productOmschrijving(contract);
  const onderwerp = `Uw huurovereenkomst — ${VERHUURDER.naam}`;
  const tekst =
    `Goedendag ${voornaam(contract.klantNaam)},\n\n` +
    `Hierbij de ondertekende huurovereenkomst voor ${wat} op ${datumLang(contract.feestDatum)}. ` +
    `De overeenkomst zit als PDF bij deze e-mail.\n\n` +
    `U kunt hem ook online bekijken:\n${definitiefUrl}\n\n` +
    `U betaalt pas na afloop; daarvoor ontvangt u een factuur.\n\n` +
    `Met vriendelijke groet,\nSjors — ${VERHUURDER.naam}\n${VERHUURDER.telefoon}\n`;

  return {
    aan: contract.klantEmail,
    onderwerp,
    tekst,
    bijlagen: [{ naam: "huurovereenkomst-smx-rental.pdf", inhoud: pdf }],
    html: omhulsel(onderwerp, `
      <p style="margin:0 0 16px;font-size:20px;font-weight:600;">Goedendag ${esc(voornaam(contract.klantNaam))},</p>
      <p style="margin:0 0 16px;">Hierbij de ondertekende huurovereenkomst voor ${esc(wat)} op
         <strong>${esc(datumLang(contract.feestDatum))}</strong>. De overeenkomst zit als PDF bij deze e-mail.</p>
      ${knop(definitiefUrl, "Contract online bekijken")}
      <p style="margin:0;color:#5F5A52;">U betaalt pas na afloop; daarvoor ontvangt u een factuur.</p>
      <p style="margin:16px 0 0;">Met vriendelijke groet,<br>Sjors — ${esc(VERHUURDER.naam)}</p>
    `),
  };
}

/** Kopie van het definitieve contract voor Sjors' eigen administratie. */
export function mailDefinitiefNaarVerhuurder(contract: Contract, pdf: Uint8Array): MailOpdracht {
  const onderwerp = `Kopie: huurovereenkomst ${contract.klantNaam} — ${datumLang(contract.feestDatum)}`;
  return {
    aan: VERHUURDER.email,
    onderwerp,
    tekst:
      `Kopie voor de administratie.\n\n` +
      `Klant: ${contract.klantNaam}\nFeestdatum: ${datumLang(contract.feestDatum)}\n` +
      `Totaal: ${euro(contract.totaalCent)}\n`,
    bijlagen: [{ naam: `huurovereenkomst-${slug(contract.klantNaam)}.pdf`, inhoud: pdf }],
    html: omhulsel(onderwerp, `
      <p style="margin:0 0 16px;font-size:20px;font-weight:600;">Kopie voor de administratie</p>
      <p style="margin:0;color:#5F5A52;">
        Klant: ${esc(contract.klantNaam)}<br>
        Feestdatum: ${esc(datumLang(contract.feestDatum))}<br>
        Totaal: ${esc(euro(contract.totaalCent))}
      </p>
    `),
  };
}

function slug(tekst: string): string {
  return (tekst || "klant")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "klant";
}
