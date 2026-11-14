import Link from "next/link";
import { CollectionRuler } from "@/components/collection-ruler";
import { Cover } from "@/components/cover";
import { Reveal } from "@/components/reveal";
import { WorkCard } from "@/components/work-card";
import { getStats, listWorks } from "@/lib/db";
import { aspect, typeLabel, workMetaLine } from "@/lib/utils";
import { site } from "@/site.config";

export default async function HomePage() {
  const stats = getStats();
  const featured = listWorks({ featuredOnly: true, limit: 3 });
  const wall = listWorks({ limit: 36 });

  const spotlight = featured.items.length ? featured.items : wall.items.slice(0, 3);
  const wallItems = wall.items.filter((work) => !spotlight.some((item) => item.id === work.id));

  return (
    <div>
      {/* ── hero ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-12 pb-14 pt-14 sm:pt-20">
          <div className="col-span-12 lg:col-span-7">
            <p className="meta mb-7 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-line-strong" />
              Private archive · no. 001 — {String(stats.total).padStart(3, "0")}
            </p>
            <h1 className="font-display text-[40px] leading-[1.1] tracking-[-0.02em] text-ink sm:text-[58px] lg:text-[72px]">
              把看过的，
              <br />
              <em className="italic">压进标本册。</em>
            </h1>
            <p className="mt-8 max-w-[34rem] font-serif text-[14px] leading-[2] text-ink-soft sm:text-[15px]">
              {site.description}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/library" className="btn">
                进入藏品
              </Link>
              <Link href="/timeline" className="meta underlink text-ink-soft hover:text-ink">
                按年份浏览
              </Link>
            </div>
          </div>

          <div className="col-span-12 flex lg:col-span-5 lg:justify-end">
            <CollectionRuler counts={stats.byType} total={stats.total} />
          </div>
        </div>
      </section>

      {/* ── spotlight ────────────────────────────────────── */}
      {spotlight.length ? (
        <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <h2 className="meta text-ink">精选展品 · Selected</h2>
            <span className="meta">{String(spotlight.length).padStart(2, "0")} / {String(stats.total).padStart(2, "0")}</span>
          </div>

          <div className="mt-8 grid grid-cols-12 gap-x-5 gap-y-10">
            {spotlight.map((work, index) => (
              <Reveal
                key={work.id}
                delay={index * 60}
                className={
                  index === 0
                    ? "col-span-12 sm:col-span-7 lg:col-span-6"
                    : "col-span-6 sm:col-span-5 lg:col-span-3"
                }
              >
                <Link href={`/work/${work.id}`} className="group block">
                  <div
                    className="relative overflow-hidden bg-line/40"
                    style={{ aspectRatio: index === 0 ? "1.28" : aspect(work.coverRatio) }}
                  >
                    <Cover
                      src={work.cover}
                      fallbackSrc={work.coverRemote}
                      title={work.title}
                      type={work.type}
                      eager={index === 0}
                      className="h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/[0.05]" />
                    <span className="pointer-events-none absolute left-0 top-0 bg-paper/90 px-2 py-[3px] backdrop-blur-sm">
                      <span className="specimen-no">No.{work.no}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <h3 className="truncate font-serif text-ink">{work.title}</h3>
                    <span className="meta shrink-0">{typeLabel(work.type)}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-ink-soft">{workMetaLine(work)}</p>
                  {index === 0 && work.review ? (
                    <p className="mt-3 line-clamp-3 max-w-2xl font-serif text-[13px] leading-[1.9] text-ink-soft">
                      {work.review}
                    </p>
                  ) : null}
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── the wall ─────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-[1440px] px-5 sm:px-8">
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <h2 className="meta text-ink">藏品墙 · The Wall</h2>
          <Link href="/library" className="meta underlink text-ink-soft hover:text-ink">
            全部 {stats.total} 件 →
          </Link>
        </div>

        <div className="mt-10 columns-2 gap-x-5 md:columns-3 xl:columns-4 [&>*]:mb-10 [&>*]:break-inside-avoid">
          {wallItems.map((work, index) => (
            <Reveal key={work.id} delay={(index % 8) * 40}>
              <WorkCard work={work} />
            </Reveal>
          ))}
        </div>

        {!wallItems.length && !spotlight.length ? (
          <p className="py-24 text-center font-serif text-sm text-ink-soft">
            标本册还是空的。登录后台，粘贴一个豆瓣链接开始吧。
          </p>
        ) : null}
      </section>

      {/* ── closing note ─────────────────────────────────── */}
      <section className="mx-auto mt-16 max-w-[1440px] px-5 sm:px-8">
        <div className="grid grid-cols-12 gap-6 border-t border-line pt-8">
          <p className="col-span-12 font-serif text-[13px] leading-[2] text-ink-soft md:col-span-6">
            这里的条目没有排序算法，只有日期和手写的短评。想找某一件作品时，用顶部搜索，或到
            <Link href="/library" className="mx-1 underline decoration-line-strong underline-offset-4 hover:text-ink">
              藏品库
            </Link>
            按类型、年份与标签筛选。
          </p>
          <p className="col-span-12 text-right font-display text-lg italic text-ink-faint md:col-span-6">
            {site.taglineEn}
          </p>
        </div>
      </section>
    </div>
  );
}
