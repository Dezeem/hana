import type { WorkType } from "@/site.config";
import type { WorkMeta } from "@/lib/db/types";
import type { DoubanDraft } from "./types";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&[a-z#0-9]+;/gi, (match) => ENTITIES[match.toLowerCase()] ?? match);
}

export function stripTags(input: string): string {
  return decodeEntities(input.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

const HOST_TYPE: Record<string, WorkType> = {
  "movie.douban.com": "movie",
  "book.douban.com": "book",
  "music.douban.com": "music",
  "www.douban.com": "movie",
  "m.douban.com": "movie",
};

export function hostFor(type: WorkType): string {
  if (type === "book") return "book.douban.com";
  if (type === "music") return "music.douban.com";
  return "movie.douban.com";
}

export type NormalizedInput = { type: WorkType; id: string; url: string };

/** Accepts a full Douban URL, a `/subject/123/` fragment, or a bare id. */
export function normalizeInput(raw: string, hint?: WorkType): NormalizedInput | null {
  const input = raw.trim();
  if (!input) return null;

  if (/^\d{4,}$/.test(input)) {
    const type = hint ?? "movie";
    return { type, id: input, url: `https://${hostFor(type)}/subject/${input}/` };
  }

  if (!/douban\.com/i.test(input)) return null;

  const idMatch = input.match(/subject\/(\d+)/);
  if (!idMatch) return null;

  const hostMatch = input.match(/https?:\/\/([^/]+)/i);
  const host = hostMatch?.[1]?.toLowerCase() ?? "";
  const hostType = Object.entries(HOST_TYPE).find(([key]) => host.includes(key))?.[1];
  const type = hint ?? hostType ?? "movie";

  return { type, id: idMatch[1], url: `https://${hostFor(type)}/subject/${idMatch[1]}/` };
}

export function extractLdJson(html: string): Record<string, unknown> | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim()) as unknown;
      if (Array.isArray(parsed) && parsed.length) return parsed[0] as Record<string, unknown>;
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      // ignore malformed block and try the next one
    }
  }
  return null;
}

