/** Opmaak van datums en bedragen. Wordt zowel op de server als in de browser
 *  gebruikt, dus geen afhankelijkheden van Node of de Cloudflare-runtime. */

export { euro } from "@/lib/prijzen";

/** "zaterdag 15 mei 2027" */
export function datumLang(datum: string): string {
  if (!datum) return "–";
  return new Date(`${datum}T12:00:00Z`).toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

/** "15 mei 2027" */
export function datumKort(datum: string): string {
  if (!datum) return "–";
  return new Date(`${datum}T12:00:00Z`).toLocaleDateString("nl-NL", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

/** "15 mei, 14:32" — voor tijdstempels uit de database (ISO met tijd). */
export function tijdstip(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("nl-NL", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function voornaam(naam: string): string {
  return (naam || "").trim().split(" ")[0] || "";
}

/** Schuift een datum een aantal dagen op, met behoud van het YYYY-MM-DD-formaat. */
export function schuifDatum(datum: string, dagen: number): string {
  if (!datum) return "";
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dagen);
  return d.toISOString().slice(0, 10);
}

/** Dagen tot de opbouwdatum; negatief als die al geweest is. */
export function dagenTot(datum: string): number | null {
  if (!datum) return null;
  const doel = new Date(`${datum}T12:00:00Z`).getTime();
  const nu = new Date();
  const vandaag = Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate(), 12);
  return Math.round((doel - vandaag) / 86400000);
}
