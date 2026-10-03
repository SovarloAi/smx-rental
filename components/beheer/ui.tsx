"use client";

/**
 * Bouwstenen voor de contractmodule. Zoveel mogelijk de bestaande klassen uit
 * globals.css (.btn-primary, .btn-secondary, .field-input, .panel), zodat dit
 * er hetzelfde uitziet als de rest van smxrental.com.
 */

import { forwardRef } from "react";
import Link from "next/link";
import type { Status } from "@/lib/contracten/types";
import { STATUS_LABEL } from "@/lib/contracten/types";

/* ---------------------------------------------------------------- */

const STATUS_STIJL: Record<Status, string> = {
  concept: "bg-sand-100 text-ink/60 ring-ink/10",
  verstuurd: "bg-sand-200 text-sand-600 ring-sand-300",
  geopend: "bg-sand-300/60 text-ink/75 ring-sand-400",
  ondertekend: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  goedgekeurd: "bg-ink text-white ring-ink",
};

export function StatusLabel({ status, opPapier }: { status: Status; opPapier?: boolean }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold tracking-tight ring-1 ${STATUS_STIJL[status]}`}
    >
      {STATUS_LABEL[status]}
      {opPapier ? " (papier)" : ""}
    </span>
  );
}

/* ---------------------------------------------------------------- */

export type KnopSoort = "primair" | "rand" | "stil" | "gevaar";

const KLASSE: Record<KnopSoort, string> = {
  primair: "btn-primary btn-sm",
  rand: "btn-secondary btn-sm",
  stil: "btn-quiet",
  gevaar: "btn-danger btn-sm",
};

type KnopProps = { soort?: KnopSoort; bezig?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Knop = forwardRef<HTMLButtonElement, KnopProps>(function Knop(
  { soort = "primair", bezig, children, className = "", ...rest },
  ref
) {
  return (
    <button {...rest} ref={ref} disabled={rest.disabled || bezig}
      className={`${KLASSE[soort]} min-h-[44px] ${className}`}>
      {bezig && <Spinner />}
      {children}
    </button>
  );
});

export function KnopLink({
  href, soort = "rand", children, className = "",
}: { href: string; soort?: KnopSoort; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${KLASSE[soort]} min-h-[44px] ${className}`}>
      {children}
    </Link>
  );
}

function Spinner() {
  return (
    <span aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
  );
}

/* ---------------------------------------------------------------- */

export function Melding({
  toon = "info", titel, children,
}: { toon?: "info" | "goed" | "waarschuwing" | "fout"; titel?: string; children: React.ReactNode }) {
  const stijl = {
    info: "border-ink/8 bg-sand-50 text-ink/75",
    goed: "border-emerald-200 bg-emerald-50 text-emerald-900",
    waarschuwing: "border-sand-400 bg-sand-100 text-ink/80",
    fout: "border-red-200 bg-red-50 text-red-800",
  }[toon];
  return (
    <div role={toon === "fout" ? "alert" : undefined}
      className={`rounded-2xl border px-5 py-4 text-sm leading-relaxed ${stijl}`}>
      {titel && <p className="mb-1 font-semibold">{titel}</p>}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function Veld({
  label, hint, auto, children,
}: { label: string; hint?: string; auto?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label flex flex-wrap items-center gap-x-2">
        {label}
        {hint && <span className="font-normal text-ink/45">{hint}</span>}
        {auto && (
          <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[11px] font-semibold tracking-tight text-sand-600">
            automatisch ingevuld
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

/** Klasse voor invoervelden, met een accent als het veld automatisch gevuld is. */
export function invoerKlasse(auto?: boolean) {
  return auto ? "field-input border-sand-400 bg-sand-50/70" : "field-input";
}

export function Blok({
  titel, hint, children,
}: { titel: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <h2 className="font-serif text-2xl font-light tracking-tightest text-ink">{titel}</h2>
      {hint && <p className="mt-1 text-sm leading-relaxed text-ink/55">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
