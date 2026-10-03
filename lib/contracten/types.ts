/** Datamodel van de contractmodule. Spiegelt `migrations/0001_init.sql`. */

import type { VoorwaardenVersie } from "./voorwaarden";

export const STATUSSEN = [
  "concept",
  "verstuurd",
  "geopend",
  "ondertekend",
  "goedgekeurd",
] as const;
export type Status = (typeof STATUSSEN)[number];

export const STATUS_LABEL: Record<Status, string> = {
  concept: "Concept",
  verstuurd: "Verstuurd",
  geopend: "Geopend",
  ondertekend: "Ondertekend",
  goedgekeurd: "Goedgekeurd",
};

export const EVENT_TYPES = [
  "aangemaakt",
  "gewijzigd",
  "verstuurd",
  "herinnering",
  "geopend",
  "ondertekend",
  "goedgekeurd",
  "op_papier",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** De velden die Sjors invult; de rest beheert de server. */
export type ContractInvoer = {
  klantNaam: string;
  klantAdres: string;
  klantPostcodePlaats: string;
  klantTelefoon: string;
  klantEmail: string;
  plaatsingsadres: string;

  feestDatum: string; // YYYY-MM-DD
  opbouwDatum: string;
  opbouwTijd: string; // HH:MM
  afbouwDatum: string;
  afbouwTijd: string;

  /** Minimaal één product is verplicht: tent, shotjesbar, of allebei. */
  tent: boolean;
  shotjesbar: boolean;
  /** Extra huurdagen; gelden voor alle gehuurde producten. */
  extraDagen: number;
  /** Alleen bij de tent. */
  verlichting: boolean;
  zijwanden: number; // 0-2
  /** Aantal extra dagen dat de zijwanden blijven staan (0 t/m extraDagen). */
  zijwandExtraDagen: number;
  klinkers: boolean;
  transportCent: number;
  afspraken: string;
};

export type Contract = ContractInvoer & {
  id: string;
  token: string;
  status: Status;

  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  openedAt: string | null;
  signedAt: string | null;
  approvedAt: string | null;
  remindedAt: string | null;

  totaalCent: number;
  voorwaardenVersie: VoorwaardenVersie;

  signerNaam: string | null;
  signerPlaats: string | null;
  signatureKey: string | null;
  signedIp: string | null;
  signedUserAgent: string | null;
  documentHash: string | null;

  opPapier: boolean;
  papierKey: string | null;
  pdfKey: string | null;
  gezien: boolean;
};

export type ContractEvent = {
  id: string;
  contractId: string;
  type: EventType;
  at: string;
  ip: string | null;
  userAgent: string | null;
};

/** Eén regel op het prijsoverzicht. */
export type Prijsregel = {
  omschrijving: string;
  toelichting: string;
  bedragCent: number;
};

export type Prijsoverzicht = {
  regels: Prijsregel[];
  totaalCent: number;
};

/** Wat de klant-API teruggeeft: nooit interne velden of andere contracten. */
export type KlantContract = {
  token: string;
  status: Status;
  klantNaam: string;
  klantTelefoon: string;
  klantEmail: string;
  adres: string;
  /** Nodig om de teksten te laten kloppen met wat er gehuurd wordt. */
  tent: boolean;
  shotjesbar: boolean;
  feestDatum: string;
  opbouwDatum: string;
  opbouwTijd: string;
  afbouwDatum: string;
  afbouwTijd: string;
  afspraken: string;
  overzicht: Prijsoverzicht;
  voorwaardenVersie: VoorwaardenVersie;
  signerNaam: string | null;
  signerPlaats: string | null;
  signedAt: string | null;
  opPapier: boolean;
};
