/** Beheer-API: Sjors' eigen handtekening één keer zetten of wijzigen. */

import {
  SLEUTEL_EIGEN_HANDTEKENING,
  instelling,
  zetInstelling,
} from "@/lib/contracten/db";
import { haalBestand, pngUitDataUrl, sleutels, zetBestand } from "@/lib/contracten/r2";
import { json, fout, metBeheerder } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return metBeheerder(req, async () => {
    const key = await instelling(SLEUTEL_EIGEN_HANDTEKENING);
    return json({ gezet: Boolean(key), key });
  });
}

/** Getekende handtekening: PNG als data-URL uit het handtekeningvak. */
export async function PUT(req: Request) {
  return metBeheerder(req, async () => {
    const body = (await req.json().catch(() => null)) as { png?: string } | null;
    if (!body?.png) return fout("Geen handtekening ontvangen.", 422);

    const bytes = pngUitDataUrl(body.png);
    if (!bytes) return fout("De handtekening kon niet worden gelezen.", 422);

    const key = sleutels.handtekeningEigen("png");
    await zetBestand(key, bytes, "image/png");
    await zetInstelling(SLEUTEL_EIGEN_HANDTEKENING, key);

    return json({ gezet: true });
  });
}

/** Geüploade handtekening: een PNG- of JPG-bestand. */
const TOEGESTAAN: Record<string, "png" | "jpg"> = {
  "image/png": "png",
  "image/jpeg": "jpg",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  return metBeheerder(req, async () => {
    const form = await req.formData().catch(() => null);
    const deel = form?.get("afbeelding");
    // In de edge-runtime is een bestandsdeel een Blob, geen File.
    if (!deel || typeof deel === "string") return fout("Geen afbeelding ontvangen.", 422);
    const bestand = deel as Blob;

    const ext = TOEGESTAAN[bestand.type];
    if (!ext) return fout("Gebruik een PNG of JPG.", 415);
    if (bestand.size > MAX_BYTES) return fout("De afbeelding is groter dan 5 MB.", 413);

    const key = sleutels.handtekeningEigen(ext);
    await zetBestand(key, await bestand.arrayBuffer(), bestand.type);
    await zetInstelling(SLEUTEL_EIGEN_HANDTEKENING, key);

    return json({ gezet: true });
  });
}

/** Handtekening weer weghalen. */
export async function DELETE(req: Request) {
  return metBeheerder(req, async () => {
    await zetInstelling(SLEUTEL_EIGEN_HANDTEKENING, "");
    return json({ gezet: false });
  });
}
