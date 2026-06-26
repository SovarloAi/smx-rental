"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  return (
    <section
      id="top"
      className="hero-gradient relative flex min-h-screen items-center overflow-hidden pt-20 sm:pt-28 lg:pt-32"
    >
      {/* subtiele zandcirkel rechtsboven */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[36rem] w-[36rem] rounded-full bg-sand-100/60 blur-3xl"
      />

      <div className="container-x relative z-10 grid w-full items-center gap-8 py-12 sm:gap-12 sm:py-16 lg:gap-16 lg:py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-sand-300/70 bg-white/60 px-4 py-1.5 text-xs font-medium tracking-tight text-ink/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sand-500" />
            Stretchtent verhuur · Neer, Limburg
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.05 }}
            className="font-serif text-[2.6rem] font-light leading-[1] tracking-tightest text-ink sm:text-6xl sm:leading-[0.95] lg:text-7xl xl:text-[5.5rem]"
          >
            Uw feest.
            <br />
            <span className="italic text-sand-600">Onder onze tent.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.18 }}
            className="mt-7 max-w-md text-lg leading-relaxed text-ink/65"
          >
            Een luxe stretchtent van 7,5 × 10 meter — ruimte voor 70 tot 100
            gasten. Wij verzorgen op- en afbouw, u geniet van het moment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.3 }}
            className="mt-8 flex items-stretch gap-3 sm:mt-10 sm:gap-4"
          >
            <a
              href="#configurator"
              className="btn-primary flex-1 justify-center px-4 text-center sm:flex-none sm:px-7"
            >
              Bereken uw prijs
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="hidden h-4 w-4 sm:block"
                aria-hidden
              >
                <path
                  d="M8 3.5v9M8 12.5l3.5-3.5M8 12.5 4.5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href="#over-ons"
              className="btn-secondary flex-1 justify-center px-4 text-center sm:flex-none sm:px-7"
            >
              Meer over SMX Rental
            </a>
          </motion.div>
        </div>

        {/* Echte foto van de stretchtent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.25 }}
          className="relative mt-4 block sm:mt-6 lg:mt-0"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] border border-ink/20 shadow-2xl shadow-sand-600/10 ring-1 ring-black/5 sm:rounded-[2rem] lg:aspect-[4/5]">
            <Image
              src="/images/tent-overzicht.jpg"
              alt="Stretchtent van SMX Rental opgesteld op een grasveld"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

            <div className="absolute bottom-3 left-3 rounded-xl border border-white/50 bg-white/90 px-3.5 py-2.5 backdrop-blur-sm sm:bottom-5 sm:left-5">
              <p className="text-[10px] font-medium uppercase tracking-widest text-sand-600 sm:text-xs">
                Weekendtarief
              </p>
              <p className="font-serif text-2xl font-light leading-tight tracking-tight text-ink sm:text-3xl">
                €550,-
              </p>
            </div>
          </div>

          {/* Vertrouwenssignalen onder de foto */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink/55 lg:justify-start">
            <span className="flex items-center gap-2">
              <CheckDot /> Inclusief op- en afbouw
            </span>
            <span className="flex items-center gap-2">
              <CheckDot /> Vaste prijzen
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CheckDot() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-sand-600" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path
        d="M5 8.2 7 10l4-4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
