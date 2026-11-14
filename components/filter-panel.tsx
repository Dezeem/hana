"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { STATUS_META, WORK_TYPES, type WorkStatus, type WorkType } from "@/site.config";
import type { TagCount } from "@/lib/db/queries";
import {
  buildQueryString,
  decadesFrom,
  parseLibraryQuery,
  toggleIn,
  type LibraryQuery,
} from "@/lib/filters";
import { cn } from "@/lib/utils";

type PanelProps = {
  counts: Record<WorkType, number>;
  years: number[];
  tags: TagCount[];
  query: LibraryQuery;
};

function useApply() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (next: Partial<LibraryQuery>) => {
    const current = parseLibraryQuery(Object.fromEntries(searchParams.entries()));
    const merged: LibraryQuery = { ...current, ...next, page: 1 };
    const qs = buildQueryString(merged);
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="meta mb-3 border-b border-line pb-2 text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-2 py-0.5 text-[12px] transition-colors",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function FilterPanel({ counts, years, tags, query }: PanelProps) {
  const apply = useApply();
  const [allYears, setAllYears] = useState(false);
  const visibleYears = allYears ? years : years.slice(0, 8);
  const decades = decadesFrom(years);

  return (
    <div className="space-y-8">
      <Section title="类型 · Type">
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => apply({ types: [] })}
              className={cn(
                "flex w-full items-center justify-between py-1 text-left text-[16px] transition-colors",
                query.types.length === 0 ? "text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              <span>全部</span>
              <span className="num text-[12px]">
                {Object.values(counts).reduce((sum, value) => sum + value, 0)}
              </span>
            </button>
          </li>
          {WORK_TYPES.map((type) => {
            const active = query.types.includes(type.key);
            return (
              <li key={type.key}>
                <button
                  type="button"
                  onClick={() => apply({ types: toggleIn(query.types, type.key) })}
                  className={cn(
                    "flex w-full items-center justify-between py-1 text-left text-[16px] transition-colors",
                    active ? "text-ink" : "text-ink-soft hover:text-ink",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 border transition-colors"
                      style={{
                        borderColor: type.color,
                        backgroundColor: active ? type.color : "transparent",
                      }}
                    />
                    {type.zh}
                  </span>
                  <span className="num text-[12px]">{counts[type.key] ?? 0}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      {decades.length ? (
        <Section title="年代 · Decade">
          <div className="flex flex-wrap gap-1.5">
            {decades.map((decade) => (
              <Chip
                key={decade}
                active={query.decades.includes(decade)}
                onClick={() => apply({ decades: toggleIn(query.decades, decade) })}
              >
                {decade}s
              </Chip>
            ))}
          </div>
        </Section>
      ) : null}

      {years.length ? (
        <Section title="年份 · Year">
          <div className="flex flex-wrap gap-1.5">
            {visibleYears.map((year) => (
              <Chip
                key={year}
                active={query.years.includes(year)}
                onClick={() => apply({ years: toggleIn(query.years, year) })}
              >
                <span className="num">{year}</span>
              </Chip>
            ))}
          </div>
          {years.length > 8 ? (
            <button
              type="button"
              onClick={() => setAllYears((prev) => !prev)}
              className="meta mt-2 underlink text-ink-soft hover:text-ink"
            >
              {allYears ? "收起" : `展开全部 ${years.length}`}
            </button>
          ) : null}
        </Section>
      ) : null}

      <Section title="评分 · Rating">
        <div className="flex flex-wrap gap-1.5">
          {[5, 4, 3, 2, 1].map((value) => {
            const active = query.minRating === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => apply({ minRating: active ? null : value })}
                className={cn(
                  "num border px-2 py-0.5 text-[12px] transition-colors",
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
                )}
              >
                {value.toFixed(1)}+
              </button>
            );
          })}
          <Chip
            active={query.unrated}
            onClick={() => apply({ unrated: !query.unrated, minRating: null })}
          >
            未评分
          </Chip>
        </div>
      </Section>

      <Section title="状态 · Status">
        <ul className="space-y-1">
          {(Object.keys(STATUS_META) as WorkStatus[]).map((status) => {
            const active = query.statuses.includes(status);
            return (
              <li key={status}>
                <button
                  type="button"
                  onClick={() => apply({ statuses: toggleIn(query.statuses, status) })}
                  className={cn(
                    "flex w-full items-center justify-between py-1 text-left text-[16px] transition-colors",
                    active ? "text-ink" : "text-ink-soft hover:text-ink",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn("inline-block h-2 w-2", active ? "bg-ink" : "bg-line-strong")}
                    />
                    {STATUS_META[status].zh}
                  </span>
                  <span className="meta">{STATUS_META[status].en}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="内容 · Note">
        <Chip active={query.reviewed} onClick={() => apply({ reviewed: !query.reviewed })}>
          只看写过短评的
        </Chip>
      </Section>

      {tags.length ? (
        <Section title="标签 · Tags">
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 24).map((item) => (
              <Chip
                key={item.tag}
                active={query.tags.includes(item.tag)}
                onClick={() => apply({ tags: toggleIn(query.tags, item.tag) })}
              >
                {item.tag}
                <span className="ml-1 opacity-50">{item.count}</span>
              </Chip>
            ))}
          </div>
        </Section>
      ) : null}

      <button
        type="button"
        onClick={() =>
          apply({
            types: [],
            years: [],
            decades: [],
            tags: [],
            statuses: [],
            minRating: null,
            unrated: false,
            reviewed: false,
            sort: "recent",
          })
        }
        className="meta underlink text-ink-soft hover:text-ink"
      >
        清除全部筛选
      </button>
    </div>
  );
}

/** Mobile: the same panel inside a bottom sheet. */
export function FilterDrawer(props: PanelProps) {
  const [open, setOpen] = useState(false);
  const activeCount =
    props.query.types.length +
    props.query.years.length +
    props.query.decades.length +
    props.query.tags.length +
    props.query.statuses.length +
    (props.query.minRating ? 1 : 0) +
    (props.query.unrated ? 1 : 0) +
    (props.query.reviewed ? 1 : 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-line px-3 py-1.5 text-[15px] text-ink-soft lg:hidden"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.4} />
        筛选
        {activeCount ? <span className="num text-ink">{activeCount}</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[95] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            aria-label="关闭筛选"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto border-t border-line bg-paper px-5 pb-10 pt-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="meta text-ink">筛选藏品</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="text-ink-soft hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={1.4} />
              </button>
            </div>
            <FilterPanel {...props} />
            <button type="button" onClick={() => setOpen(false)} className="btn mt-8 w-full">
              查看结果
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
