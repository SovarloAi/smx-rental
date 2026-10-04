import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

/** De contractmodule mag nooit in een zoekmachine belanden. */
export const metadata: Metadata = {
  title: { default: "Contracten", template: "%s · Contracten" },
  robots: { index: false, follow: false, nocache: true },
  manifest: "/beheer.webmanifest",
};

export default function BeheerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-texture min-h-[100svh] bg-sand-50/50">
      {/* Zelfde zandbalk en logo als de navbar van de site. */}
      <header className="sticky top-0 z-30 bg-[#CBB897] shadow-md shadow-ink/10"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="container-x flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link href="/beheer" className="group flex items-center gap-3" aria-label="Contracten — overzicht">
            <Image src="/smx-logo-transparant.png" alt="SMX Rental" width={311} height={308}
              priority className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-14" />
            <span className="text-sm font-medium tracking-tight text-ink/70">Contracten</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/beheer/instellingen"
              className="btn-quiet px-4 py-2 text-sm">Instellingen</Link>
            <Link href="/beheer/nieuw" className="btn-primary btn-sm">Nieuw contract</Link>
          </div>
        </div>
      </header>
      <main className="container-x max-w-4xl py-7 sm:py-10">{children}</main>
    </div>
  );
}
