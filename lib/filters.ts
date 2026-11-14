import { WORK_TYPES, type WorkStatus, type WorkType } from "@/site.config";
import type { SortKey } from "@/lib/db/queries";

export type LibraryView = "grid" | "list";

export type LibraryQuery = {
  types: WorkType[];
  years: number[];
  tags: string[];
  status: WorkStatus | null;
  minRating: number | null;
  sort: SortKey;
  view: LibraryView;
  page: number;
  q: string;
};

export type RawParams = Record<string, string | string[] | undefined>;

const VALID_TYPES = new Set(WORK_TYPES.map((item) => item.key));
const VALID_STATUS = new Set<WorkStatus>(["done", "doing", "wish"]);
const VALID_SORT = new Set<SortKey>(["recent", "rating", "year", "title"]);

function list(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseLibraryQuery(params: RawParams): LibraryQuery {
  const types = list(params.type).filter((item): item is WorkType =>
    VALID_TYPES.has(item as WorkType),
  );
  const years = list(params.year)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 1800);
  const tags = list(params.tag).slice(0, 6);

  const statusRaw = typeof params.status === "string" ? params.status : "";
  const status = VALID_STATUS.has(statusRaw as WorkStatus) ? (statusRaw as WorkStatus) : null;

  const ratingRaw = Number(typeof params.rating === "string" ? params.rating : "");
  const minRating = Number.isFinite(ratingRaw) && ratingRaw > 0 ? Math.min(ratingRaw, 5) : null;

  const sortRaw = typeof params.sort === "string" ? params.sort : "recent";
  const sort: SortKey = VALID_SORT.has(sortRaw as SortKey) ? (sortRaw as SortKey) : "recent";

  const view: LibraryView = params.view === "list" ? "list" : "grid";
  const pageRaw = Number(typeof params.page === "string" ? params.page : "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  return { types, years, tags, status, minRating, sort, view, page, q: "" };
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
  if ("tags" in query) setOrDelete("tag", (query.tags ?? []).join(","));
  if ("status" in query) setOrDelete("status", query.status ?? "");
  if ("minRating" in query) setOrDelete("rating", query.minRating ? String(query.minRating) : "");
  if ("sort" in query) setOrDelete("sort", query.sort && query.sort !== "recent" ? query.sort : "");
  if ("view" in query) setOrDelete("view", query.view === "list" ? "list" : "");
  if ("page" in query) setOrDelete("page", query.page && query.page > 1 ? String(query.page) : "");
  if ("q" in query) setOrDelete("q", query.q ?? "");

  return params.toString();
}

export function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
