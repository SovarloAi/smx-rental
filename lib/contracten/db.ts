/**
 * D1-toegang voor de contractmodule. Alle SQL staat hier; de rest van de code
 * werkt met de typen uit `types.ts`.
 *
 * De database gebruikt snake_case, de applicatie camelCase; `naarContract()`
 * vertaalt daartussen.
 */

import { db } from "./platform";
import { nieuwId, nieuwToken } from "./token";
import { berekenOverzicht, normaliseer } from "./regels";
import { HUIDIGE_VERSIE } from "./voorwaarden";
import type {
  Contract,
  ContractEvent,
  ContractInvoer,
  EventType,
  Status,
} from "./types";

const KOLOMMEN = `
  id, token, status, created_at, updated_at, sent_at, opened_at, signed_at,
  approved_at, reminded_at, klant_naam, klant_adres, klant_postcode_plaats,
  klant_telefoon, klant_email, plaatsingsadres, feest_datum, opbouw_datum,
  opbouw_tijd, afbouw_datum, afbouw_tijd, tent, shotjesbar, extra_dagen,
  verlichting, zijwanden, zijwand_extra_dagen, klinkers, transport_cent,
  afspraken, totaal_cent,
  voorwaarden_versie, signer_naam, signer_plaats, signature_key, signed_ip,
  signed_user_agent, document_hash, op_papier, papier_key, pdf_key, gezien
`;

type Rij = Record<string, unknown>;

function naarContract(r: Rij): Contract {
  const s = (k: string) => (r[k] == null ? "" : String(r[k]));
  const n = (k: string) => Number(r[k] ?? 0);
  const b = (k: string) => Number(r[k] ?? 0) === 1;
  const of = (k: string) => (r[k] == null ? null : String(r[k]));

  return {
    id: s("id"),
    token: s("token"),
    status: s("status") as Status,
    createdAt: s("created_at"),
    updatedAt: s("updated_at"),
    sentAt: of("sent_at"),
    openedAt: of("opened_at"),
    signedAt: of("signed_at"),
    approvedAt: of("approved_at"),
    remindedAt: of("reminded_at"),

    klantNaam: s("klant_naam"),
    klantAdres: s("klant_adres"),
    klantPostcodePlaats: s("klant_postcode_plaats"),
    klantTelefoon: s("klant_telefoon"),
    klantEmail: s("klant_email"),
    plaatsingsadres: s("plaatsingsadres"),

    feestDatum: s("feest_datum"),
    opbouwDatum: s("opbouw_datum"),
    opbouwTijd: s("opbouw_tijd"),
    afbouwDatum: s("afbouw_datum"),
    afbouwTijd: s("afbouw_tijd"),

    tent: b("tent"),
    shotjesbar: b("shotjesbar"),
    extraDagen: n("extra_dagen"),
    verlichting: b("verlichting"),
    zijwanden: n("zijwanden"),
    zijwandExtraDagen: n("zijwand_extra_dagen"),
    klinkers: b("klinkers"),
    transportCent: n("transport_cent"),
    afspraken: s("afspraken"),

    totaalCent: n("totaal_cent"),
    voorwaardenVersie: (s("voorwaarden_versie") || HUIDIGE_VERSIE) as Contract["voorwaardenVersie"],

    signerNaam: of("signer_naam"),
    signerPlaats: of("signer_plaats"),
    signatureKey: of("signature_key"),
    signedIp: of("signed_ip"),
    signedUserAgent: of("signed_user_agent"),
    documentHash: of("document_hash"),

    opPapier: b("op_papier"),
    papierKey: of("papier_key"),
    pdfKey: of("pdf_key"),
    gezien: b("gezien"),
  };
}

const nu = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/*  Lezen                                                             */
/* ------------------------------------------------------------------ */

export async function alleContracten(): Promise<Contract[]> {
  const { results } = await db()
    .prepare(`SELECT ${KOLOMMEN} FROM contracts ORDER BY feest_datum ASC, created_at ASC`)
    .all();
  return (results as Rij[]).map(naarContract);
}

export async function contractOpId(id: string): Promise<Contract | null> {
  const rij = await db()
    .prepare(`SELECT ${KOLOMMEN} FROM contracts WHERE id = ?`)
    .bind(id)
    .first();
  return rij ? naarContract(rij as Rij) : null;
}

export async function contractOpToken(token: string): Promise<Contract | null> {
  const rij = await db()
    .prepare(`SELECT ${KOLOMMEN} FROM contracts WHERE token = ?`)
    .bind(token)
    .first();
  return rij ? naarContract(rij as Rij) : null;
}

/* ------------------------------------------------------------------ */
/*  Schrijven                                                         */
/* ------------------------------------------------------------------ */

