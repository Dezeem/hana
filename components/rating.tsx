import { cn } from "@/lib/utils";

type RatingProps = {
  value: number | null;
  max?: number;
  size?: "sm" | "md" | "lg";
  showTicks?: boolean;
  className?: string;
};

const SIZES = {
  sm: { text: "text-[11px]", tick: "h-[3px] w-3" },
  md: { text: "text-sm", tick: "h-[3px] w-4" },
  lg: { text: "text-2xl", tick: "h-[4px] w-6" },
};

/** Score plus a row of hairline ticks — a measuring scale, not stars. */
export function Rating({ value, max = 5, size = "sm", showTicks = true, className }: RatingProps) {
  const filled = value === null ? 0 : Math.round((value / max) * 5);

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("num text-ink", SIZES[size].text)}>
        {value === null ? "—" : value.toFixed(1)}
      </span>
      {showTicks ? (
        <span className="inline-flex items-center gap-[2px]" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                SIZES[size].tick,
                index < filled ? "bg-ink" : "bg-line-strong",
                "transition-colors",
              )}
            />
          ))}
        </span>
      ) : null}
    </span>
  );
}
