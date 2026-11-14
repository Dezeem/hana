import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  /** Staggers the fade by shifting its scroll range, not by a timer. */
  delay?: number;
  className?: string;
  as?: ElementType;
};

/**
 * Marks a block for the scroll-driven fade-in defined in globals.css.
 *
 * Deliberately has no client code: the animation is CSS-only and degrades to
 * "always visible", so a blocked or failed script can never leave the page
 * blank — which is exactly what a JS-gated reveal used to do.
 */
export function Reveal({ children, delay = 0, className, as }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const shift = delay > 0 ? `${Math.min(delay / 10, 12)}%` : undefined;

  return (
    <Tag
      className={cn("reveal", className)}
      style={shift ? ({ "--reveal-shift": shift } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
