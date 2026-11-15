"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { site } from "@/site.config";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/works", label: "作品" },
  { href: "/admin/works/new", label: "新建" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-display text-[21px] italic leading-none text-ink">{site.name}</span>
            <span className="meta pb-[2px]">后台</span>
          </Link>
          <nav className="hidden items-center gap-5 sm:flex">
            {LINKS.map((link) => {
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[15px] tracking-[0.12em] transition-colors",
                    active ? "text-ink" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" target="_blank" className="meta underlink text-ink-soft hover:text-ink">
            查看站点 ↗
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="meta underlink text-ink-soft hover:text-ink">
              退出
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
