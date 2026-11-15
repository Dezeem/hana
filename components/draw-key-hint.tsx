"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Press R to draw again — the server re-renders, so no client state needed. */
export function DrawKeyHint() {
  const router = useRouter();

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const node = target as HTMLElement | null;
      if (!node) return false;
      return (
        ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName) || node.isContentEditable
      );
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== "r" || isTyping(event.target)) return;
      event.preventDefault();
      router.refresh();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <span className="hidden items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-ink-faint sm:flex">
      按
      <kbd className="border border-line px-1.5 py-0.5 text-[11px] text-ink-soft">R</kbd>
      换一件
    </span>
  );
}
