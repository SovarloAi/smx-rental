/**
 * Klant-API: het eigen PDF-contract ophalen. Alleen met het juiste token en
 * alleen als het contract is goedgekeurd.
 */

import { contractOpToken } from "@/lib/contracten/db";
import { haalBestand } from "@/lib/contracten/r2";
import { geldigTokenFormaat } from "@/lib/contracten/token";
import { LIMIETEN, binnenLimiet, bezoekerIp } from "@/lib/contracten/ratelimit";
import { fout } from "@/lib/contracten/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const ip = bezoekerIp(req);
  if (!(await binnenLimiet(`lezen:${ip}`, LIMIETEN.lezen))) {
    return fout("Te veel verzoeken.", 429);
  }

  const token = params.token ?? "";
  if (!geldigTokenFormaat(token)) return fout("Niet gevonden.", 404);

  const contract = await contractOpToken(token);
  if (!contract) return fout("Niet gevonden.", 404);
  if (contract.status !== "goedgekeurd" || !contract.pdfKey) {
    return fout("Het definitieve contract is nog niet beschikbaar.", 404);
  }

  const bestand = await haalBestand(contract.pdfKey);
  if (!bestand) return fout("Niet gevonden.", 404);

  return new Response(bestand.body, {
    headers: {
      "content-type": "application/pdf",
      "x-content-type-options": "nosniff",
      "content-disposition": `inline; filename="huurovereenkomst-smx-rental.pdf"`,
      "cache-control": "no-store, private",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
