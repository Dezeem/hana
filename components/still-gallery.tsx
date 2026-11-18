"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";

const RESIZABLE = /\.(webp|jpe?g|png|avif)$/i;

/** Local media can be downscaled by our route; remote URLs are used as-is. */
function sized(src: string, width: number) {
  if (!src.startsWith("/media/") || !RESIZABLE.test(src.split("?")[0])) return src;
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}

/**
 * A film strip plus a lightbox: the thumbnails stay in the page, and clicking
 * one opens the frame in place instead of handing the reader to a raw file.
 * Arrows, the keyboard and a horizontal swipe all walk the same set.
 */
export function StillGallery({ stills }: { stills: string[] }) {
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const wasOpen = useRef(false);
  const touchX = useRef<number | null>(null);

  const close = useCallback(() => {
    const index = active;
    setActive(null);
    if (index !== null) {
      window.requestAnimationFrame(() => thumbs.current[index]?.focus());
    }
  }, [active]);

  const step = useCallback(
    (delta: number) => {
      setActive((current) =>
        current === null ? current : (current + delta + stills.length) % stills.length,
      );
    },
    [stills.length],
  );

  // The plate holds the page still while it is open.
  useEffect(() => {
    if (active === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, step]);

  // Focus the close plate on open, not on every swap.
  useEffect(() => {
    if (active !== null && !wasOpen.current) closeRef.current?.focus();
    wasOpen.current = active !== null;
  }, [active]);

  const current = active === null ? null : stills[active];

  return (
    <>
      <div className="mt-6 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        {stills.map((src, index) => (
          <button
            key={src}
            ref={(node) => {
              thumbs.current[index] = node;
            }}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`放大第 ${index + 1} 张`}
            className="group relative w-[78%] shrink-0 cursor-zoom-in snap-start overflow-hidden rounded-[var(--radius-card)] border border-line bg-mist sm:w-[420px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sized(src, 720)}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10" />
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 flex h-6 items-center rounded-full bg-black/55 px-2 text-[11px] font-medium tracking-[0.08em] text-white backdrop-blur-sm">
              {index + 1} / {stills.length}
            </span>
          </button>
        ))}
      </div>

      {current !== null ? (
        <div
          className="fade-in fixed inset-0 z-[80] flex flex-col bg-black/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="剧照"
          onClick={close}
          onTouchStart={(event) => {
            touchX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchX.current;
            const end = event.changedTouches[0]?.clientX ?? null;
            touchX.current = null;
            if (start === null || end === null || Math.abs(end - start) < 48) return;
            step(end < start ? 1 : -1);
          }}
        >
          <div
            className="flex items-center justify-between gap-4 px-5 py-4"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="num text-[12px] tracking-[0.14em] text-white/60">
              {String((active ?? 0) + 1).padStart(2, "0")} /{" "}
              {String(stills.length).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={current}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-9 items-center gap-1.5 rounded-full border border-white/25 px-3 text-[12px] text-white/80 transition-colors hover:border-white hover:text-white"
              >
                原图
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.6} />
              </a>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="关闭"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-white hover:text-white"
              >
                <X className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </div>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-3 pb-8 sm:px-16"
            onClick={(event) => event.stopPropagation()}
          >
            {stills.length > 1 ? (
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="上一张"
                className="absolute left-2 z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white/80 transition-colors hover:border-white hover:text-white sm:left-6 sm:flex"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
            ) : null}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={active}
              src={sized(current, 1000)}
              alt=""
              className="zoom-in max-h-[76vh] max-w-full rounded-[var(--radius-card)] object-contain shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)]"
            />

            {stills.length > 1 ? (
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="下一张"
                className="absolute right-2 z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white/80 transition-colors hover:border-white hover:text-white sm:right-6 sm:flex"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
