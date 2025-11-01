import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initialize: () => void;
}

const STORAGE_KEY = "stvor-theme";

const themeTokens: Record<Theme, Record<string, string>> = {
  light: {
    "--color-primary": "179 146 240",
    "--color-secondary": "199 168 255",
    "--color-surface": "237 231 246",
    "--color-panel": "225 216 241",
    "--color-border": "208 194 229",
    "--color-text": "60 42 93",
    "--color-hover": "216 201 240",
    "--color-muted": "187 174 220",
    "--color-success": "167 243 208",
    "--color-error": "252 165 165",
  },
  dark: {
    "--color-primary": "129 107 222",
    "--color-secondary": "102 86 209",
    "--color-surface": "18 18 28",
    "--color-panel": "30 32 48",
    "--color-border": "68 70 102",
    "--color-text": "230 226 255",
    "--color-hover": "46 43 70",
    "--color-muted": "140 132 185",
    "--color-success": "52 211 153",
    "--color-error": "248 113 113",
  },
};

const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("theme-dark", theme === "dark");
  const tokens = themeTokens[theme];
  Object.entries(tokens).forEach(([variable, value]) => {
    root.style.setProperty(variable, value);
  });
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  setTheme: (theme) => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme: Theme = get().theme === "light" ? "dark" : "light";
    get().setTheme(nextTheme);
  },
  initialize: () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferred = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(preferred);
    set({ theme: preferred });
  },
}));
