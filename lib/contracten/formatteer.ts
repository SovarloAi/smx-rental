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

/**
 * Zet elk woord van een naam met een hoofdletter, zodat "janssen" netjes als
 * "Janssen" in de begroeting komt. Nederlandse tussenvoegsels blijven klein,
 * behalve als de naam daarmee begint — "van der Berg", maar "Van Dijk" als
 * alleen dat is ingevuld.
 */
const TUSSENVOEGSELS = new Set([
  "van", "de", "der", "den", "het", "ten", "ter", "te", "in", "op", "aan",
  "bij", "tot", "uit", "voor", "'t", "d'",
]);

export function naamMetHoofdletters(naam: string): string {
  const woorden = (naam || "").trim().split(/\s+/).filter(Boolean);
  return woorden
    .map((woord, i) => {
      const klein = woord.toLocaleLowerCase("nl-NL");
      if (i > 0 && TUSSENVOEGSELS.has(klein)) return klein;
      // Namen met een koppelteken of apostrof: elk deel een hoofdletter.
      return klein.replace(/(^|[-'’])([a-zà-ÿ])/g, (_, scheiding, letter) =>
        scheiding + letter.toLocaleUpperCase("nl-NL")
      );
    })
    .join(" ");
}

export function voornaam(naam: string): string {
  const net = naamMetHoofdletters(naam);
  const eerste = net.split(" ")[0] || "";
  // Is er alleen een achternaam met tussenvoegsel ingevuld ("van Dijk"), dan
  // zou de begroeting "Goedendag Van" worden. Dan liever de hele naam.
  if (TUSSENVOEGSELS.has(eerste.toLocaleLowerCase("nl-NL"))) return net;
  return eerste;
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
