/**
 * Beheer-API: contract goedkeuren en afronden.
 *
 * Hier komt alles samen: de handtekening van Sjors erbij, de definitieve PDF
 * genereren en opslaan, en die naar klant en Sjors mailen.
 *
 * De volgorde is bewust: eerst de PDF maken en opslaan, dan pas de status
 * omzetten, en de e-mails helemaal aan het eind. Mislukt het mailen, dan is
 * het contract toch goedgekeurd en staat de PDF klaar — dat melden we, zodat
 * Sjors de link met de hand kan sturen.
 */

import {
  SLEUTEL_EIGEN_HANDTEKENING,
  contractOpId,
  instelling,
  logEvent,
  markeerGoedgekeurd,
} from "@/lib/contracten/db";
import { haalBytes, sleutels, zetBestand } from "@/lib/contracten/r2";
import { maakContractPdf } from "@/lib/contracten/pdf";
import { verstuurMail } from "@/lib/contracten/mail";
import { mailDefinitiefNaarKlant, mailDefinitiefNaarVerhuurder } from "@/lib/contracten/mails";
import { definitiefLink } from "@/lib/contracten/berichten";
import { basisUrl } from "@/lib/contracten/platform";
import { json, fout, metBeheerder } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return metBeheerder(req, async () => {
    const contract = await contractOpId(params.id);
    if (!contract) return fout("Contract niet gevonden.", 404);
    if (contract.status === "goedgekeurd") return fout("Dit contract is al goedgekeurd.", 409);
    if (contract.status !== "ondertekend") {
      return fout("Dit contract is nog niet ondertekend.", 409);
    }

    const eigenKey = await instelling(SLEUTEL_EIGEN_HANDTEKENING);
    if (!eigenKey) {
      return fout(
        "Er staat nog geen handtekening van u. Zet die eerst bij Instellingen.",
        409
      );
    }

    const [handtekeningKlant, handtekeningVerhuurder] = await Promise.all([
      contract.signatureKey ? haalBytes(contract.signatureKey) : Promise.resolve(null),
      haalBytes(eigenKey),
    ]);

    // De goedkeuringsdatum hoort al in de PDF te staan.
    const nu = new Date().toISOString();
    const pdf = await maakContractPdf({
      contract: { ...contract, status: "goedgekeurd", approvedAt: nu },
      handtekeningKlant,
      handtekeningVerhuurder,
    });

    const pdfKey = sleutels.pdf(contract.id);
    await zetBestand(pdfKey, pdf, "application/pdf");

    const gelukt = await markeerGoedgekeurd(contract.id, pdfKey);
    if (!gelukt) return fout("De status kon niet worden bijgewerkt.", 409);

    await logEvent(contract.id, "goedgekeurd");

    const bijgewerkt = (await contractOpId(contract.id))!;
    const link = definitiefLink(contract.token, basisUrl(req));

    const waarschuwingen: string[] = [];
    if (bijgewerkt.klantEmail) {
      const r = await verstuurMail(mailDefinitiefNaarKlant(bijgewerkt, pdf, link));
      if (!r.ok) waarschuwingen.push(`De e-mail naar de klant is niet verstuurd (${r.reden}).`);
    } else {
      waarschuwingen.push("Er is geen e-mailadres van de klant, dus er is geen e-mail verstuurd.");
    }

    const eigen = await verstuurMail(mailDefinitiefNaarVerhuurder(bijgewerkt, pdf));
    if (!eigen.ok) waarschuwingen.push(`De kopie naar uzelf is niet verstuurd (${eigen.reden}).`);

    return json({ contract: bijgewerkt, link, waarschuwingen });
  });
}
