import Image from "next/image";
import { COMPANY, whatsappLink } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="site-texture relative overflow-hidden border-t border-ink/10 bg-sand-100">
      <div className="container-x py-16">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4">
          <div className="col-span-2">
            <Image
              src="/smx-logo-transparant.png"
              alt="SMX Rental"
              width={311}
              height={308}
              className="h-28 w-auto"
            />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink/55">
              Luxe stretchtent verhuur uit Neer, Limburg. Uw feest, onder
              onze tent — vakkundig opgebouwd, zorgeloos gevierd.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/40">
              Navigatie
            </h4>
            <ul className="mt-4 space-y-2.5 text-[15px] text-ink/65">
              <li>
                <a href="#over-ons" className="transition-colors hover:text-ink">
                  Over ons
                </a>
              </li>
              <li>
                <a href="#configurator" className="transition-colors hover:text-ink">
                  Bereken prijs
                </a>
              </li>
              <li>
                <a href="#shotjesbar" className="transition-colors hover:text-ink">
                  Verhuur
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink("Hoi SMX Rental! Ik heb een vraag.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-ink"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/40">
              Contact
            </h4>
            <ul className="mt-4 space-y-2.5 text-[15px] text-ink/65">
              <li>{COMPANY.address}</li>
              <li>
                <a
                  href={`tel:+${COMPANY.whatsapp}`}
                  className="transition-colors hover:text-ink"
                >
                  {COMPANY.phonePrimary}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="transition-colors hover:text-ink"
                >
                  {COMPANY.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://${COMPANY.website}`}
                  className="transition-colors hover:text-ink"
                >
                  {COMPANY.website}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-2 border-t border-ink/8 pt-7 text-sm text-ink/40 sm:flex-row sm:justify-between">
          <p>© 2025 SMX Rental. Alle rechten voorbehouden.</p>
          <p className="text-xs">
            Built by{" "}
            <a
              href="https://sovarlo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink/60 transition-colors hover:text-ink"
            >
              Sovarlo AI
            </a>
          </p>
        </div>

        {/* KvK — helemaal onderaan, klein */}
        <p className="mt-4 text-center text-xs text-ink/35">
          KvK: {COMPANY.kvk}
        </p>
      </div>
    </footer>
  );
}
