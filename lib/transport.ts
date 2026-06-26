/**
 * Transportkostenberekening voor SMX Rental.
 *
 * Basislocatie: Neer, Limburg (51.2717° N, 5.9836° O).
 * Een boeking telt 4 ritten (op- en afbouw, telkens heen en terug). Van elke
 * rit zijn de eerste 10 km gratis (samen 40 km vrijgesteld). De rest wordt
 * gerekend tegen €0,85/km:
 *   kosten = max(0, 4 × enkele_reisafstand − 40) × €0,85
 * Maximale enkele reis (rijafstand): 75 km.
 *
 * De rijafstand komt primair via /api/transport (PDOK geocode + OSRM-route);
 * deze module bevat de rekenlogica en een hemelsbrede fallback op postcodegebied.
 */

export const NEER = { lat: 51.2717, lon: 5.9836 } as const;

export const FREE_RADIUS_KM = 10; // eerste 10 km per rit gratis
export const MAX_DISTANCE_KM = 75; // max enkele reis (rijafstand) vanaf Neer
export const PRICE_PER_KM = 0.85;
export const NUM_TRIPS = 4; // 2 ritten opbouw (heen+terug) + 2 ritten afbouw
export const FREE_KM_TOTAL = NUM_TRIPS * FREE_RADIUS_KM; // 4 × 10 = 40 km vrijgesteld

/** Tarieven (in euro). */
export const WEEKEND_RATE = 550; // stretchtent basis, per weekend
export const EXTRA_DAY_RATE = 75; // per extra dag, incl. op/afbouw
export const LIGHTING_PRICE = 30; // verlichting, per weekend
export const SIDEWALL_PRICE = 50; // per zijwand, per weekend
export const SHOTJESBAR_PRICE = 380; // shotjesbar, per weekend

/** Haversine-afstand in kilometers tussen twee coördinaten. */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371; // straal aarde in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Benadering van coördinaten op basis van het eerste cijfer-gebied van een
 * Nederlandse postcode. Dit is een grove maar bruikbare client-side schatting
 * voor een indicatieve transportprijs; de definitieve prijs bevestigen we
 * altijd in de aanvraag.
 */
const POSTCODE_REGIONS: { range: [number, number]; lat: number; lon: number; label: string }[] = [
  { range: [1000, 1299], lat: 52.3676, lon: 4.9041, label: "Amsterdam e.o." },
  { range: [1300, 1379], lat: 52.3508, lon: 5.2647, label: "Almere" },
  { range: [1380, 1969], lat: 52.4, lon: 4.8, label: "Noord-Holland" },
  { range: [1970, 2199], lat: 52.4574, lon: 4.6092, label: "IJmond" },
  { range: [2200, 2699], lat: 52.0705, lon: 4.3007, label: "Den Haag e.o." },
  { range: [2700, 3299], lat: 51.9244, lon: 4.4777, label: "Rotterdam e.o." },
  { range: [3300, 3399], lat: 51.8133, lon: 4.6697, label: "Dordrecht" },
  { range: [3400, 3699], lat: 52.0907, lon: 5.1214, label: "Utrecht" },
  { range: [3700, 3999], lat: 52.0907, lon: 5.1214, label: "Utrecht e.o." },
  { range: [4000, 4299], lat: 51.8858, lon: 5.2, label: "Rivierenland" },
  { range: [4300, 4699], lat: 51.4988, lon: 3.6111, label: "Zeeland" },
  { range: [4700, 4899], lat: 51.5851, lon: 4.7755, label: "West-Brabant" },
  { range: [4900, 5199], lat: 51.5555, lon: 5.0913, label: "Tilburg e.o." },
  { range: [5200, 5399], lat: 51.6978, lon: 5.3037, label: "'s-Hertogenbosch" },
  { range: [5400, 5499], lat: 51.6622, lon: 5.6116, label: "Uden / Veghel" },
  { range: [5500, 5799], lat: 51.4416, lon: 5.4697, label: "Eindhoven e.o." },
  { range: [5800, 5899], lat: 51.5417, lon: 5.92, label: "Venray e.o." },
  { range: [5900, 6099], lat: 51.3704, lon: 6.1724, label: "Venlo e.o." },
  { range: [6100, 6199], lat: 51.2517, lon: 5.9836, label: "Roermond / Neer" },
  { range: [6200, 6299], lat: 50.8514, lon: 5.6909, label: "Maastricht" },
  { range: [6300, 6399], lat: 50.8882, lon: 5.9795, label: "Heuvelland" },
  { range: [6400, 6499], lat: 50.888, lon: 5.9795, label: "Heerlen e.o." },
  { range: [6500, 6699], lat: 51.8126, lon: 5.8372, label: "Nijmegen e.o." },
  { range: [6700, 6799], lat: 51.9692, lon: 5.6654, label: "Wageningen e.o." },
  { range: [6800, 6999], lat: 51.9851, lon: 5.8987, label: "Arnhem e.o." },
  { range: [7000, 7299], lat: 51.9645, lon: 6.2911, label: "Achterhoek" },
  { range: [7300, 7399], lat: 52.2112, lon: 5.9699, label: "Apeldoorn" },
  { range: [7400, 7799], lat: 52.2659, lon: 6.7944, label: "Twente / Salland" },
  { range: [7800, 7999], lat: 52.7792, lon: 6.9069, label: "Drenthe" },
  { range: [8000, 8299], lat: 52.5168, lon: 6.083, label: "Zwolle e.o." },
  { range: [8300, 8499], lat: 52.7064, lon: 5.7508, label: "Noordoostpolder" },
  { range: [8500, 8999], lat: 53.0, lon: 5.8, label: "Friesland" },
  { range: [9000, 9299], lat: 53.2194, lon: 6.5665, label: "Groningen e.o." },
  { range: [9300, 9999], lat: 53.1, lon: 6.8, label: "Noord-Groningen" },
];