export function extractMeta(html: string): Record<string, string> {
  const map: Record<string, string> = {};
  const tags = html.matchAll(/<meta[^>]+>/gi);
  for (const tag of tags) {
    const attrs = tag[0];
    const key = attrs.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
    const content = attrs.match(/content=["']([\s\S]*?)["']/i)?.[1];
    if (key && content && !map[key]) {
      map[key] = decodeEntities(content);
    }
  }
  return map;
}

/** Douban's `#info` block: "导演: 杨德昌" style key/value rows separated by <br>. */
export function extractInfo(html: string): Record<string, string> {
  const block = html.match(/<div id="info"[^>]*>([\s\S]*?)<\/div>/i);
  if (!block) return {};

  const result: Record<string, string> = {};
  for (const segment of block[1].split(/<br\s*\/?>/i)) {
    const text = stripTags(segment);
    if (!text) continue;
    const match = text.match(/^([^:：]{1,10})[:：]\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].replace(/\s*\/\s*/g, " / ").trim();
    if (!result[key]) result[key] = value;
  }
  return result;
}

export function extractRating(html: string): number | null {
  const match = html.match(/rating_nums?["'][^>]*>\s*([\d.]+)\s*</i);
  const value = match ? Number(match[1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function extractSummary(html: string): string {
  const patterns = [
    /<div class="intro">([\s\S]*?)<\/div>/i,
    /<span property="v:summary"[^>]*>([\s\S]*?)<\/span>/i,
    /<div class="bd">\s*<p>([\s\S]*?)<\/p>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const text = stripTags(match[1]);
      if (text.length > 20) return text.slice(0, 600);
    }
  }
  return "";
}

function names(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : (item as { name?: string })?.name))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === "object") {
    const name = (value as { name?: string }).name;
    return name ? [name] : [];
  }
  if (typeof value === "string") return [value];
  return [];
}

function firstYear(...candidates: (string | undefined)[]): number | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = candidate.match(/(19|20)\d{2}/);
    if (match) return Number(match[0]);
  }
  return null;
}

function duration(value: string | undefined): string {
  if (!value) return "";
  const iso = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (iso) {
    const minutes = Number(iso[1] ?? 0) * 60 + Number(iso[2] ?? 0);
    if (minutes) return `${minutes} 分钟`;
  }
  return value;
}

type ParsedPage = {
  ld: Record<string, unknown> | null;
  meta: Record<string, string>;
  info: Record<string, string>;
  rating: number | null;
  summary: string;
};

export function parsePage(html: string): ParsedPage {
  return {
    ld: extractLdJson(html),
    meta: extractMeta(html),
    info: extractInfo(html),
    rating: extractRating(html),
    summary: extractSummary(html),
  };
}

function cleanTitle(raw: string): string {
  return raw.replace(/\s*[（(]豆瓣[）)]\s*$/, "").trim();
}

export function buildDraft(
  page: ParsedPage,
  context: NormalizedInput,
): DoubanDraft | null {
  const { ld, meta, info, rating, summary } = page;
  const type = context.type;

  const rawTitle = (ld?.name as string | undefined) ?? meta["og:title"] ?? "";
  const title = cleanTitle(rawTitle);
  if (!title) return null;

  const coverRemote = (ld?.image as string | undefined) ?? meta["og:image"] ?? "";
  const description =
    summary || (ld?.description as string | undefined) || meta["og:description"] || "";

  let creator = "";
  let originalTitle = "";
  let year: number | null = null;
  const metaOut: WorkMeta = {};

  if (type === "book") {
    creator = info["作者"] || names(ld?.author).join(" / ");
    originalTitle = info["原作名"] ?? "";
    year = firstYear(info["出版时间"], info["出版年"], ld?.datePublished as string | undefined);
    metaOut.publisher = info["出版社"] ?? (ld?.publisher as string | undefined) ?? "";
    metaOut.isbn = info["ISBN"] ?? (ld?.isbn as string | undefined) ?? "";
    metaOut.pages = info["页数"] ?? "";
    metaOut.language = info["语言"] ?? "";
  } else if (type === "music") {
    creator = info["表演者"] || info["艺术家"] || names(ld?.byArtist).join(" / ");
    originalTitle = (ld?.alternateName as string | undefined) ?? "";
    year = firstYear(info["发行时间"], info["出版者"], ld?.datePublished as string | undefined);
    metaOut.artist = creator;
    metaOut.albumType = info["专辑类型"] ?? "";
    metaOut.publisher = info["出版者"] ?? "";
    metaOut.language = info["介质"] ?? "";
  } else {
    creator = info["导演"] || names(ld?.director).join(" / ");
    originalTitle = info["又名"]?.split(" / ")[0] ?? (ld?.alternateName as string | undefined) ?? "";
    year = firstYear(info["上映日期"], ld?.datePublished as string | undefined);
    metaOut.director = info["导演"]
      ? info["导演"].split(" / ").map((item) => item.trim()).filter(Boolean)
      : names(ld?.director);
    metaOut.cast = info["主演"]
      ? info["主演"].split(" / ").map((item) => item.trim()).filter(Boolean).slice(0, 6)
      : names(ld?.actor).slice(0, 6);
    metaOut.runtime = duration(info["片长"] ?? (ld?.duration as string | undefined));
    metaOut.region = info["制片国家/地区"] ?? "";
    metaOut.language = info["语言"] ?? "";
  }

  const ratingValue = Number(
    (ld?.aggregateRating as { ratingValue?: string | number } | undefined)?.ratingValue ?? NaN,
  );

  return {
    type,
    title,
    originalTitle,
    creator,
    year,
    coverRemote,
    summary: description,
    doubanId: context.id,
    doubanUrl: context.url,
    doubanRating: rating ?? (Number.isFinite(ratingValue) ? ratingValue : null),
    meta: metaOut,
    strategy: Object.keys(info).length ? "html+ld" : "og",
  };
}
