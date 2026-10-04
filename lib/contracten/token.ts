/**
 * Klanttokens. 32 willekeurige bytes als base64url: onraadbaar en uniek per
 * contract. Het token is het enige dat de klant nodig heeft — geen account,
 * geen wachtwoord, geen code.
 */

const TOKEN_BYTES = 32;

export function nieuwToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export function nieuwId(): string {
  return crypto.randomUUID();
}

/** Alleen tekens die in base64url voorkomen, met de juiste lengte. */
export function geldigTokenFormaat(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of Array.from(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Vergelijking in constante tijd, zodat de responstijd niets over het token
 * verraadt.
 */
export function tijdveiligGelijk(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let verschil = 0;
  for (let i = 0; i < a.length; i++) verschil |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return verschil === 0;
}
