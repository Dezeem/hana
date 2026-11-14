import Link from "next/link";
import { site } from "@/site.config";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-2xl italic leading-none text-ink">{site.name}</p>
            <p className="mt-4 max-w-md font-serif text-[13px] leading-relaxed text-ink-soft">
              {site.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
            <div>
              <p className="meta mb-3">Navigate</p>
              <ul className="space-y-1.5">
                {site.nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-quiet font-serif text-[13px]">
                      {item.label} · {item.labelEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="meta mb-3">Elsewhere</p>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="link-quiet font-serif text-[13px]"
                  >
                    {site.email}
                  </a>
                </li>
                <li>
                  <Link href="/admin" className="link-quiet font-serif text-[13px]">
                    后台管理
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="font-meta tracking-[0.16em] uppercase">
            © {new Date().getFullYear()} {site.owner} · All specimens kept by hand
          </p>
          <p className="font-meta tracking-[0.16em] uppercase">
            Metadata referenced from Douban · personal archive only
          </p>
        </div>
      </div>
    </footer>
  );
}
