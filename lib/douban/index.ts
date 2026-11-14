import type { WorkType } from "@/site.config";
import { DoubanError, doubanFetch } from "./fetch";
import { buildDraft, hostFor, normalizeInput, parsePage } from "./parse";
import { ERROR_COPY, type ImportResult, type SuggestItem } from "./types";

export { normalizeInput } from "./parse";
export type { DoubanDraft, ImportResult, SuggestItem } from "./types";

/**
 * Import pipeline.
 *
 * Douban has no public API, and subject pages are rate-limited on datacenter
 * IPs (movie pages in particular often 302 to sec.douban.com). The importer is
 * therefore best-effort by design: every failure returns a structured code with
 * a human hint, and the UI degrades to a manual form instead of blocking.
 */
export async function importDouban(
  input: string,
  typeHint?: WorkType,
): Promise<ImportResult> {
  const started = Date.now();
  const normalized = normalizeInput(input, typeHint);

  if (!normalized) {
    return {
      ok: false,
      code: "IMPORT_INVALID",
      ...ERROR_COPY.IMPORT_INVALID,
      url: input,
    };
  }

  try {
    const html = await doubanFetch(normalized.url);
    const draft = buildDraft(parsePage(html), normalized);

    if (!draft) {
      return {
        ok: false,
        code: "IMPORT_PARSE_FAILED",
        ...ERROR_COPY.IMPORT_PARSE_FAILED,
        url: normalized.url,
      };
    }

    console.info(
      `[douban] imported ${normalized.type}/${normalized.id} via ${draft.strategy} in ${Date.now() - started}ms`,
    );

    return { ok: true, draft, elapsedMs: Date.now() - started };
  } catch (error) {
    const code = error instanceof DoubanError ? error.code : "IMPORT_NETWORK";
    console.error(`[douban] import failed ${code}:`, (error as Error)?.message);
    return {
      ok: false,
      code,
      ...ERROR_COPY[code],
      url: normalized.url,
    };
  }
}

type SuggestRow = {
  id?: string;
  title?: string;
  pic?: string;
  url?: string;
  type?: string;
  year?: string;
  author_name?: string;
};

/** Title search used to find a subject id when the user does not have a URL. */
export async function searchDouban(query: string, type: WorkType): Promise<SuggestItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const host = hostFor(type);
  const url = `https://${host}/j/subject_suggest?q=${encodeURIComponent(trimmed)}`;

  try {
    const body = await doubanFetch(url);
    const rows = JSON.parse(body) as SuggestRow[];
    if (!Array.isArray(rows)) return [];

    return rows.slice(0, 8).map((row) => ({
      id: String(row.id ?? ""),
      title: row.title ?? "未命名条目",
      subtitle: [row.author_name, row.year].filter(Boolean).join(" · "),
      pic: row.pic ?? "",
      url: row.url ?? "",
      type: row.type ?? "",
      year: row.year ?? "",
    }));
  } catch (error) {
    console.error("[douban] suggest failed:", (error as Error)?.message);
    return [];
  }
}
