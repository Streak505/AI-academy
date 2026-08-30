import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'input-shadow': '0 63px 59px rgba(26,33,188,.1)',
        'course-shadow': '0 40px 20px rgba(0,0,0,.15)',
        'testimonial-shadow1': '0 5.54348px 11.087px rgba(89,104,118,.05)',
        'testimonial-shadow2': '5.54348px 38.8043px 110.87px rgba(89,104,118,.15)',
      },
      colors: {
        primary: "#6556ff",
        secondary: "#1a21bc",
        grey: "#57595f",
        slateGray: "#f6faff",
        deepSlate: "#d5effa",
        success: "#43c639",
        midnight_text: "#222c44",
        "midnight-text": "#222c44",
        darkmode: "#0f172a",
        dark_border: "#cbd5e1",
        "dark-border": "#cbd5e1",
        dark_grey: "#f3f4f6",
        "dark-grey": "#f3f4f6",
        body_color: "#64748b",
        "body-color": "#64748b",
        body_secondary: "#64748b",
        "body-secondary": "#64748b",
        stroke: "#e2e8f0",
        dark: "#0f172a",
        "dark-2": "#111827",
        "dark-3": "#1f2937",
        "dark-6": "#475569",
        muted: "#6b7280",
        "blue-dark": "#1e3a8a",
      },
      fontSize: {
        '17': '1.0625rem',
        '18': '1.125rem',
        '21': '1.3125rem',
        '22': '1.375rem',
        '36': ['2.25rem', { lineHeight: '2.5rem' }],
        '56': ['3.5rem', { lineHeight: '4rem' }],
      },
      spacing: {
        '75%': '75%',
      },
      backgroundImage: {
        'newsletter-bg': `url('/images/newsletter/bgFile.png')`,
        'newsletter-bg-2': `url('/E-learning/images/newsletter/bgFile.png')`,
      },
    },
  },
  plugins: [],
};
export default config;
