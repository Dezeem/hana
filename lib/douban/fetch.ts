import type { ImportErrorCode } from "./types";

export class DoubanError extends Error {
  code: ImportErrorCode;

  constructor(code: ImportErrorCode, message: string) {
    super(message);
    this.name = "DoubanError";
    this.code = code;
  }
}

const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const CACHE_TTL = 15 * 60 * 1000;
const MIN_INTERVAL = 700;

type CacheEntry = { at: number; html: string };
const cache = new Map<string, CacheEntry>();
let lastRequestAt = 0;

function timeoutMs() {
  const parsed = Number(process.env.DOUBAN_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20000;
}

async function throttle() {
  const wait = MIN_INTERVAL - (Date.now() - lastRequestAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

type FetchInit = RequestInit & { dispatcher?: unknown };

async function dispatcher() {
  const proxy = process.env.DOUBAN_PROXY;
  if (!proxy) return undefined;
  try {
    const { ProxyAgent } = await import("undici");
    return new ProxyAgent(proxy);
  } catch (error) {
    console.error("[douban] proxy agent unavailable:", error);
    return undefined;
  }
}

/**
 * Fetches a Douban page with polite defaults: request throttling, a short cache,
 * a configurable UA/cookie and a hard timeout. Redirects are treated as a
 * block signal because Douban sends bot traffic to sec.douban.com.
 */
export async function doubanFetch(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.html;
  }

  await throttle();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  const init: FetchInit = {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    signal: controller.signal,
    headers: {
      "User-Agent": process.env.DOUBAN_USER_AGENT || DEFAULT_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.6",
      Referer: "https://www.douban.com/",
      Cookie: process.env.DOUBAN_COOKIE || "",
    },
  };
  const agent = await dispatcher();
  if (agent) init.dispatcher = agent;

  try {
    const response = await fetch(url, init);

    if (response.status >= 300 && response.status < 400) {
      throw new DoubanError("IMPORT_BLOCKED", `redirected to ${response.headers.get("location") ?? "unknown"}`);
    }
    if (response.status === 404) {
      throw new DoubanError("IMPORT_NOT_FOUND", "404");
    }
    if (!response.ok) {
      throw new DoubanError("IMPORT_BLOCKED", `status ${response.status}`);
    }

    const html = await response.text();
    if (html.length < 500) {
      throw new DoubanError("IMPORT_PARSE_FAILED", "response too small");
    }
    cache.set(url, { at: Date.now(), html });
    return html;
  } catch (error) {
    if (error instanceof DoubanError) throw error;
    const name = (error as Error)?.name;
    if (name === "AbortError" || name === "TimeoutError") {
      throw new DoubanError("IMPORT_TIMEOUT", "request aborted");
    }
    throw new DoubanError("IMPORT_NETWORK", (error as Error)?.message ?? "network error");
  } finally {
    clearTimeout(timer);
  }
}