export type TransportResult = {
  ok: boolean;
  /** Afgeronde afstand (enkele reis) in km. */
  distanceKm: number;
  /** Totale transportkosten in euro (heen en terug). */
  cost: number;
  /** Is transport gratis (binnen straal)? */
  free: boolean;
  /** Herkende regio op basis van postcode, of null. */
  region: string | null;
  /** Foutmelding bij ongeldige postcode. */
  error?: string;
};

/** Haalt het 4-cijferige getal uit een postcode-invoer (bv. "6086 AB" → 6086). */
export function parsePostcode(input: string): number | null {
  const match = input.trim().match(/\b(\d{4})\b/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num < 1000 || num > 9999) return null;
  return num;
}

/** Zoekt de benaderende regio (centroïde + label) voor een 4-cijferige postcode. */
export function regionForCode(code: number) {
  return (
    POSTCODE_REGIONS.find((r) => code >= r.range[0] && code <= r.range[1]) ??
    null
  );
}

/** Rekent een afstand (enkele reis, km) om naar een TransportResult. */
export function transportFromDistance(
  distanceKm: number,
  region: string | null
): TransportResult {
  if (distanceKm > MAX_DISTANCE_KM) {
    return {
      ok: false,
      distanceKm,
      cost: 0,
      free: false,
      region,
      error: "Helaas is dit niet mogelijk.",
    };
  }
  // 4 ritten (op- + afbouw, heen + terug) minus 40 km totale vrijstelling.
  const totalDriven = distanceKm * NUM_TRIPS;
  const billableKm = Math.max(0, totalDriven - FREE_KM_TOTAL);
  // Altijd naar boven afronden op hele euro's.
  const cost = Math.ceil(billableKm * PRICE_PER_KM);
  const free = cost === 0;
  return { ok: true, distanceKm, cost, free, region };
}

/**
 * Berekent transportkosten hemelsbreed (Haversine) op basis van een postcode.
 * Wordt gebruikt als client-side fallback wanneer de route-API niet bereikbaar
 * is; de primaire berekening (rijafstand) loopt via /api/transport.
 */
export function calcTransport(postcodeInput: string): TransportResult {
  const code = parsePostcode(postcodeInput);

  if (code === null) {
    return {
      ok: false,
      distanceKm: 0,
      cost: 0,
      free: false,
      region: null,
      error: "Vul een geldige 4-cijferige postcode in (bijv. 6086).",
    };
  }

  const region = regionForCode(code);

  if (!region) {
    return {
      ok: false,
      distanceKm: 0,
      cost: 0,
      free: false,
      region: null,
      error: "Postcode niet herkend. We checken dit graag persoonlijk met u.",
    };
  }

  const rawKm = haversineKm(NEER, { lat: region.lat, lon: region.lon });
  return transportFromDistance(Math.round(rawKm), region.label);
}

/** Formatteert een euro-bedrag als "€500,-" of "€42,-". */
export function formatEuro(amount: number): string {
  return `€${amount.toLocaleString("nl-NL")},-`;
}
