/**
 * Klant-API: het eigen contract ophalen.
 *
 * Geeft uitsluitend de gegevens van dít contract terug — nooit een lijst, nooit
 * interne velden zoals het IP of de bestandssleutels. Het eerste bezoek zet de
 * status op 'geopend'.
 */

import { contractOpToken, logEvent, markeerGeopend } from "@/lib/contracten/db";
import { berekenOverzicht } from "@/lib/contracten/regels";
import { voorwaardenVoor } from "@/lib/contracten/voorwaarden";
import { geldigTokenFormaat } from "@/lib/contracten/token";
import { LIMIETEN, binnenLimiet, bezoekerIp } from "@/lib/contracten/ratelimit";
import { json, fout } from "@/lib/contracten/api";
import type { KlantContract } from "@/lib/contracten/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const ip = bezoekerIp(req);
  if (!(await binnenLimiet(`lezen:${ip}`, LIMIETEN.lezen))) {
    return fout("Te veel verzoeken. Probeer het over een minuut opnieuw.", 429);
  }

  const token = params.token ?? "";
  if (!geldigTokenFormaat(token)) return fout("Contract niet gevonden.", 404);

  const contract = await contractOpToken(token);
  if (!contract) return fout("Contract niet gevonden.", 404);

  // Alleen de eerste keer, en alleen vanuit 'verstuurd'.
  if (await markeerGeopend(contract.id)) {
    await logEvent(contract.id, "geopend", {
      ip,
      userAgent: req.headers.get("User-Agent"),
    });
    contract.status = "geopend";
  }

  const v = voorwaardenVoor(contract.voorwaardenVersie, contract);

  const klant: KlantContract = {
    token: contract.token,
    status: contract.status,
    klantNaam: contract.klantNaam,
    klantTelefoon: contract.klantTelefoon,
    klantEmail: contract.klantEmail,
    adres:
      contract.plaatsingsadres ||
      [contract.klantAdres, contract.klantPostcodePlaats].filter(Boolean).join(", "),
    feestDatum: contract.feestDatum,
    opbouwDatum: contract.opbouwDatum,
    opbouwTijd: contract.opbouwTijd,
    afbouwDatum: contract.afbouwDatum,
    afbouwTijd: contract.afbouwTijd,
    afspraken: contract.afspraken,
    overzicht: berekenOverzicht(contract),
    voorwaardenVersie: contract.voorwaardenVersie,
    signerNaam: contract.signerNaam,
    signerPlaats: contract.signerPlaats,
    signedAt: contract.signedAt,
    opPapier: contract.opPapier,
  };

  return json({
    contract: klant,
    voorwaarden: { versie: v.versie, artikelen: v.artikelen, checks: v.checks },
  });
}
