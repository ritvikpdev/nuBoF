import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** Tailwind size class, e.g. "size-4" or "w-3.5 h-3.5". Defaults to "size-4". */
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      className={cn("animate-spin", className ?? "size-4")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        className="opacity-75"
      />
    </svg>
  );
}
