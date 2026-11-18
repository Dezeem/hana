import type { WorkStatus, WorkType } from "@/site.config";

export type WorkMeta = {
  director?: string[];
  cast?: string[];
  runtime?: string;
  episodes?: number;
  publisher?: string;
  isbn?: string;
  pages?: string;
  artist?: string;
  albumType?: string;
  tracks?: number;
  region?: string;
  awards?: string[];
  language?: string;
  /** Lines said on screen, or passages copied out of a book. */
  quotes?: string[];
  /** Still frames — local `/media/*` paths or remote URLs. */
  stills?: string[];
  /** `label|https://…` — listen links, trailers, publisher pages. */
  links?: string[];
};

export type WorkRow = {
  id: number;
  type: string;
  title: string;
  original_title: string;
  creator: string;
  year: number | null;
  cover: string;
  cover_remote: string;
  cover_ratio: number;
  summary: string;
  review: string;
  rating: number | null;
  status: string;
  tags: string;
  douban_id: string;
  douban_url: string;
  douban_rating: number | null;
  meta: string;
  featured: number;
  finished_on: string | null;
  created_at: string;
  updated_at: string;
};

export type Work = {
  id: number;
  no: string;
  type: WorkType;
  title: string;
  originalTitle: string;
  creator: string;
  year: number | null;
  cover: string;
  coverRemote: string;
  coverRatio: number;
  summary: string;
  review: string;
  rating: number | null;
  status: WorkStatus;
  tags: string[];
  doubanId: string;
  doubanUrl: string;
  doubanRating: number | null;
  meta: WorkMeta;
  featured: boolean;
  finishedOn: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Tags are stored comma-wrapped (`,"a,b",`) so LIKE matching stays exact. */
export function normalizeTags(input: string[] | string): string {
  const list = Array.isArray(input) ? input : input.split(/[,，、]/);
  const cleaned = list
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
  return cleaned.length ? `,${cleaned.join(",")},` : "";
}

export function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatNo(id: number): string {
  return String(id).padStart(3, "0");
}

export function rowToWork(row: WorkRow): Work {
  let meta: WorkMeta = {};
  try {
    meta = row.meta ? (JSON.parse(row.meta) as WorkMeta) : {};
  } catch {
    meta = {};
  }
  return {
    id: row.id,
    no: formatNo(row.id),
    type: row.type as WorkType,
    title: row.title,
    originalTitle: row.original_title,
    creator: row.creator,
    year: row.year,
    cover: row.cover,
    coverRemote: row.cover_remote,
    coverRatio: row.cover_ratio || 0.72,
    summary: row.summary,
    review: row.review,
    rating: row.rating,
    status: row.status as WorkStatus,
    tags: parseTags(row.tags),
    doubanId: row.douban_id,
    doubanUrl: row.douban_url,
    doubanRating: row.douban_rating,
    meta,
    featured: row.featured === 1,
    finishedOn: row.finished_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
