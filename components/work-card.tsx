import Link from "next/link";
import { TYPE_MAP } from "@/site.config";
import type { Work } from "@/lib/db/types";
import { aspect, cn, ratingText, typeColor, typeLabel, workMetaLine } from "@/lib/utils";
import { Cover } from "./cover";
import { Rating } from "./rating";

type WorkCardProps = {
  work: Work;
  variant?: "masonry" | "grid" | "list" | "rail";
  eager?: boolean;
};

export function WorkCard({ work, variant = "masonry", eager }: WorkCardProps) {
  const type = TYPE_MAP[work.type];

  if (variant === "list") {
    return (
      <Link
        href={`/work/${work.id}`}
        className="group flex items-center gap-5 border-b border-line py-4 transition-colors hover:bg-ink/[0.02]"
      >
        <span className="specimen-no w-12 shrink-0">No.{work.no}</span>
        <span
          className="h-16 w-11 shrink-0 overflow-hidden bg-line/50"
          style={{ aspectRatio: "0.7" }}
        >
          <Cover
            src={work.cover}
            fallbackSrc={work.coverRemote}
            title={work.title}
            type={work.type}
            className="h-full w-full"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[15px] text-ink">{work.title}</span>
          <span className="mt-0.5 block truncate text-xs text-ink-soft">
            {workMetaLine(work) || work.originalTitle}
          </span>
        </span>
        <span className="hidden max-w-[280px] flex-1 truncate text-xs text-ink-faint lg:block">
          {work.review || work.summary}
        </span>
        <span className="hidden shrink-0 sm:block">
          <Rating value={work.rating} />
        </span>
        <span className="meta w-12 shrink-0 text-right" style={{ color: type?.color }}>
          {typeLabel(work.type)}
        </span>
      </Link>
    );
  }

  const isRail = variant === "rail";

  return (
    <Link
      href={`/work/${work.id}`}
      className={cn("group block", isRail && "w-[62vw] shrink-0 sm:w-[300px]")}
    >
      <div
        className="relative mb-3 overflow-hidden bg-line/40"
        style={
          variant === "grid"
            ? { aspectRatio: aspect(work.coverRatio) }
            : { aspectRatio: aspect(work.coverRatio) }
        }
      >
        <Cover
          src={work.cover}
          fallbackSrc={work.coverRemote}
          title={work.title}
          type={work.type}
          eager={eager}
          className="h-full w-full transition-transform duration-[700ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:-translate-y-1 group-hover:scale-[1.015]"
        />
        <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/[0.05]" />
        <span className="pointer-events-none absolute left-0 top-0 flex items-center gap-1 bg-paper/90 px-2 py-[3px] backdrop-blur-sm">
          <span className="specimen-no">No.{work.no}</span>
        </span>
        {work.rating !== null ? (
          <span className="pointer-events-none absolute right-0 bottom-0 bg-paper/90 px-2 py-[3px] backdrop-blur-sm">
            <span className="num text-[11px] text-ink">{ratingText(work.rating)}</span>
          </span>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[15px] leading-snug text-ink transition-colors group-hover:text-ink">
            {work.title}
          </h3>
          <p className="mt-1 truncate text-[11px] tracking-wide text-ink-soft">
            {workMetaLine(work)}
          </p>
        </div>
        <span
          className="meta mt-[3px] shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
          style={{ color: typeColor(work.type) }}
        >
          {typeLabel(work.type)}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 max-h-0 overflow-hidden text-[12px] leading-relaxed text-ink-soft opacity-0 transition-all duration-300 group-hover:max-h-12 group-hover:opacity-100">
        {work.review || work.summary}
      </p>
    </Link>
  );
}
