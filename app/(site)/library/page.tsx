import Link from "next/link";
import type { Metadata } from "next";
import { FilterDrawer, FilterPanel } from "@/components/filter-panel";
import { LibraryToolbar } from "@/components/library-toolbar";
import { Reveal } from "@/components/reveal";
import { WorkCard } from "@/components/work-card";
import { getStats, listTags, listWorks, listYears } from "@/lib/db";
import { buildQueryString, parseLibraryQuery, type LibraryQuery } from "@/lib/filters";
import { PAGE_SIZE } from "@/site.config";
import { FourBar } from "@/components/primary-bits";

export const metadata: Metadata = {
  title: "清单",
  description: "按类型、年份、评分和标签筛选全部作品。",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LibraryPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const query = parseLibraryQuery(raw);
  const stats = getStats();
  const years = listYears();
  const tags = listTags();

  const { items, total } = listWorks({
    types: query.types.length ? query.types : undefined,
    years: query.years.length ? query.years : undefined,
    decades: query.decades.length ? query.decades : undefined,
    tags: query.tags.length ? query.tags : undefined,
    statuses: query.statuses.length ? query.statuses : undefined,
    minRating: query.minRating ?? undefined,
    unrated: query.unrated || undefined,
    reviewed: query.reviewed || undefined,
    sort: query.sort,
    limit: PAGE_SIZE,
    offset: (query.page - 1) * PAGE_SIZE,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefFor(patch: Partial<LibraryQuery>) {
    const qs = buildQueryString({ ...query, ...patch });
    return qs ? `/library?${qs}` : "/library";
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
      <header className="flex flex-col gap-6 pb-10 pt-12 sm:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="meta mb-4 flex items-center gap-3">
              <FourBar className="h-1 w-8 shrink-0" />
              Everything
            </p>
            <h1 className="font-serif text-[54px] font-medium leading-none tracking-[-0.01em] text-ink sm:text-[84px]">
              清单
              <span className="ml-4 align-baseline font-display text-[16px] not-italic tracking-[0.08em] text-ink-faint">
                INDEX
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <FilterDrawer counts={stats.byType} years={years} tags={tags} query={query} />
            <p className="meta hidden text-right lg:block">
              {stats.total} entries
              <br />
              three kinds
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-x-8">
        <aside className="hidden lg:col-span-2 lg:block xl:col-span-2">
          <div className="sticky top-24 pb-16">
            <FilterPanel counts={stats.byType} years={years} tags={tags} query={query} />
          </div>
        </aside>

        <div className="col-span-12 lg:col-span-10">
          <LibraryToolbar query={query} total={total} />

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-[32px] font-semibold uppercase tracking-[-0.02em] text-ink-faint">Nothing here</p>
              <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-ink-soft">
                当前条件下没有作品。放宽年份或评分试试，或者清掉筛选看全部。
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/library" className="btn btn-ghost">
                  查看全部
                </Link>
                <Link href="/library?sort=random" className="btn">
                  摇一摇
                </Link>
              </div>
            </div>
          ) : query.view === "list" ? (
            <div className="mt-2">
              {items.map((work) => (
                <WorkCard key={work.id} work={work} variant="list" />
              ))}
            </div>
          ) : (
            <div className="mt-10 columns-1 gap-x-5 sm:columns-2 md:columns-3 xl:columns-4 [&>*]:mb-9 [&>*]:break-inside-avoid">
              {items.map((work, index) => (
                <Reveal key={work.id} delay={(index % 6) * 45}>
                  <WorkCard work={work} eager={index < 4} />
                </Reveal>
              ))}
            </div>
          )}

          {pages > 1 ? (
            <nav className="mt-16 flex items-center justify-between border-t border-line pt-6">
              {query.page > 1 ? (
                <Link href={hrefFor({ page: query.page - 1 })} className="meta underlink text-ink">
                  ← 上一页
                </Link>
              ) : (
                <span className="meta opacity-70">← 上一页</span>
              )}
              <span className="num text-[15px] text-ink-soft">
                {String(query.page).padStart(2, "0")} / {String(pages).padStart(2, "0")}
              </span>
              {query.page < pages ? (
                <Link href={hrefFor({ page: query.page + 1 })} className="meta underlink text-ink">
                  下一页 →
                </Link>
              ) : (
                <span className="meta opacity-70">下一页 →</span>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
