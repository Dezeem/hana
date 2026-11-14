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
};

/**
 * Cover art with a graceful fallback: if the local file and the remote URL both
 * fail, a tinted plate with the title's first glyph keeps the grid intact.
 */
export function Cover({ src, fallbackSrc, title, type, className, eager }: CoverProps) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [loaded, setLoaded] = useState(false);

  const current = stage === 0 ? src : stage === 1 ? (fallbackSrc ?? "") : "";
  const tint = TYPE_MAP[type];

  if (!current) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ backgroundColor: tint?.color, opacity: 0.9 }}
        aria-label={title}
      >
        <span className="font-display text-4xl text-white/85">{title.slice(0, 1)}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        )}
        style={{ backgroundColor: `${tint?.color}1a` }}
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt={title}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setStage((prev) => (prev === 0 ? 1 : 2))}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={{ color: typeColor(type) }}
      />
    </div>
  );
}
