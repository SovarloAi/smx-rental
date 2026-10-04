/**
 * Algemene Huurvoorwaarden SMX Rental — versie v1.
 *
 * Deze tekst is LEIDEND en letterlijk overgenomen uit het goedgekeurde
 * prototype. Wijzigt de tekst, maak dan een nieuwe versie (v2.ts) aan en laat
 * dit bestand ongemoeid: bestaande contracten blijven aan hun eigen versie
 * gekoppeld via `contracts.voorwaarden_versie`.
 */

export const VERSIE = "v1" as const;

/** De 13 artikelen: [kop, [lid, lid, ...]]. */
export const ARTIKELEN: ReadonlyArray<readonly [string, readonly string[]]> = [
 ["Toepasselijkheid",["Deze voorwaarden gelden voor alle verhuur door SMX Rental (“verhuurder”) aan de persoon die de huurovereenkomst ondertekent (“huurder”).","Afwijkende afspraken gelden alleen als ze onder “Bijzondere afspraken” in de huurovereenkomst staan."]],
 ["Het gehuurde",["Verhuurder verhuurt de producten die in de huurovereenkomst staan, inclusief de benodigde bevestigingsmaterialen.","Op- en afbouw van de stretchtent gebeuren altijd door verhuurder, op de tijden uit de huurovereenkomst.","Het is de huurder niet toegestaan de tent te verplaatsen of het gehuurde onder te verhuren of aan derden mee te geven. Het nalopen en aanspannen van de spanlijnen is wel toegestaan, zoals beschreven in artikel 6.4."]],
 ["Locatie en ondergrond",["De tent heeft inclusief spandraden ongeveer 10,5 × 13 meter vrije ruimte nodig. De huurder zorgt dat deze ruimte op het afgesproken tijdstip vrij en bereikbaar is.","De huurder stuurt bij de aanvraag een foto van de plaatsingslocatie, zodat verhuurder vooraf kan beoordelen of opbouw mogelijk is.","De tent is standaard bedoeld voor plaatsing op gras. Plaatsing op klinkers of andere bestrating is alleen mogelijk na vooraf gemaakte afspraken. Daarbij kan het nodig zijn enkele klinkers tijdelijk te verwijderen voor het plaatsen van haringen. Vanwege de extra opbouwtijd geldt hiervoor een toeslag van € 75.","Bij aankomst beoordeelt verhuurder de ondergrond. Is deze te nat, onstabiel of om een andere reden ongeschikt, dan kan verhuurder de opbouw weigeren. Verhuurder is in dat geval niet aansprakelijk voor het niet kunnen plaatsen van de tent. De huurder is dan alleen de transportkosten verschuldigd."]],
 ["Kabels en leidingen",["De huurder is verplicht vóór de opbouw aan te geven waar zich kabels en leidingen (zoals stroom, water, gas, glasvezel en riolering) in de grond bevinden.","Verhuurder is niet aansprakelijk voor schade aan kabels of leidingen die niet of onjuist zijn doorgegeven. Deze schade en de gevolgen daarvan komen voor rekening van de huurder."]],
 ["Gebruik en verboden",["De huurder gebruikt het gehuurde zorgvuldig en volgens de aanwijzingen van verhuurder.","Open vuur, vuurkorven, barbecues en andere ontvlambare warmtebronnen zijn in of nabij de tent ten strengste verboden.","Rookbommen, champagne spuiten, schuim, kleurpoeder, glitter en andere middelen die de tent kunnen vervuilen of beschadigen zijn ten strengste verboden.","Schade of vervuiling door overtreding van dit artikel komt volledig voor rekening van de huurder."]],
 ["Weer en veiligheid",["De stretchtent is een tijdelijke overkapping. De tent is niet bestand tegen extreme weersomstandigheden, zoals storm (windkracht 6 of hoger), zware regenval of sneeuwbelasting.","Verhuurder is tijdens het feest niet op locatie en het weer kan lokaal sterk verschillen. De huurder beoordeelt daarom zelf ter plaatse wanneer het onveilig wordt en is verantwoordelijk voor het tijdig ontruimen van de tent, zowel personen als spullen.","Bij (dreigend) gevaarlijk weer belt de huurder direct verhuurder op 06 20 65 15 28, zodat verhuurder maatregelen kan nemen.","De huurder breekt de tent nooit zelf af. De huurder mag de spanlijnen nalopen en een slappe spanlijn met de spanner bijstellen, maar alleen als dit veilig kan en de huurder weet hoe dit moet. Twijfelt de huurder, dan laat hij de tent ongemoeid en belt hij verhuurder. Schade door ondeskundig aanpassen van de tent komt voor rekening van de huurder.","Schade aan het gehuurde door plotseling opkomende extreme weersomstandigheden komt niet voor rekening van de huurder, mits de huurder zich aan dit artikel heeft gehouden. Heeft de huurder de tent niet tijdig ontruimd of verhuurder niet gewaarschuwd, dan is de huurder aansprakelijk voor de schade.","Een slechte weersverwachting is geen reden voor kosteloze annulering buiten de termijnen van artikel 9."]],
 ["Schade, vervuiling en reinigingskosten",["De huurder is vanaf de opbouw tot en met de afbouw verantwoordelijk voor het gehuurde en levert het terug in de staat waarin het is ontvangen.","Normale gebruikssporen, zoals licht vuil, gras of regenwater, worden niet in rekening gebracht.","Is het tentdoek of zijn de zijwanden vervuild door bijvoorbeeld drank, eten, vet, rook, roet, kleurpoeder of verf, of bovenmatig vervuild door natuurlijke stoffen zoals veel modder of boomhars, dan worden de reinigingskosten aan de huurder doorberekend. De reinigingskosten worden achteraf vastgesteld op basis van de werkelijke kosten.","Schade aan het gehuurde door onzorgvuldig gebruik, waaronder defecte verlichting, gescheurd tentdoek, beschadigde zijwanden en ontbrekende of beschadigde materialen, komt voor rekening van de huurder. De huurder betaalt de reparatiekosten, of bij onherstelbare schade of verlies de vervangingswaarde.","Verhuurder legt de staat van het gehuurde bij opbouw en afbouw vast met foto’s. De huurder mag daarbij aanwezig zijn.","Reinigings- en schadekosten worden op de factuur van de huurperiode vermeld."]],
 ["Aansprakelijkheid van verhuurder",["Verhuurder bouwt de tent vakkundig op en zorgt dat het gehuurde bij levering in goede staat is.","Verhuurder is niet aansprakelijk voor letsel of schade die ontstaat door gebruik in strijd met deze voorwaarden of de aanwijzingen van verhuurder, of door voortgezet gebruik van de tent bij gevaarlijke weersomstandigheden.","Verhuurder is niet aansprakelijk voor gevolgschade, zoals een feest dat (deels) niet door kan gaan.","De aansprakelijkheid van verhuurder is in alle gevallen beperkt tot het bedrag dat de verzekering van verhuurder uitkeert, of, als er geen uitkering plaatsvindt, tot het totale huurbedrag uit de huurovereenkomst.","De beperkingen in dit artikel gelden niet bij opzet of grove schuld van verhuurder."]],
 ["Annulering",["De huurder annuleert per e-mail, WhatsApp of telefoon. De datum waarop de huurder contact opneemt, geldt als annuleringsdatum. Bij een telefonische annulering stuurt verhuurder een bevestiging per e-mail of WhatsApp.","Annulering meer dan 14 dagen voor de opbouwdatum is kosteloos.","Bij annulering binnen 14 dagen voor de opbouwdatum is de huurder 25% van het totale huurbedrag verschuldigd.","Bij annulering binnen 7 dagen voor de opbouwdatum is de huurder 50% van het totale huurbedrag verschuldigd.","Bij annulering binnen 48 uur voor de opbouwdatum is de huurder 75% van het totale huurbedrag verschuldigd.","Kan verhuurder door overmacht (zoals ziekte, schade aan de tent of pech onderweg) niet leveren, dan is de huurder niets verschuldigd. Verhuurder probeert in overleg een andere datum te vinden, maar is niet aansprakelijk voor verdere schade."]],
 ["Afbouw en natte tent",["De huurder zorgt dat verhuurder op het afgesproken afbouwmoment toegang heeft tot de locatie.","Is de tent bij afbouw nog nat, dan blijft deze staan tot het tentdoek voldoende is opgedroogd. Hiervoor worden geen extra dagen in rekening gebracht.","Tot de afbouw blijft de huurder verantwoordelijk voor de tent volgens artikel 6 en 7."]],
 ["Betaling",["De huurder ontvangt na afloop van de huurperiode een factuur en betaalt binnen 14 dagen na factuurdatum.","SMX Rental valt onder de kleineondernemersregeling (KOR) en brengt geen btw in rekening.","Bij te late betaling stuurt verhuurder een herinnering. Blijft betaling daarna uit, dan kan verhuurder wettelijke rente en incassokosten in rekening brengen."]],
 ["Privacy",["Verhuurder gebruikt de gegevens van de huurder alleen voor het uitvoeren van de huurovereenkomst en de administratie. De gegevens worden niet aan derden verstrekt en niet langer bewaard dan wettelijk verplicht."]],
 ["Toepasselijk recht",["Op de huurovereenkomst en deze voorwaarden is Nederlands recht van toepassing."]]
] as const;

/** De drie verplichte vinkjes voor de klant. */
export const CHECKS: readonly string[] = [
 "Ik heb de Algemene Huurvoorwaarden van SMX Rental gelezen en ga ermee akkoord.",
 "Ik heb doorgegeven waar kabels en leidingen in de grond liggen, of er zijn mij op de plaatsingslocatie geen kabels of leidingen bekend.",
 "De gegevens in deze overeenkomst zijn juist."
] as const;

/** Verhuurdergegevens zoals ze in het contract en de PDF komen. */
export const VERHUURDER = {
  naam: "SMX Rental",
  adres: "Engelmanstraat 23",
  postcodePlaats: "6086 BA Neer",
  telefoon: "06 20 65 15 28",
  email: "smxrental@gmail.com",
  kvk: "99015951",
  plaats: "Neer",
  ondertekenaar: "Sjors Dirkx namens SMX Rental",
} as const;
