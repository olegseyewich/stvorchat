import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useThemeStore } from "@/store/themeStore";
import { clsx } from "clsx";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <Button
      variant="ghost"
      className={clsx("rounded-full bg-surface/40 p-3 text-text shadow-soft", className)}
      title={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
      onClick={toggleTheme}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};
