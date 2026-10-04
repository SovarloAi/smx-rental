/** Beheer-API: één contract ophalen, wijzigen of verwijderen. */

import {
  contractOpId,
  eventsVan,
  logEvent,
  verwijderContract,
  wijzigContract,
} from "@/lib/contracten/db";
import { verwijderMapVanContract } from "@/lib/contracten/r2";
import { overzichtVan } from "@/lib/contracten/regels";
import { json, fout, metBeheerder, leesContractInvoer } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  return metBeheerder(req, async () => {
    const contract = await contractOpId(params.id);
    if (!contract) return fout("Contract niet gevonden.", 404);
    return json({
      contract,
      overzicht: overzichtVan(contract),
      events: await eventsVan(contract.id),
    });
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  return metBeheerder(req, async () => {
    const bestaand = await contractOpId(params.id);
    if (!bestaand) return fout("Contract niet gevonden.", 404);
    if (bestaand.status === "ondertekend" || bestaand.status === "goedgekeurd") {
      return fout("Een ondertekend contract kan niet meer worden bewerkt.", 409);
    }

    const body = await req.json().catch(() => null);
    const gelezen = leesContractInvoer(body);
    if (!gelezen.ok) return fout(gelezen.fouten.join(" "), 422);

    const contract = await wijzigContract(params.id, gelezen.invoer);
    await logEvent(contract.id, "gewijzigd");

    return json({ contract, overzicht: overzichtVan(contract) });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return metBeheerder(req, async () => {
    const bestaand = await contractOpId(params.id);
    if (!bestaand) return fout("Contract niet gevonden.", 404);

    await verwijderMapVanContract(params.id);
    await verwijderContract(params.id);
    return json({ ok: true });
  });
}
