"use client";

import { useEffect, useState } from "react";

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "⌘ K / Ctrl K", label: "打开搜索" },
  { keys: "/", label: "打开搜索" },
  { keys: "R", label: "在随机页再看一件" },
  { keys: "?", label: "显示这份清单" },
  { keys: "Esc", label: "关闭浮层" },
  { keys: "↑ ↑ ↓ ↓ ← → ← → B A", label: "隐藏版面" },
];

/** Press ? to see what the keyboard can do. */
export function ShortcutsPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const node = target as HTMLElement | null;
      if (!node) return false;
      return ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName) || node.isContentEditable;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "?" && !isTyping(event.target)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center px-5">
      <button
        type="button"
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        aria-label="关闭快捷键清单"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-full max-w-[520px] border border-line bg-paper p-6 sm:p-8">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <span className="meta text-ink">Keyboard · 快捷键</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="meta underlink text-ink-soft hover:text-ink"
          >
            合上
          </button>
        </div>

        <ul className="mt-4 divide-y divide-line">
          {SHORTCUTS.map((item) => (
            <li key={item.keys} className="flex items-center justify-between gap-4 py-2.5">
              <kbd className="border border-line px-2 py-0.5 text-[12px] text-ink">{item.keys}</kbd>
              <span className="text-right text-[15px] text-ink-soft">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
