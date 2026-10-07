/**
 * Berekening van het prijsoverzicht. Dit is de enige plek waar het totaal
 * ontstaat; de client toont alleen een voorbeeld, de server rekent opnieuw.
 *
 * Regels:
 * - Stretchtent en Shotjesbar zijn allebei losse keuzes; minstens één is nodig.
 * - Extra huurdagen gelden voor de hele periode en kosten per gehuurd product:
 *   stretchtent € 75 per dag, Shotjesbar € 40 per dag.
 * - Verlichting, zijwanden en de klinkertoeslag horen bij de tent en vervallen
 *   als die niet gehuurd wordt.
 * - Sfeerverlichting: € 30 per weekend, extra dagen gratis.
 * - Zijwanden: z × € 50, plus z × (aantal extra dagen dat ze blijven staan) ×
 *   € 10. Dat aantal vult Sjors apart in en kan nul zijn.
 * - Transport: handmatig bedrag of automatisch uit de bestaande calculator.
 * - Is er een handmatige totaalprijs afgesproken, dan komt het verschil met de
 *   optelsom op de regel van de stretchtent, of op die van de Shotjesbar als
 *   er geen tent gehuurd wordt.
 */

import { TARIEVEN, MAX_ZIJWANDEN, euro } from "@/lib/prijzen";
import type { Contract, ContractInvoer, Prijsoverzicht, Prijsregel } from "./types";

type Productvelden = Pick<
  ContractInvoer,
  | "tent" | "shotjesbar" | "extraDagen" | "verlichting"
  | "zijwanden" | "zijwandExtraDagen" | "klinkers" | "transportCent"
>;

/**
 * Normaliseert de invoer. Opties die bij de tent horen worden uitgezet als er
 * geen tent gehuurd wordt, en de zijwand-extradagen kunnen nooit boven het
 * aantal extra huurdagen uitkomen.
 */
export function normaliseer(invoer: Productvelden) {
  const tent = Boolean(invoer.tent);
  const shotjesbar = Boolean(invoer.shotjesbar);
  const extraDagen = Math.max(0, Math.floor(Number(invoer.extraDagen) || 0));
  const zijwanden = tent
    ? Math.min(MAX_ZIJWANDEN, Math.max(0, Math.floor(Number(invoer.zijwanden) || 0)))
    : 0;

  return {
    tent,
    shotjesbar,
    extraDagen,
    verlichting: tent && Boolean(invoer.verlichting),
    zijwanden,
    zijwandExtraDagen: zijwanden > 0
      ? Math.min(extraDagen, Math.max(0, Math.floor(Number(invoer.zijwandExtraDagen) || 0)))
      : 0,
    klinkers: tent && Boolean(invoer.klinkers),
    transportCent: Math.max(0, Math.round(Number(invoer.transportCent) || 0)),
  };
}

/** Of er überhaupt iets gehuurd wordt. */
export function heeftProduct(invoer: Pick<ContractInvoer, "tent" | "shotjesbar">): boolean {
  return Boolean(invoer.tent) || Boolean(invoer.shotjesbar);
}

