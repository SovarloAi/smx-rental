/** Beheer-API: melding "nieuw ondertekend" in het overzicht wegklikken. */

import { contractOpId, markeerGezien } from "@/lib/contracten/db";
import { json, fout, metBeheerder } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return metBeheerder(req, async () => {
    const contract = await contractOpId(params.id);
    if (!contract) return fout("Contract niet gevonden.", 404);
    await markeerGezien(contract.id);
    return json({ ok: true });
  });
}
