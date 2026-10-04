"use client";

/**
 * Handtekeningvak. Werkt met vinger, pen en muis via pointer events, en houdt
 * rekening met de pixelverhouding van het scherm zodat de lijn scherp blijft.
 *
 * `touch-action: none` is essentieel: zonder dat scrollt de pagina mee zodra
 * iemand op een telefoon begint te tekenen.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export type HandtekeningHandle = {
  leeg: () => boolean;
  dataUrl: () => string;
  wissen: () => void;
};

type Props = { onVerandering?: (heeftTekening: boolean) => void };

const Handtekeningvak = forwardRef<HandtekeningHandle, Props>(function Handtekeningvak(
  { onVerandering },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tekent = useRef(false);
  const vorige = useRef<{ x: number; y: number } | null>(null);
  const beschreven = useRef(false);
  const [heeftTekening, setHeeftTekening] = useState(false);

  /** Stelt de canvasgrootte in op de werkelijke pixels en behoudt de tekening. */
  const pasMaatAan = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const oud = beschreven.current ? canvas.toDataURL() : null;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0A0A0A";

    if (oud) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = oud;
    }
  }, []);

  useEffect(() => {
    pasMaatAan();
    const observer = new ResizeObserver(pasMaatAan);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [pasMaatAan]);

  const punt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Pointer capture zorgt dat we blijven tekenen als de vinger buiten het
    // vak komt. Lukt het niet, dan gaan we gewoon door zonder — anders zou
    // het hele handtekeningvak stuk zijn op een browser die dit weigert.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* niet erg */
    }
    tekent.current = true;
    vorige.current = punt(e);
  };

  const beweeg = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tekent.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const nu = punt(e);
    if (!ctx || !vorige.current) return;

    ctx.beginPath();
    ctx.moveTo(vorige.current.x, vorige.current.y);
    ctx.lineTo(nu.x, nu.y);
    ctx.stroke();
    vorige.current = nu;

    if (!beschreven.current) {
      beschreven.current = true;
      setHeeftTekening(true);
      onVerandering?.(true);
    }
  };

  const stop = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tekent.current) return;
    tekent.current = false;
    vorige.current = null;
    // Eén tik zonder beweging telt ook als handtekening (een punt).
    if (!beschreven.current) {
      const ctx = canvasRef.current?.getContext("2d");
      const p = punt(e);
      if (ctx) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = "#0A0A0A";
        ctx.fill();
      }
      beschreven.current = true;
      setHeeftTekening(true);
      onVerandering?.(true);
    }
  };

  const wissen = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    beschreven.current = false;
    setHeeftTekening(false);
    onVerandering?.(false);
  }, [onVerandering]);

  useImperativeHandle(ref, () => ({
    leeg: () => !beschreven.current,
    dataUrl: () => canvasRef.current?.toDataURL("image/png") ?? "",
    wissen,
  }));

  return (
    <div>
      <div className="relative rounded-2xl border-2 border-ink/20 bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={beweeg}
          onPointerUp={stop}
          onPointerCancel={stop}
          aria-label="Handtekeningvak. Teken hier uw handtekening met uw vinger of muis."
          className="block h-44 w-full cursor-crosshair touch-none rounded-2xl sm:h-52"
        />
        {/* Schrijflijn */}
        <div aria-hidden className="pointer-events-none absolute inset-x-8 bottom-10 border-b border-ink/15" />
        {!heeftTekening && (
          <p aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[19px] text-ink/30">
            Teken hier
          </p>
        )}
      </div>
      <div className="mt-3">
        <button type="button" onClick={wissen} disabled={!heeftTekening}
          className="btn-klant-rand min-h-[48px] text-[16px] disabled:opacity-40">
          Handtekening opnieuw zetten
        </button>
      </div>
    </div>
  );
});

export default Handtekeningvak;
