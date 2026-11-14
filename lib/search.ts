import { all, hasFts } from "./db/client";
import { rowToWork, type Work, type WorkRow } from "./db/types";

/**
 * Search across the archive.
 *
 * SQLite's unicode61 tokenizer treats a run of CJK characters as a single
 * token, so FTS alone misses most partial Chinese queries. Hana therefore
 * unions an FTS pass (ranked, good for Latin text and whole titles) with a
 * LIKE pass (always correct for substrings) and de-duplicates by id.
 */
export type SearchHit = {
  work: Work;
  score: number;
  matchedFields: string[];
};

const LIST_COLUMNS = `id, type, title, original_title, creator, year, cover, cover_remote,
  cover_ratio, substr(summary, 1, 110) AS summary, '' AS review, rating, status, tags,
  douban_id, douban_url, douban_rating, meta, featured, finished_on, created_at, updated_at`;

function escapeFts(query: string): string {
  return query.replace(/["*()]/g, " ").trim();
}

export function searchWorks(query: string, limit = 24): SearchHit[] {
  const q = query.trim();
  if (!q) return [];

  const hits = new Map<number, SearchHit>();
  const like = `%${q.replace(/[%_]/g, "")}%`;

  if (hasFts() && escapeFts(q)) {
    const tokens = escapeFts(q)
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => `"${token}"*`)
      .join(" AND ");

    if (tokens) {
      const rows = all<WorkRow & { rank: number }>(
        `SELECT w.*, bm25(works_fts) AS rank
         FROM works_fts
         JOIN works w ON w.id = works_fts.rowid
         WHERE works_fts MATCH ?
         ORDER BY rank
         LIMIT ?`,
        [tokens, limit * 2],
      );

      rows.forEach((row, index) => {
        hits.set(row.id, {
          work: rowToWork(row),
          score: 1000 - index,
          matchedFields: ["fulltext"],
        });
      });
    }
  }

  const likeRows = all<WorkRow>(
    `SELECT ${LIST_COLUMNS} FROM works
     WHERE title LIKE ? OR original_title LIKE ? OR creator LIKE ? OR tags LIKE ? OR review LIKE ? OR summary LIKE ?
     ORDER BY id DESC
     LIMIT ?`,
    [like, like, like, like, like, like, limit * 2],
  );

  likeRows.forEach((row, index) => {
    const existing = hits.get(row.id);
    const fields: string[] = [];
    const lower = q.toLowerCase();
    if (row.title.toLowerCase().includes(lower)) fields.push("title");
    if (row.creator.toLowerCase().includes(lower)) fields.push("creator");
    if (row.tags.toLowerCase().includes(lower)) fields.push("tags");
    if (row.review.toLowerCase().includes(lower)) fields.push("review");

    if (existing) {
      existing.score += 500 - index;
      existing.matchedFields = [...new Set([...existing.matchedFields, ...fields])];
    } else {
      hits.set(row.id, {
        work: rowToWork(row),
        score: 500 - index,
        matchedFields: fields.length ? fields : ["body"],
      });
    }
  });

  return [...hits.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
