import { all, one } from "./client";
import { parseTags, rowToWork, type Work, type WorkRow } from "./types";
import type { WorkStatus, WorkType } from "@/site.config";

export type SortKey = "recent" | "collected" | "rating" | "year" | "title" | "random";

export type WorkFilter = {
  types?: WorkType[];
  years?: number[];
  /** Decade starts, e.g. `[2020, 1990]` → 2020–2029 or 1990–1999. */
  decades?: number[];
  tags?: string[];
  status?: WorkStatus;
  statuses?: WorkStatus[];
  minRating?: number;
  /** Only works with no rating — often the biggest bucket in a real archive. */
  unrated?: boolean;
  /** Only works that carry a written note. */
  reviewed?: boolean;
  q?: string;
  sort?: SortKey;
  /** keyset cursor — only used by the `recent` ordering */
  cursor?: number;
  limit?: number;
  offset?: number;
  featuredOnly?: boolean;
};

export type ListResult = {
  items: Work[];
  total: number;
  nextCursor: number | null;
};

const LIST_COLUMNS = `id, type, title, original_title, creator, year, cover, cover_remote,
  cover_ratio, substr(summary, 1, 110) AS summary, '' AS review, rating, status, tags,
  douban_id, douban_url, douban_rating, meta, featured, finished_on, created_at, updated_at`;

