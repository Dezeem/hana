import Link from "next/link";
import type { Metadata } from "next";

import { FourBar } from "@/components/primary-bits";
import { TimelineFeed } from "@/components/timeline-feed";
import { getTimelineBounds, getTimelinePage } from "@/lib/db";
import { cn, workFactsLine } from "@/lib/utils";

export const metadata: Metadata = {
  title: "按年",
  description: "把作品按年份排开，看看这些年都看了什么。",
};

/**
 * `span` counts year groups including the newest one. 「最近一年」covers a
 * rolling twelve months, which can straddle two calendar years — hence 2.
 */
const RANGES = [
  { key: "1y", label: "最近一年", span: 2 },
  { key: "3y", label: "近三年", span: 3 },
  { key: "5y", label: "近五年", span: 5 },
  { key: "10y", label: "近十年", span: 10 },
  { key: "all", label: "全部年份", span: null },
] as const;

type Range = (typeof RANGES)[number];

const DEFAULT_RANGE = RANGES[0].key;

type PageProps = {
  searchParams: Promise<{ range?: string | string[] }>;
};

function rangeHref(range: Range): string {
  return range.key === DEFAULT_RANGE ? "/timeline" : `/timeline?range=${range.key}`;
}

export default async function TimelinePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = typeof params.range === "string" ? params.range : "";
  const active = RANGES.find((range) => range.key === requested) ?? RANGES[0];

  const bounds = getTimelineBounds();
  const anchor = bounds.to ?? new Date().getFullYear();
  const since = active.span === null ? null : anchor - (active.span - 1);

  // First page is server-rendered; the rest arrives as the reader scrolls.
  const { groups, nextCursor, rangeTotal } = getTimelinePage({ since, limit: 3 });

  const initialGroups = groups.map((group) => ({
    year: group.year,
    works: group.works.map((work) => ({
      id: work.id,
      type: work.type,
      title: work.title,
      creator: work.creator,
      year: work.year,
      cover: work.cover,
      summary: work.summary,
      facts: workFactsLine(work),
    })),
  }));

  const rangeFrom = since === null ? bounds.from : Math.max(since, bounds.from ?? since);
  const rangeLabel =
    rangeFrom && bounds.to
      ? rangeFrom === bounds.to
        ? `${bounds.to}`
        : `${rangeFrom} – ${bounds.to}`
      : "—";

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
      <header className="pb-10 pt-12 sm:pt-16">
        <p className="meta mb-4 flex items-center gap-3">
          <FourBar className="h-1 w-8 shrink-0" />
          Chronology
        </p>
        <h1 className="font-display text-[54px] leading-none tracking-[-0.04em] text-ink sm:text-[84px]">
          按年
          <span className="ml-4 align-baseline text-[16px] not-italic tracking-[0.08em] text-ink-faint">
            BY YEAR
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-[16px] leading-[1.9] text-ink-soft">
          按作品本身的年份排开，而不是我遇见它的时间。先看最近一年，往下滚，更早的年份会自己接上来。
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-line py-3">
          <nav className="flex flex-wrap items-center gap-2" aria-label="年份范围">
            {RANGES.map((range) => {
              const isActive = range.key === active.key;
              return (
                <Link
                  key={range.key}
                  href={rangeHref(range)}
                  scroll={false}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                    isActive
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-ink-soft hover:border-ink hover:text-ink",
                  )}
                >
                  {range.label}
                </Link>
              );
            })}
          </nav>

          <p className="flex items-baseline gap-2 text-[13px] text-ink-soft">
            <span className="num">{rangeLabel}</span>
            <span className="opacity-40">·</span>
            <span className="num">{rangeTotal} 件</span>
            {active.span !== null ? (
              <>
                <span className="opacity-40">·</span>
                <Link
                  href={rangeHref(RANGES[RANGES.length - 1])}
                  className="underline decoration-2 underline-offset-4 transition-colors hover:text-ink"
                >
                  全部 {bounds.total}
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </header>

      <div className="relative border-t border-line pt-10">
        <span className="absolute left-[3px] top-10 hidden h-[calc(100%-2.5rem)] w-px bg-line md:left-1/2 md:block" />

        {rangeTotal ? (
          <TimelineFeed
            key={active.key}
            initialGroups={initialGroups}
            initialCursor={nextCursor}
            since={since}
          />
        ) : (
          <p className="py-24 text-center text-[15px] text-ink-soft">
            {bounds.total
              ? "这个范围里还没有作品，换个范围看看。"
              : "还没有任何作品，先去后台录入一件吧。"}
          </p>
        )}
      </div>
    </div>
  );
}
