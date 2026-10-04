/**
 * Cloudflare Access-controle voor /beheer en /api/beheer.
 *
 * De Access-policy op de route is de eerste laag. Deze module is de tweede: we
 * valideren de `Cf-Access-Jwt-Assertion`-header zelf tegen de publieke sleutels
 * van het Access-team en controleren de audience (AUD). Zonder die tweede laag
 * zou een verkeerd geconfigureerde route de beheer-API openzetten.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";
import { bindings } from "./platform";

export type AccessIdentiteit = { email: string; sub: string };

export class AccessFout extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessFout";
  }
}

/**
 * JWKS-sets worden per team-domein gecachet. `createRemoteJWKSet` doet zelf aan
 * caching en her-ophalen bij een onbekende sleutel.
 */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksVoor(teamDomain: string) {
  let set = jwksCache.get(teamDomain);
  if (!set) {
    set = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, set);
  }
  return set;
}

/**
 * Controleert het Access-token van het verzoek.
 *
 * Gooit een `AccessFout` als er geen geldig token is. Ontbreekt de
 * configuratie, dan gooien we óók — liever een kapotte beheerpagina dan een
 * open beheer-API.
 */
export async function vereisBeheerder(req: Request): Promise<AccessIdentiteit> {
  const env = bindings();

  // Lokale ontwikkeling: op localhost bestaat Cloudflare Access niet, dus daar
  // kun je nooit inloggen. Alleen dán, en alleen als er bewust een
  // LOKALE_BEHEERDER in .dev.vars staat, slaan we de controle over.
  //
  // Dit kan in productie niet werken: een Pages-build draait met
  // NODE_ENV === "production", waardoor deze tak nooit wordt genomen.
  if (process.env.NODE_ENV === "development") {
    const lokaal = (env as Record<string, unknown>).LOKALE_BEHEERDER;
    if (typeof lokaal === "string" && lokaal) {
      console.warn(
        "[contracten] Access-controle overgeslagen (lokale ontwikkeling, LOKALE_BEHEERDER=%s)",
        lokaal
      );
      return { email: lokaal, sub: "lokaal" };
    }
  }
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const aud = env.CF_ACCESS_AUD;

  if (!teamDomain || !aud) {
    throw new AccessFout(
      "Cloudflare Access is niet geconfigureerd (CF_ACCESS_TEAM_DOMAIN of CF_ACCESS_AUD ontbreekt)."
    );
  }

  const token =
    req.headers.get("Cf-Access-Jwt-Assertion") ||
    leesCookie(req, "CF_Authorization");

  if (!token) {
    throw new AccessFout("Geen Access-token aanwezig.");
  }

  try {
    const { payload } = await jwtVerify(token, jwksVoor(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience: aud,
    });
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) throw new AccessFout("Access-token bevat geen e-mailadres.");
    return { email, sub: String(payload.sub ?? "") };
  } catch (e) {
    if (e instanceof AccessFout) throw e;
    throw new AccessFout("Access-token is ongeldig of verlopen.");
  }
}

function leesCookie(req: Request, naam: string): string | null {
  const cookie = req.headers.get("Cookie");
  if (!cookie) return null;
  for (const deel of cookie.split(";")) {
    const [k, ...rest] = deel.trim().split("=");
    if (k === naam) return rest.join("=");
  }
  return null;
}
