"use client";

import { Tent, Hammer, ShieldCheck, MapPin } from "lucide-react";
import Reveal from "./Reveal";
import ZoomablePhoto from "./ZoomablePhoto";

const USPS = [
  {
    title: "Stretchtent 7,5 × 10 meter",
    body: "Ruim 75 m² overdekt feestplezier voor 70 tot 100 gasten. Strak gespannen, elegant en weerbestendig.",
    icon: Tent,
  },
  {
    title: "Inclusief op- en afbouw",
    body: "Op- en afbouw verzorgen wij altijd zelf, op een tijdstip dat we samen met u afstemmen.",
    icon: Hammer,
  },
  {
    title: "Brandveilig gecertificeerd",
    body: "Het tentdoek is getest volgens BS 7837, NFPA 701 en de Franse M1/M2-norm.",
    icon: ShieldCheck,
  },
  {
    title: "Ruim werkgebied",
    body: "Tot ca. 75 km rondom Neer — ook over de grens.",
    icon: MapPin,
  },
];

const GALLERY = [
  {
    src: "/images/tent-tuin.jpg",
    alt: "Stretchtent van SMX Rental opgesteld in een tuin tijdens het gouden uur",
  },
  {
    src: "/images/tent-feest.jpg",
    alt: "Feestopstelling onder de stretchtent met statafels en sfeerverlichting",
  },
  {
    src: "/images/tent-merk.jpg",
    alt: "Onder de stretchtent met het SMX Rental-bord en uitzicht op het veld",
  },
];

export default function About() {
  return (
    <section
      id="over-ons"
      className="about-bg relative overflow-hidden py-28 sm:py-36"
    >
      <div className="container-x">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sand-600">
                Over ons
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-serif text-4xl font-light leading-tight tracking-tightest text-ink sm:text-5xl">
                Een tent die de toon zet voor uw moment.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 text-lg leading-relaxed text-ink/65">
                SMX Rental is een stretchtent verhuurbedrijf uit Neer in
                Limburg. We geloven dat een mooie tent het verschil maakt
                tussen een feestje en een onvergetelijke avond. We richten ons
                vol overgave op het leveren van een topervaring, met de
                stretchtent als uitgangspunt — en met meer moois op komst.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-4 text-lg leading-relaxed text-ink/65">
                Bruiloft, verjaardag, bedrijfsfeest of festival — particulier
                of zakelijk: wij creëren de perfecte ambiance voor elke
                gelegenheid. Met oog voor detail en een vlekkeloze service maken
                we van uw evenement een onvergetelijke beleving.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {USPS.map((usp, i) => {
              const Icon = usp.icon;
              return (
                <Reveal key={usp.title} delay={0.1 + i * 0.08}>
                  <div className="group h-full rounded-2xl border border-ink/8 bg-white p-6 shadow-sm shadow-sand-600/5 transition-all duration-300 hover:-translate-y-1 hover:border-sand-300 hover:shadow-xl hover:shadow-sand-600/10 sm:p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand-100 text-sand-600 ring-1 ring-ink/5 transition-colors group-hover:bg-ink group-hover:text-white">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">
                      {usp.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink/60">
                      {usp.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Fotogalerij — horizontaal scrollend op mobiel, grid vanaf sm */}
        <div className="reviews-scroll -mx-6 mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:mt-20 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
          {GALLERY.map((img, i) => (
            <Reveal
              key={img.src}
              delay={i * 0.1}
              className="w-[78%] flex-none snap-start sm:w-auto"
            >
              <ZoomablePhoto
                src={img.src}
                alt={img.alt}
                sizes="(min-width: 640px) 33vw, 80vw"
                className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-ink/20 shadow-md shadow-sand-600/10 ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl hover:shadow-sand-600/15"
                imgClassName="object-cover transition-transform duration-700 group-hover/zoom:scale-105"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
