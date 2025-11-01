const withOpacityValue = (variable) => {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}) / 1)`;
    }
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: withOpacityValue("--color-primary"),
        secondary: withOpacityValue("--color-secondary"),
        surface: withOpacityValue("--color-surface"),
        panel: withOpacityValue("--color-panel"),
        border: withOpacityValue("--color-border"),
        text: withOpacityValue("--color-text"),
        hover: withOpacityValue("--color-hover"),
        muted: withOpacityValue("--color-muted"),
        success: withOpacityValue("--color-success"),
        error: withOpacityValue("--color-error"),
      },
      borderRadius: {
        xl: "1.2rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 20px 35px -15px rgb(var(--color-text) / 0.25)",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "nyx-gradient":
          "linear-gradient(135deg, rgb(var(--color-primary) / 0.9), rgb(var(--color-secondary) / 0.9))",
      },
    },
  },
  plugins: [],
};

