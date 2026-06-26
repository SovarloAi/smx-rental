"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, whatsappLink } from "@/lib/config";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const waMessage = "Hoi SMX Rental! Ik heb een vraag over jullie stretchtent.";
  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 bg-[#CBB897] transition-shadow duration-300 ${
        scrolled ? "shadow-lg shadow-ink/20" : "shadow-md shadow-ink/10"
      }`}
    >
      <nav className="container-x flex h-20 items-center justify-between sm:h-28 lg:h-32">
        <a href="#top" className="group flex items-center" aria-label="SMX Rental — naar boven">
          <Image
            src="/smx-logo-transparant.png"
            alt="SMX Rental"
            width={311}
            height={308}
            priority
            className="h-14 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-24 lg:h-28"
          />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop-navigatie */}
          <div className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-medium text-ink transition-all hover:border-ink/40 hover:bg-ink hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <a
            href={whatsappLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp hidden md:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>WhatsApp</span>
          </a>

          {/* Hamburger (mobiel/tablet) */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-ink transition-colors hover:border-ink/40 hover:bg-ink hover:text-white md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Uitklapmenu (mobiel/tablet) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-ink/10 bg-[#CBB897] shadow-lg shadow-ink/15 md:hidden"
          >
            <div className="container-x flex flex-col gap-2 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-xl border border-white/30 bg-white/15 px-4 py-3 text-base font-medium text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={whatsappLink(waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="btn-whatsapp w-full py-3 text-base"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
