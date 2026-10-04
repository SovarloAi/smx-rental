/**
 * Klant-API: ondertekenen.
 *
 * Kan maar één keer slagen: de UPDATE in `markeerOndertekend` eist status
 * 'verstuurd' of 'geopend', dus twee gelijktijdige verzoeken leveren maar één
 * ondertekening op. Vastgelegd worden: tijdstip, IP, user-agent, de
 * handtekening (PNG in R2) en een SHA-256 over de exacte contractinhoud.
 */

import {
  contractOpToken,
  logEvent,
  markeerOndertekend,
  werkKlantgegevensBij,
} from "@/lib/contracten/db";
import { documentHash } from "@/lib/contracten/hash";
import { pngUitDataUrl, sleutels, zetBestand } from "@/lib/contracten/r2";
import { voorwaardenVoor } from "@/lib/contracten/voorwaarden";
import { geldigTokenFormaat } from "@/lib/contracten/token";
import { LIMIETEN, binnenLimiet, bezoekerIp } from "@/lib/contracten/ratelimit";
import { json, fout } from "@/lib/contracten/api";
import { verstuurMail } from "@/lib/contracten/mail";
import { mailOndertekend } from "@/lib/contracten/mails";
import { basisUrl } from "@/lib/contracten/platform";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Body = {
  versie?: string;
  naam?: string;
  plaats?: string;
  telefoon?: string;
  email?: string;
  handtekeningPng?: string;
  akkoord?: boolean[];
};

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const ip = bezoekerIp(req);
  if (!(await binnenLimiet(`tekenen:${ip}`, LIMIETEN.ondertekenen))) {
    return fout("Er zijn te veel pogingen gedaan vanaf dit apparaat. Wacht een paar minuten en probeer het opnieuw, of bel Sjors op 06 20 65 15 28.", 429);
  }

  const token = params.token ?? "";
  if (!geldigTokenFormaat(token)) return fout("Contract niet gevonden.", 404);

  const contract = await contractOpToken(token);
  if (!contract) return fout("Contract niet gevonden.", 404);

  if (contract.status === "ondertekend" || contract.status === "goedgekeurd") {
    return fout("Dit contract is al ondertekend.", 409);
  }
  if (contract.status === "concept") {
    return fout("Dit contract is nog niet verstuurd.", 409);
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return fout("Ongeldig verzoek.", 400);

  // Is het contract gewijzigd nadat de klant de pagina opende? Dan mag hij niet
  // tekenen voor iets wat hij niet gezien heeft.
  if (body.versie && body.versie !== contract.updatedAt) {
    return json(
      {
        verouderd: true,
        fout:
          "Dit contract is zojuist aangepast. Ververs de pagina, lees de " +
          "gewijzigde gegevens door en onderteken daarna opnieuw.",
      },
      409
    );
  }

  // Dezelfde controles als op de pagina, maar dan serverkant.
  const ontbreekt: string[] = [];
  const schoon = (t: string) => t.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  const naam = schoon(body.naam ?? "").slice(0, 120);
  const plaats = schoon(body.plaats ?? "").slice(0, 120);
  const checks = voorwaardenVoor(contract.voorwaardenVersie, contract).checks;
  const akkoord = Array.isArray(body.akkoord) ? body.akkoord : [];

  if (!naam) ontbreekt.push("Vul uw naam in.");
  if (!plaats) ontbreekt.push("Vul de plaats in.");
  if (akkoord.length !== checks.length || !akkoord.every(Boolean)) {
    ontbreekt.push(`Zet alle ${checks.length} vinkjes.`);
  }

  const png = body.handtekeningPng ? pngUitDataUrl(body.handtekeningPng) : null;
  if (!png) ontbreekt.push("Zet uw handtekening in het vak.");

  if (ontbreekt.length) return json({ fouten: ontbreekt }, 422);

  // Correcties van de klant meenemen vóór we de hash berekenen.
  const telefoon =
    schoon(body.telefoon ?? "").replace(/[^0-9+()\s-]/g, "").slice(0, 40) || contract.klantTelefoon;
  const email = schoon(body.email ?? "").slice(0, 160);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ fouten: ["Het e-mailadres ziet er niet geldig uit."] }, 422);
  }
  await werkKlantgegevensBij(contract.id, telefoon, email);
  contract.klantTelefoon = telefoon;
  contract.klantEmail = email;

  const hash = await documentHash(contract);

  const key = sleutels.handtekeningKlant(contract.id);
  await zetBestand(key, png!, "image/png");

  const gelukt = await markeerOndertekend(contract.id, {
    signerNaam: naam,
    signerPlaats: plaats,
    signatureKey: key,
    signedIp: ip,
    signedUserAgent: req.headers.get("User-Agent"),
    documentHash: hash,
  });

  if (!gelukt) {
    // Iemand was ons net voor; het contract is inmiddels ondertekend.
    return fout("Dit contract is al ondertekend.", 409);
  }

  await logEvent(contract.id, "ondertekend", {
    ip,
    userAgent: req.headers.get("User-Agent"),
  });

  // Melding naar Sjors. Lukt dat niet, dan is dat voor de klant niet van
  // belang: hij heeft getekend en ziet gewoon het bedankscherm. Sjors ziet het
  // contract sowieso in het overzicht met een melding.
  const bijgewerkt = await contractOpToken(token);
  if (bijgewerkt) {
    const beheerUrl = `${basisUrl(req)}/beheer/contract/${bijgewerkt.id}`;
    const verstuurd = await verstuurMail(mailOndertekend(bijgewerkt, beheerUrl));
    if (!verstuurd.ok) {
      console.warn("Melding over ondertekening niet verstuurd:", verstuurd.reden);
    }
  }

  return json({ ok: true, documentHash: hash });
}
