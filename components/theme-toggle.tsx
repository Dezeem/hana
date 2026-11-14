"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("hana-theme", next ? "dark" : "light");
    } catch {
      // private mode: theme simply won't persist
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
      title={dark ? "浅色" : "深色"}
      className="group flex h-8 w-8 items-center justify-center border border-transparent text-ink-soft transition-colors hover:border-line hover:text-ink"
    >
      {mounted && dark ? (
        <Sun className="h-[15px] w-[15px]" strokeWidth={1.4} />
      ) : (
        <Moon className="h-[15px] w-[15px]" strokeWidth={1.4} />
      )}
    </button>
  );
}
