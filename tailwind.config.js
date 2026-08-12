/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
          indigo: "#4F46E5",
          indigoDark: "#4338CA",
          midnight: "#111827",
          coral: "#FF6B35",
          coralDark: "#E85A2A",
          ivory: "#F8FAFC",
          slate: "#64748B",
          borderLight: "#E2E8F0",
          success: "#10B981",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.05" }],
        h1: ["2.75rem", { lineHeight: "1.1" }],
        h2: ["2.25rem", { lineHeight: "1.15" }],
        h3: ["1.5rem", { lineHeight: "1.25" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,.04), 0 8px 24px -4px rgba(15,23,42,.08)",
        elevated: "0 4px 6px rgba(15,23,42,.05), 0 20px 40px -8px rgba(15,23,42,.14)",
      },
    },
  },
  plugins: [],
}