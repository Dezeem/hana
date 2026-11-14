import { all, one } from "./client";
import { parseTags, rowToWork, type Work, type WorkRow } from "./types";
import type { WorkStatus, WorkType } from "@/site.config";

export type SortKey = "recent" | "rating" | "year" | "title";

export type WorkFilter = {
  types?: WorkType[];
  years?: number[];
  tags?: string[];
  status?: WorkStatus;
  minRating?: number;
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
  if (filter.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }
  if (typeof filter.minRating === "number" && filter.minRating > 0) {
    clauses.push("rating >= ?");
    params.push(filter.minRating);
  }
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
    case "rating":
      return "ORDER BY rating IS NULL, rating DESC, id DESC";
    case "year":
      return "ORDER BY year IS NULL, year DESC, id DESC";
    case "title":
      return "ORDER BY title COLLATE NOCASE ASC";
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

  const byType: Record<WorkType, number> = { movie: 0, series: 0, book: 0, music: 0 };
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

  return {
    total: totalRow?.c ?? 0,
    byType,
    byStatus,
    averageRating: avg?.a ?? null,
    ratingBuckets,
    topTags: listTags().slice(0, 12),
    years: yearRows.slice(0, 12).map((row) => ({ year: row.year, count: row.c })),
  };
}

/** Timeline: every year that has works, with the works inside it. */
export function getTimeline(): { year: number; works: Work[] }[] {
  const rows = all<WorkRow>(
    `SELECT ${LIST_COLUMNS} FROM works ORDER BY COALESCE(year, 0) DESC, id DESC`,
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
