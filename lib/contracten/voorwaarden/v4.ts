/**
 * Algemene Huurvoorwaarden SMX Rental — versie v4.
 *
 * Verschil met v3: alleen het artikel "Privacy". De oude tekst zei dat
 * gegevens "niet aan derden worden verstrekt" en "niet langer bewaard dan
 * wettelijk verplicht". Dat eerste klopte niet — de site, de opslag en de
 * e-mail lopen via dienstverleners die de gegevens namens verhuurder
 * verwerken — en het tweede was te vaag om iets aan af te meten. v4 noemt de
 * verwerkers met naam en een concrete bewaartermijn.
 *
 * Alle andere artikelen komen ongewijzigd uit v3. Dat is geen kopie: ze worden
 * hier uit v3 overgenomen, zodat er één tekst blijft bestaan.
 */

import { ARTIKELEN as V3_ARTIKELEN, CHECKS as V3_CHECKS, type Artikel } from "./v3";

export const VERSIE = "v4" as const;

const PRIVACY: Artikel = {
  kop: "Privacy",
  voor: "altijd",
  leden: [
    "Verhuurder gebruikt de gegevens van de huurder alleen voor het uitvoeren van de huurovereenkomst en voor zijn administratie.",
    "Voor de website, het bewaren van contracten en het versturen van e-mail maakt verhuurder gebruik van dienstverleners die de gegevens namens hem verwerken: Cloudflare (hosting en opslag), Resend (e-mail) en Anthropic (het uitlezen van een bericht van de huurder bij het opstellen van een contract). Verder worden de gegevens niet aan derden verstrekt.",
    "Verhuurder bewaart de huurovereenkomst en de gegevens die daarbij horen zeven jaar, conform de fiscale bewaarplicht, en verwijdert ze daarna.",
    "De huurder kan zijn gegevens opvragen, laten verbeteren of laten verwijderen voor zover de bewaarplicht dat toelaat. Een verzoek daarvoor kan naar smxrental@gmail.com.",
  ],
};

export const ARTIKELEN: readonly Artikel[] = V3_ARTIKELEN.map((a) =>
  a.kop === "Privacy" ? PRIVACY : a
);

export const CHECKS = V3_CHECKS;

export { VERHUURDER } from "./v1";
