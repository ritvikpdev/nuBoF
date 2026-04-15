import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg className={cn("w-3.5 h-3.5", className)} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6.5 2h3M2 4h12m-1.5 0L11 13H5L3.5 4"
        stroke="currentColor" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoveIcon({ className }: IconProps) {
  return (
    <svg className={cn("w-3.5 h-3.5", className)} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronIcon({ className, open }: IconProps & { open: boolean }) {
  return (
    <svg
      className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180", className)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
