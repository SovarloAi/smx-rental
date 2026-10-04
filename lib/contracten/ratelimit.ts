/**
 * Eenvoudige rate limiting voor de klant-API, met vaste tijdvensters in D1.
 *
 * Doel is niet een waterdichte verdediging — Cloudflare zit er al voor — maar
 * voorkomen dat iemand met tokens zit te raden of de ondertekenroute bestookt.
 */

import { db } from "./platform";

export type Limiet = { max: number; vensterSeconden: number };

export const LIMIETEN = {
  lezen: { max: 60, vensterSeconden: 60 },
  /**
   * Ruim bemeten, en met opzet. De limiet telt ook pogingen die op de
   * validatie stranden, en onze klanten zijn vaak wat ouder: iemand die een
   * paar keer een vinkje vergeet, mag daarna niet buitengesloten worden. Tegen
   * het raden van tokens beschermt deze limiet toch niet — dat doen de 32
   * willekeurige bytes van het token zelf. Hij is er alleen om herhaald
   * bestoken van de route af te remmen.
   */
  ondertekenen: { max: 30, vensterSeconden: 300 },
} as const satisfies Record<string, Limiet>;

/**
 * Telt een poging en geeft terug of die binnen de limiet valt.
 * Faalt de database, dan laten we het verzoek door (de API zelf is de echte
 * autorisatielaag; een kapotte teller mag geen klant buitensluiten).
 */
export async function binnenLimiet(
  sleutel: string,
  limiet: Limiet
): Promise<boolean> {
  const venster = Math.floor(Date.now() / 1000 / limiet.vensterSeconden);
  const bucket = `${sleutel}:${venster}`;

  try {
    await db()
      .prepare(
        `INSERT INTO ratelimit (bucket, window_start, aantal) VALUES (?, ?, 1)
         ON CONFLICT(bucket) DO UPDATE SET aantal = aantal + 1`
      )
      .bind(bucket, venster)
      .run();

    const rij = await db()
      .prepare(`SELECT aantal FROM ratelimit WHERE bucket = ?`)
      .bind(bucket)
      .first();

    const aantal = Number((rij as { aantal?: unknown } | null)?.aantal ?? 0);

    // Oude vensters af en toe opruimen, zodat de tabel niet blijft groeien.
    if (aantal === 1 && Math.random() < 0.02) {
      await db()
        .prepare(`DELETE FROM ratelimit WHERE window_start < ?`)
        .bind(venster - 10)
        .run();
    }

    return aantal <= limiet.max;
  } catch {
    return true;
  }
}

/** Het IP van de bezoeker volgens Cloudflare. */
export function bezoekerIp(req: Request): string {
  return (
    req.headers.get("CF-Connecting-IP") ||
    req.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "onbekend"
  );
}
