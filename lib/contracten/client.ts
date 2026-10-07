/** Browserkant van de beheer-API. Eén plek voor fetch, foutafhandeling en typen. */

import type { Contract, ContractEvent, ContractInvoer, Prijsoverzicht } from "./types";

export type ContractMetOverzicht = { contract: Contract; overzicht: Prijsoverzicht };
export type ContractDetail = ContractMetOverzicht & { events: ContractEvent[] };
export type VerstuurAntwoord = {
  contract: Contract;
  tekst: string;
  waUrl: string | null;
  link: string;
};

export class ApiFout extends Error {
  status: number;
  constructor(bericht: string, status: number) {
    super(bericht);
    this.name = "ApiFout";
    this.status = status;
  }
}

async function vraag<T>(pad: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(pad, {
      ...init,
      headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers },
    });
  } catch {
    throw new ApiFout("Geen verbinding. Controleer uw internetverbinding.", 0);
  }

  if (res.status === 403) {
    throw new ApiFout("Geen toegang. Log opnieuw in via Cloudflare Access.", 403);
  }

  const data = (await res.json().catch(() => null)) as
    | (T & { fout?: string; fouten?: string[] })
    | null;

  if (!res.ok) {
    const bericht =
      data?.fouten?.join(" ") || data?.fout || "Er ging iets mis. Probeer het opnieuw.";
    throw new ApiFout(bericht, res.status);
  }
  return data as T;
}

export const api = {
  lijst: () => vraag<{ contracten: Contract[] }>("/api/beheer/contracten"),

  detail: (id: string) => vraag<ContractDetail>(`/api/beheer/contracten/${id}`),

  maak: (invoer: FormulierInvoer) =>
    vraag<ContractMetOverzicht>("/api/beheer/contracten", {
      method: "POST",
      body: JSON.stringify(invoer),
    }),

  wijzig: (id: string, invoer: FormulierInvoer) =>
    vraag<ContractMetOverzicht>(`/api/beheer/contracten/${id}`, {
      method: "PATCH",
      body: JSON.stringify(invoer),
    }),

  verwijder: (id: string) =>
    vraag<{ ok: true }>(`/api/beheer/contracten/${id}`, { method: "DELETE" }),

  versturen: (id: string) =>
    vraag<VerstuurAntwoord>(`/api/beheer/contracten/${id}/versturen`, { method: "POST" }),

  herinneren: (id: string) =>
    vraag<VerstuurAntwoord>(`/api/beheer/contracten/${id}/herinneren`, { method: "POST" }),

  goedkeuren: (id: string) =>
    vraag<{ contract: Contract; link: string; waarschuwingen: string[] }>(
      `/api/beheer/contracten/${id}/goedkeuren`, { method: "POST" }
    ),

  gezien: (id: string) =>
    vraag<{ ok: true }>(`/api/beheer/contracten/${id}/gezien`, { method: "POST" }),

  eigenHandtekening: () =>
    vraag<{ gezet: boolean; key: string | null }>("/api/beheer/instellingen/handtekening"),

  zetEigenHandtekening: (png: string) =>
    vraag<{ gezet: boolean }>("/api/beheer/instellingen/handtekening", {
      method: "PUT",
      body: JSON.stringify({ png }),
    }),
};

/** Wat het formulier verstuurt: bedragen in euro's, de server rekent om. */
export type FormulierInvoer = Omit<
  ContractInvoer,
  "transportCent" | "handmatigTotaalCent"
> & {
  transportEuro: number;
  /** Handmatig afgesproken totaalprijs in hele euro's, of null voor het tarief. */
  handmatigTotaalEuro: number | null;
};
