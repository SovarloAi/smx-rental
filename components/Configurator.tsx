"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import {
  calcTransport,
  formatEuro,
  WEEKEND_RATE,
  LIGHTING_PRICE,
  SIDEWALL_PRICE,
  SHOTJESBAR_PRICE,
  NUM_TRIPS,
  FREE_KM_TOTAL,
  type TransportResult,
} from "@/lib/transport";
import { whatsappLink } from "@/lib/config";

/* -------------------------------------------------------------------------- */
/*  Types & constante data                                                    */
/* -------------------------------------------------------------------------- */

const TOTAL_STEPS = 5;

const SURFACES = ["Gras", "Klinkers", "Beton/asfalt", "Grind", "Anders"] as const;
type Surface = (typeof SURFACES)[number];

const SPACE_OPTIONS = ["Ja", "Nee", "Weet ik niet"] as const;
type SpaceAnswer = (typeof SPACE_OPTIONS)[number];

type VerdictLevel = "suitable" | "doubt" | "unsuitable";
type Verdict = { level: VerdictLevel; title: string; body: string; whatsapp?: boolean };

type ZoomImage = { src: string; alt: string };

type FormState = {
  length: string;
  width: string;
  surface: Surface | "";
  space: SpaceAnswer | "";
  weekend: string; // ISO-datum van de vrijdag
  lighting: boolean;
  sidewalls: number; // aantal zijwanden 0-2
  shotjesbar: boolean;
  postcode: string;
  name: string;
  phone: string;
  email: string;
};

const INITIAL: FormState = {
  length: "",
  width: "",
  surface: "",
  space: "",
  weekend: "",
  lighting: false,
  sidewalls: 0,
  shotjesbar: false,
  postcode: "",
  name: "",
  phone: "",
  email: "",
};

// Benodigde voetafdruk inclusief spandraden.
const FULL_LONG = 13.0;
const FULL_SHORT = 10.5;
// Twijfelgrens: tot 1,5 m minder dan de vereiste maten.
const MIN_LONG = FULL_LONG - 1.5; // 11,5
const MIN_SHORT = FULL_SHORT - 1.5; // 9,0
const MAX_SIDEWALLS = 2; // 2 zijwanden beschikbaar, elk 10 meter

// Eén consistente tekst voor álle twijfel-(gele)meldingen.
const DOUBT_VERDICT: Verdict = {
  level: "doubt",
  title: "Dit vraagt om een persoonlijke check.",
  body: "Neem contact met ons op, dan bekijken we de mogelijkheden samen.",
  whatsapp: true,
};

// Reeds bezette weekenden — vul hier de vrijdag-datums in (formaat "YYYY-MM-DD").
const UNAVAILABLE_WEEKENDS = new Set<string>([
  // "2026-07-17",
]);

const ease = [0.22, 1, 0.36, 1] as const;

/* -------------------------------------------------------------------------- */
/*  Hulpfuncties                                                              */
/* -------------------------------------------------------------------------- */

/** Beoordeelt de locatie op basis van stap 1. */
function evaluateLocation(s: FormState): Verdict | null {
  if (!s.length || !s.width || !s.surface || !s.space) return null;

  const L = parseFloat(s.length.replace(",", "."));
  const W = parseFloat(s.width.replace(",", "."));
  if (isNaN(L) || isNaN(W)) return null;

  const fitsFull =
    (L >= FULL_LONG && W >= FULL_SHORT) || (L >= FULL_SHORT && W >= FULL_LONG);
  const fitsMin =
    (L >= MIN_LONG && W >= MIN_SHORT) || (L >= MIN_SHORT && W >= MIN_LONG);

  const unsuitableBody =
    "De ondergrond of beschikbare ruimte voldoet niet aan de minimale vereisten voor een veilige opbouw. Neem gerust contact op, dan denken we mee naar een alternatief.";

  /* ---- harde afkeur ---- */
  if (s.surface === "Beton/asfalt") {
    return { level: "unsuitable", title: "Helaas niet geschikt", body: unsuitableBody, whatsapp: true };
  }
  if (!fitsMin) {
    return { level: "unsuitable", title: "Helaas niet geschikt", body: unsuitableBody, whatsapp: true };
  }

  /* ---- twijfelgevallen — altijd dezelfde melding ---- */
  if (!fitsFull) return DOUBT_VERDICT;
  if (s.surface === "Klinkers" || s.surface === "Grind" || s.surface === "Anders") {
    return DOUBT_VERDICT;
  }
  if (s.space !== "Ja") return DOUBT_VERDICT;

  return {
    level: "suitable",
    title: "Zeker geschikt ✅",
    body: "Uw locatie ziet er prima uit voor onze stretchtent. Ga verder naar de volgende stap.",
  };
}

