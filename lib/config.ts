/** Centrale bedrijfsgegevens voor SMX Rental. */

export const COMPANY = {
  name: "SMX Rental",
  owner: "Sjors",
  address: "Engelmanstraat 23, Neer, Limburg",
  kvk: "99015951",
  website: "smxrental.com",
  email: "smxrental@gmail.com",
  phonePrimary: "06 20651528",
  phoneSecondary: "06 57156301",
  /** WhatsApp-nummer in internationaal formaat zonder + (voor wa.me). */
  whatsapp: "31620651528",
} as const;

export const NAV_LINKS = [
  { href: "#over-ons", label: "Over ons" },
  { href: "#configurator", label: "Berekenen en Reserveren" },
  { href: "#shotjesbar", label: "Verhuur" },
] as const;

/** Bouwt een wa.me-link met vooringevuld bericht. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Backwards-compatibele export.
export const WHATSAPP_NUMBER = COMPANY.whatsapp;
