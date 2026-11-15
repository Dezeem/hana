"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** A quiet plate in the corner — appears once there is something to scroll back from. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="返回顶部"
      title="返回顶部"
      tabIndex={visible ? 0 : -1}
      className={[
        "fixed bottom-24 right-5 z-40 flex h-12 w-12 flex-col items-center justify-center gap-0.5",
        "rounded-[10px] border border-line bg-paper/90 text-ink-soft backdrop-blur-md",
        "transition-all duration-300 hover:border-ink hover:text-ink md:bottom-8 md:right-8",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
      ].join(" ")}
    >
      <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
      <span className="meta !text-[9px] leading-none">Top</span>
    </button>
  );
}
