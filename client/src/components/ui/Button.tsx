import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

type ButtonVariant = NonNullable<ButtonProps["variant"]>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-2xl font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 disabled:opacity-60 disabled:cursor-not-allowed whitespace-normal break-words text-center";

    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-gradient-to-br from-primary to-secondary text-text shadow-soft hover:shadow-lg hover:brightness-105 px-4 py-2",
      secondary:
        "bg-panel text-text border border-border hover:bg-hover px-4 py-2",
      ghost: "bg-transparent text-text/80 hover:text-text hover:bg-hover/60 px-3 py-2",
    };

    return (
      <button ref={ref} className={clsx(baseStyles, variants[variant], className)} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

