import type { Metadata } from "next";
import Link from "next/link";

/** De contractmodule mag nooit in een zoekmachine belanden. */
export const metadata: Metadata = {
  title: { default: "Contracten", template: "%s · Contracten" },
  robots: { index: false, follow: false, nocache: true },
  // Eigen manifest, zodat /beheer als app op het beginscherm kan.
  manifest: "/beheer.webmanifest",
};

export default function BeheerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-sand-50/60">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/95 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/beheer" className="flex items-baseline gap-2">
            <span className="font-serif text-lg font-light tracking-tight text-ink">SMX Rental</span>
            <span className="text-sm text-ink/45">Contracten</span>
          </Link>
          <Link href="/beheer/nieuw"
            className="inline-flex min-h-[40px] items-center rounded-xl bg-ink px-3.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90">
            Nieuw contract
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
