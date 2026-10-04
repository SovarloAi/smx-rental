# Contractmodule smxrental.com – bouwspecificatie

Dit document beschrijft de digitale huurcontract-flow voor SMX Rental. Het is geschreven als opdracht voor Claude Code. Het bijgevoegde `prototype.html` laat zien hoe de schermen en de flow eruit moeten zien en werken; gebruik het als functionele en visuele referentie, niet als code om over te nemen.

## Doel

Sjors maakt een huurcontract klaar, verstuurt het via WhatsApp (en optioneel e-mail), ziet de status, krijgt een melding bij ondertekening, en keurt het getekende contract goed. Daarna ontvangen klant en Sjors het definitieve PDF-contract.

De klanten zijn vaak oudere, weinig digitale mensen. De klantpagina moet daarom extreem eenvoudig zijn: geen account, geen wachtwoord, geen sms-code, grote letters en knoppen, u-vorm.

## Huidige situatie (eerst controleren)

- Next.js-site, gedeployed via GitHub naar Cloudflare (Pages).
- Domein smxrental.com, gekocht bij Namecheap.
- Bestaande onderdelen: prijscalculator met transportberekening, WhatsApp-links, AI-chatbot via de Anthropic API.
- Huisstijl: wit, zwart en zandtinten (zand #CBB897), premium uitstraling, formeel Nederlands (u/uw).

## Fase 0 – Onderzoek en voorstel (nog niets bouwen)

Onderzoek het project en rapporteer aan Sjors, voordat je iets wijzigt:

1. Hoe de site gebouwd en gedeployed wordt: statische export (`output: 'export'`), `@cloudflare/next-on-pages`, OpenNext of iets anders. Dit bepaalt waar de server-code komt:
   - Statische export → API als Cloudflare Pages Functions in `/functions`.
   - Server-runtime op Cloudflare → Next.js route handlers.
2. Of de DNS van smxrental.com via Cloudflare loopt (nameservers). Cloudflare Access vereist dat het domein als zone in Cloudflare staat. Zo niet: leg uit hoe Sjors de nameservers gratis naar Cloudflare verhuist.
3. Waar de prijslogica en transportberekening nu staan, zodat die hergebruikt kan worden.
4. Een concreet plan met de bestanden die je gaat toevoegen of wijzigen.

Wacht op akkoord van Sjors voordat je verdergaat.

## Techniek

| Onderdeel | Keuze |
| --- | --- |
| Database | Cloudflare D1 |
| Bestanden (handtekeningen, PDF's, foto's van papieren contracten) | Cloudflare R2, privé bucket |
| PDF genereren | `pdf-lib` (werkt op de Cloudflare-runtime) |
| Handtekening tekenen | `signature_pad` of een eigen canvas met pointer events |
| E-mail | Resend via de HTTP-API |
| Beveiliging beheer | Cloudflare Access (Zero Trust, gratis) |

Geheimen (`RESEND_API_KEY`, Access-instellingen) alleen via environment variables / secrets, nooit in de code.

## Routes

| Route | Wie | Doel |
| --- | --- | --- |
| `/beheer` | Sjors (Access) | Overzicht van alle contracten |
| `/beheer/nieuw` | Sjors | Contract klaarmaken |
| `/beheer/contract/[id]` | Sjors | Detail, versturen, herinneren, goedkeuren |
| `/beheer/contract/[id]/bewerken` | Sjors | Bewerken (alleen vóór ondertekening) |
| `/contract/[token]` | Klant | Lezen en ondertekenen |
| `/contract/[token]/definitief` | Klant | Definitief contract bekijken en PDF downloaden |
| `/api/beheer/*` | Sjors (Access) | Beheer-API |
| `/api/contract/[token]/*` | Klant | Ophalen, openen registreren, ondertekenen |

Zet `noindex` op alle `/beheer`- en `/contract`-pagina's en sluit ze uit in `robots.txt` en de sitemap.

## Beveiliging

- Cloudflare Access beschermt `/beheer*` en `/api/beheer*`; alleen Sjors' e-mailadres heeft toegang.
- De beheer-API controleert daarnaast zelf de `Cf-Access-Jwt-Assertion`-header (JWT valideren tegen de certs van het Access-team en de juiste audience). Vertrouw niet alleen op de route-instelling.
- Klanttoken: minimaal 32 willekeurige bytes (base64url), onraadbaar, uniek per contract.
- Klant-API geeft alleen de gegevens van dat ene contract terug, nooit lijsten.
- Ondertekenen kan maar één keer. Een ondertekend of goedgekeurd contract is niet meer te bewerken.
- Handtekeningen en PDF's staan in een privé R2-bucket en worden alleen via de API geserveerd (beheer via Access, klant via zijn eigen token).
- Eenvoudige rate limiting op de klant-API.

## Datamodel (D1)

**contracts**

- `id` (tekst, uuid), `token` (tekst, uniek), `status` (`concept` | `verstuurd` | `geopend` | `ondertekend` | `goedgekeurd`)
- Tijdstempels: `created_at`, `sent_at`, `opened_at`, `signed_at`, `approved_at`, `reminded_at`, `updated_at`
- Klant: `klant_naam`, `klant_adres`, `klant_postcode_plaats`, `klant_telefoon`, `klant_email`, `plaatsingsadres`
- Periode: `feest_datum`, `opbouw_datum`, `opbouw_tijd`, `afbouw_datum`, `afbouw_tijd`
- Producten: `extra_dagen`, `verlichting` (bool), `zijwanden` (0–2), `klinkers` (bool), `shotjesbar` (bool), `transport` (bedrag), `afspraken`
- `totaal` (server-side berekend), `voorwaarden_versie`
- Ondertekening: `signer_naam`, `signer_plaats`, `signature_key` (R2), `signed_ip`, `signed_user_agent`, `document_hash`
- `op_papier` (bool), `papier_key` (R2, foto/scan), `pdf_key` (R2), `gezien` (bool, voor de melding in het overzicht)

**events** (audit-log): `id`, `contract_id`, `type` (aangemaakt, gewijzigd, verstuurd, herinnering, geopend, ondertekend, goedgekeurd, op_papier), `at`, `ip`, `user_agent`.

**settings**: sleutel/waarde, onder meer `owner_signature_key` (R2).

Bedragen opslaan in hele euro's of centen (integer), nooit als float.

## Prijzen (config-bestand, server-side berekenen)

| Product | Prijs |
| --- | --- |
| Stretchtent 7,5 × 10 m, weekendtarief incl. op- en afbouw | € 550 |
| Extra huurdag | € 75 per dag |
| Sfeerverlichting | € 30 per weekend, extra dagen gratis |
| Zijwand 10 m (max. 2) | € 50 per stuk per weekend + € 10 per zijwand per extra dag |
| Toeslag klinkers of bestrating | € 75 |
| Shotjesbar | € 380 per weekend |
| Transportkosten | Bedrag uit de bestaande calculator (handmatig in te vullen, hergebruik de berekening waar mogelijk) |

Geen btw: SMX Rental valt onder de KOR. Vermeld dit bij elk totaal.

Het totaal wordt altijd op de server berekend; de client toont alleen een voorbeeld.

## Contracttekst

- Leg de Algemene Huurvoorwaarden vast als versiebestand in de code (bijvoorbeeld `voorwaarden/v1.ts`), met 13 artikelen. De actuele tekst staat in `prototype.html` (constante `VOORWAARDEN`) en is leidend.
- Elk contract bewaart `voorwaarden_versie`. Wijzigt de tekst later, dan komt er een nieuwe versie; bestaande contracten blijven aan hun eigen versie gekoppeld.
- Verhuurdergegevens: SMX Rental, Engelmanstraat 23, 6086 BA Neer · 06 20 65 15 28 · smxrental@gmail.com · KvK 99015951.
- Drie verplichte vinkjes voor de klant (zie `CHECKS` in het prototype).

## Flow

### 1. Klaarmaken (beheer)

- Formulier zoals in het prototype: klant, data en tijden, producten, transport, bijzondere afspraken.
- Feestdatum invullen zet automatisch opbouw (dag ervoor, 19:00) en afbouw (dag erna, 11:00, plus eventuele extra dagen). Sjors kan alles aanpassen.
- Live totaal tijdens het invullen.
- Opslaan als concept, of opslaan en versturen.

### 2. Versturen

- Toon een kant-en-klaar WhatsApp-bericht met de link naar `/contract/[token]`, als `https://wa.me/<nummer>?text=...` (06-nummer omzetten naar 316...). Sjors verstuurt het vanuit zijn eigen WhatsApp.
- Optioneel tegelijk een e-mail naar de klant met dezelfde link (alleen als er een e-mailadres is).
- Status wordt `verstuurd`.

### 3. Klant opent en ondertekent

- Openen zet de status op `geopend` (alleen de eerste keer).
- Pagina-opbouw (zie prototype): begroeting met voornaam → "Uw huur in het kort" (data, adres, producten met bedragen, totaal, "u betaalt pas na afloop via een factuur") → telefoon en e-mail controleren → voorwaarden per artikel uitklapbaar → drie vinkjes → naam en plaats → handtekeningvak → één grote knop "Contract ondertekenen".
- Duidelijke foutmelding die precies zegt wat nog ontbreekt.
- Bij ondertekenen legt de server vast: tijdstip, IP-adres, user-agent, handtekening (PNG naar R2) en een SHA-256-hash van de exacte contractinhoud (klantgegevens, periode, prijsregels, totaal, afspraken en de volledige voorwaardentekst van de gebruikte versie).
- Bedankpagina met een optionele knop om Sjors via WhatsApp te laten weten dat het getekend is (naar 31620651528).

### 4. Melding naar Sjors

- E-mail naar smxrental@gmail.com: "[naam] heeft het huurcontract ondertekend", met link naar het contract in het beheer.
- In het overzicht een opvallende melding voor ondertekende contracten die nog niet bekeken zijn.

### 5. Goedkeuren

- Sjors bekijkt het getekende contract en klikt op "Goedkeuren en afronden".
- De opgeslagen handtekening van Sjors wordt toegevoegd, met plaats "Neer" en als datum de verzenddatum.
- Genereer de definitieve PDF (alle gegevens, prijzen, volledige voorwaarden, beide handtekeningen, en onderaan de ondertekeningsgegevens en de documenthash) en sla die op in R2.
- E-mail met de PDF als bijlage naar de klant en naar Sjors.
- Knop om de klant via WhatsApp de link naar `/contract/[token]/definitief` te sturen.

### 6. Overige acties

- Herinnering sturen (WhatsApp-bericht met dezelfde link; `reminded_at` bijwerken).
- "Ondertekend op papier": foto of scan uploaden naar R2, status naar `ondertekend`, `op_papier = true`.
- Contract verwijderen (met bevestiging).
- Instelling om Sjors' eigen handtekening één keer te zetten of te wijzigen.

## E-mail

- Verzenden vanaf een adres op smxrental.com (bijvoorbeeld contracten@smxrental.com), met `reply-to: smxrental@gmail.com`. Het domein moet in Resend geverifieerd worden (DNS-records).
- Eenvoudige, nette HTML-mails in huisstijl, met een platte-tekstversie.

## Beheerscherm

- Overzicht gesorteerd op feestdatum, met tellers: te keuren, wacht op handtekening, concept, rond.
- Per contract: naam, locatie, feestdatum, totaal, statuslabel.
- Detailpagina met tijdlijn (klaargemaakt, verstuurd, geopend, ondertekend, goedgekeurd) en de bewijsgegevens.
- Werkt goed op telefoon. Voeg een web app manifest en icoon toe, zodat Sjors `/beheer` op zijn beginscherm kan zetten.

## Toegankelijkheid klantpagina

- Lettergrootte minimaal 19px, knoppen minimaal 56px hoog, hoog contrast.
- Volledig bruikbaar op een oudere telefoon; handtekeningvak werkt met vinger en muis.
- Formeel Nederlands (u/uw), korte zinnen, geen vakjargon.

## Opleverfasen

1. **Fase 0** – onderzoek en plan (zie boven).
2. **Fase 1** – D1-schema en migraties, R2, API-endpoints, Access-controle, prijsconfig en voorwaarden-v1.
3. **Fase 2** – beheerscherm: overzicht, formulier, detail, versturen, herinneren.
4. **Fase 3** – klantpagina en ondertekenen, inclusief hash en audit-log.
5. **Fase 4** – goedkeuren, PDF, e-mails, meldingen, eigen handtekening.
6. **Fase 5** – testen en livegang.

Na elke fase: kort laten zien wat er gebouwd is en hoe Sjors het kan testen. Commit per fase.

## Testchecklist (fase 5)

- Volledige flow van klaarmaken tot definitieve PDF, op laptop en op telefoon.
- Klantpagina testen met iemand die weinig digitaal is.
- Een ondertekend contract kan niet opnieuw ondertekend of bewerkt worden.
- `/beheer` en `/api/beheer` zijn zonder Access-login niet bereikbaar (ook niet via directe API-aanroepen).
- Een onbekend of fout token geeft een nette foutpagina.
- E-mails komen aan en belanden niet in spam.
- Totaal klopt in alle combinaties (extra dagen met verlichting en zijwanden).

## Later (niet in deze versie)

- Contract automatisch invullen door een WhatsApp-gesprek te plakken (Anthropic API).
- Pushmeldingen op de telefoon (bijvoorbeeld via ntfy).
- Automatische herinnering na een aantal dagen.
- Aparte productblokken voor Shotjesbar en, later, de Photobooth.
