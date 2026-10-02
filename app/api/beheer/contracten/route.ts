/** Beheer-API: lijst van alle contracten + nieuw contract aanmaken. */

import { alleContracten, logEvent, maakContract } from "@/lib/contracten/db";
import { berekenOverzicht } from "@/lib/contracten/regels";
import { json, fout, metBeheerder, leesContractInvoer } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return metBeheerder(req, async () => {
    const contracten = await alleContracten();
    return json({ contracten });
  });
}

export async function POST(req: Request) {
  return metBeheerder(req, async () => {
    const body = await req.json().catch(() => null);
    const gelezen = leesContractInvoer(body);
    if (!gelezen.ok) return fout(gelezen.fouten.join(" "), 422);

    const contract = await maakContract(gelezen.invoer);
    await logEvent(contract.id, "aangemaakt", {
      ip: req.headers.get("CF-Connecting-IP"),
      userAgent: req.headers.get("User-Agent"),
    });

    return json({ contract, overzicht: berekenOverzicht(contract) }, 201);
  });
}
