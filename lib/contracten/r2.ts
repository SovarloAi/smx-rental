/**
 * R2-opslag voor handtekeningen, PDF's en foto's van papieren contracten.
 *
 * De bucket is privé: bestanden worden nooit rechtstreeks geserveerd, altijd
 * via een API-route die eerst de toegang controleert (beheer via Cloudflare
 * Access, klant via zijn eigen token).
 */

import { bucket } from "./platform";
// De Workers-runtime heeft zijn eigen Blob-definitie. Het is dezelfde waarde
// als de DOM-Blob, maar TypeScript ziet twee onverenigbare typen (hun
// stream() verschilt). We importeren de Workers-variant om die ene cast
// hieronder expliciet en leesbaar te houden.
import type { Blob as WorkersBlob } from "@cloudflare/workers-types";

/** Sleutelindeling, zodat alles van één contract bij elkaar staat. */
export const sleutels = {
  handtekeningKlant: (contractId: string) => `contracten/${contractId}/handtekening-klant.png`,
  handtekeningEigen: (ext: "png" | "jpg" = "png") =>
    `instellingen/handtekening-verhuurder.${ext}`,
  pdf: (contractId: string) => `contracten/${contractId}/huurovereenkomst.pdf`,
  papier: (contractId: string, ext: string) => `contracten/${contractId}/op-papier.${ext}`,
};

export async function zetBestand(
  key: string,
  data: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<void> {
  // We geven de inhoud als Blob door, niet als ArrayBuffer of Uint8Array.
  // Reden: tijdens `next dev` draait deze code in de edge-sandbox van Next,
  // terwijl de R2-binding bij miniflare in een ander realm leeft. Een
  // ArrayBuffer uit de sandbox wordt daar niet herkend ("Invalid input"); een
  // Blob wel. Op de echte Workers-runtime zijn beide prima, dus dit werkt
  // overal hetzelfde.
  const blob = new Blob([data as BlobPart], { type: contentType });
  await bucket().put(key, blob as unknown as WorkersBlob, {
    httpMetadata: { contentType },
  });
}

export async function haalBestand(
  key: string
): Promise<{ body: ReadableStream; contentType: string; size: number } | null> {
  const obj = await bucket().get(key);
  if (!obj) return null;
  return {
    body: obj.body as unknown as ReadableStream,
    contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
    size: obj.size,
  };
}

/** Haalt een bestand als bytes op, bijvoorbeeld om in de PDF te zetten. */
export async function haalBytes(key: string): Promise<Uint8Array | null> {
  const obj = await bucket().get(key);
  if (!obj) return null;
  return new Uint8Array(await obj.arrayBuffer());
}

export async function verwijderBestand(key: string): Promise<void> {
  await bucket().delete(key);
}

export async function verwijderMapVanContract(contractId: string): Promise<void> {
  const prefix = `contracten/${contractId}/`;
  const lijst = await bucket().list({ prefix });
  await Promise.all(lijst.objects.map((o) => bucket().delete(o.key)));
}

/**
 * Leest een data-URL ("data:image/png;base64,....") uit en geeft de bytes
 * terug. Alleen PNG wordt geaccepteerd — dat is wat het handtekeningvak levert.
 */
export function pngUitDataUrl(dataUrl: string): Uint8Array | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const bin = atob(m[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    // Een lege of belachelijk grote handtekening weigeren we.
    if (bytes.length < 100 || bytes.length > 2_000_000) return null;
    return bytes;
  } catch {
    return null;
  }
}
