// TIJDELIJK — alleen om te bepalen hoe env-variabelen op Cloudflare binnenkomen.
// Geeft uitsluitend ja/nee per naam terug, nooit een waarde. Wordt direct na
// de diagnose weer verwijderd.
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const NAMEN = [
  "ANTHROPIC_API_KEY",
  "CF_ACCESS_TEAM_DOMAIN",
  "CF_ACCESS_AUD",
  "CONTRACT_BASIS_URL",
];

export async function GET() {
  let ctxEnv: Record<string, unknown> = {};
  let ctxFout: string | null = null;
  try {
    ctxEnv = getRequestContext().env as unknown as Record<string, unknown>;
  } catch (e) {
    ctxFout = String((e as Error)?.message ?? e).slice(0, 120);
  }

  const rij = (n: string) => ({
    naam: n,
    procesEnv: typeof process !== "undefined" && Boolean(process.env?.[n]),
    requestContext: Boolean(ctxEnv?.[n]),
  });

  return Response.json({
    requestContextFout: ctxFout,
    bindingsZichtbaar: { DB: Boolean(ctxEnv?.DB), BESTANDEN: Boolean(ctxEnv?.BESTANDEN) },
    variabelen: NAMEN.map(rij),
  });
}
