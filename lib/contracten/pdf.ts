/**
 * Genereert de definitieve huurovereenkomst als PDF.
 *
 * Met pdf-lib en de standaard Helvetica, zodat er geen lettertypebestand mee
 * hoeft. Helvetica kan alleen tekens uit WinAnsi aan; `leesbaar()` zet
 * typografische tekens om naar varianten die wél passen en gooit de rest weg,
 * zodat een rare apostrof nooit het hele contract laat mislukken.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { euro } from "@/lib/prijzen";
import { datumLang } from "./formatteer";
import { overzichtVan } from "./regels";
import { productOmschrijving } from "./producten";
import { VERHUURDER, voorwaardenVoor } from "./voorwaarden";
import { logoBytes } from "./logo";
import type { Contract } from "./types";

const A4 = { breedte: 595.28, hoogte: 841.89 };
const MARGE = 56;
const INHOUD = A4.breedte - MARGE * 2;

const INKT = rgb(0.04, 0.04, 0.04);
const GRIJS = rgb(0.42, 0.4, 0.37);
const LIJN = rgb(0.85, 0.83, 0.79);

/**
 * Helvetica gebruikt WinAnsi: dat is Latin-1 plus een handvol typografische
 * tekens (€, – , —, ‘ ’ “ ”, …, •, ™). Die mogen dus gewoon blijven staan.
 * Alleen wat daarbuiten valt vervangen we, anders laat één raar teken het hele
 * contract mislukken.
 */
const WINANSI_EXTRA = "\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178";
const BUITEN_WINANSI = new RegExp(`[^\\u0020-\\u007e\\u00a0-\\u00ff${WINANSI_EXTRA}]`, "g");

/** Vervangingen voor tekens die buiten WinAnsi vallen maar wél kunnen voorkomen. */
const VERVANG: Record<string, string> = {
  "\u2212": "-",   // echte minus
  "\u2033": '"',   // dubbele prime
  "\u2032": "'",   // enkele prime
  "\u00a0": " ",   // harde spatie
  "\u2192": "->",
  "\u2264": "<=",
  "\u2265": ">=",
};

export function leesbaar(tekst: string): string {
  let uit = tekst;
  for (const [van, naar] of Object.entries(VERVANG)) uit = uit.split(van).join(naar);
  // Eerst witruimte-stuurtekens naar een spatie. Zouden we ze gewoon
  // weghalen, dan plakt "krap!\nContact" aan elkaar tot "krap!Contact".
  uit = uit.replace(/[\t\r\n\v\f]/g, " ");
  // Wat daarna nog buiten WinAnsi valt (emoji bijvoorbeeld) vervangen we door
  // een spatie, om dezelfde reden.
  return uit.replace(BUITEN_WINANSI, " ").replace(/ {2,}/g, " ");
}

type Opmaak = {
  doc: PDFDocument;
  pagina: PDFPage;
  y: number;
  normaal: PDFFont;
  vet: PDFFont;
};

function nieuwePagina(o: Opmaak) {
  o.pagina = o.doc.addPage([A4.breedte, A4.hoogte]);
  o.y = A4.hoogte - MARGE;
}

function ruimte(o: Opmaak, nodig: number) {
  if (o.y - nodig < MARGE + 30) nieuwePagina(o);
}

/** Breekt tekst af op de beschikbare breedte. */
function regels(tekst: string, font: PDFFont, grootte: number, breedte: number): string[] {
  const woorden = leesbaar(tekst).split(/\s+/).filter(Boolean);
  const uit: string[] = [];
  let regel = "";
  for (const woord of woorden) {
    const kandidaat = regel ? `${regel} ${woord}` : woord;
    if (font.widthOfTextAtSize(kandidaat, grootte) > breedte && regel) {
      uit.push(regel);
      regel = woord;
    } else {
      regel = kandidaat;
    }
  }
  if (regel) uit.push(regel);
  return uit.length ? uit : [""];
}

