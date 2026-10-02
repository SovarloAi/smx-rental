/** Beheer-API: Sjors' eigen handtekening één keer zetten of wijzigen. */

import {
  SLEUTEL_EIGEN_HANDTEKENING,
  instelling,
  zetInstelling,
} from "@/lib/contracten/db";
import { pngUitDataUrl, sleutels, zetBestand } from "@/lib/contracten/r2";
import { json, fout, metBeheerder } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return metBeheerder(req, async () => {
    const key = await instelling(SLEUTEL_EIGEN_HANDTEKENING);
    return json({ gezet: Boolean(key) });
  });
}

export async function PUT(req: Request) {
  return metBeheerder(req, async () => {
    const body = (await req.json().catch(() => null)) as { png?: string } | null;
    if (!body?.png) return fout("Geen handtekening ontvangen.", 422);

    const bytes = pngUitDataUrl(body.png);
    if (!bytes) return fout("De handtekening kon niet worden gelezen.", 422);

    const key = sleutels.handtekeningEigen();
    await zetBestand(key, bytes, "image/png");
    await zetInstelling(SLEUTEL_EIGEN_HANDTEKENING, key);

    return json({ gezet: true });
  });
}
