"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Phone, Mail, Send } from "lucide-react";
import { COMPANY, whatsappLink } from "@/lib/config";

const WELCOME =
  "Hoi! Ik ben de assistent van SMX Rental. Stel gerust uw vraag over de stretchtent, ShotjesBar, prijzen of het werkgebied.";

const FALLBACK =
  "Dat bespreken we graag even persoonlijk. Via de knoppen hieronder kunt u ons bereiken via WhatsApp, telefoon of e-mail — we helpen u graag verder!";

type Msg = { role: "user" | "bot"; text: string };

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "bot", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Klein nudge-bubbeltje verschijnt pas na ~30s, en maar één keer per bezoek.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("smx-chat-seen")) return;
    const t = setTimeout(() => setNudge(true), 30000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const markSeen = () => {
    if (typeof window !== "undefined") sessionStorage.setItem("smx-chat-seen", "1");
  };
  const openPanel = () => {
    setOpen(true);
    setNudge(false);
    markSeen();
  };
  const dismissNudge = () => {
    setNudge(false);
    markSeen();
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next: Msg[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const payload = next.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));
    while (payload.length && payload[0].role !== "user") payload.shift();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages((m) => [...m, { role: "bot", text: data.reply || FALLBACK }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: FALLBACK }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chatvenster (opent alleen bij klik) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 z-40 flex h-[26rem] max-h-[68vh] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl shadow-ink/20 sm:right-6"
          >
            <div className="flex flex-none items-center justify-between gap-3 bg-ink px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                  <Image src="/smx-logo-transparant.png" alt="SMX Rental" width={32} height={32} className="h-7 w-7 object-contain" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">SMX Rental</p>
                  <p className="text-xs text-white/60">Meestal snel een reactie</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chat sluiten"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-sand-50/50 px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-ink text-white"
                        : "rounded-bl-sm border border-ink/8 bg-white text-ink/80 shadow-sm"
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-ink/8 bg-white px-4 py-3 shadow-sm">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-ink/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={send} className="flex flex-none items-center gap-2 border-t border-ink/8 bg-white px-3 py-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Typ uw vraag…"
                className="min-w-0 flex-1 rounded-full border border-ink/10 bg-sand-50/60 px-4 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink/35 focus:border-sand-500 focus:ring-2 focus:ring-sand-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Versturen"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ink text-white transition-all hover:bg-ink/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <div className="flex flex-none items-center gap-2 border-t border-ink/8 bg-white px-3 pb-3">
              <a
                href={whatsappLink("Hoi SMX Rental! Ik heb een vraag.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp flex-1 px-3 py-2 text-xs"
              >
                WhatsApp
              </a>
              <a
                href={`tel:+${COMPANY.whatsapp}`}
                aria-label="Bellen"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
              >
                <Phone className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${COMPANY.email}`}
                aria-label="E-mailen"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Klein nudge-bubbeltje na 30s (boven de knop) */}
      <AnimatePresence>
        {nudge && !open && (
          <motion.button
            type="button"
            onClick={openPanel}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-[5.25rem] right-4 z-40 flex max-w-[16rem] items-center gap-2 rounded-2xl rounded-br-sm border border-ink/10 bg-white py-2.5 pl-3.5 pr-2.5 text-left text-sm text-ink shadow-xl shadow-ink/15 sm:right-6"
          >
            <span className="leading-snug">Vragen over de tent? Ik help u graag! 💬</span>
            <span
              role="button"
              tabIndex={-1}
              aria-label="Sluiten"
              onClick={(e) => {
                e.stopPropagation();
                dismissNudge();
              }}
              className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Ronde knop met SMX-logo + zachte gloed */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? "Chat sluiten" : "Chat openen"}
        className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-ink/10 bg-white shadow-xl shadow-ink/20 transition-transform duration-300 hover:scale-105 active:scale-95 sm:right-6"
      >
        {/* pulserende gloed zodat de chatbot opvalt */}
        {!open && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            animate={{ boxShadow: ["0 0 0 0 rgba(200,184,154,0.55)", "0 0 0 12px rgba(200,184,154,0)"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="h-6 w-6 text-ink" />
            </motion.span>
          ) : (
            <motion.span key="logo" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Image src="/smx-logo-transparant.png" alt="SMX Rental chat" width={40} height={40} className="relative h-9 w-9 object-contain" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </>
  );
}
