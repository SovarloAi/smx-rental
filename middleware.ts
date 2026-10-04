import { NextResponse, type NextRequest } from "next/server";

/**
 * Beveiligingsheaders voor de contractmodule.
 *
 * Deze pagina's bevatten persoonsgegevens en, in het geval van de klantpagina,
 * een token in de URL. Daarom:
 * - geen verwijzer meesturen, zodat het token nooit in de logs van een andere
 *   site belandt als iemand doorklikt;
 * - niets bewaren in caches van browsers of tussenliggende servers;
 * - niet indexeren;
 * - geen MIME-sniffing en niet in een iframe van een andere site.
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

export const config = {
  matcher: ["/beheer/:path*", "/contract/:path*", "/api/beheer/:path*", "/api/contract/:path*"],
};
