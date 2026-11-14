import Link from "next/link";
import { WORK_TYPES } from "@/site.config";
import type { WorkType } from "@/site.config";

type RulerProps = {
  counts: Record<WorkType, number>;
  total: number;
};

/** Four engraved scales — one per collection type. */
export function CollectionRuler({ counts, total }: RulerProps) {
  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-5 flex items-baseline justify-between border-b border-line pb-2">
        <span className="meta">Index</span>
        <span className="num text-[11px] text-ink-soft">{total} specimens</span>
      </div>
      <ul className="space-y-4">
        {WORK_TYPES.map((type) => {
          const count = counts[type.key] ?? 0;
          return (
            <li key={type.key}>
              <Link href={`/library?type=${type.key}`} className="group block">
                <div className="flex items-baseline justify-between">
                  <span className="flex items-baseline gap-2">
                    <span
                      className="inline-block h-[7px] w-[7px] shrink-0 translate-y-[-1px]"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="font-serif text-[13px] text-ink">{type.zh}</span>
                    <span className="meta">{type.en}</span>
                  </span>
                  <span className="num text-[13px] text-ink-soft transition-colors group-hover:text-ink">
                    {String(count).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-2 h-px w-full bg-line">
                  <div
                    className="h-px transition-all duration-500 group-hover:opacity-100"
                    style={{
                      width: `${Math.max((count / max) * 100, 2)}%`,
                      backgroundColor: type.color,
                      opacity: 0.75,
                    }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
