/**
 * Algemene Huurvoorwaarden SMX Rental — versie v3.
 *
 * Verschil met v2:
 * - De algemene artikelen zijn productneutraal gemaakt: ze spreken over "het
 *   gehuurde" in plaats van over de tent. Alles wat alleen voor de stretchtent
 *   geldt staat in tentspecifieke artikelen, zodat een Shotjesbar-contract geen
 *   bepalingen over tentdoek, spanlijnen of regenwater bevat.
 * - De Shotjesbar heeft eigen artikelen, inclusief een eigen artikel over
 *   schoonmaak en schade. Daar gaat het om gemorste drank en glaswerk, niet om
 *   gras en modder.
 * - Het vinkje over kabels en leidingen is vervallen. Dat wordt bij de opbouw
 *   samen besproken; artikel "Kabels en leidingen" beschrijft dat nu zo.
 *
 * v1 en v2 blijven bestaan voor contracten die daaraan gekoppeld zijn.
 */

export const VERSIE = "v3" as const;

/** Bij welk product een artikel hoort. */
export type Doelgroep = "altijd" | "tent" | "shotjesbar";

export type Artikel = {
  kop: string;
  voor: Doelgroep;
  leden: readonly string[];
};

export const ARTIKELEN: readonly Artikel[] = [
  {
    kop: "Toepasselijkheid",
    voor: "altijd",
    leden: [
      "Deze voorwaarden gelden voor alle verhuur door SMX Rental (“verhuurder”) aan de persoon die de huurovereenkomst ondertekent (“huurder”).",
      "Afwijkende afspraken gelden alleen als ze onder “Bijzondere afspraken” in de huurovereenkomst staan.",
    ],
  },
  {
    kop: "Het gehuurde",
    voor: "altijd",
    leden: [
      "Verhuurder verhuurt de producten die in de huurovereenkomst staan, inclusief de benodigde bevestigingsmaterialen.",
      "Op- en afbouw gebeuren altijd door verhuurder, op de tijden uit de huurovereenkomst.",
      "Het is de huurder niet toegestaan het gehuurde te verplaatsen, onder te verhuren of aan derden mee te geven.",
    ],
  },
  {
    kop: "De stretchtent",
    voor: "tent",
    leden: [
      "Het is de huurder niet toegestaan de tent te verplaatsen. Het nalopen en aanspannen van de spanlijnen is wel toegestaan, zoals beschreven in het artikel Weer en veiligheid.",
    ],
  },
  {
    kop: "Locatie en ondergrond",
    voor: "tent",
    leden: [
      "De tent heeft inclusief spandraden ongeveer 10,5 × 13 meter vrije ruimte nodig. De huurder zorgt dat deze ruimte op het afgesproken tijdstip vrij en bereikbaar is.",
      "De huurder stuurt bij de aanvraag een foto van de plaatsingslocatie, zodat verhuurder vooraf kan beoordelen of opbouw mogelijk is.",
      "De tent is standaard bedoeld voor plaatsing op gras. Plaatsing op klinkers of andere bestrating is alleen mogelijk na vooraf gemaakte afspraken. Daarbij kan het nodig zijn enkele klinkers tijdelijk te verwijderen voor het plaatsen van haringen. Vanwege de extra opbouwtijd geldt hiervoor een toeslag van € 75.",
      "Bij aankomst beoordeelt verhuurder de ondergrond. Is deze te nat, onstabiel of om een andere reden ongeschikt, dan kan verhuurder de opbouw weigeren. Verhuurder is in dat geval niet aansprakelijk voor het niet kunnen plaatsen van de tent. De huurder is dan alleen de transportkosten verschuldigd.",
    ],
  },
  {
    kop: "Kabels en leidingen",
    voor: "tent",
    leden: [
      "Bij de opbouw bespreken huurder en verhuurder samen waar kabels en leidingen (zoals stroom, water, gas, glasvezel en riolering) in de grond liggen. De huurder geeft daarbij aan wat hem bekend is.",
      "Verhuurder is niet aansprakelijk voor schade aan kabels of leidingen die niet zijn gemeld. Deze schade en de gevolgen daarvan komen voor rekening van de huurder.",
    ],
  },
  {
    kop: "De Shotjesbar",
    voor: "shotjesbar",
    leden: [
      "De Shotjesbar is een omgebouwde Volkswagen Golf Cabriolet op een aanhanger, waarvan de achterklep opengaat.",
      "Bij de huurprijs horen 50 shotjes, tien bekende merken sterke drank en het Krokodil Shot spel.",
      "De geleverde drank blijft na afloop van de huurperiode eigendom van de huurder, ook de flessen die niet zijn geopend. Het Krokodil Shot spel, het glaswerk en de bar zelf blijven eigendom van verhuurder en gaan weer mee terug.",
    ],
  },
  {
    kop: "Plaatsing en stroom",
    voor: "shotjesbar",
    leden: [
      "Verhuurder rijdt de Shotjesbar zo dicht mogelijk naar de gewenste plek en zet hem daar neer. Het laatste stuk kan zo nodig geduwd worden. De huurder hoeft de bar niet zelf te plaatsen.",
      "De ondergrond maakt niet uit; de Shotjesbar kan op vrijwel elke ondergrond staan. De huurder zorgt wel dat de plek met een auto bereikbaar is.",
      "De Shotjesbar heeft stroom nodig. De huurder zorgt voor één werkende aansluiting binnen bereik.",
      "De huurder verplaatst, duwt of sleept de Shotjesbar niet zelf en opent de motorkap niet.",
    ],
  },
  {
    kop: "Gebruik",
    voor: "altijd",
    leden: [
      "De huurder gebruikt het gehuurde zorgvuldig en volgens de aanwijzingen van verhuurder.",
      "Schade of vervuiling door gebruik in strijd met deze voorwaarden komt volledig voor rekening van de huurder.",
    ],
  },
  {
    kop: "Verboden in en om de tent",
    voor: "tent",
    leden: [
      "Open vuur, vuurkorven, barbecues en andere ontvlambare warmtebronnen zijn in of nabij de tent ten strengste verboden.",
      "Rookbommen, champagne spuiten, schuim, kleurpoeder, glitter en andere middelen die de tent kunnen vervuilen of beschadigen zijn ten strengste verboden.",
    ],
  },
  {
    kop: "Self-service en toezicht",
    voor: "shotjesbar",
    leden: [
      "De Shotjesbar is volledig self-service. Er staat niemand achter de bar en verhuurder is tijdens het feest niet aanwezig. Gasten pakken zelf een shotje of spelen zelf het Krokodil Shot spel.",
      "De huurder is verantwoordelijk voor het schenken en voor het naleven van de wettelijke regels daarover. De huurder verstrekt geen alcohol aan personen onder de 18 jaar en niet aan personen die kennelijk in staat van dronkenschap verkeren.",
      "Verhuurder is niet aansprakelijk voor schade of letsel dat voortkomt uit het gebruik van de geleverde drank.",
    ],
  },
  {
    kop: "Weer en veiligheid",
    voor: "tent",
    leden: [
      "De stretchtent is een tijdelijke overkapping. De tent is niet bestand tegen extreme weersomstandigheden, zoals storm (windkracht 6 of hoger), zware regenval of sneeuwbelasting.",
      "Verhuurder is tijdens het feest niet op locatie en het weer kan lokaal sterk verschillen. De huurder beoordeelt daarom zelf ter plaatse wanneer het onveilig wordt en is verantwoordelijk voor het tijdig ontruimen van de tent, zowel personen als spullen.",
      "Bij (dreigend) gevaarlijk weer belt de huurder direct verhuurder op 06 20 65 15 28, zodat verhuurder maatregelen kan nemen.",
      "De huurder breekt de tent nooit zelf af. De huurder mag de spanlijnen nalopen en een slappe spanlijn met de spanner bijstellen, maar alleen als dit veilig kan en de huurder weet hoe dit moet. Twijfelt de huurder, dan laat hij de tent ongemoeid en belt hij verhuurder. Schade door ondeskundig aanpassen van de tent komt voor rekening van de huurder.",
      "Schade aan het gehuurde door plotseling opkomende extreme weersomstandigheden komt niet voor rekening van de huurder, mits de huurder zich aan dit artikel heeft gehouden. Heeft de huurder de tent niet tijdig ontruimd of verhuurder niet gewaarschuwd, dan is de huurder aansprakelijk voor de schade.",
      "Een slechte weersverwachting is geen reden voor kosteloze annulering buiten de termijnen van artikel 9.",
    ],
  },
  {
    kop: "Schade en vervuiling",
    voor: "altijd",
    leden: [
      "De huurder is vanaf de opbouw tot en met de afbouw verantwoordelijk voor het gehuurde en levert het terug in de staat waarin het is ontvangen.",
      "Normale gebruikssporen worden niet in rekening gebracht.",
      "Schade aan het gehuurde door onzorgvuldig gebruik komt voor rekening van de huurder. De huurder betaalt de reparatiekosten, of bij onherstelbare schade of verlies de vervangingswaarde.",
      "Verhuurder legt de staat van het gehuurde bij opbouw en afbouw vast met foto’s. De huurder mag daarbij aanwezig zijn.",
      "Reinigings- en schadekosten worden op de factuur van de huurperiode vermeld.",
    ],
  },
  {
    kop: "Reiniging en schade aan de tent",
    voor: "tent",
    leden: [
      "Normale gebruikssporen aan de tent, zoals licht vuil, gras of regenwater, worden niet in rekening gebracht.",
      "Is het tentdoek of zijn de zijwanden vervuild door bijvoorbeeld drank, eten, vet, rook, roet, kleurpoeder of verf, of bovenmatig vervuild door natuurlijke stoffen zoals veel modder of boomhars, dan worden de reinigingskosten aan de huurder doorberekend. De reinigingskosten worden achteraf vastgesteld op basis van de werkelijke kosten.",
      "Schade door onzorgvuldig gebruik, waaronder defecte verlichting, gescheurd tentdoek, beschadigde zijwanden en ontbrekende of beschadigde materialen, komt voor rekening van de huurder.",
    ],
  },
  {
    kop: "Schoonmaak en schade aan de Shotjesbar",
    voor: "shotjesbar",
    leden: [
      "De huurder hoeft de Shotjesbar niet schoongemaakt terug te leveren. Er wordt wel normaal gebruik verwacht.",
      "Is er bijvoorbeeld een complete fles drank gemorst of is de binnenkant van de bar sterk vervuild geraakt, dan kan verhuurder de schoonmaakkosten doorberekenen. Die kosten worden achteraf vastgesteld op basis van de werkelijke kosten.",
      "Schade aan de Shotjesbar, het glaswerk of het Krokodil Shot spel komt voor rekening van de huurder. Dat geldt ook voor het aanbrengen van stickers, tape of andere zaken op of aan de bar.",
      "Regen is geen probleem voor de Shotjesbar. De huurder zorgt wel dat glaswerk en losse onderdelen bij slecht weer veilig worden weggezet.",
    ],
  },
  {
    kop: "Aansprakelijkheid van verhuurder",
    voor: "altijd",
    leden: [
      "Verhuurder levert het gehuurde vakkundig op en zorgt dat het bij levering in goede staat is.",
      "Verhuurder is niet aansprakelijk voor letsel of schade die ontstaat door gebruik in strijd met deze voorwaarden of de aanwijzingen van verhuurder.",
      "Verhuurder is niet aansprakelijk voor gevolgschade, zoals een feest dat (deels) niet door kan gaan.",
      "De aansprakelijkheid van verhuurder is in alle gevallen beperkt tot het bedrag dat de verzekering van verhuurder uitkeert, of, als er geen uitkering plaatsvindt, tot het totale huurbedrag uit de huurovereenkomst.",
      "De beperkingen in dit artikel gelden niet bij opzet of grove schuld van verhuurder.",
    ],
  },
  {
    kop: "Annulering",
    voor: "altijd",
    leden: [
      "De huurder annuleert per e-mail, WhatsApp of telefoon. De datum waarop de huurder contact opneemt, geldt als annuleringsdatum. Bij een telefonische annulering stuurt verhuurder een bevestiging per e-mail of WhatsApp.",
      "Annulering meer dan 14 dagen voor de opbouwdatum is kosteloos.",
      "Bij annulering binnen 14 dagen voor de opbouwdatum is de huurder 25% van het totale huurbedrag verschuldigd.",
      "Bij annulering binnen 7 dagen voor de opbouwdatum is de huurder 50% van het totale huurbedrag verschuldigd.",
      "Bij annulering binnen 48 uur voor de opbouwdatum is de huurder 75% van het totale huurbedrag verschuldigd.",
      "Kan verhuurder door overmacht (zoals ziekte, schade aan het gehuurde of pech onderweg) niet leveren, dan is de huurder niets verschuldigd. Verhuurder probeert in overleg een andere datum te vinden, maar is niet aansprakelijk voor verdere schade.",
    ],
  },
  {
    kop: "Afbouw",
    voor: "altijd",
    leden: [
      "De huurder zorgt dat verhuurder op het afgesproken afbouwmoment toegang heeft tot de locatie.",
      "Tot de afbouw blijft de huurder verantwoordelijk voor het gehuurde.",
    ],
  },
  {
    kop: "Afbouw van een natte tent",
    voor: "tent",
    leden: [
      "Is de tent bij afbouw nog nat, dan blijft deze staan tot het tentdoek voldoende is opgedroogd. Hiervoor worden geen extra dagen in rekening gebracht.",
    ],
  },
  {
    kop: "Betaling",
    voor: "altijd",
    leden: [
      "De huurder ontvangt na afloop van de huurperiode een factuur en betaalt binnen 14 dagen na factuurdatum.",
      "SMX Rental valt onder de kleineondernemersregeling (KOR) en brengt geen btw in rekening.",
      "Bij te late betaling stuurt verhuurder een herinnering. Blijft betaling daarna uit, dan kan verhuurder wettelijke rente en incassokosten in rekening brengen.",
    ],
  },
  {
    kop: "Privacy",
    voor: "altijd",
    leden: [
      "Verhuurder gebruikt de gegevens van de huurder alleen voor het uitvoeren van de huurovereenkomst en de administratie. De gegevens worden niet aan derden verstrekt en niet langer bewaard dan wettelijk verplicht.",
    ],
  },
  {
    kop: "Toepasselijk recht",
    voor: "altijd",
    leden: [
      "Op de huurovereenkomst en deze voorwaarden is Nederlands recht van toepassing.",
    ],
  },
] as const;

/**
 * De verplichte vinkjes. Het vinkje over kabels en leidingen is vervallen: dat
 * bespreken huurder en verhuurder bij de opbouw, waar tijd genoeg is om na te
 * meten.
 */
export const CHECKS: readonly { tekst: string; voor: Doelgroep }[] = [
  { tekst: "Ik heb de Algemene Huurvoorwaarden van SMX Rental gelezen en ga ermee akkoord.", voor: "altijd" },
  { tekst: "De gegevens in deze overeenkomst zijn juist.", voor: "altijd" },
] as const;

export { VERHUURDER } from "./v1";
