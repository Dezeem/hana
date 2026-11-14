"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  bulkUpdate,
  createWork,
  deleteWork,
  deleteWorks,
  getWork,
  setFeatured,
  updateWork,
  type WorkInput,
} from "@/lib/db";
import type { WorkMeta } from "@/lib/db/types";
import { importDouban, searchDouban, type ImportResult } from "@/lib/douban";
import { localizeCover } from "@/lib/douban/cover";
import { storeUpload } from "@/lib/uploads";

const typeEnum = z.enum(["movie", "series", "book", "music"]);
const statusEnum = z.enum(["done", "doing", "wish"]);

export type SaveState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(raw: string, max: number): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(value, 0), max);
}

function splitTags(raw: string): string[] {
  return raw
    .split(/[,，、]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function parseMeta(raw: string): WorkMeta {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as WorkMeta;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveWork(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const rawId = text(formData, "id");
  const id = rawId ? Number(rawId) : null;
  const title = text(formData, "title");
  const type = typeEnum.safeParse(text(formData, "type"));
  const status = statusEnum.safeParse(text(formData, "status") || "done");

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "标题不能为空";
  if (!type.success) fieldErrors.type = "请选择作品类型";

  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "请补全必填项。", fieldErrors };
  }

  const upload = await storeUpload(formData.get("coverFile") as File | null);
  const coverRemote = text(formData, "coverRemote");
  const existingCover = text(formData, "cover");
  const previous = id ? getWork(id) : null;
  const remoteChanged = Boolean(coverRemote) && coverRemote !== (previous?.coverRemote ?? "");

  let cover = existingCover;
  let coverRatio = numberOrNull(text(formData, "coverRatio"), 4) ?? 0.72;

  if (upload) {
    cover = upload.path;
    coverRatio = upload.ratio;
  } else if (coverRemote && (!cover || remoteChanged)) {
    // Keyed by the remote URL so re-saving the same subject reuses one file.
    const localized = await localizeCover(coverRemote, coverRemote);
    if (localized) {
      cover = localized.path;
      coverRatio = localized.ratio;
    }
  }

  const payload: WorkInput = {
    type: type.success ? type.data : "movie",
    title,
    originalTitle: text(formData, "originalTitle"),
    creator: text(formData, "creator"),
    year: numberOrNull(text(formData, "year"), 2200) || null,
    cover,
    coverRemote,
    coverRatio,
    summary: text(formData, "summary"),
    review: text(formData, "review"),
    rating: numberOrNull(text(formData, "rating"), 5),
    status: status.success ? status.data : "done",
    tags: splitTags(text(formData, "tags")),
    doubanId: text(formData, "doubanId"),
    doubanUrl: text(formData, "doubanUrl"),
    doubanRating: numberOrNull(text(formData, "doubanRating"), 10),
    meta: parseMeta(text(formData, "meta")),
    featured: formData.get("featured") === "on",
    finishedOn: text(formData, "finishedOn") || null,
  };

  try {
    if (id) {
      updateWork(id, payload);
    } else {
      createWork(payload);
    }
  } catch (error) {
    console.error("[admin] save failed:", error);
    return { ok: false, error: "保存失败，请检查表单后重试。" };
  }

  revalidatePath("/");
  revalidatePath("/library");
  redirect("/admin/works");
}

export async function importDoubanAction(input: string, type: string): Promise<ImportResult> {
  await requireAdmin();
  const parsed = typeEnum.safeParse(type);
  return importDouban(input, parsed.success ? parsed.data : undefined);
}

export async function searchSuggestAction(query: string, type: string) {
  await requireAdmin();
  const parsed = typeEnum.safeParse(type);
  return searchDouban(query, parsed.success ? parsed.data : "movie");
}

export async function deleteWorkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isFinite(id)) deleteWork(id);
  revalidatePath("/");
  revalidatePath("/library");
  redirect("/admin/works");
}

export async function bulkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const ids = formData
    .getAll("ids")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const op = String(formData.get("op") ?? "");

  if (!ids.length) redirect("/admin/works");

  if (op === "delete") {
    deleteWorks(ids);
  } else if (op === "done" || op === "doing" || op === "wish") {
    bulkUpdate(ids, { status: op });
  } else if (op === "feature") {
    for (const id of ids) setFeatured(id, true);
  } else if (op === "unfeature") {
    for (const id of ids) setFeatured(id, false);
  }

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/admin/works");
  redirect("/admin/works");
}


