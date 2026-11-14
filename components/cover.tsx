"use client";

import { useState } from "react";
import { cn, typeColor } from "@/lib/utils";
import { TYPE_MAP } from "@/site.config";
import type { WorkType } from "@/site.config";

type CoverProps = {
  src: string;
  fallbackSrc?: string;
  title: string;
  type: WorkType;
  className?: string;
  eager?: boolean;
  /** Layout hint for srcset selection; defaults to a grid tile. */
  sizes?: string;
};

const WIDTHS = [240, 360, 480, 720];

/**
 * Cover art with a graceful fallback: if the local file and the remote URL both
 * fail, a tinted plate with the title's first glyph keeps the grid intact.
 *
 * Visibility is deliberately NOT gated on JavaScript. The previous version kept
 * the <img> at `opacity-0` until an `onLoad` handler fired, so whenever that
 * event was missed — a cached image finishing before React attached, a rereender
 * or hydration hiccup — the plate stayed blank forever. The image is now always
 * painted by the browser; the tinted plate simply sits underneath it.
 */
export function Cover({
  src,
  fallbackSrc,
  title,
  type,
  className,
  eager,
  sizes = "(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 360px",
}: CoverProps) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  const current = stage === 0 ? src : stage === 1 ? (fallbackSrc ?? "") : "";
  const tint = TYPE_MAP[type];

  // Local uploads can be downscaled on demand; remote fallbacks cannot.
  const local = current.startsWith("/media/") && /\.(webp|jpe?g|png|avif)$/i.test(current);
  const srcSet = local
    ? WIDTHS.map((width) => `${current}?w=${width} ${width}w`).join(", ")
    : undefined;

  if (!current) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ backgroundColor: tint?.color, opacity: 0.9 }}
        aria-label={title}
      >
        <span className="font-display text-[clamp(20px,3.4vw,44px)] text-white/85">
          {title.slice(0, 1)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundColor: `${tint?.color}1a` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={title}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setStage((prev) => (prev === 0 ? 1 : 2))}
        className="h-full w-full object-cover"
        style={{ color: typeColor(type) }}
      />
    </div>
  );
}
