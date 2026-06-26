"use client";

import Reveal from "./Reveal";

type Review = {
  name: string;
  place?: string;
  rating: number; // 0–5, halve waarden toegestaan
  text: string;
  /** Langere review krijgt een bredere kaart met scrollbare tekst. */
  wide?: boolean;
};

const REVIEWS: Review[] = [
  {
    name: "Lotte & Mark",
    place: "Weert",
    rating: 5,
    text: "Super tent, top service. Alles ging op rolletjes!",
  },
  {
    name: "Familie Peeters",
    place: "Panningen",
    rating: 4,
    text: "Nette tent en vriendelijke service. De opbouw verliep prima en wij waren erg tevreden!",
  },
  {
    name: "Niels & Fleur",
    place: "Reuver",
    rating: 4,
    text: "Prima tent voor ons tuinfeest en duidelijke afspraken. Zeker voor herhaling vatbaar!",
  },
  {
    name: "Familie Verhoeven",
    place: "Bergeijk",
    rating: 4.5,
    text: "Mooie tent, goed verzorgd en netjes opgeleverd. Wij waren erg tevreden!",
  },
  {
    name: "Tim & Iris",
    place: "Nunhem",
    rating: 5,
    wide: true,
    text: "We hebben onze bruiloft gevierd onder de tent van SMX Rental en het was werkelijk perfect. Vanaf het eerste contact tot de opbouw op vrijdagavond verliep alles soepel en professioneel. De tent zag er prachtig uit, precies zoals op de foto's, en paste helemaal in de sfeer die we voor ogen hadden. Onze gasten waren onder de indruk en wij hebben tot diep in de nacht kunnen vieren zonder ergens aan te denken. Een feest om nooit te vergeten — dankzij de perfecte tent en de perfecte service van SMX Rental.",
  },
  {
    name: "Bram & Eline",
    place: "Valkenburg",
    rating: 4.5,
    text: "Fijne samenwerking en een prachtige tent voor onze verjaardag. Het eindresultaat was top!",
  },
  {
    name: "Familie Hendrix",
    place: "Kessel",
    rating: 5,
    text: "De shotjesbar was dé hit van de avond — top geregeld!",
  },
  {
    name: "Familie Coenen",
    place: "Echt",
    rating: 4,
    text: "Goede prijs-kwaliteit en de tent zag er netjes uit. Opbouw verliep soepel.",
  },
];

const STAR_PATH =
  "M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.6l-4.95 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z";

const STAR_FILL = "#B5A37E"; // zandbruin (gevuld)
const STAR_OUTLINE = "#C8B89A"; // zand (omlijning lege ster)

/** Eénmalige SVG-definitie: gradient die een ster half vult (links vol, rechts leeg). */
function StarDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <linearGradient id="smx-half-star">
          <stop offset="50%" stopColor={STAR_FILL} />
          <stop offset="50%" stopColor={STAR_FILL} stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Eén ster: volledig gevuld, half gevuld of leeg (omlijnd). */
function Star({ type }: { type: "full" | "half" | "empty" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 flex-none" aria-hidden>
      <path
        d={STAR_PATH}
        fill={type === "empty" ? "none" : type === "half" ? "url(#smx-half-star)" : STAR_FILL}
        stroke={STAR_OUTLINE}
        strokeWidth={type === "full" ? 0 : 1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Rij van 5 sterren; per positie vol/half/leeg op basis van de rating. */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex gap-0.5" aria-label={`${rating} van 5 sterren`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const type = rating >= i + 1 ? "full" : rating >= i + 0.5 ? "half" : "empty";
        return <Star key={i} type={type} />;
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      className={`flex h-[260px] flex-none flex-col rounded-2xl border border-ink/8 bg-white p-7 shadow-sm shadow-sand-600/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sand-600/10 ${
        review.wide ? "w-[420px] sm:w-[480px]" : "w-[300px] sm:w-[340px]"
      }`}
    >
      <Stars rating={review.rating} />
      <p className="reviews-scroll mt-4 flex-1 overflow-y-auto pr-1 text-[15px] leading-relaxed text-ink/70">
        “{review.text}”
      </p>
      <footer className="mt-5 border-t border-ink/8 pt-4">
        <p className="text-sm font-semibold text-ink">{review.name}</p>
        {review.place && <p className="text-sm text-ink/45">{review.place}</p>}
      </footer>
    </article>
  );
}

export default function Reviews() {
  // Lijst dubbel renderen zodat de lus naadloos doorloopt.
  const loop = [...REVIEWS, ...REVIEWS];

  return (
    <section
      id="reviews"
      className="site-texture relative overflow-hidden bg-white py-24 sm:py-28"
    >
      <StarDefs />
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sand-600">
              Wat klanten zeggen
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 font-serif text-4xl font-light leading-tight tracking-tightest text-ink sm:text-5xl">
              Onvergetelijke feesten, telkens weer
            </h2>
          </Reveal>
        </div>
      </div>

      {/* Marquee */}
      <div className="group relative mt-14">
        {/* Vervagende randen links & rechts */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-32" />

        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:[animation:none]">
          {loop.map((review, i) => (
            <div key={i} className="mr-5 sm:mr-6" aria-hidden={i >= REVIEWS.length}>
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
