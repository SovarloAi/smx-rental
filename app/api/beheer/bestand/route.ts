/**
 * Beheer-API: serveert een bestand uit de privé R2-bucket. De bucket is nooit
 * publiek; alleen deze route (achter Access) kan erbij.
 */

import { haalBestand } from "@/lib/contracten/r2";
import { fout, metBeheerder } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return metBeheerder(req, async () => {
    const key = new URL(req.url).searchParams.get("key") ?? "";
    // Alleen sleutels binnen onze eigen mappen, geen pad-trucs.
    if (!/^(contracten|instellingen)\/[A-Za-z0-9._\/-]+$/.test(key) || key.includes("..")) {
      return fout("Ongeldige sleutel.", 400);
    }

    const bestand = await haalBestand(key);
    if (!bestand) return fout("Bestand niet gevonden.", 404);

    return new Response(bestand.body, {
      headers: {
        "content-type": bestand.contentType,
        "cache-control": "no-store, private",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  });
}
