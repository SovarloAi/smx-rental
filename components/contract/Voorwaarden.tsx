"use client";

/** De huurvoorwaarden, per artikel uitklapbaar. */

import type { Artikel } from "@/lib/contracten/voorwaarden";

export default function Voorwaarden({ artikelen }: { artikelen: readonly Artikel[] }) {
  return (
    <div className="space-y-2.5">
      {artikelen.map((a, i) => (
        <details key={a.kop} className="group rounded-xl border border-ink/15 bg-white">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-[18px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span>
              <span className="text-ink/45">{i + 1}.</span> {a.kop}
            </span>
            <span aria-hidden
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-ink/20 text-ink/60 transition-transform group-open:rotate-180">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </summary>
          <ol className="list-decimal space-y-2.5 border-t border-ink/10 px-5 py-4 pl-9 text-[18px] leading-relaxed text-ink/80 marker:text-ink/40">
            {a.leden.map((lid, j) => <li key={j}>{lid}</li>)}
          </ol>
        </details>
      ))}
    </div>
  );
}
