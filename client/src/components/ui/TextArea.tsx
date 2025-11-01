import { forwardRef, type TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        "w-full resize-none rounded-2xl border border-transparent bg-panel/90 px-4 py-3 text-text placeholder:text-muted shadow-inner transition focus:border-primary/40 focus:bg-panel focus:ring-2 focus:ring-primary/30",
        className,
      )}
      {...props}
    />
  ),
);

TextArea.displayName = "TextArea";

