"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { TYPE_MAP } from "@/site.config";

type Hit = {
  id: number;
  no: string;
  title: string;
  creator: string;
  year: number | null;
  type: keyof typeof TYPE_MAP;
  cover: string;
};

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((prev) => Math.min(prev + 1, Math.max(hits.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((prev) => Math.max(prev - 1, 0));
      }
      if (event.key === "Enter" && hits[active]) {
        window.location.href = `/work/${hits[active].id}`;
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, hits, active]);

  const search = useCallback((value: string) => {
    if (value.trim().length < 1) {
      setHits([]);
      return;
    }

    // Fast typing can finish requests out of order; keep only the latest one.
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(value)}&limit=8`, { signal: request.signal })
      .then((response) => response.json())
      .then((data: { results?: Hit[] }) => {
        setHits(data.results ?? []);
        setActive(0);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          console.error("[search] request failed", error);
        }
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => search(query), 220);
    return () => clearTimeout(timer);
  }, [query, open, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-paper/97 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-3xl px-6 pt-24 pb-10 sm:pt-32">
        <div className="flex items-end gap-4 border-b border-ink pb-4">
          <Search className="mb-2 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.4} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、导演、标签，或一句短评"
            className="w-full bg-transparent font-serif text-xl text-ink outline-none placeholder:text-ink-faint sm:text-2xl"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onClose}
            className="mb-1 flex h-7 w-7 items-center justify-center text-ink-faint transition-colors hover:text-ink"
            aria-label="关闭搜索"
          >
            <X className="h-4 w-4" strokeWidth={1.4} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="meta">{loading ? "检索中" : `${hits.length} 个结果`}</span>
          <span className="meta">ESC 关闭 · ↑↓ 选择</span>
        </div>

        <ul className="mt-8 max-h-[52vh] overflow-y-auto">
          {hits.map((hit, index) => (
            <li key={hit.id}>
              <Link
                href={`/work/${hit.id}`}
                onClick={onClose}
                onMouseEnter={() => setActive(index)}
                className={`flex items-center gap-4 border-b border-line py-3 transition-colors ${
                  active === index ? "bg-ink/[0.04]" : "hover:bg-ink/[0.02]"
                }`}
              >
                <span className="specimen-no w-10 shrink-0">No.{hit.no}</span>
                <span className="h-12 w-9 shrink-0 overflow-hidden bg-line">
                  {hit.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hit.cover} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-base text-ink">{hit.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-soft">
                    {[hit.creator, hit.year].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span
                  className="meta shrink-0"
                  style={{ color: TYPE_MAP[hit.type]?.color }}
                >
                  {TYPE_MAP[hit.type]?.zh}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {!loading && query && hits.length === 0 ? (
          <p className="mt-10 text-center font-serif text-sm text-ink-soft">
            没有找到「{query}」。试试更短的关键词，或者去作品库按标签浏览。
          </p>
        ) : null}

        {!query ? (
          <p className="mt-10 text-center font-serif text-sm text-ink-soft">
            输入任意关键词，标题、导演、标签与短评都会被检索。
          </p>
        ) : null}

        <p className="mt-10 flex items-center justify-center gap-8">
          {query ? (
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="meta underlink text-ink"
            >
              查看全部结果 →
            </Link>
          ) : null}
          <Link href="/library" onClick={onClose} className="meta underlink text-ink-soft">
            浏览全部藏品
          </Link>
        </p>
      </div>
    </div>
  );
}
