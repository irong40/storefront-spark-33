import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Libre Franklin', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        accent: ['Cormorant', 'Georgia', 'serif'],
        body: ['Libre Franklin', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          cream: "hsl(var(--brand-cream))",
          "cream-dark": "hsl(var(--brand-cream-dark))",
          terracotta: "hsl(var(--brand-terracotta))",
          "terracotta-light": "hsl(var(--brand-terracotta-light))",
          olive: "hsl(var(--brand-olive))",
          "olive-light": "hsl(var(--brand-olive-light))",
          "olive-dark": "hsl(var(--brand-olive-dark))",
          mustard: "hsl(var(--brand-mustard))",
          "mustard-light": "hsl(var(--brand-mustard-light))",
          berry: "hsl(var(--brand-berry))",
          "berry-dark": "hsl(var(--brand-berry-dark))",
          "berry-light": "hsl(var(--brand-berry-light))",
          brown: "hsl(var(--brand-brown))",
          "brown-light": "hsl(var(--brand-brown-light))",
          "warm-gray": "hsl(var(--brand-warm-gray))",
          kraft: "hsl(var(--brand-kraft))",
          // New sophisticated palette colors
          ivory: "hsl(var(--color-ivory))",
          stone: "hsl(var(--color-stone))",
          taupe: "hsl(var(--color-taupe))",
          sage: "hsl(var(--color-sage))",
          "sage-muted": "hsl(var(--color-sage-muted))",
          charcoal: "hsl(var(--color-charcoal))",
          ink: "hsl(var(--color-ink))",
          "warm-white": "hsl(var(--color-warm-white))",
          champagne: "hsl(var(--color-champagne))",
          blush: "hsl(var(--color-blush))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.5rem",
        "2xl": "0.75rem",
        "3xl": "1rem",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        medium: "var(--shadow-medium)",
        lifted: "var(--shadow-lifted)",
        berry: "var(--shadow-berry)",
        subtle: "0 2px 20px rgba(0,0,0,0.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "float-card": {
          "0%, 100%": {
            transform: "translate(0, 0)",
          },
          "25%": {
            transform: "translate(6px, -8px)",
          },
          "50%": {
            transform: "translate(0, -12px)",
          },
          "75%": {
            transform: "translate(-6px, -6px)",
          },
        },
        "scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "float-card": "float-card var(--float-duration, 25s) ease-in-out var(--float-delay, 0s) infinite",
        "scroll": "scroll 20s linear infinite",
        "marquee": "scroll 30s linear infinite",
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;