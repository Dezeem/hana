import { cn } from "@/lib/utils";

type RatingProps = {
  value: number | null;
  max?: number;
  size?: "sm" | "md" | "lg";
  showTicks?: boolean;
  className?: string;
  /** Accent colour (usually the work's type colour) for the score and ticks. */
  color?: string;
};

const SIZES = {
  sm: { text: "text-[15px]", tick: "h-[4px] w-3.5" },
  md: { text: "text-[17px]", tick: "h-[4px] w-4" },
  lg: { text: "text-[34px]", tick: "h-[6px] w-8" },
};

/** Score plus a row of hairline ticks — a measuring scale, not stars. */
export function Rating({
  value,
  max = 5,
  size = "sm",
  showTicks = true,
  className,
  color,
}: RatingProps) {
  const filled = value === null ? 0 : Math.round((value / max) * 5);

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span
        className={cn("num", SIZES[size].text, !color && "text-ink")}
        style={color ? { color } : undefined}
      >
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
              style={index < filled && color ? { backgroundColor: color } : undefined}
            />
          ))}
        </span>
      ) : null}
    </span>
  );
}
