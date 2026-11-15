import Link from "next/link";
import { site } from "@/site.config";
import { FourBar } from "./primary-bits";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <FourBar />
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[16px] font-semibold leading-none text-ink">{site.name}</span>
            <span className="text-[13px] text-ink-faint">{site.tagline}</span>
          </p>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-soft"
            aria-label="页脚导航"
          >
            {site.nav.map((item) => (
              <Link key={item.href} href={item.href} className="link-quiet">
                {item.label}
              </Link>
            ))}
            <a href={`mailto:${site.email}`} className="link-quiet">
              邮件
            </a>
            <Link href="/admin" className="link-quiet">
              后台
            </Link>
          </nav>
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line pt-3 text-[11px] uppercase tracking-[0.08em] text-ink-faint">
          <span>
            © {new Date().getFullYear()} {site.owner}
          </span>
          <span className="opacity-40">·</span>
          <span>按 ? 看快捷键</span>
          <span className="opacity-40">·</span>
          <span>Metadata referenced from Douban</span>
        </p>
      </div>
    </footer>
  );
}