export function berekenOverzicht(invoer: ContractInvoer): Prijsoverzicht {
  const n = normaliseer(invoer);
  const regels: Prijsregel[] = [];
  const dagen = n.extraDagen;
  const meervoud = dagen > 1 ? "en" : "";

  // Op welke regel een handmatige prijs landt. We onthouden de plek meteen bij
  // het opbouwen; zoeken op omschrijving zou breken zodra een tekst wijzigt.
  let regelTent = -1;
  let regelBar = -1;

  if (n.tent) {
    regelTent = regels.push({
      omschrijving: "Stretchtent 7,5 × 10 m",
      toelichting: "Weekendtarief, incl. bevestigingsmaterialen, op- en afbouw",
      bedragCent: TARIEVEN.tent,
    }) - 1;

    if (dagen > 0) {
      regels.push({
        omschrijving: `Extra huurdag${meervoud} stretchtent`,
        toelichting: `${dagen} × ${euro(TARIEVEN.extraDag)}`,
        bedragCent: dagen * TARIEVEN.extraDag,
      });
    }

    if (n.verlichting) {
      regels.push({
        omschrijving: "Sfeerverlichting",
        toelichting: dagen > 0
          ? "Per weekend, extra dagen gratis"
          : "Voor de gehele tent, per weekend",
        bedragCent: TARIEVEN.verlichting,
      });
    }

    if (n.zijwanden > 0) {
      regels.push({
        omschrijving: `Zijwand${n.zijwanden > 1 ? "en" : ""} 10 m`,
        toelichting: `${n.zijwanden} × ${euro(TARIEVEN.zijwand)}`,
        bedragCent: n.zijwanden * TARIEVEN.zijwand,
      });

      if (n.zijwandExtraDagen > 0) {
        regels.push({
          omschrijving: `Zijwand${n.zijwanden > 1 ? "en" : ""} — extra dag${n.zijwandExtraDagen > 1 ? "en" : ""}`,
          toelichting: `${n.zijwanden} × ${n.zijwandExtraDagen} dag${n.zijwandExtraDagen > 1 ? "en" : ""} × ${euro(TARIEVEN.zijwandExtraDag)}`,
          bedragCent: n.zijwanden * n.zijwandExtraDagen * TARIEVEN.zijwandExtraDag,
        });
      }
    }

    if (n.klinkers) {
      regels.push({
        omschrijving: "Toeslag klinkers of bestrating",
        toelichting: "Extra opbouwtijd",
        bedragCent: TARIEVEN.klinkers,
      });
    }
  }

  if (n.shotjesbar) {
    regelBar = regels.push({
      omschrijving: "Shotjesbar",
      toelichting: "Per weekend; de flessen blijven na de huur van u",
      bedragCent: TARIEVEN.shotjesbar,
    }) - 1;

    if (dagen > 0) {
      regels.push({
        omschrijving: `Extra huurdag${meervoud} Shotjesbar`,
        toelichting: `${dagen} × ${euro(TARIEVEN.shotjesbarExtraDag)}`,
        bedragCent: dagen * TARIEVEN.shotjesbarExtraDag,
      });
    }
  }

  if (n.transportCent > 0) {
    regels.push({
      omschrijving: "Transportkosten",
      toelichting: "Volgens berekening",
      bedragCent: n.transportCent,
    });
  }

  const dragerRegel = regelTent >= 0 ? regelTent : regelBar;
  const metPrijs = pasPrijsafspraakToe(regels, dragerRegel, invoer.handmatigTotaalCent);

  return {
    regels: metPrijs,
    totaalCent: metPrijs.reduce((som, r) => som + r.bedragCent, 0),
  };
}

/**
 * Verwerkt een handmatig afgesproken totaalprijs.
 *
 * Het verschil met de optelsom gaat naar één regel — de stretchtent, of de
 * Shotjesbar als er geen tent is — zodat het overzicht precies op het
 * afgesproken bedrag uitkomt. Er komt bewust géén kortingsregel bij: de klant
 * hoort hetzelfde contract te zien als ieder ander, alleen met zijn eigen prijs.
 *
 * Zou de dragende regel onder nul duiken, dan laten we het overzicht ongemoeid.
 * De invoercontrole weigert zo'n bedrag al, dit is het vangnet daarachter.
 */
function pasPrijsafspraakToe(
  regels: Prijsregel[],
  drager: number,
  gewenstCent: number | null | undefined
): Prijsregel[] {
  if (gewenstCent == null || drager < 0) return regels;

  const gewenst = Math.max(0, Math.round(gewenstCent));
  const huidig = regels.reduce((som, r) => som + r.bedragCent, 0);
  const nieuwBedrag = regels[drager].bedragCent + (gewenst - huidig);
  if (nieuwBedrag < 0) return regels;

  return regels.map((r, i) => (i === drager ? { ...r, bedragCent: nieuwBedrag } : r));
}

/**
 * Wat het contract zou kosten zónder prijsafspraak, plus hoe ver de prijs
 * omlaag kan. Lager dan de overige regels bij elkaar kan niet: dan zou de
 * stretchtent of de Shotjesbar een negatief bedrag krijgen.
 */
export function prijsruimte(invoer: ContractInvoer): {
  normaalCent: number;
  laagsteCent: number;
  dragerOmschrijving: string | null;
} {
  const zonder = berekenOverzicht({ ...invoer, handmatigTotaalCent: null });
  const drager =
    zonder.regels.find((r) => r.omschrijving.startsWith("Stretchtent")) ??
    zonder.regels.find((r) => r.omschrijving === "Shotjesbar") ??
    null;

  return {
    normaalCent: zonder.totaalCent,
    laagsteCent: zonder.totaalCent - (drager?.bedragCent ?? 0),
    dragerOmschrijving: drager?.omschrijving ?? null,
  };
}

/**
 * Het prijsoverzicht dat voor dít contract geldt.
 *
 * Staan er vastgelegde regels bij het contract, dan gelden die — ook als de
 * tarieven inmiddels veranderd zijn. Dat is het hele punt: wat de klant heeft
 * gezien en ondertekend mag later niet verschuiven. Alleen contracten van vóór
 * die vastlegging worden nog herberekend.
 */
export function overzichtVan(contract: Contract): Prijsoverzicht {
  if (contract.prijsregels && contract.prijsregels.length) {
    return {
      regels: contract.prijsregels,
      totaalCent: contract.prijsregels.reduce((som, r) => som + r.bedragCent, 0),
    };
  }
  return berekenOverzicht(contract);
}
