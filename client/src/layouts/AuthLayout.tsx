import { type ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-8">
      <div className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-panel/90 md:grid-cols-[1.2fr_1fr]">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle className="bg-surface/60" />
        </div>
        <div className="relative flex flex-col justify-between bg-nyx-gradient p-8 text-text md:p-12">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.4em] text-text/70">Stvor</p>
            <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{title}</h1>
            <p className="mt-2 max-w-sm text-text/80">{subtitle}</p>
          </div>
          <div className="mt-12 grid gap-3 text-sm text-text/80 md:mt-16">
            <p>· Мгновенные сообщения</p>
            <p>· Уютная светло-фиолетовая тема</p>
            <p>· Друзья и комнаты в одном месте</p>
          </div>
        </div>
        <div className="flex flex-col justify-center bg-surface px-6 py-10 md:px-10 md:py-12">
          <div className="mx-auto w-full max-w-md space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

