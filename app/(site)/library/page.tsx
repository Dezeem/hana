import Link from "next/link";
import type { Metadata } from "next";
import { FilterDrawer, FilterPanel } from "@/components/filter-panel";
import { LibraryToolbar } from "@/components/library-toolbar";
import { Reveal } from "@/components/reveal";
import { WorkCard } from "@/components/work-card";
import { getStats, listTags, listWorks, listYears } from "@/lib/db";
import { buildQueryString, parseLibraryQuery, type LibraryQuery } from "@/lib/filters";
import { PAGE_SIZE } from "@/site.config";

export const metadata: Metadata = {
  title: "藏品库",
  description: "按类型、年份、评分与标签检索全部收藏。",
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
    tags: query.tags.length ? query.tags : undefined,
    status: query.status ?? undefined,
    minRating: query.minRating ?? undefined,
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
              <span className="inline-block h-px w-8 bg-line-strong" />
              The collection
            </p>
            <h1 className="font-display text-[46px] leading-none tracking-[-0.035em] text-ink sm:text-[68px]">
              藏品库
              <span className="ml-4 align-baseline text-[14px] not-italic tracking-[0.2em] text-ink-faint">
                LIBRARY
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <FilterDrawer counts={stats.byType} years={years} tags={tags} query={query} />
            <p className="meta hidden text-right lg:block">
              {stats.total} specimens
              <br />
              four collections
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
              <p className="font-display text-2xl italic text-ink-faint">No specimens</p>
              <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-soft">
                当前条件下没有藏品。试试放宽年份或评分，或者清除筛选看看全部。
              </p>
              <Link href="/library" className="btn btn-ghost mt-8">
                查看全部
              </Link>
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
            <nav className="mt-16 flex items-center justify-between border-t-2 border-line pt-6">
              {query.page > 1 ? (
                <Link href={hrefFor({ page: query.page - 1 })} className="meta underlink text-ink">
                  ← 上一页
                </Link>
              ) : (
                <span className="meta opacity-40">← 上一页</span>
              )}
              <span className="num text-[13px] text-ink-soft">
                {String(query.page).padStart(2, "0")} / {String(pages).padStart(2, "0")}
              </span>
              {query.page < pages ? (
                <Link href={hrefFor({ page: query.page + 1 })} className="meta underlink text-ink">
                  下一页 →
                </Link>
              ) : (
                <span className="meta opacity-40">下一页 →</span>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