export async function maakContract(invoer: ContractInvoer): Promise<Contract> {
  const id = nieuwId();
  const token = nieuwToken();
  const t = nu();
  const norm = normaliseer(invoer);
  const totaal = berekenOverzicht(invoer).totaalCent;

  await db()
    .prepare(
      `INSERT INTO contracts (
        id, token, status, created_at, updated_at,
        klant_naam, klant_adres, klant_postcode_plaats, klant_telefoon, klant_email,
        plaatsingsadres, feest_datum, opbouw_datum, opbouw_tijd, afbouw_datum, afbouw_tijd,
        tent, shotjesbar, extra_dagen, verlichting, zijwanden, zijwand_extra_dagen,
        klinkers, transport_cent, afspraken, totaal_cent, voorwaarden_versie, gezien
      ) VALUES (?,?,'concept',?,?, ?,?,?,?,?, ?,?,?,?,?,?, ?,?,?,?,?,?, ?,?,?,?,?,1)`
    )
    .bind(
      id, token, t, t,
      invoer.klantNaam, invoer.klantAdres, invoer.klantPostcodePlaats,
      invoer.klantTelefoon, invoer.klantEmail,
      invoer.plaatsingsadres, invoer.feestDatum, invoer.opbouwDatum,
      invoer.opbouwTijd, invoer.afbouwDatum, invoer.afbouwTijd,
      norm.tent ? 1 : 0, norm.shotjesbar ? 1 : 0, norm.extraDagen,
      norm.verlichting ? 1 : 0, norm.zijwanden, norm.zijwandExtraDagen,
      norm.klinkers ? 1 : 0, norm.transportCent,
      invoer.afspraken, totaal, HUIDIGE_VERSIE
    )
    .run();

  const gemaakt = await contractOpId(id);
  if (!gemaakt) throw new Error("Contract kon niet worden aangemaakt.");
  return gemaakt;
}

/**
 * Werkt een contract bij. Alleen toegestaan zolang er niet getekend is; dat
 * wordt hier nogmaals afgedwongen, niet alleen in de route.
 */
export async function wijzigContract(
  id: string,
  invoer: ContractInvoer
): Promise<Contract> {
  const bestaand = await contractOpId(id);
  if (!bestaand) throw new Error("Contract niet gevonden.");
  if (bestaand.status === "ondertekend" || bestaand.status === "goedgekeurd") {
    throw new Error("Een ondertekend contract kan niet meer worden gewijzigd.");
  }

  const norm = normaliseer(invoer);
  const totaal = berekenOverzicht(invoer).totaalCent;

  await db()
    .prepare(
      `UPDATE contracts SET
        updated_at = ?, klant_naam = ?, klant_adres = ?, klant_postcode_plaats = ?,
        klant_telefoon = ?, klant_email = ?, plaatsingsadres = ?, feest_datum = ?,
        opbouw_datum = ?, opbouw_tijd = ?, afbouw_datum = ?, afbouw_tijd = ?,
        tent = ?, shotjesbar = ?, extra_dagen = ?, verlichting = ?, zijwanden = ?,
        zijwand_extra_dagen = ?, klinkers = ?, transport_cent = ?,
        afspraken = ?, totaal_cent = ?
       WHERE id = ?`
    )
    .bind(
      nu(), invoer.klantNaam, invoer.klantAdres, invoer.klantPostcodePlaats,
      invoer.klantTelefoon, invoer.klantEmail, invoer.plaatsingsadres, invoer.feestDatum,
      invoer.opbouwDatum, invoer.opbouwTijd, invoer.afbouwDatum, invoer.afbouwTijd,
      norm.tent ? 1 : 0, norm.shotjesbar ? 1 : 0, norm.extraDagen,
      norm.verlichting ? 1 : 0, norm.zijwanden, norm.zijwandExtraDagen,
      norm.klinkers ? 1 : 0, norm.transportCent, invoer.afspraken, totaal,
      id
    )
    .run();

  const bij = await contractOpId(id);
  if (!bij) throw new Error("Contract niet gevonden na wijziging.");
  return bij;
}

/** Klantgegevens die de klant zelf mag corrigeren op zijn eigen pagina. */
export async function werkKlantgegevensBij(
  id: string,
  telefoon: string,
  email: string
): Promise<void> {
  await db()
    .prepare(
      `UPDATE contracts SET klant_telefoon = ?, klant_email = ?, updated_at = ?
       WHERE id = ? AND status NOT IN ('ondertekend','goedgekeurd')`
    )
    .bind(telefoon, email, nu(), id)
    .run();
}

export async function markeerVerstuurd(id: string): Promise<void> {
  const t = nu();
  await db()
    .prepare(
      `UPDATE contracts
         SET status = CASE WHEN status = 'concept' THEN 'verstuurd' ELSE status END,
             sent_at = COALESCE(sent_at, ?), updated_at = ?
       WHERE id = ?`
    )
    .bind(t, t, id)
    .run();
}

export async function markeerHerinnerd(id: string): Promise<void> {
  const t = nu();
  await db()
    .prepare(`UPDATE contracts SET reminded_at = ?, updated_at = ? WHERE id = ?`)
    .bind(t, t, id)
    .run();
}