/** Genereert alle vrijdagen (weekendstart) van nu t/m de gegeven einddatum. */
function weekendFridaysUntil(end: Date): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1); // naar eerstvolgende vrijdag
  while (d <= end) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDay(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString("nl-NL", opts);
}

/** Leesbare weekendomschrijving uit een ISO-datum van de vrijdag. */
function weekendLabel(iso: string): string {
  if (!iso) return "";
  const fri = new Date(iso);
  const sun = new Date(iso);
  sun.setDate(sun.getDate() + 2);
  const friStr = fmtDay(fri, { weekday: "long", day: "numeric", month: "long" });
  const sunStr = fmtDay(sun, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${friStr} t/m ${sunStr}`;
}

/* -------------------------------------------------------------------------- */
/*  Hoofdcomponent                                                            */
/* -------------------------------------------------------------------------- */

export default function Configurator() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [zoom, setZoom] = useState<ZoomImage | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const verdict = useMemo(() => evaluateLocation(form), [form]);

  // Transport via rijafstand (server-route). Gedebounced, met Haversine-fallback.
  const [transport, setTransport] = useState<TransportResult | null>(null);
  const [transportLoading, setTransportLoading] = useState(false);

  useEffect(() => {
    const pc = form.postcode.trim();
    if (!/\d{4}/.test(pc)) {
      setTransport(null);
      setTransportLoading(false);
      return;
    }
    let cancelled = false;
    setTransportLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/transport?postcode=${encodeURIComponent(pc)}`);
        const data = (await res.json()) as TransportResult;
        if (!cancelled) setTransport(data);
      } catch {
        if (!cancelled) setTransport(calcTransport(pc)); // fallback hemelsbreed
      } finally {
        if (!cancelled) setTransportLoading(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.postcode]);

  const lightingCost = form.lighting ? LIGHTING_PRICE : 0;
  const sidewallsCost = form.sidewalls * SIDEWALL_PRICE;
  const shotjesbarCost = form.shotjesbar ? SHOTJESBAR_PRICE : 0;
  const transportCost = transport?.ok ? transport.cost : 0;
  const total =
    WEEKEND_RATE + lightingCost + sidewallsCost + shotjesbarCost + transportCost;

  // Alle weekenden t/m eind september 2026.
  const fridays = useMemo(() => weekendFridaysUntil(new Date(2026, 8, 30)), []);

  /* ---- per-stap validatie ---- */
  const canContinue = (() => {
    switch (step) {
      case 1:
        return verdict !== null && verdict.level !== "unsuitable";
      case 2:
        return form.weekend !== "";
      case 3:
        return true; // opties zijn optioneel
      case 4:
        return transport?.ok === true && !transportLoading;
      case 5:
        return (
          form.name.trim() !== "" &&
          form.phone.trim() !== "" &&
          /\S+@\S+\.\S+/.test(form.email)
        );
      default:
        return false;
    }
  })();

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  /* ---- WhatsApp-bericht ---- */
  const message = useMemo(() => {
    const transportLine =
      transport?.ok && !transport.free
        ? `€${transport.cost},- (${NUM_TRIPS} ritten, ${FREE_KM_TOTAL} km vrijgesteld)`
        : "gratis (binnen 10 km)";

    return [
      "🎪 *Nieuwe tentaanvraag — SMX Rental*",
      "",
      `👤 Naam: ${form.name}`,
      `📞 Tel: ${form.phone}`,
      `📧 E-mail: ${form.email}`,
      `📅 Weekend: ${weekendLabel(form.weekend)}`,
      `📍 Postcode: ${form.postcode}`,
      "",
      "✅ Locatiecheck:",
      `- Ruimte: ${form.length} x ${form.width} meter`,
      `- Ondergrond: ${form.surface}`,
      `- Spanruimte rondom: ${form.space}`,
      "📷 Ik stuur zo een foto van de locatie mee in deze chat.",
      "",
      "🛠️ Opties:",
      `- Verlichting: ${form.lighting ? "ja" : "nee"} — €${lightingCost},-`,
      `- Zijwanden: ${form.sidewalls} — €${sidewallsCost},-`,
      `- Shotjesbar: ${form.shotjesbar ? "ja" : "nee"} — €${shotjesbarCost},-`,
      "",
      "💶 Prijsopgave:",
      "- Weekendtarief: €550,-",
      `- Verlichting: €${lightingCost},-`,
      `- Zijwanden: €${sidewallsCost},-`,
      `- Shotjesbar: €${shotjesbarCost},-`,
      `- Transport: ${transportLine}`,
      `- *Totaal: €${total},-*`,
    ].join("\n");
  }, [form, transport, lightingCost, sidewallsCost, shotjesbarCost, total]);

  return (
    <section id="configurator" className="site-texture relative overflow-hidden bg-sand-50/50 py-16 sm:py-28 lg:py-36">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sand-600">
            Bereken &amp; reserveer
          </p>
          <h2 className="mt-5 font-serif text-4xl font-light leading-tight tracking-tightest text-ink sm:text-5xl">
            Stel uw aanvraag samen
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/60">
            In vijf korte stappen weet u of uw locatie geschikt is en wat het
            kost. U verstuurt de aanvraag direct via WhatsApp.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl sm:mt-14">
          <div className="overflow-hidden rounded-[1.75rem] border border-ink/8 bg-white shadow-xl shadow-sand-600/5">
            <ProgressBar step={step} />

            <div className="px-5 py-8 sm:px-12 sm:py-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease }}
                >
                  {step === 1 && (
                    <StepLocation form={form} set={set} verdict={verdict} />
                  )}
                  {step === 2 && (
                    <StepDate form={form} set={set} fridays={fridays} />
                  )}
                  {step === 3 && (
                    <StepOptions form={form} set={set} onZoom={setZoom} />
                  )}
                  {step === 4 && (
                    <StepTransport
                      form={form}
                      set={set}
                      transport={transport}
                      loading={transportLoading}
                      lightingCost={lightingCost}
                      sidewallsCost={sidewallsCost}
                      shotjesbarCost={shotjesbarCost}
                      total={total}
                    />
                  )}
                  {step === 5 && (
                    <StepContact form={form} set={set} message={message} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigatie */}
            <div className="flex items-center justify-between gap-4 border-t border-ink/8 bg-sand-50/40 px-5 py-4 sm:px-12 sm:py-5">
              <button
                onClick={back}
                disabled={step === 1}
                className="text-sm font-medium text-ink/50 transition-colors hover:text-ink disabled:invisible"
              >
                ← Terug
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  onClick={next}
                  disabled={!canContinue}
                  className="btn-primary"
                >
                  Volgende
                </button>
              ) : (
                <span className="text-sm text-ink/40">
                  Stap {step} van {TOTAL_STEPS}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Lightbox image={zoom} onClose={() => setZoom(null)} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Voortgangsindicator                                                       */
/* -------------------------------------------------------------------------- */

const STEP_LABELS = ["Locatie", "Datum", "Opties", "Transport", "Gegevens"];

function ProgressBar({ step }: { step: number }) {
  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="border-b border-ink/8 px-5 pb-5 pt-6 sm:px-12 sm:pb-6 sm:pt-7">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ink">
          Stap {step} <span className="text-ink/40">/ {TOTAL_STEPS}</span>
        </span>
        <span className="text-sm font-medium text-sand-600">
          {STEP_LABELS[step - 1]}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-100">
        <motion.div
          className="h-full rounded-full bg-ink"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gedeelde sub-onderdelen                                                   */
/* -------------------------------------------------------------------------- */

type StepProps = {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <h3 className="font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl">
        {title}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/55">{sub}</p>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
        active
          ? "border-ink bg-ink text-white shadow-sm"
          : "border-ink/12 bg-white text-ink/70 hover:border-ink/30 hover:bg-sand-50"
      }`}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stap 1 — Locatiecheck                                                     */
/* -------------------------------------------------------------------------- */

function StepLocation({
  form,
  set,
  verdict,
}: StepProps & { verdict: Verdict | null }) {
  return (
    <div>
      <StepHeading
        title="Is uw locatie geschikt?"
        sub="De tent heeft inclusief spandraden ongeveer 10,5 × 13 meter ruimte nodig. We checken even of er genoeg ruimte en de juiste ondergrond is."
      />

      <div className="space-y-7">
        <div>
          <label className="field-label">
            Hoeveel ruimte is er beschikbaar? (meters)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Lengte"
              value={form.length}
              onChange={(e) => set("length", e.target.value)}
              className="field-input"
            />
            <span className="text-ink/40">×</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Breedte"
              value={form.width}
              onChange={(e) => set("width", e.target.value)}
              className="field-input"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Wat is de ondergrond?</label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {SURFACES.map((s) => (
              <ChoiceButton
                key={s}
                active={form.surface === s}
                onClick={() => set("surface", s)}
              >
                {s}
              </ChoiceButton>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">
            Is er rondom de tent ongeveer 1,5 meter vrije ruimte voor de
            spandraden?
          </label>
          <p className="-mt-1 mb-2 text-[13px] leading-relaxed text-ink/45">
            1 meter aan één zijde kan ook — geef het gerust aan, we kijken graag
            mee.
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {SPACE_OPTIONS.map((s) => (
              <ChoiceButton
                key={s}
                active={form.space === s}
                onClick={() => set("space", s)}
              >
                {s}
              </ChoiceButton>
            ))}
          </div>
        </div>

        <VerdictNotice verdict={verdict} />
      </div>
    </div>
  );
}

function VerdictNotice({ verdict }: { verdict: Verdict | null }) {
  if (!verdict) return null;

  const tone =
    verdict.level === "suitable"
      ? "good"
      : verdict.level === "doubt"
        ? "warn"
        : "bad";

  return (
    <Notice tone={tone} title={verdict.title}>
      {verdict.body}
      {verdict.whatsapp && (
        <div className="mt-5">
          <WhatsAppInline message="Hoi, ik heb een vraag over de geschiktheid van mijn locatie voor de stretchtent." />
        </div>
      )}
    </Notice>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stap 2 — Datum                                                            */
/* -------------------------------------------------------------------------- */

function StepDate({
  form,
  set,
  fridays,
}: StepProps & { fridays: Date[] }) {
  return (
    <div>
      <StepHeading
        title="Kies uw weekend"
        sub="Kies het weekend dat u uitkomt. Wij bevestigen de beschikbaarheid na uw aanvraag."
      />

      <div className="mb-6 rounded-2xl border border-ink/8 bg-white p-5">
        <p className="mb-1 text-sm font-semibold text-ink">
          Op- en afbouw — dat regelen wij
        </p>
        <p className="text-sm leading-relaxed text-ink/60">
          Opbouw is doorgaans op <span className="font-medium text-ink/80">vrijdagavond</span>{" "}
          en afbouw op <span className="font-medium text-ink/80">zondagochtend</span>. U
          hoeft hier niets te kiezen — we stemmen het altijd in overleg met u af.
        </p>
      </div>

      <div className="reviews-scroll max-h-72 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {fridays.map((fri) => {
            const iso = fri.toISOString();
            const sun = new Date(fri);
            sun.setDate(sun.getDate() + 2);
            const active = form.weekend === iso;
            const unavailable = UNAVAILABLE_WEEKENDS.has(dateKey(fri));
            return (
              <button
                key={iso}
                type="button"
                disabled={unavailable}
                onClick={() => set("weekend", iso)}
                className={`rounded-xl border px-4 py-3.5 text-left transition-all ${
                  unavailable
                    ? "cursor-not-allowed border-ink/8 bg-sand-50/50 opacity-50"
                    : active
                      ? "border-ink bg-ink text-white shadow-sm"
                      : "border-ink/12 bg-white hover:border-ink/30 hover:bg-sand-50"
                }`}
              >
                <span
                  className={`block text-xs uppercase tracking-wide ${
                    active ? "text-white/60" : "text-ink/40"
                  }`}
                >
                  {unavailable ? "Niet beschikbaar" : "Weekend"}
                </span>
                <span className="mt-0.5 block text-sm font-semibold">
                  {fmtDay(fri, { day: "numeric", month: "short" })} –{" "}
                  {fmtDay(sun, { day: "numeric", month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Notice tone="info" title="Beschikbaarheid">
        We bevestigen de beschikbaarheid na ontvangst van uw aanvraag.
      </Notice>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stap 3 — Opties                                                           */
/* -------------------------------------------------------------------------- */

function StepOptions({
  form,
  set,
  onZoom,
}: StepProps & { onZoom: (img: ZoomImage) => void }) {
  return (
    <div>
      <StepHeading
        title="Maak het compleet"
        sub="Optionele extra's voor uw tent. U ziet de prijzen direct terug in het overzicht. Tik op een foto om hem te vergroten."
      />

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-ink/40">
        Bij de tent
      </p>
      <div className="space-y-4">
        <OptionCard
          active={form.lighting}
          onToggle={() => set("lighting", !form.lighting)}
          onZoom={onZoom}
          title="Sfeervolle verlichting"
          price="€30,- per weekend"
          body="32 meter warme lichtsnoeren — complete sfeerverlichting voor de hele tent."
          image="/images/tent-avond.jpg"
          alt="Stretchtent met sfeerverlichting in de avond"
        >
          <ToggleSwitch active={form.lighting} />
        </OptionCard>

        <SidewallStepper
          value={form.sidewalls}
          onChange={(n) => set("sidewalls", n)}
          onZoom={onZoom}
        />
      </div>

      <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-ink/40">
        Extra verhuur
      </p>
      <OptionCard
        active={form.shotjesbar}
        onToggle={() => set("shotjesbar", !form.shotjesbar)}
        onZoom={onZoom}
        title="Shotjesbar"
        price="€380,- per weekend"
        body="10 sterke drankflessen, 50+ shotjes, shotglaasjes & ijs en een Crocodile shotspel."
        image="/images/shotjesbar.jpg"
        alt="De SMX Rental Shotjesbar"
      >
        <ToggleSwitch active={form.shotjesbar} />
      </OptionCard>
    </div>
  );
}

/** Klikbare optiekaart: foto opent een lightbox, de rest schakelt de optie. */
function OptionCard({
  active,
  onToggle,
  onZoom,
  title,
  price,
  body,
  image,
  alt,
  children,
}: {
  active: boolean;
  onToggle: () => void;
  onZoom: (img: ZoomImage) => void;
  title: string;
  price: string;
  body: string;
  image: string;
  alt: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-stretch gap-3 overflow-hidden rounded-2xl border p-3 transition-all sm:gap-4 ${
        active ? "border-sand-400 bg-sand-50 shadow-sm" : "border-ink/10 bg-white"
      }`}
    >
      <ZoomableImage image={{ src: image, alt }} onZoom={onZoom} />

      <button
        type="button"
        onClick={onToggle}
        className="flex flex-1 items-start justify-between gap-3 py-1 pr-2 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h4 className="text-base font-semibold text-ink">{title}</h4>
            <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-sand-600">
              {price}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{body}</p>
        </div>
        {children}
      </button>
    </div>
  );
}

