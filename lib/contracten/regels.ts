/**
 * Berekening van het prijsoverzicht. Dit is de enige plek waar het totaal
 * ontstaat; de client toont alleen een voorbeeld, de server rekent opnieuw.
 *
 * Regels (zie SPEC):
 * - Stretchtent: weekendtarief, altijd.
 * - Extra huurdagen: n × € 75.
 * - Sfeerverlichting: € 30 per weekend, extra dagen gratis.
 * - Zijwanden: z × € 50 + z × n × € 10 (toeslag per zijwand per extra dag).
 * - Toeslag klinkers: € 75.
 * - Shotjesbar: € 380 per weekend.
 * - Transport: handmatig bedrag, afkomstig uit de bestaande calculator.
 */

import { TARIEVEN, MAX_ZIJWANDEN, euro } from "@/lib/prijzen";
import type { ContractInvoer, Prijsoverzicht, Prijsregel } from "./types";

/** Normaliseert invoer zodat een rare waarde nooit tot een raar totaal leidt. */
export function normaliseer(
  invoer: Pick<
    ContractInvoer,
    "extraDagen" | "zijwanden" | "transportCent" | "verlichting" | "klinkers" | "shotjesbar"
  >
) {
  const extraDagen = Math.max(0, Math.floor(Number(invoer.extraDagen) || 0));
  const zijwanden = Math.min(
    MAX_ZIJWANDEN,
    Math.max(0, Math.floor(Number(invoer.zijwanden) || 0))
  );
  const transportCent = Math.max(0, Math.round(Number(invoer.transportCent) || 0));
  return {
    extraDagen,
    zijwanden,
    transportCent,
    verlichting: Boolean(invoer.verlichting),
    klinkers: Boolean(invoer.klinkers),
    shotjesbar: Boolean(invoer.shotjesbar),
  };
}

export function berekenOverzicht(invoer: ContractInvoer): Prijsoverzicht {
  const { extraDagen: n, zijwanden: z, transportCent, verlichting, klinkers, shotjesbar } =
    normaliseer(invoer);

  const regels: Prijsregel[] = [];

  regels.push({
    omschrijving: "Stretchtent 7,5 × 10 m",
    toelichting: "Weekendtarief, incl. bevestigingsmaterialen, op- en afbouw",
    bedragCent: TARIEVEN.tent,
  });

  if (n > 0) {
    regels.push({
      omschrijving: `Extra huurdag${n > 1 ? "en" : ""}`,
      toelichting: `${n} × ${euro(TARIEVEN.extraDag)}`,
      bedragCent: n * TARIEVEN.extraDag,
    });
  }

  if (verlichting) {
    regels.push({
      omschrijving: "Sfeerverlichting",
      toelichting: n > 0
        ? "Per weekend, extra dagen gratis"
        : "Voor de gehele tent, per weekend",
      bedragCent: TARIEVEN.verlichting,
    });
  }

  if (z > 0) {
    const toeslag = z * n * TARIEVEN.zijwandExtraDag;
    regels.push({
      omschrijving: `Zijwand${z > 1 ? "en" : ""} 10 m`,
      toelichting:
        `${z} × ${euro(TARIEVEN.zijwand)}` +
        (n > 0 ? ` + ${z} × ${n} extra dag × ${euro(TARIEVEN.zijwandExtraDag)}` : ""),
      bedragCent: z * TARIEVEN.zijwand + toeslag,
    });
  }

  if (klinkers) {
    regels.push({
      omschrijving: "Toeslag klinkers of bestrating",
      toelichting: "Extra opbouwtijd",
      bedragCent: TARIEVEN.klinkers,
    });
  }

  if (shotjesbar) {
    regels.push({
      omschrijving: "Shotjesbar",
      toelichting: "Per weekend; de flessen blijven na de huur van u",
      bedragCent: TARIEVEN.shotjesbar,
    });
  }

  if (transportCent > 0) {
    regels.push({
      omschrijving: "Transportkosten",
      toelichting: "Volgens berekening",
      bedragCent: transportCent,
    });
  }

  return {
    regels,
    totaalCent: regels.reduce((som, r) => som + r.bedragCent, 0),
  };
}
