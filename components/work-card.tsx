import type { CSSProperties } from "react";
import Link from "next/link";
import { Quote } from "lucide-react";
import { TYPE_MAP } from "@/site.config";
import type { Work } from "@/lib/db/types";
import { aspect, cn, ratingText, workMetaLine } from "@/lib/utils";
import { Cover } from "./cover";
import { Rating } from "./rating";

type WorkCardProps = {
  work: Work;
  variant?: "masonry" | "grid" | "list" | "rail";
  eager?: boolean;
};

function TypeMark({ type }: { type: Work["type"] }) {
  const meta = TYPE_MAP[type];
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-mist-soft px-2 py-0.5">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta?.color }}
      />
      <span className="text-[12px] font-medium text-ink-soft">{meta?.zh}</span>
    </span>
  );
}

export function WorkCard({ work, variant = "masonry", eager }: WorkCardProps) {
  if (variant === "list") {
    return (
      <Link
        href={`/work/${work.id}`}
        className="group flex items-center gap-5 border-b border-l-2 border-line border-l-transparent py-5 transition-colors hover:border-l-[var(--tc)] hover:bg-mist"
        style={{ "--tc": TYPE_MAP[work.type]?.color } as CSSProperties}
      >
        <span className="specimen-no w-14 shrink-0">No.{work.no}</span>
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-mist">
          <Cover
            src={work.cover}
            fallbackSrc={work.coverRemote}
            title={work.title}
            type={work.type}
            className="h-full w-full"
          />
        </div>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[19px] font-medium">{work.title}</span>
          <span className="mt-1 block truncate text-[16px] text-ink-soft">
            {workMetaLine(work) || work.originalTitle}
          </span>
        </span>
        <span className="hidden max-w-[280px] flex-1 truncate text-[16px] text-ink-faint lg:block">
          {work.review || work.summary}
        </span>
        <span className="hidden shrink-0 sm:block">
          <Rating value={work.rating} color={TYPE_MAP[work.type]?.color} />
        </span>
        {work.review ? (
          <Quote className="hidden h-3.5 w-3.5 shrink-0 text-ink-faint sm:block" strokeWidth={1.6} aria-hidden />
        ) : null}
        <TypeMark type={work.type} />
      </Link>
    );
  }

  const isRail = variant === "rail";

  return (
    <Link
      href={`/work/${work.id}`}
      className={cn("group block", isRail && "w-[72vw] shrink-0 sm:w-[320px]")}
      style={{ "--tc": TYPE_MAP[work.type]?.color } as CSSProperties}
    >
      <div
        className="relative mb-4 overflow-hidden rounded-[var(--radius-card)] border border-line bg-mist transition-colors duration-300 group-hover:border-[var(--tc)]"
        style={{ aspectRatio: aspect(work.coverRatio) }}
      >
        <Cover
          src={work.cover}
          fallbackSrc={work.coverRemote}
          title={work.title}
          type={work.type}
          eager={eager}
          className="h-full w-full transition-transform duration-[700ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10" />
        <span className="pointer-events-none absolute left-2.5 top-2.5 flex h-6 items-center rounded-full bg-ink/80 px-2.5 backdrop-blur-sm">
          <span className="specimen-no !text-paper text-[11px]">No.{work.no}</span>
        </span>
        <span
          className="pointer-events-none absolute right-2.5 top-2.5 flex h-6 items-center rounded-full px-2.5"
          style={{ backgroundColor: TYPE_MAP[work.type]?.color }}
        >
          <span className="specimen-no !text-paper text-[11px]">{TYPE_MAP[work.type]?.en}</span>
        </span>
        {work.review ? (
          <span
            className="pointer-events-none absolute bottom-2.5 left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-ink backdrop-blur-sm"
            title="写过短评"
          >
            <Quote className="h-3 w-3" strokeWidth={1.8} aria-hidden />
          </span>
        ) : null}
        {work.rating !== null ? (
          <span className="pointer-events-none absolute bottom-2.5 right-2.5 flex h-6 items-center rounded-full bg-white/85 px-2 backdrop-blur-sm">
            <span className="num text-[13px] font-medium text-ink">{ratingText(work.rating)}</span>
          </span>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[19px] font-semibold leading-snug">
            <span
              className="h-2.5 w-2.5 shrink-0"
              style={{ background: "var(--tc)" }}
              aria-hidden
            />
            <span className="truncate">{work.title}</span>
          </h3>
          <p className="mt-1 truncate text-[16px] text-ink-soft">{workMetaLine(work)}</p>
        </div>
        <TypeMark type={work.type} />
      </div>

      <p className="mt-2 line-clamp-2 max-h-0 overflow-hidden text-[16px] leading-relaxed text-ink-soft opacity-0 transition-all duration-300 group-hover:max-h-14 group-hover:opacity-100">
        {work.review || work.summary}
      </p>
    </Link>
  );
}
