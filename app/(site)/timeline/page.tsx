import Link from "next/link";
import type { Metadata } from "next";
import { Cover } from "@/components/cover";
import { Reveal } from "@/components/reveal";
import { getTimeline } from "@/lib/db";
import { TYPE_MAP } from "@/site.config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "年表",
  description: "按作品年份排列的个人观看与阅读史。",
};

export default function TimelinePage() {
  const timeline = getTimeline();
  const total = timeline.reduce((sum, group) => sum + group.works.length, 0);

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
      <header className="pb-12 pt-12 sm:pt-16">
        <p className="meta mb-4 flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-line-strong" />
          Chronology
        </p>
        <h1 className="font-display text-[54px] leading-none tracking-[-0.04em] text-ink sm:text-[84px]">
          年表
          <span className="ml-4 align-baseline text-[16px] not-italic tracking-[0.08em] text-ink-faint">
            TIMELINE
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-[16px] leading-[1.9] text-ink-soft">
          按作品本身的年份排列，而不是我遇见它的时间。{total} 件藏品散落在 {timeline.length} 个年份里，
          越往上越接近此刻。
        </p>
      </header>

      <div className="relative border-t border-line pt-10">
        <span className="absolute left-[3px] top-10 hidden h-[calc(100%-2.5rem)] w-px bg-line md:left-1/2 md:block" />

        {timeline.map((group) => (
          <section key={group.year} className="mb-4">
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
                    className="relative pl-6 md:pl-0"
                  >
                    <span
                      className="absolute left-0 top-4 h-[7px] w-[7px] -translate-x-[3px] rounded-full md:left-1/2 md:-translate-x-1/2"
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
                        <Cover
                          src={work.cover}
                          fallbackSrc={work.coverRemote}
                          title={work.title}
                          type={work.type}
                          className="h-full w-full"
                        />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] leading-snug text-ink">
                          {work.title}
                        </span>
                        <span className="mt-1 block text-[12px] text-ink-soft">
                          {[work.creator, type?.zh].filter(Boolean).join(" · ")}
                        </span>
                        <span className="mt-2 line-clamp-2 max-h-0 overflow-hidden text-[15px] leading-relaxed text-ink-soft opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:opacity-100">
                          {work.review || work.summary}
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {!timeline.length ? (
        <p className="py-24 text-center text-[15px] text-ink-soft">
          还没有任何藏品，先去后台录入一件吧。
        </p>
      ) : null}
    </div>
  );
}
