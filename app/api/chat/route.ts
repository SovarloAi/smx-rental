import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// Strikte system prompt: alleen oppervlakkige basisinfo, altijd doorverwijzen.
const SYSTEM_PROMPT = `Je bent de chatassistent van SMX Rental, een stretchtent-verhuurbedrijf in Neer, Limburg.

Beschikbare basisinformatie (gebruik UITSLUITEND dit):
- Prijzen: stretchtent €550,- per weekend, ShotjesBar €380,- per weekend.
- Inbegrepen: op- en afbouw zit altijd inbegrepen; opties zijn verlichting (€30,-) en zijwanden (€50,- per zijwand).
- Werkgebied: tot maximaal 75 km (rijafstand) vanaf Neer; ook over de grens in overleg.
- Afmetingen: de stretchtent is 7,5 × 10 meter (ruim 75 m²); inclusief spandraden is ongeveer 10,5 × 13 meter ruimte nodig.
- Capaciteit: ruimte voor ongeveer 70 tot 100 gasten.
- Ondergrond: gras is ideaal; klinkers in overleg; beton/asfalt en grind zijn niet geschikt.
- Op- en afbouw: doorgaans opbouw op vrijdagavond en afbouw op zondagochtend, altijd in overleg.
- Boeken: via de knop "Bereken prijs" op de site stelt u in een paar stappen uw aanvraag samen en verstuurt u die via WhatsApp.
- Beschikbaarheid: bevestigen we na ontvangst van de aanvraag (geef nooit exacte data of garanties).
- Annulering: binnen 7 dagen voor aanvang 25% van het huurbedrag, binnen 48 uur 50%.
- De ShotjesBar is een omgebouwde Volkswagen Golf Cabriolet en bevat o.a. 50+ shotjes, 10 merken sterke drank en een spel.
- Het tentdoek is brandveilig gecertificeerd.

Regels:
1. Beantwoord standaardvragen kort en behulpzaam met bovenstaande informatie (max 2-3 zinnen, in de u-vorm).
2. Geef NOOIT te diepgaande of te gedetailleerde informatie; verzin niets en gebruik geen kennis buiten bovenstaande punten.
3. Bij diepgaande of specifieke vragen (bijv. of een specifieke tuin/locatie geschikt is, exacte beschikbaarheid op een datum, contractvoorwaarden, juridische vragen, of onderhandelen over prijs): geef GEEN inhoudelijk antwoord, maar verwijs vriendelijk door naar persoonlijk contact.
- Geef nooit een mening, nooit garanties over beschikbaarheid, en doe nooit toezeggingen namens SMX Rental.
- Noem NOOIT een telefoonnummer, e-mailadres of internetlink letterlijk. Verwijs in plaats daarvan naar de contactknoppen onderaan de chat, bijvoorbeeld: "via de knoppen hieronder kunt u ons bereiken via WhatsApp, telefoon of e-mail".`;

const FALLBACK =
  "Dat bespreken we graag even persoonlijk. Via de knoppen hieronder kunt u ons bereiken via WhatsApp, telefoon of e-mail — we helpen u graag verder!";

const CONTACT_SUFFIX =
  " Voor specifieke vragen kunt u ons via de knoppen hieronder bereiken via WhatsApp, telefoon of e-mail.";

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Draagbare timeout (Edge-/Cloudflare-veilig). */
function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/**
 * Lichte, regel-gebaseerde beantwoorder voor veelgestelde vragen. Wordt gebruikt
 * wanneer er geen Anthropic-sleutel is ingesteld of de AI tijdelijk onbereikbaar
 * is, zodat de chatbot ook dan zinnige antwoorden geeft i.p.v. één vaste tekst.
 */
