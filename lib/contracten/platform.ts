/**
 * Toegang tot de Cloudflare-bindings (D1 en R2).
 *
 * In productie draait dit op Cloudflare Pages via `@cloudflare/next-on-pages`;
 * lokaal levert `setupDevPlatform()` in next.config.js dezelfde bindings via
 * miniflare, op basis van `wrangler.dev.toml`.
 */

import { getRequestContext } from "@cloudflare/next-on-pages";
// Expliciet importeren (niet als globale types), zodat de DOM-typen van de
// React-componenten niet overschreven worden door de Workers-varianten.
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export type Bindings = {
  DB: D1Database;
  BESTANDEN: R2Bucket;
  RESEND_API_KEY?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  CONTRACT_BASIS_URL?: string;
  /** Alleen lokaal: slaat de Access-controle over. Zie access.ts. */
  LOKALE_BEHEERDER?: string;
};

/**
 * Geeft de bindings van het huidige request. Gooit een duidelijke fout als de
 * binding ontbreekt — dat betekent vrijwel altijd dat hij in het Cloudflare
 * Pages-dashboard (of in wrangler.dev.toml) nog niet gekoppeld is.
 */
export function bindings(): Bindings {
  const env = getRequestContext().env as unknown as Partial<Bindings>;
  return env as Bindings;
}

export function db(): D1Database {
  const { DB } = bindings();
  if (!DB) {
    throw new Error(
      "D1-binding 'DB' ontbreekt. Koppel de database in het Pages-dashboard " +
        "(Settings → Bindings) of in wrangler.dev.toml voor lokale ontwikkeling."
    );
  }
  return DB;
}

export function bucket(): R2Bucket {
  const { BESTANDEN } = bindings();
  if (!BESTANDEN) {
    throw new Error(
      "R2-binding 'BESTANDEN' ontbreekt. Koppel de bucket in het Pages-dashboard " +
        "(Settings → Bindings) of in wrangler.dev.toml voor lokale ontwikkeling."
    );
  }
  return BESTANDEN;
}

/**
 * Basis-URL voor links in berichten en e-mails.
 *
 * We leiden hem af van het verzoek zelf. Zo wijst een link die je op de preview
 * aanmaakt naar de preview, en een link vanaf smxrental.com naar de live site —
 * zonder dat daar een instelling voor goed moet staan. `CONTRACT_BASIS_URL`
 * blijft als noodgreep bestaan voor het geval de herkomst niet te bepalen is.
 */
export function basisUrl(req?: Request): string {
  if (req) {
    try {
      return new URL(req.url).origin;
    } catch {
      /* onbruikbare URL; val terug op de instelling */
    }
  }
  return bindings().CONTRACT_BASIS_URL?.replace(/\/$/, "") || "https://smxrental.com";
}
