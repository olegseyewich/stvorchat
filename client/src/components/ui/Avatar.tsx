import { clsx } from "clsx";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  fallback?: string;
  isOnline?: boolean;
}

const sizeMap = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
};

export const Avatar = ({ src, alt, size = "md", fallback, isOnline }: AvatarProps) => {
  return (
    <div className={clsx("relative inline-flex", sizeMap[size])}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full rounded-full object-cover shadow-soft"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/30 text-text font-semibold shadow-soft">
          {fallback?.slice(0, 2).toUpperCase()}
        </div>
      )}
      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-success shadow" />}
    </div>
  );
};

