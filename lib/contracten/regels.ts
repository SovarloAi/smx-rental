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

  if (n.tent) {
    regels.push({
      omschrijving: "Stretchtent 7,5 × 10 m",
      toelichting: "Weekendtarief, incl. bevestigingsmaterialen, op- en afbouw",
      bedragCent: TARIEVEN.tent,
    });

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
    regels.push({
      omschrijving: "Shotjesbar",
      toelichting: "Per weekend; de flessen blijven na de huur van u",
      bedragCent: TARIEVEN.shotjesbar,
    });

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

  return {
    regels,
    totaalCent: regels.reduce((som, r) => som + r.bedragCent, 0),
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
