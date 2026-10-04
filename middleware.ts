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
/**
 * Cloudflare Access beschermt `smxrental.com/beheer*` en de previewadressen
 * `*.smx-rental.pages.dev`. Dat jokerteken dekt de subdomeinen, maar níét het
 * kale projectadres `smx-rental.pages.dev` zelf: daar kwam het beheerscherm
 * zonder inlogscherm in beeld. De API hield wel stand — die controleert het
 * Access-token zelf en gaf overal "Geen toegang" — maar één laag beveiliging
 * is er één te weinig. Het beheer hoort op één adres thuis; verzoeken via het
 * projectadres sturen we door naar het echte domein, waar Access ervoor staat.
 */
const PROJECTADRES = "smx-rental.pages.dev";
const EIGEN_DOMEIN = "https://smxrental.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  const beheerpad =
    request.nextUrl.pathname.startsWith("/beheer") ||
    request.nextUrl.pathname.startsWith("/api/beheer");
  if (host === PROJECTADRES && beheerpad) {
    return NextResponse.redirect(
      `${EIGEN_DOMEIN}${request.nextUrl.pathname}${request.nextUrl.search}`,
      308
    );
  }

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
