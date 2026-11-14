import Link from "next/link";
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
    <span className="flex shrink-0 items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: meta?.color }} />
      <span
        className="text-[12px] font-medium uppercase tracking-[0.18em]"
        style={{ color: meta?.ink }}
      >
        {meta?.zh}
      </span>
    </span>
  );
}

export function WorkCard({ work, variant = "masonry", eager }: WorkCardProps) {
  if (variant === "list") {
    return (
      <Link
        href={`/work/${work.id}`}
        className="group flex items-center gap-5 border-b-2 border-line py-5 transition-colors hover:bg-ink hover:text-paper"
      >
        <span className="specimen-no w-14 shrink-0">No.{work.no}</span>
        <span className="h-20 w-14 shrink-0 overflow-hidden border-2 border-line bg-mist">
          <Cover
            src={work.cover}
            fallbackSrc={work.coverRemote}
            title={work.title}
            type={work.type}
            className="h-full w-full"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-medium">{work.title}</span>
          <span className="mt-1 block truncate text-[14px] text-ink-soft">
            {workMetaLine(work) || work.originalTitle}
          </span>
        </span>
        <span className="hidden max-w-[280px] flex-1 truncate text-[14px] text-ink-faint lg:block">
          {work.review || work.summary}
        </span>
        <span className="hidden shrink-0 sm:block">
          <Rating value={work.rating} />
        </span>
        <TypeMark type={work.type} />
      </Link>
    );
  }

  const isRail = variant === "rail";

  return (
    <Link
      href={`/work/${work.id}`}
      className={cn("group block", isRail && "w-[72vw] shrink-0 sm:w-[320px]")}
    >
      <div
        className="relative mb-4 overflow-hidden border-2 border-line bg-mist"
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
        <span className="pointer-events-none absolute left-0 top-0 flex h-7 items-center bg-ink px-2">
          <span className="specimen-no !text-paper">No.{work.no}</span>
        </span>
        {work.rating !== null ? (
          <span className="pointer-events-none absolute bottom-0 right-0 flex h-7 items-center border-l-2 border-t-2 border-line bg-paper px-2">
            <span className="num text-[13px] font-medium text-ink">{ratingText(work.rating)}</span>
          </span>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-semibold leading-snug">{work.title}</h3>
          <p className="mt-1 truncate text-[14px] text-ink-soft">{workMetaLine(work)}</p>
        </div>
        <TypeMark type={work.type} />
      </div>

      <p className="mt-2 line-clamp-2 max-h-0 overflow-hidden text-[14px] leading-relaxed text-ink-soft opacity-0 transition-all duration-300 group-hover:max-h-14 group-hover:opacity-100">
        {work.review || work.summary}
      </p>
    </Link>
  );
}
