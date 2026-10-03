import type { Config } from "tailwindcss";

const config: Config = {
  // Op touch-apparaten (iPad/iPhone) blijft een `hover:`-stijl na een tik
  // "plakken". Met deze vlag gelden hover-stijlen alleen op apparaten met een
  // echte muisaanwijzer.
  future: { hoverOnlyWhenSupported: true },
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        sand: {
          DEFAULT: "#C8B89A",
          50: "#FBF9F5",
          100: "#F5F1E8",
          200: "#EAE2D1",
          300: "#DDD0B6",
          400: "#C8B89A",
          500: "#B5A37E",
          600: "#9C8A64",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      // Tailwind genereert opacity in stappen van 5. De site gebruikt al langer
      // /8 en /12 (o.a. border-ink/8 op alle kaarten); zonder deze toevoeging
      // bestaan die klassen niet en valt de rand terug op Tailwinds grijze
      // standaardkleur in plaats van het bedoelde zachte inkt-randje.
      opacity: {
        8: "0.08",
        12: "0.12",
      },
      maxWidth: {
        "8xl": "88rem",
      },
      keyframes: {
        // Schuift langzaam en continu van links naar rechts in een lus.
        marquee: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        marquee: "marquee 50s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
