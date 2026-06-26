"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { whatsappLink } from "@/lib/config";

const INCLUDED = [
  {
    title: "50+ shotjes",
    body: "Voldoende voor een avond lang plezier.",
  },
  {
    title: "10 bekende merken sterke drank",
    body: "Na de huur blijven de flessen in uw eigendom.",
  },
  {
    title: "Crocodile shotspel",
    body: "Voor de extra lol op uw feest.",
  },
];

export default function Shotjesbar() {
  const waMessage =
    "Hoi SMX Rental! Ik heb interesse in de Shotjesbar (€380,- per weekend). Kunnen jullie me meer vertellen?";

  return (
    <section id="shotjesbar" className="relative bg-ink py-28 text-white sm:py-36">
      <WaveDivider position="top" />
      <WaveDivider position="bottom" />

      {/* zachte gloed (geclipt binnen de sectie) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          aria-hidden
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-sand-500/10 blur-3xl"
        />
      </div>

      <div className="container-x relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Beeld: twee foto's */}
          <Reveal className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-[#E5C76B]/40 shadow-[0_10px_50px_-12px_rgba(212,175,55,0.45)]">
                <Image
                  src="/images/tent-3.jpg"
                  alt="De SMX Rental Shotjesbar in de avond, met verlichte drankbakken — het schatkist-effect"
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-[#E5C76B]/40 shadow-[0_10px_50px_-12px_rgba(212,175,55,0.45)]">
                <Image
                  src="/images/shotjesbar-detail.jpg"
                  alt="De SMX Rental Shotjesbar van dichtbij — flessen in ijs, shotglaasjes en het krokodillenspel"
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#E5C76B]">
                Extra verhuur
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-serif text-4xl font-light leading-tight tracking-tightest sm:text-5xl">
                De Shotjesbar
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                Onze Shotjesbar is een unieke, omgebouwde
                <span className="text-white"> Volkswagen Golf Cabriolet</span> —
                een echte eyecatcher op zich. Het bekende
                <span className="text-[#E5C76B]"> schatkist-effect</span> maakt
                de bar zeker 's avonds dé blikvanger van uw feest.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 flex items-baseline gap-3">
                <span className="font-serif text-5xl font-light tracking-tight">
                  €380,-
                </span>
                <span className="text-white/50">per weekend</span>
              </div>
              <p className="mt-1.5 text-xs text-white/40">Exclusief reiskosten</p>
            </Reveal>

            <Reveal delay={0.3}>
              <ul className="mt-8 space-y-4">
                {INCLUDED.map((item) => (
                  <li key={item.title} className="flex items-start gap-3 text-[15px]">
                    <CheckIcon />
                    <span>
                      <span className="font-semibold text-white">{item.title}</span>
                      <span className="text-white/65"> — {item.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.38}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href={whatsappLink(waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                >
                  Vraag de Shotjesbar aan
                </a>
                <span className="text-sm text-white/50">
                  Combineerbaar met de stretchtent
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Golvende scheidingslijn boven/onder het zwarte vlak, met subtiele gouden rand. */
function WaveDivider({ position }: { position: "top" | "bottom" }) {
  const isTop = position === "top";
  const curve = "M0,40 C320,100 520,0 760,42 C1000,82 1180,8 1440,48";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 z-10 leading-[0] ${
        isTop ? "top-0 -translate-y-[98%]" : "bottom-0 translate-y-[98%] rotate-180"
      }`}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="h-12 w-full sm:h-20"
      >
        <path d={`${curve} L1440,100 L0,100 Z`} fill="#0A0A0A" />
        <path d={curve} fill="none" stroke="#E5C76B" strokeOpacity="0.5" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 flex-none text-[#E5C76B]"
      fill="none"
      aria-hidden
    >
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path
        d="M6 10.2 8.5 12.7 14 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