/**
 * Zet de status op 'geopend', maar alleen de eerste keer en alleen vanuit
 * 'verstuurd'. Geeft terug of er echt iets veranderd is.
 */
export async function markeerGeopend(id: string): Promise<boolean> {
  const t = nu();
  const res = await db()
    .prepare(
      `UPDATE contracts SET status = 'geopend', opened_at = ?, updated_at = ?
       WHERE id = ? AND status = 'verstuurd'`
    )
    .bind(t, t, id)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * Legt de ondertekening vast. De WHERE-clausule zorgt ervoor dat dit maar één
 * keer kan slagen, ook bij twee gelijktijdige verzoeken.
 */
export async function markeerOndertekend(
  id: string,
  gegevens: {
    signerNaam: string;
    signerPlaats: string;
    signatureKey: string;
    signedIp: string | null;
    signedUserAgent: string | null;
    documentHash: string;
  }
): Promise<boolean> {
  const t = nu();
  const res = await db()
    .prepare(
      `UPDATE contracts SET
         status = 'ondertekend', signed_at = ?, updated_at = ?, gezien = 0,
         signer_naam = ?, signer_plaats = ?, signature_key = ?,
         signed_ip = ?, signed_user_agent = ?, document_hash = ?
       WHERE id = ? AND status IN ('verstuurd','geopend')`
    )
    .bind(
      t, t, gegevens.signerNaam, gegevens.signerPlaats, gegevens.signatureKey,
      gegevens.signedIp, gegevens.signedUserAgent, gegevens.documentHash, id
    )
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function markeerOpPapier(id: string, papierKey: string): Promise<boolean> {
  const t = nu();
  const res = await db()
    .prepare(
      `UPDATE contracts SET status = 'ondertekend', op_papier = 1, papier_key = ?,
         signed_at = COALESCE(signed_at, ?), updated_at = ?, gezien = 1
       WHERE id = ? AND status IN ('concept','verstuurd','geopend')`
    )
    .bind(papierKey, t, t, id)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function markeerGoedgekeurd(id: string, pdfKey: string): Promise<boolean> {
  const t = nu();
  const res = await db()
    .prepare(
      `UPDATE contracts SET status = 'goedgekeurd', approved_at = ?, updated_at = ?,
         pdf_key = ?, gezien = 1
       WHERE id = ? AND status = 'ondertekend'`
    )
    .bind(t, t, pdfKey, id)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function markeerGezien(id: string): Promise<void> {
  await db().prepare(`UPDATE contracts SET gezien = 1 WHERE id = ?`).bind(id).run();
}

export async function verwijderContract(id: string): Promise<void> {
  await db().prepare(`DELETE FROM events WHERE contract_id = ?`).bind(id).run();
  await db().prepare(`DELETE FROM contracts WHERE id = ?`).bind(id).run();
}

/* ------------------------------------------------------------------ */
/*  Audit-log                                                         */
/* ------------------------------------------------------------------ */

export async function logEvent(
  contractId: string,
  type: EventType,
  herkomst?: { ip?: string | null; userAgent?: string | null }
): Promise<void> {
  await db()
    .prepare(
      `INSERT INTO events (id, contract_id, type, at, ip, user_agent) VALUES (?,?,?,?,?,?)`
    )
    .bind(nieuwId(), contractId, type, nu(), herkomst?.ip ?? null, herkomst?.userAgent ?? null)
    .run();
}

export async function eventsVan(contractId: string): Promise<ContractEvent[]> {
  const { results } = await db()
    .prepare(
      `SELECT id, contract_id, type, at, ip, user_agent FROM events
       WHERE contract_id = ? ORDER BY at ASC`
    )
    .bind(contractId)
    .all();
  return (results as Rij[]).map((r) => ({
    id: String(r.id),
    contractId: String(r.contract_id),
    type: String(r.type) as EventType,
    at: String(r.at),
    ip: r.ip == null ? null : String(r.ip),
    userAgent: r.user_agent == null ? null : String(r.user_agent),
  }));
}

/* ------------------------------------------------------------------ */
/*  Instellingen                                                      */
/* ------------------------------------------------------------------ */

export async function instelling(sleutel: string): Promise<string | null> {
  const rij = await db()
    .prepare(`SELECT waarde FROM settings WHERE sleutel = ?`)
    .bind(sleutel)
    .first();
  return rij ? String((rij as Rij).waarde) : null;
}

export async function zetInstelling(sleutel: string, waarde: string): Promise<void> {
  await db()
    .prepare(
      `INSERT INTO settings (sleutel, waarde) VALUES (?, ?)
       ON CONFLICT(sleutel) DO UPDATE SET waarde = excluded.waarde`
    )
    .bind(sleutel, waarde)
    .run();
}

export const SLEUTEL_EIGEN_HANDTEKENING = "owner_signature_key";
