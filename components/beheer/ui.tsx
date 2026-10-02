"use client";

/** Kleine bouwstenen voor het beheerscherm, in de huisstijl van de site. */

import { forwardRef } from "react";
import Link from "next/link";
import type { Status } from "@/lib/contracten/types";
import { STATUS_LABEL } from "@/lib/contracten/types";

/* ---------------------------------------------------------------- */

const STATUS_STIJL: Record<Status, string> = {
  concept: "bg-sand-100 text-ink/60 ring-ink/10",
  verstuurd: "bg-blue-50 text-blue-800 ring-blue-200",
  geopend: "bg-amber-50 text-amber-900 ring-amber-200",
  ondertekend: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  goedgekeurd: "bg-ink text-white ring-ink",
};

export function StatusLabel({ status, opPapier }: { status: Status; opPapier?: boolean }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_STIJL[status]}`}
    >
      {STATUS_LABEL[status]}
      {opPapier ? " (papier)" : ""}
    </span>
  );
}

/* ---------------------------------------------------------------- */

type KnopProps = {
  soort?: "primair" | "rand" | "stil" | "gevaar";
  bezig?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const KNOP_STIJL = {
  primair: "bg-ink text-white hover:bg-ink/90 disabled:hover:bg-ink",
  rand: "border border-ink/20 bg-white text-ink hover:border-ink/40 hover:bg-sand-50",
  stil: "text-ink/70 hover:bg-sand-100 hover:text-ink",
  gevaar: "border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50",
};

export const Knop = forwardRef<HTMLButtonElement, KnopProps>(function Knop(
  { soort = "primair", bezig, children, className = "", ...rest },
  ref
) {
  return (
    <button
      {...rest}
      ref={ref}
      disabled={rest.disabled || bezig}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${KNOP_STIJL[soort]} ${className}`}
    >
      {bezig && <Spinner />}
      {children}
    </button>
  );
});

export function KnopLink({
  href, soort = "rand", children, className = "",
}: { href: string; soort?: keyof typeof KNOP_STIJL; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${KNOP_STIJL[soort]} ${className}`}
    >
      {children}
    </Link>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}

/* ---------------------------------------------------------------- */

export function Melding({
  toon = "info", titel, children,
}: { toon?: "info" | "goed" | "waarschuwing" | "fout"; titel?: string; children: React.ReactNode }) {
  const stijl = {
    info: "border-ink/10 bg-sand-50 text-ink/80",
    goed: "border-emerald-200 bg-emerald-50 text-emerald-900",
    waarschuwing: "border-amber-200 bg-amber-50 text-amber-900",
    fout: "border-red-200 bg-red-50 text-red-800",
  }[toon];
  return (
    <div role={toon === "fout" ? "alert" : undefined} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${stijl}`}>
      {titel && <p className="mb-1 font-semibold">{titel}</p>}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- */

export function Veld({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink/45">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const invoerKlasse =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-sand-500 focus:ring-4 focus:ring-sand-100";

export function Blok({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm shadow-sand-600/5 sm:p-6">
      <h2 className="mb-4 font-serif text-xl font-light tracking-tight text-ink">{titel}</h2>
      {children}
    </section>
  );
}
