"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  src: string;
  alt: string;
  /** Styling van de thumbnail-container (relative aspect-… overflow-hidden …). */
  className?: string;
  /** Styling van de <Image> zelf (bv. object-cover + hover-effect). */
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Klikbare foto die in een fullscreen lightbox vergroot. Sluiten via het
 * kruisje rechtsboven, op de achtergrond klikken of Esc. Werkt op telefoon,
 * tablet en desktop. De overlay rendert via een portal op <body>, zodat
 * `overflow-hidden` op bovenliggende containers hem niet afknipt.
 */
export default function ZoomablePhoto({
  src,
  alt,
  className = "",
  imgClassName = "object-cover",
  sizes = "100vw",
  priority,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // Voorkom scrollen achter de lightbox.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Foto vergroten: ${alt}`}
        className={`group/zoom block cursor-zoom-in ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={imgClassName}
        />
        {/* Zoom-hint (verschijnt bij hover op desktop) */}
        <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover/zoom:opacity-100">
          <ZoomIn className="h-4 w-4" />
        </span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm sm:p-8"
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Foto sluiten"
                  className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:right-6 sm:top-6"
                >
                  <X className="h-5 w-5" />
                </button>
                <motion.div
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.94, opacity: 0 }}
                  transition={{ duration: 0.25, ease }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl"
                >
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