function buildWhere(filter: WorkFilter, withCursor: boolean) {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filter.types?.length) {
    clauses.push(`type IN (${filter.types.map(() => "?").join(",")})`);
    params.push(...filter.types);
  }
  if (filter.years?.length) {
    clauses.push(`year IN (${filter.years.map(() => "?").join(",")})`);
    params.push(...filter.years);
  }
  if (filter.tags?.length) {
    for (const tag of filter.tags) {
      clauses.push("tags LIKE ?");
      params.push(`%,${tag},%`);
    }
  }
  if (filter.statuses?.length) {
    clauses.push(`status IN (${filter.statuses.map(() => "?").join(",")})`);
    params.push(...filter.statuses);
  } else if (filter.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }
  if (filter.decades?.length) {
    clauses.push(`(${filter.decades.map(() => "(year BETWEEN ? AND ?)").join(" OR ")})`);
    for (const decade of filter.decades) params.push(decade, decade + 9);
  }
  if (typeof filter.minRating === "number" && filter.minRating > 0) {
    clauses.push("rating >= ?");
    params.push(filter.minRating);
  }
  if (filter.unrated) clauses.push("rating IS NULL");
  if (filter.reviewed) clauses.push("review <> ''");
  if (filter.featuredOnly) {
    clauses.push("featured = 1");
  }
  if (filter.q) {
    const like = `%${filter.q}%`;
    clauses.push(
      "(title LIKE ? OR original_title LIKE ? OR creator LIKE ? OR tags LIKE ? OR review LIKE ?)",
    );
    params.push(like, like, like, like, like);
  }
  if (withCursor && typeof filter.cursor === "number") {
    clauses.push("id < ?");
    params.push(filter.cursor);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function orderBy(sort: SortKey | undefined) {
  switch (sort) {
    case "collected":
      // The编号 is insertion order, not a date. Real chronology lives in finished_on.
      return "ORDER BY finished_on IS NULL, finished_on DESC, id DESC";
    case "rating":
      return "ORDER BY rating IS NULL, rating DESC, id DESC";
    case "year":
      return "ORDER BY year IS NULL, year DESC, id DESC";
    case "title":
      return "ORDER BY title COLLATE NOCASE ASC";
    case "random":
      return "ORDER BY RANDOM()";
    default:
      return "ORDER BY id DESC";
  }
}

export function listWorks(filter: WorkFilter = {}): ListResult {
  const limit = Math.min(Math.max(filter.limit ?? 24, 1), 96);
  const sort = filter.sort ?? "recent";
  const keyset = sort === "recent" && typeof filter.offset !== "number";
  const { sql: where, params } = buildWhere(filter, keyset);

  const rows = all<WorkRow>(
    `SELECT ${LIST_COLUMNS} FROM works ${where} ${orderBy(sort)} LIMIT ${limit + 1}`,
    [...params],
  );

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map(rowToWork);

  const countWhere = buildWhere(filter, false);
  const countRow = one<{ c: number }>(
    `SELECT COUNT(*) AS c FROM works ${countWhere.sql}`,
    countWhere.params,
  );

  return {
    items,
    total: countRow?.c ?? items.length,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export function getWork(id: number): Work | null {
  const row = one<WorkRow>("SELECT * FROM works WHERE id = ?", [id]);
  return row ? rowToWork(row) : null;
}

export function getRelated(work: Work, limit = 8): Work[] {
  if (!work.tags.length) {
    const rows = all<WorkRow>(
      `SELECT ${LIST_COLUMNS} FROM works WHERE type = ? AND id != ? ORDER BY id DESC LIMIT ?`,
      [work.type, work.id, limit],
    );
    return rows.map(rowToWork);
  }
  const rows = all<WorkRow>(
    `SELECT ${LIST_COLUMNS} FROM works
     WHERE id != ? AND (${work.tags.map(() => "tags LIKE ?").join(" OR ")})
     ORDER BY (${work.tags.map(() => "tags LIKE ?").join(" + ")}) DESC, id DESC
     LIMIT ?`,
    [work.id, ...work.tags.map((t) => `%,${t},%`), ...work.tags.map((t) => `%,${t},%`), limit],
  );
  return rows.map(rowToWork);
}

/**
 * One random specimen, optionally limited to a status. `ORDER BY RANDOM()` is
 * fine at this scale (hundreds of rows) and keeps the draw page stateless.
 */
export function getRandomWork(status?: WorkStatus): Work | null {
  const row = status
    ? one<WorkRow>("SELECT * FROM works WHERE status = ? ORDER BY RANDOM() LIMIT 1", [status])
    : one<WorkRow>("SELECT * FROM works ORDER BY RANDOM() LIMIT 1");
  return row ? rowToWork(row) : null;
}

/**
 * The same specimen all day, a different one tomorrow — a deterministic offset
 * keyed on the UTC date, so the home page is stable within a day but not frozen.
 */
export function getDailyPick(date = new Date()): Work | null {
  const total = one<{ c: number }>("SELECT COUNT(*) AS c FROM works")?.c ?? 0;
  if (!total) return null;

  const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  let hash = 7;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) % 100003;

  const row = one<WorkRow>("SELECT * FROM works ORDER BY id LIMIT 1 OFFSET ?", [hash % total]);
  return row ? rowToWork(row) : null;
}

export function getNeighbours(id: number) {
  const prev = one<{ id: number; title: string }>(
    "SELECT id, title FROM works WHERE id < ? ORDER BY id DESC LIMIT 1",
    [id],
  );
  const next = one<{ id: number; title: string }>(
    "SELECT id, title FROM works WHERE id > ? ORDER BY id ASC LIMIT 1",
    [id],
  );
  return { prev, next };
}

export type TagCount = { tag: string; count: number };

export function listTags(): TagCount[] {
  const rows = all<{ tags: string }>("SELECT tags FROM works WHERE tags != ''");
  const counter = new Map<string, number>();
  for (const row of rows) {
    for (const tag of parseTags(row.tags)) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
  }
  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

export function listYears(): number[] {
  const rows = all<{ year: number }>(
    "SELECT DISTINCT year FROM works WHERE year IS NOT NULL AND year > 1800 ORDER BY year DESC",
  );
  return rows.map((row) => row.year);
}

export type Stats = {
  total: number;
  byType: Record<WorkType, number>;
  byStatus: Record<WorkStatus, number>;
  averageRating: number | null;
  ratingBuckets: { label: string; count: number }[];
  topTags: TagCount[];
  years: { year: number; count: number }[];
  /** Oldest and newest work year, ignoring unset years. */
  yearRange: { from: number | null; to: number | null };
};

export function getStats(): Stats {
  const byTypeRows = all<{ type: WorkType; c: number }>(
    "SELECT type, COUNT(*) AS c FROM works GROUP BY type",
  );
  const byStatusRows = all<{ status: WorkStatus; c: number }>(
    "SELECT status, COUNT(*) AS c FROM works GROUP BY status",
  );
  const avg = one<{ a: number | null }>("SELECT AVG(rating) AS a FROM works WHERE rating IS NOT NULL");
  const yearRows = all<{ year: number; c: number }>(
    "SELECT year, COUNT(*) AS c FROM works WHERE year IS NOT NULL GROUP BY year ORDER BY year DESC",
  );
  const bucketRows = all<{ b: number; c: number }>(
    "SELECT CAST(rating AS INT) AS b, COUNT(*) AS c FROM works WHERE rating IS NOT NULL GROUP BY b ORDER BY b",
  );

  const byType: Record<WorkType, number> = { movie: 0, book: 0, music: 0 };
  for (const row of byTypeRows) {
    if (row.type in byType) byType[row.type] = row.c;
  }
  const byStatus: Record<WorkStatus, number> = { done: 0, doing: 0, wish: 0 };
  for (const row of byStatusRows) {
    if (row.status in byStatus) byStatus[row.status] = row.c;
  }

  const bucketMap = new Map(bucketRows.map((row) => [row.b, row.c]));
  const ratingBuckets = [1, 2, 3, 4, 5].map((value) => ({
    label: String(value),
    count: bucketMap.get(value) ?? 0,
  }));

  const totalRow = one<{ c: number }>("SELECT COUNT(*) AS c FROM works");
  const rangeRow = one<{ lo: number | null; hi: number | null }>(
    "SELECT MIN(year) AS lo, MAX(year) AS hi FROM works WHERE year IS NOT NULL",
  );

  return {
    total: totalRow?.c ?? 0,
    byType,
    byStatus,
    averageRating: avg?.a ?? null,
    ratingBuckets,
    topTags: listTags().slice(0, 12),
    years: yearRows.slice(0, 12).map((row) => ({ year: row.year, count: row.c })),
    yearRange: { from: rangeRow?.lo ?? null, to: rangeRow?.hi ?? null },
  };
}

/** Timeline: every year that has works, with the works inside it. */
/**
 * The timeline renders every work at once, so only the fields that actually
 * reach the page are selected. Anything not listed here becomes an empty
 * default — the whole archive would otherwise serialise ~2 MB of RSC payload
 * made of DOI links, tags and long URLs the page never reads.
 */
const TIMELINE_COLUMNS = `id, type, title, creator, year, cover, cover_remote, cover_ratio,
  substr(summary, 1, 90) AS summary, '' AS review,
  '' AS original_title, NULL AS rating, 'done' AS status, '' AS tags,
  '' AS douban_id, '' AS douban_url, NULL AS douban_rating,
  '{}' AS meta, 0 AS featured, NULL AS finished_on,
  '' AS created_at, '' AS updated_at`;

export function getTimeline(): { year: number; works: Work[] }[] {
  const rows = all<WorkRow>(
    `SELECT ${TIMELINE_COLUMNS} FROM works ORDER BY COALESCE(year, 0) DESC, id DESC`,
  );
  const groups = new Map<number, Work[]>();
  for (const row of rows) {
    const year = row.year ?? 0;
    const list = groups.get(year) ?? [];
    list.push(rowToWork(row));
    groups.set(year, list);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, works]) => ({ year, works }));
}
