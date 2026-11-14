"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { site } from "@/site.config";
import { SearchOverlay } from "./search-overlay";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const node = target as HTMLElement | null;
      if (!node) return false;
      return (
        ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName) || node.isContentEditable
      );
    };

    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key === "/" && !isTyping(event.target)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-20 border-b-2 border-line bg-paper">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="group flex items-baseline gap-3" aria-label={`${site.name} 首页`}>
            <span className="flex h-8 items-center bg-ink px-3 text-[20px] font-semibold uppercase leading-none tracking-[0.08em] text-paper">
              {site.name}
            </span>
            <span className="hidden text-[13px] font-medium uppercase tracking-[0.3em] text-ink-soft sm:block">
              {site.nameZh}
            </span>
          </Link>

          <nav className="hidden items-center gap-10 md:flex" aria-label="主导航">
            {site.nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={active}
                  className="underlink text-[14px] font-medium uppercase tracking-[0.22em] transition-colors"
                  style={{ color: active ? "var(--ink)" : "var(--ink-soft)" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 border-2 border-line px-3 text-ink transition-colors hover:bg-ink hover:text-paper"
              aria-label="打开搜索"
            >
              <Search className="h-4 w-4" strokeWidth={2} />
              <span className="hidden text-[12px] font-medium uppercase tracking-[0.2em] sm:inline">
                搜索
              </span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