function ruleBasedReply(text: string): string | null {
  const t = text.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  // Bedankt
  if (has("bedankt", "dank je", "dank u", "thanks", "top, dank")) {
    return "Graag gedaan! Heeft u nog een vraag, dan hoor ik het graag.";
  }
  // ShotjesBar (vóór de algemene tentprijs)
  if (has("shotjes", "shotjesbar", "borrel", "cabrio")) {
    return (
      "De ShotjesBar (een omgebouwde Volkswagen Golf Cabriolet) huurt u voor €380,- per weekend, exclusief reiskosten — leuk te combineren met de tent." +
      CONTACT_SUFFIX
    );
  }
  // Capaciteit
  if (has("hoeveel mensen", "hoeveel personen", "hoeveel gasten", "capaciteit", "personen", "gasten", "mensen passen", "aantal mensen")) {
    return "Onder de tent is plek voor ongeveer 70 tot 100 gasten." + CONTACT_SUFFIX;
  }
  // Afmetingen
  if (has("afmeting", "hoe groot", "formaat", "maat", "meter", "m2", "m²", "oppervlak", "grootte")) {
    return (
      "De stretchtent is 7,5 × 10 meter (ruim 75 m²). Inclusief de spandraden is er ongeveer 10,5 × 13 meter ruimte nodig." +
      CONTACT_SUFFIX
    );
  }
  // Ondergrond / geschiktheid
  if (has("ondergrond", "geschikt", "gras", "klinker", "beton", "asfalt", "grind", "tuin", "tegel")) {
    return (
      "Gras is ideaal; klinkers kan in overleg; beton/asfalt en grind zijn niet geschikt. In de configurator checkt u dit direct voor uw locatie." +
      CONTACT_SUFFIX
    );
  }
  // Boeken / reserveren
  if (has("boek", "reserve", "aanvraag", "aanvragen", "bestel", "huren", "regelen", "hoe werkt")) {
    return (
      "Via de knop 'Bereken prijs' stelt u in een paar stappen uw aanvraag samen en verstuurt u die direct via WhatsApp." +
      CONTACT_SUFFIX
    );
  }
  // Op- en afbouw (vóór beschikbaarheid, zodat "wanneer bouwen jullie op" hier valt)
  if (has("opbouw", "afbouw", "opbouwen", "afbreken", "opzetten", "bouwen")) {
    return (
      "Op- en afbouw verzorgen wij altijd zelf — meestal opbouw op vrijdagavond en afbouw op zondagochtend, in overleg." +
      CONTACT_SUFFIX
    );
  }
  // Beschikbaarheid / datum
  if (has("beschikbaar", "datum", "wanneer", "vrij", "weekend", "agenda")) {
    return (
      "We bevestigen de beschikbaarheid zodra we uw aanvraag hebben ontvangen." + CONTACT_SUFFIX
    );
  }
  // Annulering
  if (has("annuler", "afzeggen", "afzegging", "annulatie")) {
    return (
      "Bij annulering geldt: binnen 7 dagen voor aanvang 25% van het huurbedrag, binnen 48 uur 50%." +
      CONTACT_SUFFIX
    );
  }
  // Verlichting / zijwanden / inbegrepen / opties
  if (has("inbegrepen", "inclusief", "verlichting", "zijwand", "opties", "extra")) {
    return (
      "Op- en afbouw zit altijd inbegrepen. Daarnaast kunt u kiezen voor verlichting (€30,-) en zijwanden (€50,- per zijwand)." +
      CONTACT_SUFFIX
    );
  }
  // Brandveilig
  if (has("brandveilig", "brand", "veilig", "vergunning", "certific")) {
    return "Het tentdoek is brandveilig gecertificeerd." + CONTACT_SUFFIX;
  }
  // Werkgebied / afstand / transport
  if (has("werkgebied", "afstand", "km", "kilometer", "ver", "rijden", "regio", "bezorg", "transport", "reiskost", "leveren")) {
    return (
      "We rijden standaard tot maximaal 75 km (rijafstand) vanaf Neer; verder weg is in overleg vaak mogelijk." +
      CONTACT_SUFFIX
    );
  }
  // Prijs / tent (algemener, daarom verder naar onder)
  if (has("kost", "prijs", "tarief", "euro", "€", "hoeveel", "duur", "tent", "stretch")) {
    return (
      "Het weekendtarief voor de stretchtent is €550,- (inclusief op- en afbouw)." + CONTACT_SUFFIX
    );
  }
  // Contact
  if (has("contact", "bellen", "telefoon", "mail", "whatsapp", "bereiken")) {
    return "Via de knoppen hieronder kunt u ons bereiken via WhatsApp, telefoon of e-mail. We helpen u graag verder!";
  }
  // Begroeting
  if (has("hoi", "hallo", "hey", "goede", "goedemiddag", "goedemorgen", "dag")) {
    return "Hoi! Stel gerust uw vraag over de stretchtent, ShotjesBar, prijzen, afmetingen of het werkgebied.";
  }
  return null;
}

/** Roept de Anthropic Messages API rechtstreeks via fetch aan (Edge-compatibel). */
async function askClaude(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    }),
    signal: timeoutSignal(20000),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
}

export async function POST(request: Request) {
  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reply: FALLBACK });
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== ""
    )
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  // Eerste bericht moet van de gebruiker zijn.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (messages.length === 0) {
    return NextResponse.json({ reply: FALLBACK });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Geen API-sleutel → meteen de regel-gebaseerde beantwoorder.
  if (!apiKey) {
    return NextResponse.json({ reply: ruleBasedReply(lastUser) ?? FALLBACK });
  }

  try {
    const reply = await askClaude(apiKey, messages);
    return NextResponse.json({ reply: reply || ruleBasedReply(lastUser) || FALLBACK });
  } catch {
    // AI tijdelijk onbereikbaar → val terug op de regel-gebaseerde beantwoorder.
    return NextResponse.json({ reply: ruleBasedReply(lastUser) ?? FALLBACK });
  }
}
