"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, X } from "lucide-react";
import { STATUS_META, TYPE_MAP } from "@/site.config";
import { buildQueryString, parseLibraryQuery, type LibraryQuery } from "@/lib/filters";
import { cn } from "@/lib/utils";

type Props = {
  query: LibraryQuery;
  total: number;
};

const SORTS: { value: LibraryQuery["sort"]; label: string }[] = [
  { value: "recent", label: "最新收录" },
  { value: "rating", label: "我的评分" },
  { value: "year", label: "作品年份" },
  { value: "title", label: "标题笔画" },
];

export function LibraryToolbar({ query, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(next: Partial<LibraryQuery>) {
    const current = parseLibraryQuery(Object.fromEntries(searchParams.entries()));
    const merged: LibraryQuery = { ...current, ...next };
    if (!("page" in next)) merged.page = 1;
    const qs = buildQueryString(merged);
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const chips: { key: string; label: string; color?: string; remove: () => void }[] = [
    ...query.types.map((type) => ({
      key: `type-${type}`,
      label: TYPE_MAP[type]?.zh ?? type,
      color: TYPE_MAP[type]?.color,
      remove: () => apply({ types: query.types.filter((item) => item !== type) }),
    })),
    ...query.years.map((year) => ({
      key: `year-${year}`,
      label: String(year),
      remove: () => apply({ years: query.years.filter((item) => item !== year) }),
    })),
    ...query.tags.map((tag) => ({
      key: `tag-${tag}`,
      label: `#${tag}`,
      remove: () => apply({ tags: query.tags.filter((item) => item !== tag) }),
    })),
    ...(query.status
      ? [
          {
            key: `status-${query.status}`,
            label: STATUS_META[query.status].zh,
            remove: () => apply({ status: null }),
          },
        ]
      : []),
    ...(query.minRating
      ? [
          {
            key: "rating",
            label: `${query.minRating.toFixed(1)}+`,
            remove: () => apply({ minRating: null }),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-line pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-[13px] text-ink-soft">
          <span className="num mr-1.5 font-display text-[26px] italic text-ink">{total}</span>
          件藏品
        </p>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="meta hidden sm:inline">排序</span>
            <select
              value={query.sort}
              onChange={(event) => apply({ sort: event.target.value as LibraryQuery["sort"] })}
              className="cursor-pointer border border-line bg-transparent px-2 py-1 font-serif text-[12px] text-ink outline-none focus:border-ink"
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value} className="bg-paper text-ink">
                  {sort.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => apply({ view: "grid" })}
              aria-label="网格视图"
              className={cn(
                "flex h-7 w-7 items-center justify-center transition-colors",
                query.view === "grid" ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={() => apply({ view: "list" })}
              aria-label="列表视图"
              className={cn(
                "flex h-7 w-7 items-center justify-center transition-colors",
                query.view === "list" ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
              )}
            >
              <List className="h-3.5 w-3.5" strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 border border-line px-2 py-0.5 text-[11px] text-ink-soft"
              style={chip.color ? { borderColor: chip.color, color: chip.color } : undefined}
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.remove}
                aria-label={`移除 ${chip.label}`}
                className="opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="h-3 w-3" strokeWidth={1.6} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