function schrijf(
  o: Opmaak,
  tekst: string,
  opties: { grootte?: number; vet?: boolean; kleur?: typeof INKT; x?: number; breedte?: number; regelhoogte?: number } = {}
) {
  const grootte = opties.grootte ?? 10;
  const font = opties.vet ? o.vet : o.normaal;
  const x = opties.x ?? MARGE;
  const breedte = opties.breedte ?? INHOUD;
  const hoogte = opties.regelhoogte ?? grootte * 1.45;

  // Door de klant ingevoerde regeleindes blijven staan: elke regel wordt apart
  // afgebroken, zodat de PDF toont wat er op de klantpagina stond.
  for (const alinea of tekst.split(/\r?\n/)) {
    if (!alinea.trim()) {
      ruimte(o, hoogte);
      o.y -= hoogte * 0.6;
      continue;
    }
    for (const regel of regels(alinea, font, grootte, breedte)) {
      ruimte(o, hoogte);
      o.pagina.drawText(regel, { x, y: o.y - grootte, size: grootte, font, color: opties.kleur ?? INKT });
      o.y -= hoogte;
    }
  }
}

function kop(o: Opmaak, tekst: string, grootte = 13) {
  ruimte(o, grootte * 2.6);
  o.y -= grootte * 0.9;
  schrijf(o, tekst, { grootte, vet: true });
  o.y -= 3;
}

function streep(o: Opmaak) {
  ruimte(o, 12);
  o.pagina.drawLine({
    start: { x: MARGE, y: o.y - 4 },
    end: { x: A4.breedte - MARGE, y: o.y - 4 },
    thickness: 0.6,
    color: LIJN,
  });
  o.y -= 12;
}

/** Twee kolommen: label links, waarde rechts uitgelijnd. */
function bedragRegel(o: Opmaak, links: string, onder: string, bedrag: string) {
  const bedragBreedte = o.vet.widthOfTextAtSize(leesbaar(bedrag), 10);
  const tekstBreedte = INHOUD - bedragBreedte - 16;
  const linkerRegels = regels(links, o.vet, 10, tekstBreedte);
  const onderRegels = onder ? regels(onder, o.normaal, 9, tekstBreedte) : [];
  ruimte(o, 14 * linkerRegels.length + 12 * onderRegels.length + 6);

  const top = o.y;
  for (const r of linkerRegels) {
    o.pagina.drawText(r, { x: MARGE, y: o.y - 10, size: 10, font: o.vet, color: INKT });
    o.y -= 14;
  }
  for (const r of onderRegels) {
    o.pagina.drawText(r, { x: MARGE, y: o.y - 9, size: 9, font: o.normaal, color: GRIJS });
    o.y -= 12;
  }
  o.pagina.drawText(leesbaar(bedrag), {
    x: A4.breedte - MARGE - bedragBreedte,
    y: top - 10,
    size: 10,
    font: o.vet,
    color: INKT,
  });
  o.y -= 5;
}

export type PdfGegevens = {
  contract: Contract;
  handtekeningKlant: Uint8Array | null;
  handtekeningVerhuurder: Uint8Array | null;
};

