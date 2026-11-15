"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dices, LayoutGrid, List, X } from "lucide-react";
import { STATUS_META, TYPE_MAP } from "@/site.config";
import { buildQueryString, parseLibraryQuery, type LibraryQuery } from "@/lib/filters";
import { cn } from "@/lib/utils";

type Props = {
  query: LibraryQuery;
  total: number;
};

const SORTS: { value: LibraryQuery["sort"]; label: string }[] = [
  { value: "collected", label: "我的收藏日" },
  { value: "recent", label: "编号倒序" },
  { value: "rating", label: "我的评分" },
  { value: "year", label: "作品年份" },
  { value: "title", label: "标题笔画" },
  { value: "random", label: "随机洗牌" },
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
    ...query.decades.map((decade) => ({
      key: `decade-${decade}`,
      label: `${decade}s`,
      remove: () => apply({ decades: query.decades.filter((item) => item !== decade) }),
    })),
    ...query.statuses.map((status) => ({
      key: `status-${status}`,
      label: STATUS_META[status].zh,
      remove: () => apply({ statuses: query.statuses.filter((item) => item !== status) }),
    })),
    ...(query.minRating
      ? [
          {
            key: "rating",
            label: `${query.minRating.toFixed(1)}+`,
            remove: () => apply({ minRating: null }),
          },
        ]
      : []),
    ...(query.unrated
      ? [{ key: "unrated", label: "未评分", remove: () => apply({ unrated: false }) }]
      : []),
    ...(query.reviewed
      ? [{ key: "reviewed", label: "写过短评", remove: () => apply({ reviewed: false }) }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-line pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[16px] text-ink-soft">
          <span className="num mr-1.5 font-display text-[26px] italic text-ink">{total}</span>
          件作品
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => apply({ sort: "random" })}
            title="随机洗牌"
            className={cn(
              "flex h-[34px] items-center gap-1.5 border border-line px-2.5 text-[13px] uppercase tracking-[0.06em] transition-colors",
              query.sort === "random"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-mist hover:text-ink",
            )}
          >
            <Dices className="h-3.5 w-3.5" strokeWidth={1.6} />
            摇一摇
          </button>

          <label className="flex items-center gap-2">
            <span className="meta hidden sm:inline">排序</span>
            <select
              value={query.sort}
              onChange={(event) => apply({ sort: event.target.value as LibraryQuery["sort"] })}
              className="cursor-pointer border border-line bg-transparent px-2 py-1 text-[15px] text-ink outline-none focus:border-ink"
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
              className="inline-flex items-center gap-1.5 border border-line px-2 py-0.5 text-[12px] text-ink-soft"
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
