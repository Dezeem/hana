import { one, run, transaction } from "./client";
import { normalizeTags, parseTags, type WorkMeta } from "./types";
import type { WorkStatus, WorkType } from "@/site.config";

export type WorkInput = {
  type: WorkType;
  title: string;
  originalTitle?: string;
  creator?: string;
  year?: number | null;
  cover?: string;
  coverRemote?: string;
  coverRatio?: number;
  summary?: string;
  review?: string;
  rating?: number | null;
  status?: WorkStatus;
  tags?: string[];
  doubanId?: string;
  doubanUrl?: string;
  doubanRating?: number | null;
  meta?: WorkMeta;
  featured?: boolean;
  finishedOn?: string | null;
};

function now() {
  return new Date().toISOString();
}

export function createWork(input: WorkInput): number {
  const timestamp = now();
  const result = run(
    `INSERT INTO works (
      type, title, original_title, creator, year, cover, cover_remote, cover_ratio,
      summary, review, rating, status, tags, douban_id, douban_url, douban_rating,
      meta, featured, finished_on, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      input.type,
      input.title.trim(),
      input.originalTitle?.trim() ?? "",
      input.creator?.trim() ?? "",
      input.year ?? null,
      input.cover ?? "",
      input.coverRemote ?? "",
      input.coverRatio ?? 0.72,
      input.summary ?? "",
      input.review ?? "",
      input.rating ?? null,
      input.status ?? "done",
      normalizeTags(input.tags ?? []),
      input.doubanId ?? "",
      input.doubanUrl ?? "",
      input.doubanRating ?? null,
      JSON.stringify(input.meta ?? {}),
      input.featured ? 1 : 0,
      input.finishedOn ?? null,
      timestamp,
      timestamp,
    ],
  );
  return Number(result.lastInsertRowid);
}

export function updateWork(id: number, input: WorkInput): void {
  run(
    `UPDATE works SET
      type = ?, title = ?, original_title = ?, creator = ?, year = ?, cover = ?,
      cover_remote = ?, cover_ratio = ?, summary = ?, review = ?, rating = ?, status = ?,
      tags = ?, douban_id = ?, douban_url = ?, douban_rating = ?, meta = ?, featured = ?,
      finished_on = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.type,
      input.title.trim(),
      input.originalTitle?.trim() ?? "",
      input.creator?.trim() ?? "",
      input.year ?? null,
      input.cover ?? "",
      input.coverRemote ?? "",
      input.coverRatio ?? 0.72,
      input.summary ?? "",
      input.review ?? "",
      input.rating ?? null,
      input.status ?? "done",
      normalizeTags(input.tags ?? []),
      input.doubanId ?? "",
      input.doubanUrl ?? "",
      input.doubanRating ?? null,
      JSON.stringify(input.meta ?? {}),
      input.featured ? 1 : 0,
      input.finishedOn ?? null,
      now(),
      id,
    ],
  );
}

export function deleteWork(id: number): void {
  run("DELETE FROM works WHERE id = ?", [id]);
}

export function deleteWorks(ids: number[]): void {
  if (!ids.length) return;
  transaction(() => {
    for (const id of ids) run("DELETE FROM works WHERE id = ?", [id]);
  });
}

export function setFeatured(id: number, featured: boolean): void {
  run("UPDATE works SET featured = ?, updated_at = ? WHERE id = ?", [
    featured ? 1 : 0,
    now(),
    id,
  ]);
}

/** Bulk status change and tag add/remove, applied in one transaction. */
export function bulkUpdate(
  ids: number[],
  patch: { status?: WorkStatus; addTags?: string[]; removeTags?: string[] },
): void {
  if (!ids.length) return;
  transaction(() => {
    for (const id of ids) {
      const current = one<{ tags: string }>("SELECT tags FROM works WHERE id = ?", [id]);
      if (!current) continue;
      let tags = parseTags(current.tags);
      if (patch.addTags?.length) {
        tags = [...new Set([...tags, ...patch.addTags])];
      }
      if (patch.removeTags?.length) {
        tags = tags.filter((tag) => !patch.removeTags?.includes(tag));
      }
      run("UPDATE works SET status = COALESCE(?, status), tags = ?, updated_at = ? WHERE id = ?", [
        patch.status ?? null,
        normalizeTags(tags),
        now(),
        id,
      ]);
    }
  });
}

export function countWorks(): number {
  const row = one<{ c: number }>("SELECT COUNT(*) AS c FROM works");
  return row?.c ?? 0;
}
