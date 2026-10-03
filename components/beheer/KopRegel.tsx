/** Sectiekop in de stijl van de publieke site: eyebrow + serif-titel. */
export default function KopRegel({
  eyebrow, titel, sub,
}: { eyebrow: string; titel: string; sub?: string }) {
  return (
    <div className="mb-7">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-sand-600">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-4xl font-light leading-tight tracking-tightest text-ink">
        {titel}
      </h1>
      {sub && <p className="mt-3 text-lg leading-relaxed text-ink/60">{sub}</p>}
    </div>
  );
}
