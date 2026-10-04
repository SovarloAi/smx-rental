/**
 * E-mail via de HTTP-API van Resend. Geen SDK nodig; één fetch is genoeg en
 * dat werkt zonder meer op de edge-runtime.
 *
 * Verzenden gebeurt vanaf contracten@smxrental.com, met smxrental@gmail.com
 * als antwoordadres — zo komen reacties van klanten gewoon in de bestaande
 * mailbox terecht.
 */

import { VERHUURDER } from "./voorwaarden";

const RESEND_URL = "https://api.resend.com/emails";

export const AFZENDER = `SMX Rental <contracten@smxrental.com>`;
export const ANTWOORD_NAAR = VERHUURDER.email;

export type Bijlage = { naam: string; inhoud: Uint8Array };

export type MailOpdracht = {
  aan: string | string[];
  onderwerp: string;
  html: string;
  tekst: string;
  bijlagen?: Bijlage[];
};

export type MailResultaat = { ok: true; id: string } | { ok: false; reden: string };

/**
 * Verstuurt een e-mail. Gooit nooit: de aanroepende route moet door kunnen
 * gaan als de mail niet lukt. Een contract mag niet stranden omdat een
 * e-mailserver hapert; de fout komt wel terug zodat we hem kunnen tonen.
 */
export async function verstuurMail(opdracht: MailOpdracht): Promise<MailResultaat> {
  const sleutel = process.env.RESEND_API_KEY;
  if (!sleutel) return { ok: false, reden: "RESEND_API_KEY ontbreekt" };

  const ontvangers = Array.isArray(opdracht.aan) ? opdracht.aan : [opdracht.aan];
  const geldig = ontvangers.filter((a) => /^\S+@\S+\.\S+$/.test(a));
  if (!geldig.length) return { ok: false, reden: "geen geldig e-mailadres" };

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sleutel}` },
      body: JSON.stringify({
        from: AFZENDER,
        to: geldig,
        reply_to: ANTWOORD_NAAR,
        // Vangnet: een regeleinde in een onderwerp is de klassieke manier om
        // extra mailheaders te smokkelen.
        subject: opdracht.onderwerp.replace(/[\r\n]+/g, " ").slice(0, 200),
        html: opdracht.html,
        text: opdracht.tekst,
        attachments: opdracht.bijlagen?.map((b) => ({
          filename: b.naam,
          content: naarBase64(b.inhoud),
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend gaf een fout:", res.status, body.slice(0, 300));
      return { ok: false, reden: `Resend gaf status ${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id ?? "" };
  } catch (e) {
    console.error("Mail versturen mislukt:", e);
    return { ok: false, reden: "de mailserver was niet bereikbaar" };
  }
}

function naarBase64(bytes: Uint8Array): string {
  let bin = "";
  const blok = 0x8000;
  for (let i = 0; i < bytes.length; i += blok) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + blok)) as unknown as number[]
    );
  }
  return btoa(bin);
}

/** Zet tekst veilig in HTML. */
export function esc(tekst: string): string {
  return String(tekst ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}
