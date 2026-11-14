import Link from "next/link";
import { site } from "@/site.config";

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t-2 border-line">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex h-10 w-fit items-center bg-ink px-4 text-[22px] font-semibold uppercase leading-none tracking-[0.08em] text-paper">
              {site.name}
            </p>
            <p className="mt-6 max-w-md text-[15px] leading-[1.9] text-ink-soft">
              {site.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-x-16 gap-y-8">
            <div>
              <p className="meta mb-4 text-ink">Navigate</p>
              <ul className="space-y-2">
                {site.nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-quiet text-[15px]">
                      {item.label} · {item.labelEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="meta mb-4 text-ink">Elsewhere</p>
              <ul className="space-y-2">
                <li>
                  <a href={`mailto:${site.email}`} className="link-quiet text-[15px]">
                    {site.email}
                  </a>
                </li>
                <li>
                  <Link href="/admin" className="link-quiet text-[15px]">
                    后台管理
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t-2 border-line pt-6 text-[12px] uppercase tracking-[0.2em] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.owner} · Collection kept by hand
          </p>
          <p>Metadata referenced from Douban · personal archive only</p>
        </div>
      </div>
    </footer>
  );
}
