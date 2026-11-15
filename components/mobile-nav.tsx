"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, Home, LayoutGrid, ListOrdered, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { FourBar } from "./primary-bits";

const ITEMS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/library", label: "清单", icon: LayoutGrid },
  { href: "/timeline", label: "按年", icon: ListOrdered },
  { href: "/random", label: "随机", icon: Dices },
  { href: "/about", label: "关于", icon: Info },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 h-[76px] border-t border-line bg-paper/95 backdrop-blur-md md:hidden"
      aria-label="移动端导航"
    >
      <ul className="mx-auto flex h-full max-w-md items-stretch">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="relative flex-1">
              {active ? (
                <FourBar className="absolute inset-x-4 top-0 h-0.5" />
              ) : null}
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-ink" : "text-ink-faint",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.8} />
                <span className="text-[11px] font-medium uppercase tracking-[0.16em]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
