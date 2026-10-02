/**
 * Beheer-API: "ondertekend op papier". Foto of scan gaat naar R2, de status
 * gaat naar 'ondertekend' en `op_papier` wordt gezet.
 */

import { contractOpId, logEvent, markeerOpPapier } from "@/lib/contracten/db";
import { sleutels, zetBestand } from "@/lib/contracten/r2";
import { json, fout, metBeheerder } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const TOEGESTAAN: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return metBeheerder(req, async () => {
    const contract = await contractOpId(params.id);
    if (!contract) return fout("Contract niet gevonden.", 404);
    if (contract.status === "ondertekend" || contract.status === "goedgekeurd") {
      return fout("Dit contract staat al als ondertekend.", 409);
    }

    const form = await req.formData().catch(() => null);
    const bestand = form?.get("bestand");
    if (!(bestand instanceof File)) return fout("Geen bestand ontvangen.", 422);

    const ext = TOEGESTAAN[bestand.type];
    if (!ext) return fout("Alleen JPG, PNG, HEIC of PDF.", 415);
    if (bestand.size > MAX_BYTES) return fout("Het bestand is groter dan 10 MB.", 413);

    const key = sleutels.papier(contract.id, ext);
    await zetBestand(key, await bestand.arrayBuffer(), bestand.type);

    const gelukt = await markeerOpPapier(contract.id, key);
    if (!gelukt) return fout("De status kon niet worden bijgewerkt.", 409);

    await logEvent(contract.id, "op_papier", {
      ip: req.headers.get("CF-Connecting-IP"),
      userAgent: req.headers.get("User-Agent"),
    });

    return json({ contract: await contractOpId(contract.id) });
  });
}
