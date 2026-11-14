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
      // "/" is the quick-search key, as long as the caret is not in a field.
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
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="group flex items-baseline gap-2.5" aria-label={`${site.name} 首页`}>
            <span className="font-display text-[23px] italic leading-none tracking-[-0.02em] text-ink">
              Hana
            </span>
            <span className="meta hidden pb-[3px] transition-colors group-hover:text-ink sm:block">
              {site.nameZh}
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="主导航">
            {site.nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={active}
                  className="underlink meta text-ink-soft hover:text-ink"
                  style={active ? { color: "var(--ink)" } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-8 items-center gap-2 border border-transparent px-2 text-ink-soft transition-colors hover:border-line hover:text-ink"
              aria-label="打开搜索"
            >
              <Search className="h-[15px] w-[15px]" strokeWidth={1.4} />
              <span className="meta hidden sm:inline">搜索</span>
              <kbd className="meta ml-1 hidden rounded-none border border-line px-1 py-[1px] text-[9px] lg:inline">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
