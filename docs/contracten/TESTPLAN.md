# Testplan contractmodule

De checklist uit `SPEC-contracten.md`, met per punt hoe het gecontroleerd is.
De geautomatiseerde controles draaien tegen een lopende dev-server op poort
3001 met een lege lokale database.

## Checklist uit de spec

| Punt | Hoe gecontroleerd | Uitkomst |
| --- | --- | --- |
| Volledige flow van klaarmaken tot definitieve PDF, op laptop en telefoon | Geautomatiseerd op 390 en 1280 px: contract klaarmaken, versturen, ondertekenen met getekende handtekening, goedkeuren, PDF ophalen, definitieve pagina | 26 controles, alles goed |
| Klantpagina testen met iemand die weinig digitaal is | **Nog te doen door Sjors** — dit kan niet geautomatiseerd | open |
| Een ondertekend contract kan niet opnieuw ondertekend of bewerkt worden | Tweede ondertekening geeft 409, PATCH na ondertekenen geeft 409, ondertekenaar wordt niet overschreven. Ook na goedkeuring: bewerken en nogmaals goedkeuren geven 409 | goed |
| `/beheer` en `/api/beheer` zijn zonder Access niet bereikbaar | Op de preview: alle beheerroutes geven 302 naar het Access-loginscherm. Zonder `CF_ACCESS`-configuratie weigeren de routes zelf met 403 — de tweede laag uit de spec | goed |
| Een onbekend of fout token geeft een nette foutpagina | Te kort, juist formaat maar onbekend, en padtrucs geven alle drie 404. De pagina toont "Dit contract is niet gevonden" met een belknop | goed |
| E-mails komen aan en belanden niet in spam | Door Sjors bevestigd: melding bij ondertekening, het definitieve contract met werkende PDF, en de kopie | goed |
| Totaal klopt in alle combinaties | 648 combinaties van producten, opties, extra dagen, zijwanddagen en transport, onafhankelijk nagerekend | 0 afwijkingen |

## Vaste testsuites

Draaien met een lopende dev-server; leeg eerst de lokale database.

| Suite | Wat | Omvang |
| --- | --- | --- |
| `e2e` | API van klaarmaken tot ondertekenen, inclusief beveiliging | 41 |
| `beheer-test` | Beheerschermen op 390 en 1280 px | 38 |
| `fase3` | Klantpagina, toegankelijkheid en ondertekenen | 46 |
| `doorstroom` | Elk veld uit het beheer terug op de klantpagina | 47 |
| `fase4` | Goedkeuren, PDF en de definitieve pagina | 16 |
| `fase5` | De checklist hierboven | 26 |

## Wat niet geautomatiseerd is

- **Echte e-mailbezorging.** Resend is door Sjors getest met echte mails.
- **Gedrag van een echte klant.** De klantpagina is gemeten op lettergrootte
  (19 px), knophoogte (56 px) en aanklikbare vlakken (66–95 px), maar of hij
  ook écht te begrijpen is, blijkt pas als iemand uit de doelgroep hem gebruikt.
- **Beheer achter Access.** Daar komt een geautomatiseerde test niet door;
  dat deel is op de preview met de hand gecontroleerd.

## Voor livegang

1. Beide databases gemigreerd (`db:migrate:prod` en `db:migrate:preview`).
2. `nodejs_compat` staat op Production én Preview.
3. Bindings `DB` en `BESTANDEN` (jurisdictie EU) op beide omgevingen.
4. Secrets `ANTHROPIC_API_KEY` en `RESEND_API_KEY` op beide omgevingen.
5. Cloudflare Access op `smxrental.com/beheer*` en `smxrental.com/api/beheer*`.
6. Eigen handtekening gezet via `/beheer/instellingen` — **op productie
   opnieuw**, want die staat in de database en preview heeft een eigen database.
