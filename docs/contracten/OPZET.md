# Contractmodule — opzet en lokaal draaien

Hoort bij `SPEC-contracten.md`. Beschrijft hoe de module technisch in elkaar
zit en hoe je hem lokaal draait.

## Hoe dit project deployt

De site draait op **Cloudflare Pages** (project `smx-rental`) met de ingebouwde
Next.js-preset, die zelf `@cloudflare/next-on-pages` draait. Deployen gebeurt
door naar GitHub te pushen; Pages bouwt automatisch (~2–3 minuten).

Gevolg voor deze module:

- Server-code zijn **gewone Next.js route handlers** onder `app/api/...`.
- Elke route moet `export const runtime = "edge"` hebben.
- D1 en R2 komen binnen via `getRequestContext()` (zie `lib/contracten/platform.ts`).

## Waarom `wrangler.dev.toml` en geen `wrangler.toml`

Cloudflare Pages leest een `wrangler.toml` in de projectroot en laat die dan
vóórgaan op de instellingen in het dashboard. Omdat de live site daar prima
mee draait, wilden we die configuratie niet overnemen in git en daarmee riskeren
dat een foutje de marketingsite omlegt.

Daarom heet het bestand bewust **`wrangler.dev.toml`**:

- Pages ziet het niet en blijft de dashboardinstellingen gebruiken.
- Lokaal gebruiken `setupDevPlatform({ configPath: "wrangler.dev.toml" })` en
  de `db:*`-scripts het wél.

**De productie-bindings zet je dus in het Pages-dashboard**, niet in dit bestand.

## Instellen in Cloudflare (eenmalig)

### 1. Bindings op het Pages-project

Workers & Pages → **smx-rental** → Settings → Bindings. Voeg toe voor
**Production én Preview**:

| Type | Variabelenaam | Waarde |
| --- | --- | --- |
| D1 database | `DB` | `smx-contracten` |
| R2 bucket | `BESTANDEN` | `smx-contracten-bestanden`, jurisdiction **EU** |

> De bucket staat in de EU-jurisdictie. Kies bij de R2-binding expliciet die
> jurisdictie; zonder die keuze wijst de binding naar een niet-bestaande bucket
> in de standaardjurisdictie.

### 2. Environment variables

Settings → Environment variables, voor Production én Preview:

| Naam | Waarde |
| --- | --- |
| `CF_ACCESS_TEAM_DOMAIN` | `<team>.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | de Application Audience (AUD) tag van de Access-app |
| `CONTRACT_BASIS_URL` | `https://smxrental.com` (preview: de preview-URL) |
| `RESEND_API_KEY` | pas nodig in fase 4 — als **secret** |

### 3. Cloudflare Access

Zero Trust → Access → Applications → Add a self-hosted application:

- Application domain: `smxrental.com`, path `beheer`
- Tweede domain-regel: `smxrental.com`, path `api/beheer`
- Policy: Allow, Include → Emails → het e-mailadres van Sjors

Noteer daarna onder Overview de **Application Audience (AUD) Tag** — die gaat
in `CF_ACCESS_AUD`.

### 4. Migraties op de echte database

```bash
npx wrangler login          # eenmalig
npm run db:migrate:prod
```

## Lokaal draaien

```bash
cp .dev.vars.example .dev.vars   # vul LOKALE_BEHEERDER in
npm run db:migrate               # migraties op de lokale database
npm run dev                      # draait op poort 3001
```

`setupDevPlatform()` geeft `next dev` echte lokale D1- en R2-bindings via
miniflare. De lokale database staat in `.wrangler/state/` (niet in git).

Let op: draai **niet** `npm run build` terwijl de dev-server loopt — die
overschrijft `.next` en de dev-server valt dan om.

### Access op localhost

Cloudflare Access bestaat niet op localhost, dus inloggen kan daar niet. Zet
`LOKALE_BEHEERDER=<e-mailadres>` in `.dev.vars` om de controle over te slaan.
Dat werkt alleen bij `NODE_ENV === "development"`; een Pages-build draait met
`NODE_ENV=production` en kan die tak nooit nemen.

## `npm run cf:build` — let op de valse melding

`npm run cf:build` draait `@cloudflare/next-on-pages` lokaal, om te controleren
of elke route de edge-runtime declareert. Dat is nuttig: vergeet je bij een
nieuwe API-route `export const runtime = "edge"`, dan vang je dat hiermee op.

De versie die we lokaal moeten gebruiken (1.13.12) is wel wat ouder: 1.13.16+
eist `next >= 14.3` en dit project draait 14.2.35. Die oudere versie meldt ten
onrechte dat vier routes de edge-runtime missen:

```
/favicon.ico  /manifest.webmanifest  /robots.txt  /sitemap.xml
```

Die zijn statisch (ze staan in `.next/prerender-manifest.json`) en draaien
gewoon live. **Negeer die vier; let alleen op routes die je zelf hebt
toegevoegd.** De echte bouwcontrole is de preview-deploy van Cloudflare.

## Twee dingen die onderweg bleken

**Cloudflare draait de Next.js image-optimizer niet.** Dat was al eerder
opgelost met `images.unoptimized`; hier alleen van belang omdat het verklaart
waarom alle statische assets rechtstreeks geserveerd worden.

**R2 `put()` krijgt een `Blob`, geen `ArrayBuffer`.** Tijdens `next dev` draait
de route in de edge-sandbox van Next, terwijl de R2-binding bij miniflare in een
ander realm leeft. Een `ArrayBuffer` uit die sandbox herkent miniflare niet
("Invalid input"); een `Blob` wel. Zie `lib/contracten/r2.ts`.

## Indeling

```
lib/prijzen.ts                     tarieven (centen) — enige bron van waarheid
lib/transport.ts                   bestaande transportberekening, her-exporteert de tarieven
lib/contracten/
  types.ts        datamodel
  regels.ts       prijsregels + totaal (server-side)
  voorwaarden/    v1.ts (13 artikelen, leidend) + register per versie
  db.ts           alle SQL
  r2.ts           bestandsopslag
  platform.ts     bindings
  access.ts       Cloudflare Access-JWT-validatie
  ratelimit.ts    rate limiting klant-API
  token.ts        32-byte klanttokens
  hash.ts         SHA-256 over de contractinhoud
  berichten.ts    WhatsApp-teksten en -links
  api.ts          JSON-helpers, Access-guard, validatie
app/api/beheer/**     beheer-API (achter Access)
app/api/contract/**   klant-API (token)
migrations/           D1-migraties
```
