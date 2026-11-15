"use client";

import { useCallback, useEffect, useState } from "react";
import { MondrianPlate } from "./mondrian-plate";

const SEQUENCE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

/**
 * A hidden plate: the classic ↑↑↓↓←→←→BA unlocks a full-screen plate and
 * shuffles the four collection colours for as long as it stays open.
 */
export function KonamiEgg() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    let cursor = 0;

    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === SEQUENCE[cursor]) {
        cursor += 1;
        if (cursor === SEQUENCE.length) {
          cursor = 0;
          setOpen(true);
        }
        return;
      }
      cursor = key === SEQUENCE[0] ? 1 : 0;
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.egg = "on";
    else delete root.dataset.egg;

    return () => {
      delete root.dataset.egg;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="隐藏关卡"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-paper px-5"
    >
      <button
        type="button"
        onClick={close}
        className="absolute inset-0 cursor-default"
        aria-label="关闭隐藏关卡"
      />

      <div className="relative z-10 w-full max-w-[720px] border border-ink bg-paper p-6 sm:p-10">
        <p className="meta text-ink">Hidden plate · 隐藏关卡</p>

        <div className="mt-6 flex justify-center">
          <MondrianPlate className="max-w-[300px]" />
        </div>

        <p className="mt-8 font-display text-[26px] leading-[1.3] tracking-[-0.02em] text-ink sm:text-[34px]">
          四种原色换了个位置。
        </p>
        <p className="mt-3 text-[16px] leading-[1.9] text-ink-soft">
          这没有含义，只是让人知道：这份清单是人手工摆的，不是流水线生成的。
        </p>

        <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
          <span className="meta">↑ ↑ ↓ ↓ ← → ← → B A</span>
          <button
            type="button"
            onClick={close}
            className="text-[15px] font-medium uppercase tracking-[0.08em] underline decoration-2 underline-offset-4 hover:text-ink"
          >
            合上
          </button>
        </div>
      </div>
    </div>
  );
}
