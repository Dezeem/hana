import { WORK_TYPES, type WorkStatus, type WorkType } from "@/site.config";
import type { SortKey } from "@/lib/db/queries";

export type LibraryView = "grid" | "list";

export type LibraryQuery = {
  types: WorkType[];
  years: number[];
  decades: number[];
  tags: string[];
  /** Multi-select: an archive usually wants "want to watch + in progress". */
  statuses: WorkStatus[];
  minRating: number | null;
  /** Only entries without a rating. */
  unrated: boolean;
  /** Only entries with a written note. */
  reviewed: boolean;
  sort: SortKey;
  view: LibraryView;
  page: number;
  q: string;
};

export type RawParams = Record<string, string | string[] | undefined>;

const VALID_TYPES = new Set(WORK_TYPES.map((item) => item.key));
const VALID_STATUS = new Set<WorkStatus>(["done", "doing", "wish"]);
const VALID_SORT = new Set<SortKey>(["recent", "rating", "year", "title", "random"]);

function list(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function flag(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
}

export function parseLibraryQuery(params: RawParams): LibraryQuery {
  const types = list(params.type).filter((item): item is WorkType =>
    VALID_TYPES.has(item as WorkType),
  );
  const years = list(params.year)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 1800);
  const decades = list(params.decade)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item >= 1900 && item % 10 === 0);
  const tags = list(params.tag).slice(0, 6);

  const statuses = list(params.status).filter((item): item is WorkStatus =>
    VALID_STATUS.has(item as WorkStatus),
  );

  const ratingRaw = Number(typeof params.rating === "string" ? params.rating : "");
  const minRating = Number.isFinite(ratingRaw) && ratingRaw > 0 ? Math.min(ratingRaw, 5) : null;

  // 收藏日 is the real chronology; 编号 is only insertion order.
  const sortRaw = typeof params.sort === "string" ? params.sort : "collected";
  const sort: SortKey = VALID_SORT.has(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : "collected";

  const view: LibraryView = params.view === "list" ? "list" : "grid";
  const pageRaw = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  return {
    types,
    years,
    decades,
    tags,
    statuses,
    minRating,
    unrated: flag(params.unrated),
    reviewed: flag(params.review),
    sort,
    view,
    page,
    q: "",
  };
}

/** Rebuilds the query string, dropping empty values so URLs stay readable. */
export function buildQueryString(query: Partial<LibraryQuery>, base?: URLSearchParams): string {
  const params = new URLSearchParams(base);

  const setOrDelete = (key: string, value: string) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };

  if ("types" in query) setOrDelete("type", (query.types ?? []).join(","));
  if ("years" in query) setOrDelete("year", (query.years ?? []).join(","));
  if ("decades" in query) setOrDelete("decade", (query.decades ?? []).join(","));
  if ("tags" in query) setOrDelete("tag", (query.tags ?? []).join(","));
  if ("statuses" in query) setOrDelete("status", (query.statuses ?? []).join(","));
  if ("minRating" in query) setOrDelete("rating", query.minRating ? String(query.minRating) : "");
  if ("unrated" in query) setOrDelete("unrated", query.unrated ? "1" : "");
  if ("reviewed" in query) setOrDelete("review", query.reviewed ? "1" : "");
  if ("sort" in query)
    setOrDelete("sort", query.sort && query.sort !== "collected" ? query.sort : "");
  if ("view" in query) setOrDelete("view", query.view === "list" ? "list" : "");
  if ("page" in query) setOrDelete("page", query.page && query.page > 1 ? String(query.page) : "");
  if ("q" in query) setOrDelete("q", query.q ?? "");

  return params.toString();
}

export function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** The decade buckets that actually occur in a given year list. */
export function decadesFrom(years: number[]): number[] {
  const set = new Set<number>();
  for (const year of years) set.add(Math.floor(year / 10) * 10);
  return [...set].sort((a, b) => b - a);
}
