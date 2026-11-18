import { cn } from "@/lib/utils";

/**
 * The two De Stijl ornaments the layout repeats everywhere: a four-segment
 * colour bar and a four-dot mark. Both are pure CSS, carry no text, and stay
 * hidden from assistive tech — they are decoration, not information.
 */

const COLORS = ["var(--c-movie)", "var(--c-series)", "var(--c-book)", "var(--c-music)"];

/**
 * A span, not a div: the bar is used inside `<p className="meta">` labels, and a
 * block element there is invalid HTML that React reports as a hydration error.
 */
export function FourBar({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-1.5 w-full overflow-hidden", className)} aria-hidden>
      {COLORS.map((color) => (
        <span key={color} className="flex-1" style={{ background: color }} />
      ))}
    </span>
  );
}

export function FourDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      {COLORS.map((color) => (
        <span key={color} className="h-1.5 w-1.5" style={{ background: color }} />
      ))}
    </span>
  );
}
