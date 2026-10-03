/**
 * Beheer-API: leest een screenshot uit (websiteformulier of WhatsApp-gesprek)
 * en haalt daar de contractgegevens uit, zodat Sjors het formulier niet
 * helemaal met de hand hoeft te vullen.
 *
 * De afbeelding wordt NIET opgeslagen. Hij gaat één keer naar de Anthropic API
 * en wordt daarna weggegooid. Wat eruit komt is een voorstel: Sjors controleert
 * en past aan voordat er iets wordt bewaard.
 */

import { json, fout, metBeheerder } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-5-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Anthropic accepteert deze beeldformaten. */
const TOEGESTAAN = ["image/jpeg", "image/png", "image/gif", "image/webp"];
/** Ruim onder de limiet van de API (5 MB base64 ≈ 3,7 MB binair). */
const MAX_BYTES = 3_500_000;

const INSTRUCTIE = `Je krijgt een schermafbeelding van een aanvraag voor SMX Rental, een verhuurbedrijf van stretchtenten in Neer (Limburg). Dat kan een ingevuld formulier van de website zijn, of een WhatsApp-gesprek met een klant.

Haal hier de gegevens uit en geef ALLEEN geldige JSON terug, zonder uitleg en zonder markdown.

Vorm:
{
  "klantNaam": string,
  "klantAdres": string,
  "klantPostcodePlaats": string,
  "klantTelefoon": string,
  "klantEmail": string,
  "plaatsingsadres": string,
  "feestDatum": "JJJJ-MM-DD",
  "extraDagen": number,
  "tent": boolean,
  "shotjesbar": boolean,
  "verlichting": boolean,
  "zijwanden": number,
  "klinkers": boolean,
  "afspraken": string
}

Harde regels:
- Staat een gegeven niet duidelijk in de afbeelding, gebruik dan "" voor tekst, 0 voor getallen en false voor ja/nee. Verzin NOOIT iets en gok niet.
- "tent" is true als het om de stretchtent gaat, "shotjesbar" als de Shotjesbar genoemd wordt. Allebei mag.
- "zijwanden" is 0, 1 of 2.
- "klinkers" is true als de tent op klinkers of bestrating komt.
- Datums altijd als JJJJ-MM-DD. Staat er alleen een dag en maand, gebruik dan het eerstvolgende jaar waarin die datum nog komt.
- Zet in "afspraken" alleen echte bijzonderheden die de klant noemt, kort samengevat. Anders "".
- Een telefoonnummer neem je over zoals het er staat.`;

export async function POST(req: Request) {
  return metBeheerder(req, async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return fout(
        "Uitlezen is niet beschikbaar: de ANTHROPIC_API_KEY ontbreekt in de omgeving.",
        503
      );
    }

    const form = await req.formData().catch(() => null);
    const bestand = form?.get("afbeelding");
    if (!(bestand instanceof File)) return fout("Geen afbeelding ontvangen.", 422);
    if (!TOEGESTAAN.includes(bestand.type)) {
      return fout("Gebruik een JPG, PNG, GIF of WEBP.", 415);
    }
    if (bestand.size > MAX_BYTES) {
      return fout("De afbeelding is te groot. Maak hem kleiner dan 3,5 MB.", 413);
    }

    const base64 = naarBase64(new Uint8Array(await bestand.arrayBuffer()));

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: bestand.type, data: base64 } },
              { type: "text", text: INSTRUCTIE },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const tekst = await res.text().catch(() => "");
      console.error("Uitlezen mislukt:", res.status, tekst.slice(0, 400));
      return fout(
        "De afbeelding kon niet worden uitgelezen. Vul het formulier handmatig in.",
        502
      );
    }

    const antwoord = (await res.json()) as { content?: { type: string; text?: string }[] };
    const tekst = antwoord.content?.find((c) => c.type === "text")?.text ?? "";

    const gegevens = leesJson(tekst);
    if (!gegevens) {
      return fout(
        "Ik kon er geen gegevens uit halen. Probeer een duidelijkere schermafbeelding, of vul het handmatig in.",
        422
      );
    }

    // Alleen velden teruggeven die daadwerkelijk iets bevatten; de rest blijft
    // leeg in het formulier.
    return json({ velden: schoon(gegevens) });
  });
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

/** Pakt de JSON uit het antwoord, ook als er toch tekst omheen staat. */
function leesJson(tekst: string): Record<string, unknown> | null {
  const kaal = tekst.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = kaal.indexOf("{");
  const eind = kaal.lastIndexOf("}");
  if (start === -1 || eind <= start) return null;
  try {
    const o = JSON.parse(kaal.slice(start, eind + 1));
    return o && typeof o === "object" ? (o as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const DATUM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Houdt alleen bruikbare waarden over. Wat het model niet zeker wist, komt als
 * lege string of 0 binnen en laten we weg — dan blijft het veld in het
 * formulier gewoon leeg.
 */
function schoon(g: Record<string, unknown>): Record<string, string | number | boolean> {
  const uit: Record<string, string | number | boolean> = {};
  const tekst = (k: string, max = 200) => {
    const v = g[k];
    if (typeof v === "string" && v.trim()) uit[k] = v.trim().slice(0, max);
  };
  const vlag = (k: string) => {
    if (g[k] === true) uit[k] = true;
  };

  tekst("klantNaam", 120);
  tekst("klantAdres", 160);
  tekst("klantPostcodePlaats", 120);
  tekst("klantTelefoon", 40);
  tekst("klantEmail", 160);
  tekst("plaatsingsadres", 200);
  tekst("afspraken", 2000);

  if (typeof g.feestDatum === "string" && DATUM.test(g.feestDatum)) {
    uit.feestDatum = g.feestDatum;
  }
  const dagen = Number(g.extraDagen);
  if (Number.isFinite(dagen) && dagen > 0) uit.extraDagen = Math.min(14, Math.floor(dagen));
  const zijwanden = Number(g.zijwanden);
  if (Number.isFinite(zijwanden) && zijwanden > 0) uit.zijwanden = Math.min(2, Math.floor(zijwanden));

  vlag("tent");
  vlag("shotjesbar");
  vlag("verlichting");
  vlag("klinkers");

  return uit;
}
