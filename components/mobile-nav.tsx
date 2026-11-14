"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ListOrdered, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/library", label: "藏品", icon: LayoutGrid },
  { href: "/timeline", label: "年表", icon: ListOrdered },
  { href: "/about", label: "关于", icon: Info },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 h-[68px] border-t-2 border-line bg-paper/95 backdrop-blur-md md:hidden"
      aria-label="移动端导航"
    >
      <ul className="mx-auto flex h-full max-w-md items-stretch">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-ink" : "text-ink-faint",
                )}
              >
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.4} />
                <span className="text-[11px] font-medium uppercase tracking-[0.16em]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
