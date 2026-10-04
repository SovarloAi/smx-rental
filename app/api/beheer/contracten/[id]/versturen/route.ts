/**
 * Beheer-API: markeert een contract als verstuurd en levert het kant-en-klare
 * WhatsApp-bericht met de klantlink. Sjors verstuurt zelf vanuit zijn WhatsApp.
 */

import { contractOpId, logEvent, markeerVerstuurd } from "@/lib/contracten/db";
import { basisUrl } from "@/lib/contracten/platform";
import { json, fout, metBeheerder } from "@/lib/contracten/api";
import { whatsappBericht, klantLink } from "@/lib/contracten/berichten";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return metBeheerder(req, async () => {
    const contract = await contractOpId(params.id);
    if (!contract) return fout("Contract niet gevonden.", 404);
    if (contract.status === "ondertekend" || contract.status === "goedgekeurd") {
      return fout("Dit contract is al ondertekend.", 409);
    }

    await markeerVerstuurd(contract.id);
    await logEvent(contract.id, "verstuurd");

    const bijgewerkt = await contractOpId(params.id);
    return json({
      contract: bijgewerkt,
      ...whatsappBericht(contract, "versturen", basisUrl(req)),
      link: klantLink(contract.token, basisUrl(req)),
    });
  });
}
