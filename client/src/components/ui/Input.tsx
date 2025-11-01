import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-2xl border border-transparent bg-panel/80 px-4 py-3 text-text placeholder:text-muted shadow-inner transition focus:border-primary/40 focus:bg-panel focus:ring-2 focus:ring-primary/30",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