function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-6 w-11 flex-none items-center rounded-full p-0.5 transition-colors ${
        active ? "bg-ink" : "bg-ink/15"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`h-5 w-5 rounded-full bg-white shadow ${active ? "ml-auto" : ""}`}
      />
    </span>
  );
}

/** Foto-thumbnail die bij een klik de lightbox opent. */
function ZoomableImage({
  image,
  onZoom,
}: {
  image: ZoomImage;
  onZoom: (img: ZoomImage) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onZoom(image)}
      className="group relative h-20 w-24 flex-none overflow-hidden rounded-xl sm:h-24 sm:w-28"
      aria-label="Foto vergroten"
      title="Klik om te vergroten"
    >
      <Image src={image.src} alt={image.alt} fill sizes="120px" className="object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-white opacity-0 transition-all duration-300 group-hover:bg-ink/30 group-hover:opacity-100">
        <ZoomIn className="h-5 w-5" />
      </span>
    </button>
  );
}

function SidewallStepper({
  value,
  onChange,
  onZoom,
}: {
  value: number;
  onChange: (n: number) => void;
  onZoom: (img: ZoomImage) => void;
}) {
  const image: ZoomImage = {
    src: "/images/zijwand-rechtop-180.png",
    alt: "Stretchtent met zijwand voor extra bescherming",
  };
  return (
    <div
      className={`flex items-stretch gap-3 overflow-hidden rounded-2xl border p-3 transition-all sm:gap-4 ${
        value > 0 ? "border-sand-400 bg-sand-50 shadow-sm" : "border-ink/10 bg-white"
      }`}
    >
      <ZoomableImage image={image} onZoom={onZoom} />

      <div className="flex flex-1 items-center justify-between gap-3 py-1 pr-2">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h4 className="text-base font-semibold text-ink">Zijwanden</h4>
            <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-sand-600">
              €50,- per zijwand per weekend
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
            Bescherming tegen wind en regen. Elke zijwand is 10 meter — er zijn
            er maximaal 2 beschikbaar.
          </p>
        </div>

        <div className="flex flex-none items-center gap-3">
          <StepperButton
            onClick={() => onChange(Math.max(0, value - 1))}
            disabled={value === 0}
            label="Minder zijwanden"
          >
            −
          </StepperButton>
          <span className="w-5 text-center text-base font-semibold tabular-nums text-ink">
            {value}
          </span>
          <StepperButton
            onClick={() => onChange(Math.min(MAX_SIDEWALLS, value + 1))}
            disabled={value === MAX_SIDEWALLS}
            label="Meer zijwanden"
          >
            +
          </StepperButton>
        </div>
      </div>
    </div>
  );
}

function StepperButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white text-lg text-ink transition-all hover:border-ink/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lightbox                                                                  */
/* -------------------------------------------------------------------------- */

function Lightbox({
  image,
  onClose,
}: {
  image: ZoomImage | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [image, onClose]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            onClick={(e) => e.stopPropagation()}
            className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-2xl"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stap 4 — Transport & prijsoverzicht                                       */
/* -------------------------------------------------------------------------- */

function StepTransport({
  form,
  set,
  transport,
  loading,
  lightingCost,
  sidewallsCost,
  shotjesbarCost,
  total,
}: StepProps & {
  transport: TransportResult | null;
  loading: boolean;
  lightingCost: number;
  sidewallsCost: number;
  shotjesbarCost: number;
  total: number;
}) {
  return (
    <div>
      <StepHeading
        title="Transportkosten"
        sub="Vul uw postcode in en we berekenen de transportkosten op basis van de rijafstand vanaf Neer."
      />

      <div>
        <label className="field-label">Postcode bezorgadres</label>
        <input
          type="text"
          placeholder="bijv. 6086 AB"
          value={form.postcode}
          onChange={(e) => set("postcode", e.target.value)}
          className="field-input max-w-xs"
          autoComplete="postal-code"
        />

        <p className="mt-3 text-[13px] leading-relaxed text-ink/55">
          De eerste 10 km van elke rit (op- en afbouw, heen en terug) zijn
          gratis.
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink/45">
          Wij rijden standaard tot maximaal 75 km enkele reis. Verder weg? In
          overleg is vaak meer mogelijk — neem dan contact met ons op.
        </p>

        {loading && (
          <p className="mt-4 text-sm text-ink/50">Rijafstand berekenen…</p>
        )}

        {!loading && transport && !transport.ok && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {transport.error}
          </motion.div>
        )}

        {!loading && transport?.ok && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              transport.free
                ? "bg-emerald-50 text-emerald-700"
                : "bg-sand-100 text-sand-600"
            }`}
          >
            {transport.free ? (
              <>Transport gratis ✓ — {transport.region} ligt binnen 10 km</>
            ) : (
              <>
                {transport.region} · {transport.distanceKm} km enkele reis →{" "}
                {NUM_TRIPS} ritten, {FREE_KM_TOTAL} km vrijgesteld = €
                {transport.cost},-
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Prijsoverzicht */}
      <div className="mt-9 rounded-2xl border border-ink/8 bg-sand-50/60 p-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Prijsoverzicht
        </h4>
        <dl className="mt-4 space-y-3 text-[15px]">
          <Row label="Weekendtarief">{formatEuro(WEEKEND_RATE)}</Row>
          <Row label="Verlichting" muted={lightingCost === 0}>
            {lightingCost > 0 ? formatEuro(lightingCost) : "—"}
          </Row>
          <Row
            label={`Zijwanden${
              sidewallsCost > 0 ? ` (${sidewallsCost / SIDEWALL_PRICE}×)` : ""
            }`}
            muted={sidewallsCost === 0}
          >
            {sidewallsCost > 0 ? formatEuro(sidewallsCost) : "—"}
          </Row>
          <Row label="Shotjesbar" muted={shotjesbarCost === 0}>
            {shotjesbarCost > 0 ? formatEuro(shotjesbarCost) : "—"}
          </Row>
          <Row label="Transport" muted={!transport?.ok}>
            {transport?.ok
              ? transport.free
                ? "Gratis"
                : formatEuro(transport.cost)
              : "—"}
          </Row>
        </dl>
        {transport?.ok && !transport.free && (
          <p className="mt-2 text-xs text-ink/45">
            Transport: {NUM_TRIPS} ritten van {transport.distanceKm} km −{" "}
            {FREE_KM_TOTAL} km vrijgesteld.
          </p>
        )}
        <div className="mt-5 flex items-baseline justify-between border-t border-ink/10 pt-5">
          <span className="text-base font-semibold text-ink">Totaal</span>
          <span className="font-serif text-3xl font-light tracking-tight text-ink">
            {transport?.ok ? formatEuro(total) : "—"}
          </span>
        </div>
        <p className="mt-3 text-xs text-ink/40">
          Vul uw postcode in voor het complete totaalbedrag. De definitieve
          prijs bevestigen we in uw persoonlijke offerte.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  muted,
}: {
  label: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink/60">{label}</dt>
      <dd className={muted ? "text-ink/45" : "font-medium text-ink"}>
        {children}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stap 5 — Contact & versturen                                              */
/* -------------------------------------------------------------------------- */

function StepContact({
  form,
  set,
  message,
}: StepProps & { message: string }) {
  const valid =
    form.name.trim() !== "" &&
    form.phone.trim() !== "" &&
    /\S+@\S+\.\S+/.test(form.email);

  return (
    <div>
      <StepHeading
        title="Bijna klaar!"
        sub="Laat uw gegevens achter en verstuur uw aanvraag direct via WhatsApp. We bevestigen de beschikbaarheid zo snel mogelijk."
      />

      <div className="space-y-5">
        <div>
          <label className="field-label">Naam</label>
          <input
            type="text"
            placeholder="Voor- en achternaam"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="field-input"
            autoComplete="name"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label">Telefoonnummer</label>
            <input
              type="tel"
              placeholder="06 12345678"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="field-input"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="field-label">E-mailadres</label>
            <input
              type="email"
              placeholder="naam@voorbeeld.nl"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="field-input"
              autoComplete="email"
            />
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-sand-200 bg-sand-50/70 p-4 text-[13px] leading-relaxed text-ink/70">
        <span className="font-semibold text-ink">Tip:</span> stuur na het
        versturen gerust een foto van uw locatie mee in de WhatsApp-chat — dan
        kunnen we direct goed met u meedenken.
      </div>

      <div className="mt-3 rounded-xl border border-sand-200 bg-sand-50/70 p-4 text-[13px] leading-relaxed text-ink/60">
        Door deze aanvraag te versturen, zit u nog nergens aan vast. We
        bekijken samen de mogelijkheden — de boeking is pas definitief na
        akkoord van beide partijen en ondertekening van het contract.
      </div>

      <a
        href={valid ? whatsappLink(message) : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!valid}
        onClick={(e) => {
          if (!valid) e.preventDefault();
        }}
        className={`btn-whatsapp mt-6 w-full py-4 text-base ${
          valid ? "" : "pointer-events-none opacity-40"
        }`}
      >
        <WhatsAppGlyph />
        Verstuur aanvraag via WhatsApp
      </a>
      <p className="mt-3 text-center text-xs text-ink/40">
        U opent WhatsApp met een ingevuld bericht. U verstuurt het zelf met één
        tik.
      </p>

      <p className="mt-6 border-t border-ink/8 pt-5 text-center text-xs leading-relaxed text-ink/40">
        Annulering binnen 7 dagen voor aanvang: 25% van het huurbedrag. Binnen
        48 uur voor aanvang: 50% van het huurbedrag.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Notices & iconen                                                          */
/* -------------------------------------------------------------------------- */

function Notice({
  tone,
  title,
  children,
}: {
  tone: "good" | "warn" | "bad" | "info";
  title: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    bad: "border-red-200 bg-red-50 text-red-900",
    info: "border-sand-200 bg-sand-50 text-ink/80",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-2 rounded-2xl border p-5 text-sm leading-relaxed ${styles[tone]}`}
    >
      <p className="mb-1 font-semibold">{title}</p>
      <div className="opacity-90">{children}</div>
    </motion.div>
  );
}

function WhatsAppInline({ message }: { message: string }) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
    >
      <WhatsAppGlyph />
      Contact via WhatsApp
    </a>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
