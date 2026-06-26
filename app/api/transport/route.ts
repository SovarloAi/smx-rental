import { NextResponse } from "next/server";
import {
  NEER,
  haversineKm,
  parsePostcode,
  transportFromDistance,
  type TransportResult,
} from "@/lib/transport";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Geo = { lat: number; lon: number; place: string | null };

/** Draagbare timeout (Edge-/Cloudflare-veilig, geen AbortSignal.timeout nodig). */
function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/**
 * Geocodeert een NL-postcode via de PDOK Locatieserver (officiële NL-geocoder).
 * Geeft nauwkeurige coördinaten + de echte woonplaatsnaam terug.
 */
async function geocodePDOK(postcode: string): Promise<Geo | null> {
  try {
    const q = encodeURIComponent(postcode.trim());
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${q}&fq=type:postcode&rows=1&fl=woonplaatsnaam,gemeentenaam,centroide_ll`;
    const res = await fetch(url, { signal: timeoutSignal(6000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      response?: {
        docs?: Array<{
          woonplaatsnaam?: string;
          gemeentenaam?: string;
          centroide_ll?: string;
        }>;
      };
    };
    const doc = data.response?.docs?.[0];
    if (!doc?.centroide_ll) return null;
    // centroide_ll = "POINT(lon lat)"
    const m = doc.centroide_ll.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!m) return null;
    return {
      lon: parseFloat(m[1]),
      lat: parseFloat(m[2]),
      place: doc.woonplaatsnaam ?? doc.gemeentenaam ?? null,
    };
  } catch {
    return null;
  }
}

/** Fallback-geocoder via Nominatim (OpenStreetMap). */
async function geocodeNominatim(code: number): Promise<Geo | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${code}&countrycodes=nl&format=jsonv2&addressdetails=1&limit=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SMX-Rental-Website/1.0 (smxrental@gmail.com)",
        "Accept-Language": "nl",
      },
      signal: timeoutSignal(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      address?: { village?: string; town?: string; city?: string; municipality?: string };
    }>;
    const hit = data[0];
    if (!hit) return null;
    const a = hit.address ?? {};
    return {
      lat: parseFloat(hit.lat),
      lon: parseFloat(hit.lon),
      place: a.village ?? a.town ?? a.city ?? a.municipality ?? null,
    };
  } catch {
    return null;
  }
}

/** Haalt de rijafstand (km, enkele reis, via de weg) op via OSRM. */
async function drivingDistanceKm(dest: { lat: number; lon: number }): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${NEER.lon},${NEER.lat};${dest.lon},${dest.lat}?overview=false`;
    const res = await fetch(url, { signal: timeoutSignal(6000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { routes?: Array<{ distance: number }> };
    const meters = data.routes?.[0]?.distance;
    if (typeof meters !== "number") return null;
    return meters / 1000;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("postcode") ?? "";
  const code = parsePostcode(raw);

  const invalid: TransportResult = {
    ok: false,
    distanceKm: 0,
    cost: 0,
    free: false,
    region: null,
    error: "Vul een geldige 4-cijferige postcode in (bijv. 6086).",
  };

  if (code === null) return NextResponse.json(invalid);

  // 1) Echte coördinaten + plaatsnaam via PDOK, anders Nominatim.
  //    Lukt geen van beide, dan bestaat de postcode (vermoedelijk) niet:
  //    geef een duidelijke fout i.p.v. terug te vallen op een grove regio.
  const geo: Geo | null = (await geocodePDOK(raw)) ?? (await geocodeNominatim(code));
  if (!geo) {
    return NextResponse.json({
      ...invalid,
      error: "De postcode wordt niet herkend. Probeer een andere postcode.",
    } satisfies TransportResult);
  }

  // 2) Rijafstand via de weg (OSRM); fallback hemelsbreed × 1,3.
  const road = await drivingDistanceKm({ lat: geo.lat, lon: geo.lon });
  const distanceKm =
    road !== null
      ? Math.round(road)
      : Math.round(haversineKm(NEER, { lat: geo.lat, lon: geo.lon }) * 1.3);

  return NextResponse.json(transportFromDistance(distanceKm, geo.place));
}
