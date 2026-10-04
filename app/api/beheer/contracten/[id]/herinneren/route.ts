/** Beheer-API: herinnering sturen (zelfde link, nieuw WhatsApp-bericht). */

import { contractOpId, logEvent, markeerHerinnerd } from "@/lib/contracten/db";
import { basisUrl } from "@/lib/contracten/platform";
import { json, fout, metBeheerder } from "@/lib/contracten/api";
import { whatsappBericht, klantLink } from "@/lib/contracten/berichten";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return metBeheerder(req, async () => {
    const contract = await contractOpId(params.id);
    if (!contract) return fout("Contract niet gevonden.", 404);
    if (contract.status === "concept") {
      return fout("Verstuur het contract eerst voordat u een herinnering stuurt.", 409);
    }
    if (contract.status === "ondertekend" || contract.status === "goedgekeurd") {
      return fout("Dit contract is al ondertekend.", 409);
    }

    await markeerHerinnerd(contract.id);
    await logEvent(contract.id, "herinnering");

    const bijgewerkt = await contractOpId(params.id);
    return json({
      contract: bijgewerkt,
      ...whatsappBericht(contract, "herinneren", basisUrl(req)),
      link: klantLink(contract.token, basisUrl(req)),
    });
  });
}
