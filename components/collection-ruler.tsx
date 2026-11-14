import Link from "next/link";
import { WORK_TYPES } from "@/site.config";
import type { WorkType } from "@/site.config";

type RulerProps = {
  counts: Record<WorkType, number>;
  total: number;
};

/** Four primary-coloured columns — a De Stijl index of the collection. */
export function CollectionRuler({ counts, total }: RulerProps) {
  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="meta text-ink">Index</span>
        <span className="num text-[16px] font-medium">{total} specimens</span>
      </div>

      <ul className="divide-y divide-line">
        {WORK_TYPES.map((type) => {
          const count = counts[type.key] ?? 0;
          return (
            <li key={type.key}>
              <Link href={`/library?type=${type.key}`} className="group block py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex items-baseline gap-3">
                    <span
                      className="inline-block h-3 w-3 shrink-0 translate-y-[-1px]"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-[17px] font-medium">{type.zh}</span>
                    <span className="text-[12px] uppercase tracking-[0.08em] text-ink-faint">
                      {type.en}
                    </span>
                  </span>
                  <span className="num text-[22px] font-semibold leading-none">
                    {String(count).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-mist">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                    style={{
                      width: `${Math.max((count / max) * 100, 3)}%`,
                      backgroundColor: type.color,
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
