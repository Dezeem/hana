import Link from "next/link";
import { CollectionRuler } from "@/components/collection-ruler";
import { Cover } from "@/components/cover";
import { MondrianPlate } from "@/components/mondrian-plate";
import { Reveal } from "@/components/reveal";
import { WorkCard } from "@/components/work-card";
import { getStats, listWorks } from "@/lib/db";
import { aspect, typeLabel, workMetaLine } from "@/lib/utils";
import { site, TYPE_MAP } from "@/site.config";

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
        <div className="grid grid-cols-12 items-end gap-x-8 gap-y-14 border-b-2 border-line pb-16 pt-12 sm:pt-16">
          <div className="col-span-12 lg:col-span-7">
            <span className="label-bar">Private archive</span>

            <h1 className="mt-8 text-[clamp(46px,7.4vw,96px)] font-semibold leading-[0.94] tracking-[-0.045em]">
              把看过的，
              <br />
              <span style={{ color: "var(--c-movie)" }}>压进</span>
              <span style={{ color: "var(--c-series)" }}>标</span>
              <span style={{ color: "var(--c-book)" }}>本</span>册。
            </h1>

            <p className="mt-9 max-w-[36rem] text-[16px] leading-[1.85] text-ink-soft sm:text-[17px]">
              {site.description}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link href="/library" className="btn">
                进入藏品
              </Link>
              <Link
                href="/timeline"
                className="text-[13px] font-medium uppercase tracking-[0.2em] underline decoration-2 underline-offset-4"
              >
                按年份浏览
              </Link>
            </div>
          </div>

          <div className="col-span-12 flex items-end justify-start gap-8 lg:col-span-5 lg:justify-end">
            <MondrianPlate className="hidden sm:block" />
          </div>
        </div>
      </section>

      {/* ── index strip ──────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="grid grid-cols-12 gap-x-8 gap-y-10 border-b-2 border-line py-12">
          <div className="col-span-12 md:col-span-3">
            <p className="meta mb-4 text-ink">Four collections</p>
            <p className="text-[15px] leading-[1.85] text-ink-soft">
              电影、剧集、书籍、音乐各占一种原色。点任意一栏进入对应藏品。
            </p>
          </div>
          <div className="col-span-12 md:col-span-9 lg:col-span-7 lg:col-start-6">
            <CollectionRuler counts={stats.byType} total={stats.total} />
          </div>
        </div>
      </section>

      {/* ── spotlight ────────────────────────────────────── */}
      {spotlight.length ? (
        <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
          <div className="flex items-baseline justify-between border-b-2 border-line py-4">
            <span className="label-bar">Selected</span>
            <span className="num text-[13px]">
              {String(spotlight.length).padStart(2, "0")} / {String(stats.total).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-12">
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
                    className="relative overflow-hidden border-2 border-line bg-mist"
                    style={{ aspectRatio: index === 0 ? "1.34" : aspect(work.coverRatio) }}
                  >
                    <Cover
                      src={work.cover}
                      fallbackSrc={work.coverRemote}
                      title={work.title}
                      type={work.type}
                      eager={index === 0}
                      className="h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.035]"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10" />
                    <span className="absolute left-0 top-0 flex h-7 items-center bg-ink px-2">
                      <span className="specimen-no !text-paper">No.{work.no}</span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <h3 className="truncate text-[19px] font-semibold">{work.title}</h3>
                    <span
                      className="shrink-0 text-[12px] font-medium uppercase tracking-[0.18em]"
                      style={{ color: TYPE_MAP[work.type]?.ink }}
                    >
                      {typeLabel(work.type)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[14px] text-ink-soft">{workMetaLine(work)}</p>
                  {index === 0 && work.review ? (
                    <p className="mt-4 line-clamp-3 max-w-2xl border-l-2 border-line pl-4 text-[14px] leading-[1.9] text-ink-soft">
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
        <div className="flex items-baseline justify-between border-b-2 border-line py-4">
          <span className="label-bar">The wall</span>
          <Link
            href="/library"
            className="text-[13px] font-medium uppercase tracking-[0.2em] underline decoration-2 underline-offset-4"
          >
            全部 {stats.total} 件 →
          </Link>
        </div>

        <div className="mt-10 columns-1 gap-x-6 sm:columns-2 md:columns-3 xl:columns-4 [&>*]:mb-12 [&>*]:break-inside-avoid">
          {wallItems.map((work, index) => (
            <Reveal key={work.id} delay={(index % 8) * 40}>
              <WorkCard work={work} />
            </Reveal>
          ))}
        </div>

        {!wallItems.length && !spotlight.length ? (
          <p className="py-28 text-center text-[15px] text-ink-soft">
            标本册还是空的。登录后台，粘贴一个豆瓣链接开始吧。
          </p>
        ) : null}
      </section>

      {/* ── closing note ─────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-[1440px] px-5 sm:px-8">
        <div className="grid grid-cols-12 gap-8 border-t-2 border-line pt-10">
          <p className="col-span-12 max-w-xl text-[14px] leading-[1.95] text-ink-soft md:col-span-7">
            这里的条目没有排序算法，只有日期和手写的短评。想找某一件作品时，用顶部搜索，或到
            <Link
              href="/library"
              className="mx-1 underline decoration-2 underline-offset-4 hover:text-ink"
            >
              藏品库
            </Link>
            按类型、年份与标签筛选。
          </p>
          <p className="col-span-12 text-right text-[20px] font-semibold uppercase leading-tight tracking-[0.04em] text-ink-faint md:col-span-5">
            {site.taglineEn}
          </p>
        </div>
      </section>
    </div>
  );
}
