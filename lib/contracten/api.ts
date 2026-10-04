/**
 * Gedeelde helpers voor de API-routes: JSON-antwoorden, de Access-guard en het
 * valideren van binnenkomende contractgegevens.
 */

import { AccessFout, vereisBeheerder } from "./access";
import type { ContractInvoer } from "./types";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Niets van de contractmodule mag in een cache belanden.
      "cache-control": "no-store, private",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

export function fout(bericht: string, status = 400): Response {
  return json({ fout: bericht }, status);
}

/**
 * Controleert of een verzoek van onze eigen pagina's komt.
 *
 * Cloudflare Access werkt met een cookie. Zonder deze controle zou een
 * kwaadaardige website een formulier naar /api/beheer kunnen sturen terwijl
 * Sjors is ingelogd: de browser stuurt het cookie mee, Access laat het door en
 * de actie wordt uitgevoerd. Voor alles wat iets wijzigt eisen we daarom dat
 * het verzoek aantoonbaar van onze eigen oorsprong komt.
 */
function zelfdeHerkomst(req: Request): boolean {
  const site = req.headers.get("Sec-Fetch-Site");
  if (site) return site === "same-origin";

  // Oudere browsers sturen Sec-Fetch-Site niet; dan valt Origin terug.
  const origin = req.headers.get("Origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

const LEEST_ALLEEN = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Voert een beheerhandeling uit achter de Access-controle. Bij een ontbrekend
 * of ongeldig token komt er een 403 en nooit inhoudelijke informatie.
 */
export async function metBeheerder(
  req: Request,
  handler: (identiteit: { email: string; sub: string }) => Promise<Response>
): Promise<Response> {
  if (!LEEST_ALLEEN.has(req.method) && !zelfdeHerkomst(req)) {
    return fout("Dit verzoek komt niet van de beheerpagina.", 403);
  }

  try {
    const identiteit = await vereisBeheerder(req);
    return await handler(identiteit);
  } catch (e) {
    if (e instanceof AccessFout) {
      return fout("Geen toegang.", 403);
    }
    console.error("Beheer-API-fout:", e);
    return fout("Er ging iets mis.", 500);
  }
}

/* ------------------------------------------------------------------ */
/*  Validatie                                                         */
/* ------------------------------------------------------------------ */

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const TIJD = /^\d{2}:\d{2}$/;

/**
 * Leest een tekstveld van één regel. Stuurtekens en regeleindes gaan eruit:
 * ze horen niet in een naam of adres, zien er raar uit in de PDF, en een
 * regeleinde in een naam zou in het onderwerp van een e-mail terechtkomen.
 */
function tekst(waarde: unknown, max = 500): string {
  if (typeof waarde !== "string") return "";
  return waarde
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Meerregelig veld: regeleindes blijven, andere stuurtekens niet. */
function tekstMeerRegels(waarde: unknown, max = 2000): string {
  if (typeof waarde !== "string") return "";
  return waarde
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((r) => r.trim())
    .join("\n")
    .trim()
    .slice(0, max);
}

/**
 * Telefoonnummer. Filteren op toegestane tekens is niet genoeg: uit
 * `06-1234 5678" onmouseover="alert(1)` blijven dan de cijfers van `alert(1)`
 * staan en krijg je een verkeerd WhatsApp-nummer. We zoeken daarom de eerste
 * reeks die er écht als een telefoonnummer uitziet en gooien de rest weg.
 */
function telefoon(waarde: unknown): string {
  if (typeof waarde !== "string") return "";
  const gevonden = waarde.match(/\+?\d[\d\s()-]{4,19}/);
  if (!gevonden) return "";
  // Randen zonder cijfer eraf: een losse "(" of "-" hoort er niet bij.
  const nummer = gevonden[0].replace(/^[^\d+]+/, "").replace(/[^\d)]+$/, "").trim();
  const cijfers = nummer.replace(/\D/g, "").length;
  if (cijfers < 6 || cijfers > 15) return "";
  return nummer.slice(0, 40);
}

export type Validatie =
  | { ok: true; invoer: ContractInvoer }
  | { ok: false; fouten: string[] };

/**
 * Leest en controleert de velden van het beheerformulier. Bedragen komen binnen
 * in hele euro's (zo vult Sjors ze in) en worden hier naar centen omgezet.
 */
export function leesContractInvoer(body: unknown): Validatie {
  const b = (body ?? {}) as Record<string, unknown>;
  const fouten: string[] = [];

  const invoer: ContractInvoer = {
    klantNaam: tekst(b.klantNaam, 120),
    klantAdres: tekst(b.klantAdres, 160),
    klantPostcodePlaats: tekst(b.klantPostcodePlaats, 120),
    klantTelefoon: telefoon(b.klantTelefoon),
    klantEmail: tekst(b.klantEmail, 160),
    plaatsingsadres: tekst(b.plaatsingsadres, 200),

    feestDatum: tekst(b.feestDatum, 10),
    opbouwDatum: tekst(b.opbouwDatum, 10),
    opbouwTijd: tekst(b.opbouwTijd, 5) || "19:00",
    afbouwDatum: tekst(b.afbouwDatum, 10),
    afbouwTijd: tekst(b.afbouwTijd, 5) || "11:00",

    tent: Boolean(b.tent),
    shotjesbar: Boolean(b.shotjesbar),
    extraDagen: Math.max(0, Math.floor(Number(b.extraDagen) || 0)),
    verlichting: Boolean(b.verlichting),
    zijwanden: Math.max(0, Math.floor(Number(b.zijwanden) || 0)),
    zijwandExtraDagen: Math.max(0, Math.floor(Number(b.zijwandExtraDagen) || 0)),
    klinkers: Boolean(b.klinkers),
    transportCent: euroNaarCent(b.transportEuro ?? b.transportCent, "transportCent" in b),
    afspraken: tekstMeerRegels(b.afspraken, 2000),
  };

  if (!invoer.klantNaam) fouten.push("Vul de naam van de klant in.");
  if (!invoer.klantTelefoon && !invoer.klantEmail) {
    fouten.push("Vul een telefoonnummer of een e-mailadres in — anders kunt u het contract niet versturen.");
  }
  if (!invoer.tent && !invoer.shotjesbar) {
    fouten.push("Kies minstens één product: de stretchtent, de Shotjesbar, of allebei.");
  }
  if (!DATUM.test(invoer.feestDatum)) fouten.push("Vul een geldige feestdatum in.");
  if (!DATUM.test(invoer.opbouwDatum)) fouten.push("Vul een geldige opbouwdatum in.");
  if (!DATUM.test(invoer.afbouwDatum)) fouten.push("Vul een geldige afbouwdatum in.");
  if (!TIJD.test(invoer.opbouwTijd)) fouten.push("Opbouwtijd moet als uu:mm.");
  if (!TIJD.test(invoer.afbouwTijd)) fouten.push("Afbouwtijd moet als uu:mm.");
  if (invoer.afbouwDatum && invoer.opbouwDatum && invoer.afbouwDatum < invoer.opbouwDatum) {
    fouten.push("De afbouwdatum ligt vóór de opbouwdatum.");
  }
  if (invoer.zijwanden > 2) fouten.push("Er zijn maximaal 2 zijwanden beschikbaar.");
  if (invoer.zijwandExtraDagen > invoer.extraDagen) {
    fouten.push("De zijwanden kunnen niet langer blijven staan dan het aantal extra huurdagen.");
  }
  if (invoer.klantEmail && !/^\S+@\S+\.\S+$/.test(invoer.klantEmail)) {
    fouten.push("Het e-mailadres ziet er niet geldig uit.");
  }

  return fouten.length ? { ok: false, fouten } : { ok: true, invoer };
}

/** Accepteert zowel een bedrag in euro's als een al omgerekend centbedrag. */
function euroNaarCent(waarde: unknown, alCenten: boolean): number {
  const n = Number(waarde);
  if (!Number.isFinite(n) || n < 0) return 0;
  return alCenten ? Math.round(n) : Math.round(n * 100);
}
