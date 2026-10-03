/**
 * Hoe we naar de gehuurde producten verwijzen in berichten, op de klantpagina
 * en straks in de e-mails en de PDF. Op één plek, zodat er nergens "tent" komt
 * te staan bij een klant die alleen de Shotjesbar huurt.
 */

export type Producten = { tent: boolean; shotjesbar: boolean };

/** "de stretchtent" · "de Shotjesbar" · "de stretchtent en de Shotjesbar" */
export function productOmschrijving(p: Producten): string {
  if (p.tent && p.shotjesbar) return "de stretchtent en de Shotjesbar";
  if (p.shotjesbar) return "de Shotjesbar";
  if (p.tent) return "de stretchtent";
  return "uw huur";
}

/** Zonder lidwoord: "Stretchtent" · "Shotjesbar" · "Stretchtent + Shotjesbar" */
export function productKort(p: Producten): string {
  const delen = [p.tent && "Stretchtent", p.shotjesbar && "Shotjesbar"].filter(Boolean);
  return delen.join(" + ") || "—";
}
