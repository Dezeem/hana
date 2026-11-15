"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { TYPE_MAP, type WorkType } from "@/site.config";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export type TimelineItem = {
  id: number;
  type: WorkType;
  title: string;
  creator: string;
  year: number | null;
  cover: string;
  summary: string;
  /** Precomputed from `meta` on the server — director, publisher, region… */
  facts: string;
};

export type TimelineGroupData = { year: number; works: TimelineItem[] };

type TimelineFeedProps = {
  initialGroups: TimelineGroupData[];
  initialCursor: number | null;
  /** Lower bound of the selected range, forwarded to the feed endpoint. */
  since: number | null;
};

const PAGE_SIZE = 3;

/**
 * Appends whole year groups as the sentinel below the list approaches the
 * viewport. The first page is server-rendered, so the timeline still reads
 * without JavaScript — the button underneath is the fallback and the retry.
 */
export function TimelineFeed({ initialGroups, initialCursor, since }: TimelineFeedProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [cursor, setCursor] = useState(initialCursor);
  const [count, setCount] = useState(() =>
    initialGroups.reduce((sum, group) => sum + group.works.length, 0),
  );
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const busy = useRef(false);
  const mounted = useRef(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (busy.current || cursor === null) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);

    try {
      const query = new URLSearchParams({ before: String(cursor), limit: String(PAGE_SIZE) });
      if (since !== null) query.set("since", String(since));

      const response = await fetch(`/api/timeline?${query.toString()}`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error(`timeline ${response.status}`);

      const data = (await response.json()) as {
        groups: TimelineGroupData[];
        nextCursor: number | null;
      };
      if (!mounted.current) return;

      if (data.groups.length) {
        setGroups((previous) => [...previous, ...data.groups]);
        setCount((previous) =>
          previous + data.groups.reduce((sum, group) => sum + group.works.length, 0),
        );
      }
      setCursor(data.nextCursor);
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [cursor, since]);

  useEffect(() => {
    if (cursor === null) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void load();
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, load]);

  return (
    <div>
      {groups.map((group) => (
        <section
          key={group.year}
          className="mb-4 [content-visibility:auto] [contain-intrinsic-size:auto_600px]"
        >
          <div className="relative mb-6 flex items-center md:justify-center">
            <h2 className="font-display text-[60px] leading-none tracking-[-0.04em] text-ink sm:text-[88px]">
              {group.year === 0 ? "—" : group.year}
            </h2>
            <span className="meta ml-4 md:absolute md:right-0">
              {String(group.works.length).padStart(2, "0")} pieces
            </span>
          </div>

          <div className="pb-14">
            {group.works.map((work, index) => {
              const type = TYPE_MAP[work.type];
              const right = index % 2 === 1;
              return (
                <Reveal
                  key={work.id}
                  delay={(index % 6) * 45}
                  className="group relative pl-6 md:pl-0"
                >
                  <span
                    className="absolute left-0 top-4 h-[7px] w-[7px] -translate-x-[3px] rounded-full transition-transform duration-300 group-hover:scale-[1.9] md:left-1/2 md:-translate-x-1/2"
                    style={{ backgroundColor: type?.color }}
                  />
                  <Link
                    href={`/work/${work.id}`}
                    className={cn(
                      "group flex items-start gap-4 py-3 transition-colors md:w-[46%]",
                      right ? "md:ml-auto md:pl-10" : "md:pr-10 md:text-right",
                      right ? "" : "md:flex-row-reverse",
                    )}
                  >
                    <div
                      className="w-12 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-mist"
                      style={{ aspectRatio: "0.72" }}
                    >
                      {work.cover ? (
                        // Plain <img> on purpose: every timeline entry is a
                        // client <Cover> otherwise, which is what used to make
                        // this page megabytes of flight data.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${work.cover}?w=240`}
                          alt=""
                          width={48}
                          height={67}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] leading-snug text-ink">
                        {work.title}
                      </span>
                      <span className="mt-1 block text-[12px] text-ink-soft">
                        {[work.creator, type?.zh].filter(Boolean).join(" · ")}
                      </span>
                      <span className="mt-2 line-clamp-2 max-h-0 overflow-hidden text-[15px] leading-relaxed text-ink-soft opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:opacity-100">
                        {work.summary || work.facts}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      ))}

      <div
        ref={sentinelRef}
        className="flex flex-col items-center justify-center gap-3 border-t border-line py-8"
        aria-live="polite"
      >
        {loading ? (
          <p className="meta">正在取更早的年份…</p>
        ) : failed ? (
          <button type="button" onClick={() => void load()} className="btn btn-ghost">
            加载失败，重试
          </button>
        ) : cursor === null ? (
          <p className="meta">
            这个范围已经全部展开 · 共 <span className="num">{count}</span> 件
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void load()}
            className="text-[13px] text-ink-soft underline decoration-2 underline-offset-4 transition-colors hover:text-ink"
          >
            加载更早的年份
          </button>
        )}
      </div>
    </div>
  );
}