export async function maakContractPdf({
  contract,
  handtekeningKlant,
  handtekeningVerhuurder,
}: PdfGegevens): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Huurovereenkomst ${VERHUURDER.naam} - ${contract.klantNaam}`);
  doc.setProducer(VERHUURDER.naam);
  doc.setCreationDate(new Date());

  const o: Opmaak = {
    doc,
    pagina: doc.addPage([A4.breedte, A4.hoogte]),
    y: A4.hoogte - MARGE,
    normaal: await doc.embedFont(StandardFonts.Helvetica),
    vet: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const overzicht = overzichtVan(contract);
  const v = voorwaardenVoor(contract.voorwaardenVersie, contract);

  /* ---- kop: logo links, titel en gegevens ernaast ---- */
  const LOGO = 46;
  let tekstX = MARGE;
  try {
    const logo = await doc.embedPng(logoBytes());
    const schaal = LOGO / Math.max(logo.width, logo.height);
    o.pagina.drawImage(logo, {
      x: MARGE,
      y: o.y - LOGO,
      width: logo.width * schaal,
      height: logo.height * schaal,
    });
    tekstX = MARGE + LOGO + 16;
  } catch {
    // Zonder logo gaat het contract gewoon door.
  }

  const kopTop = o.y;
  o.pagina.drawText(leesbaar("Huurovereenkomst"), {
    x: tekstX, y: kopTop - 17, size: 19, font: o.vet, color: INKT,
  });
  o.pagina.drawText(leesbaar(productOmschrijving(contract).replace(/^de /, "")), {
    x: tekstX, y: kopTop - 31, size: 10.5, font: o.normaal, color: GRIJS,
  });
  o.y = Math.min(kopTop - LOGO, kopTop - 40) - 12;

  schrijf(
    o,
    `${VERHUURDER.naam} - ${VERHUURDER.adres}, ${VERHUURDER.postcodePlaats} - ` +
      `${VERHUURDER.telefoon} - ${VERHUURDER.email} - KvK ${VERHUURDER.kvk}`,
    { grootte: 9, kleur: GRIJS }
  );
  schrijf(o, `${VERHUURDER.naam} valt onder de kleineondernemersregeling (KOR); er wordt geen btw berekend.`, {
    grootte: 9,
    kleur: GRIJS,
  });
  streep(o);

  /* ---- huurder ---- */
  kop(o, "Huurder");
  schrijf(o, contract.klantNaam);
  if (contract.klantAdres || contract.klantPostcodePlaats) {
    schrijf(o, [contract.klantAdres, contract.klantPostcodePlaats].filter(Boolean).join(", "));
  }
  schrijf(o, [contract.klantTelefoon, contract.klantEmail].filter(Boolean).join(" - "));

  /* ---- periode ---- */
  kop(o, "Huurperiode");
  schrijf(o, `Opbouw: ${datumLang(contract.opbouwDatum)}, ${contract.opbouwTijd} uur`);
  schrijf(o, `Feest: ${datumLang(contract.feestDatum)}`);
  schrijf(o, `Afbouw: ${datumLang(contract.afbouwDatum)}, ${contract.afbouwTijd} uur`);
  const adres =
    contract.plaatsingsadres ||
    [contract.klantAdres, contract.klantPostcodePlaats].filter(Boolean).join(", ");
  if (adres) schrijf(o, `Adres: ${adres}`);

  /* ---- producten ---- */
  kop(o, "Gehuurd");
  streep(o);
  for (const r of overzicht.regels) {
    bedragRegel(o, r.omschrijving, r.toelichting, euro(r.bedragCent));
    streep(o);
  }
  bedragRegel(o, "Totaal", "geen btw, kleineondernemersregeling", euro(overzicht.totaalCent));
  o.y -= 4;
  schrijf(o, "De huurder betaalt na afloop van de huurperiode, op basis van een factuur.", {
    grootte: 9,
    kleur: GRIJS,
  });

  if (contract.afspraken) {
    kop(o, "Bijzondere afspraken");
    schrijf(o, contract.afspraken);
  }

  /* ---- voorwaarden ---- */
  kop(o, "Algemene Huurvoorwaarden", 14);
  schrijf(o, `Versie ${v.versie}. Deze voorwaarden horen onlosmakelijk bij deze overeenkomst.`, {
    grootte: 9,
    kleur: GRIJS,
  });
  o.y -= 4;

  v.artikelen.forEach((artikel, i) => {
    ruimte(o, 46);
    o.y -= 8;
    schrijf(o, `Artikel ${i + 1} - ${artikel.kop}`, { grootte: 10.5, vet: true });
    o.y -= 2;
    artikel.leden.forEach((lid, j) => {
      const nummer = `${i + 1}.${j + 1}`;
      const inspring = 26;
      const stukken = regels(lid, o.normaal, 9.5, INHOUD - inspring);
      ruimte(o, stukken.length * 13 + 2);
      o.pagina.drawText(nummer, { x: MARGE, y: o.y - 9.5, size: 9.5, font: o.normaal, color: GRIJS });
      for (const regel of stukken) {
        o.pagina.drawText(regel, {
          x: MARGE + inspring,
          y: o.y - 9.5,
          size: 9.5,
          font: o.normaal,
          color: INKT,
        });
        o.y -= 13;
      }
      o.y -= 2;
    });
  });

  /* ---- ondertekening ---- */
  ruimte(o, 190);
  o.y -= 14;
  kop(o, "Ondertekening", 14);
  o.y -= 4;

  const kolomBreedte = (INHOUD - 28) / 2;
  const basis = o.y;
  await handtekeningBlok(o, {
    x: MARGE,
    y: basis,
    breedte: kolomBreedte,
    titel: "Huurder",
    bytes: handtekeningKlant,
    naam: contract.signerNaam ?? contract.klantNaam,
    plaats: contract.signerPlaats ?? "",
    datum: contract.signedAt,
    opPapier: contract.opPapier,
  });
  await handtekeningBlok(o, {
    x: MARGE + kolomBreedte + 28,
    y: basis,
    breedte: kolomBreedte,
    titel: "Verhuurder",
    bytes: handtekeningVerhuurder,
    naam: VERHUURDER.ondertekenaar,
    plaats: VERHUURDER.plaats,
    datum: contract.approvedAt ?? contract.sentAt,
    opPapier: false,
  });
  o.y = basis - 150;

  /* ---- bewijs ---- */
  ruimte(o, 92);
  streep(o);
  schrijf(o, "Gegevens van de ondertekening", { grootte: 9.5, vet: true, kleur: GRIJS });
  o.y -= 2;
  const bewijs: string[] = [];
  if (contract.opPapier) {
    bewijs.push("Dit contract is op papier ondertekend. Een scan is bij verhuurder bewaard.");
  } else {
    if (contract.signedAt) bewijs.push(`Tijdstip: ${new Date(contract.signedAt).toLocaleString("nl-NL")}`);
    if (contract.signedIp) bewijs.push(`IP-adres: ${contract.signedIp}`);
    if (contract.signedUserAgent) bewijs.push(`Apparaat: ${contract.signedUserAgent}`);
    bewijs.push(`Akkoord met ${v.checks.length} verklaringen bij het ondertekenen.`);
  }
  for (const regel of bewijs) schrijf(o, regel, { grootte: 8.5, kleur: GRIJS });
  if (contract.documentHash) {
    schrijf(o, `Vingerafdruk van de contracttekst (SHA-256):`, { grootte: 8.5, kleur: GRIJS });
    schrijf(o, contract.documentHash, { grootte: 8, kleur: GRIJS });
  }

  /* ---- paginanummers ---- */
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    const tekst = `${i + 1} / ${paginas.length}`;
    const breedte = o.normaal.widthOfTextAtSize(tekst, 8);
    p.drawText(tekst, {
      x: A4.breedte - MARGE - breedte,
      y: MARGE - 22,
      size: 8,
      font: o.normaal,
      color: GRIJS,
    });
  });

  return doc.save();
}

async function handtekeningBlok(
  o: Opmaak,
  a: {
    x: number; y: number; breedte: number; titel: string;
    bytes: Uint8Array | null; naam: string; plaats: string;
    datum: string | null; opPapier: boolean;
  }
) {
  o.pagina.drawText(a.titel, { x: a.x, y: a.y - 10, size: 10, font: o.vet, color: INKT });

  const vakTop = a.y - 22;
  const vakHoogte = 70;

  if (a.bytes) {
    try {
      const afb = await (isPng(a.bytes) ? o.doc.embedPng(a.bytes) : o.doc.embedJpg(a.bytes));
      const schaal = Math.min(a.breedte / afb.width, vakHoogte / afb.height, 1);
      o.pagina.drawImage(afb, {
        x: a.x,
        y: vakTop - afb.height * schaal,
        width: afb.width * schaal,
        height: afb.height * schaal,
      });
    } catch {
      // Een onleesbare afbeelding mag het contract niet tegenhouden.
    }
  } else if (a.opPapier) {
    o.pagina.drawText("Op papier ondertekend", {
      x: a.x, y: vakTop - 30, size: 9, font: o.normaal, color: GRIJS,
    });
  }

  const lijnY = vakTop - vakHoogte - 4;
  o.pagina.drawLine({
    start: { x: a.x, y: lijnY },
    end: { x: a.x + a.breedte, y: lijnY },
    thickness: 0.6,
    color: LIJN,
  });

  const onder = [a.naam, [a.plaats, a.datum ? new Date(a.datum).toLocaleDateString("nl-NL") : ""]
    .filter(Boolean).join(", ")].filter(Boolean);
  let y = lijnY - 12;
  for (const regel of onder) {
    for (const r of regels(regel, o.normaal, 9, a.breedte)) {
      o.pagina.drawText(r, { x: a.x, y, size: 9, font: o.normaal, color: GRIJS });
      y -= 11;
    }
  }
}

function isPng(bytes: Uint8Array): boolean {
  return bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e;
}
