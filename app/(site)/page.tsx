import Link from "next/link";
import { Dices } from "lucide-react";
import { CollectionRuler } from "@/components/collection-ruler";
import { Cover } from "@/components/cover";
import { FourBar, FourDots } from "@/components/primary-bits";
import { Rating } from "@/components/rating";
import { Reveal } from "@/components/reveal";
import { WorkCard } from "@/components/work-card";
import { getDailyPick, getStats, listWorks } from "@/lib/db";
import type { Work } from "@/lib/db/types";
import { aspect, formatDate, typeLabel, workMetaLine } from "@/lib/utils";
import { site, STATUS_META, TYPE_MAP } from "@/site.config";

/** Spec band cells come from what the row actually holds — no empty placeholders. */
function dailySpecCells(work: Work): { label: string; value: string }[] {
  const cells: { label: string; value: string }[] = [
    { label: "类型", value: typeLabel(work.type) },
    { label: "年份", value: work.year ? String(work.year) : "—" },
    { label: "状态", value: STATUS_META[work.status].zh },
  ];

  const { meta } = work;
  if (meta.director?.length) cells.push({ label: "导演", value: meta.director.join(" / ") });
  if (meta.artist) cells.push({ label: "表演者", value: meta.artist });
  if (meta.region) cells.push({ label: "地区", value: meta.region });
  if (meta.runtime) cells.push({ label: "片长", value: meta.runtime });
  if (meta.publisher) cells.push({ label: "出版", value: meta.publisher });
  if (meta.pages) cells.push({ label: "页数", value: `${meta.pages} 页` });

  cells.push({ label: "收藏日", value: formatDate(work.finishedOn ?? work.createdAt) || "—" });
  cells.push({ label: "编号", value: work.no });

  return cells.slice(0, 6);
}

export default async function HomePage() {
  const stats = getStats();
  const featured = listWorks({ featuredOnly: true, limit: 3 });
  const wall = listWorks({ sort: "collected", limit: 36 });
  const daily = getDailyPick();

  const spotlight = featured.items.length ? featured.items : wall.items.slice(0, 3);
  // 24 divides evenly by 1, 2, 3 and 4, so a uniform grid ends flush at every
  // breakpoint instead of leaving a half-empty last row.
  const wallItems = wall.items
    .filter((work) => !spotlight.some((item) => item.id === work.id))
    .slice(0, 24);
  // Hero cover: the newest arrival reads as "this season"; fall back to a featured pick.
  const heroPick = listWorks({ sort: "collected", limit: 1 }).items[0] ?? spotlight[0] ?? null;

  const dailyColor = daily ? TYPE_MAP[daily.type]?.color : undefined;
  const dailySpecs = daily ? dailySpecCells(daily) : [];
  // Creator + original title say more than repeating the year already shown above.
  const dailySubline = daily
    ? [daily.creator, daily.originalTitle].filter(Boolean).join(" · ")
    : "";

  return (
    <div>
      {/* ── hero ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <FourBar />
        <div className="grid grid-cols-12 items-start gap-x-4 gap-y-14 border-b border-line pb-16 pt-12 sm:gap-x-8 sm:pt-16">
          <div className="col-span-12 lg:col-span-7">
            <span className="label-bar">Personal list</span>

            <h1 className="mt-8 font-serif text-[clamp(42px,8.2vw,118px)] font-medium leading-[0.96] tracking-[-0.02em]">
              看过的，
              <br />
              <span style={{ color: "var(--c-movie)" }}>都</span>
              <span style={{ color: "var(--c-series)" }}>记</span>
              <span style={{ color: "var(--c-book)" }}>在</span>这里。
            </h1>

            <p className="mt-9 max-w-[36rem] text-[18px] leading-[1.85] text-ink-soft sm:text-[19px]">
              {site.description}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link href="/library" className="btn">
                翻清单
              </Link>
              <Link
                href="/timeline"
                className="text-[15px] font-medium uppercase tracking-[0.08em] underline decoration-2 underline-offset-4"
              >
                按年份看
              </Link>
            </div>
          </div>

          <div className="col-span-12 hidden lg:col-span-5 lg:block">
            {heroPick ? (
              <div className="ml-auto w-full max-w-[460px]">
                <div
                  className="flex items-baseline justify-between border-b-2 pb-2"
                  style={{ borderBottomColor: "var(--ink)" }}
                >
                  <span className="label-bar">Featured</span>
                  <span className="meta">当季推荐 · 最新一件</span>
                </div>

                {/* cover and its caption sit side by side, so the block stays
                    roughly as tall as the headline on the left */}
                <div className="mt-6 flex items-start gap-5">
                  <Link
                    href={`/work/${heroPick.id}`}
                    className="group block w-[56%] shrink-0"
                  >
                    <div
                      className="relative overflow-hidden rounded-[var(--radius-card)] bg-mist"
                      style={{
                        aspectRatio: aspect(heroPick.coverRatio),
                        maxHeight: "min(46vh, 380px)",
                      }}
                    >
                      <Cover
                        src={heroPick.cover}
                        fallbackSrc={heroPick.coverRemote}
                        title={heroPick.title}
                        type={heroPick.type}
                        eager
                        sizes="(max-width: 1024px) 24vw, 260px"
                        className="h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
                      />
                      <span className="pointer-events-none absolute left-0 top-0 bg-paper/90 px-2 py-0.5 backdrop-blur-sm">
                        <span className="specimen-no text-[11px]">No.{heroPick.no}</span>
                      </span>
                      <span className="vertical-rl pointer-events-none absolute right-0 top-0 h-full border-l border-line bg-paper/90 px-1.5 py-3 backdrop-blur-sm">
                        <span className="specimen-no text-[11px] tracking-[0.28em]">
                          No.{heroPick.no} — {heroPick.year ?? "—"}
                        </span>
                      </span>
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <p
                      className="text-[11px] font-medium uppercase tracking-[0.1em]"
                      style={{ color: TYPE_MAP[heroPick.type]?.ink }}
                    >
                      {typeLabel(heroPick.type)}
                    </p>
                    <h2 className="mt-2 font-serif text-[21px] leading-[1.3] tracking-[-0.01em]">
                      <Link href={`/work/${heroPick.id}`} className="underlink">
                        {heroPick.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-[14px] leading-[1.7] text-ink-soft">
                      {workMetaLine(heroPick) || "—"}
                    </p>
                    <Link
                      href="/library"
                      className="mt-4 inline-flex items-center text-[12px] font-medium uppercase tracking-[0.08em] underline decoration-2 underline-offset-4 text-ink-soft hover:text-ink"
                    >
                      全部 {stats.total} 件 →
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── ticker ───────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-line bg-mist py-2.5">
        <div className="marquee flex w-max">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {Array.from({ length: 6 }).map((_, index) => (
                <span
                  key={index}
                  className="meta flex items-center gap-6 whitespace-nowrap pr-6 !text-ink-soft"
                >
                  <span>清单 · The list</span>
                  <span className="opacity-40">◆</span>
                  <span>{String(index + 1).padStart(3, "0")}</span>
                  <span className="opacity-40">◆</span>
                  <span className="flex items-center gap-1.5">
                    <span style={{ color: "var(--c-movie)" }}>红</span>
                    <span className="opacity-50">·</span>
                    <span style={{ color: "var(--c-series)" }}>蓝</span>
                    <span className="opacity-50">·</span>
                    <span style={{ color: "var(--c-book)" }}>黄</span>
                    <span className="opacity-50">·</span>
                    <span style={{ color: "var(--c-music)" }}>黑</span>
                  </span>
                  <span className="opacity-40">◆</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── index strip ──────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="grid grid-cols-12 gap-x-4 gap-y-10 border-b border-line py-12 sm:gap-x-8">
          <div className="col-span-12 md:col-span-3">
            <div className="infobox infobox-spectrum">
              <div className="infobox-head">
                <span className="meta">At a glance · 概览</span>
                <span className="num text-[11px] text-ink-soft">
                  {String(stats.total).padStart(3, "0")}
                </span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">名称</span>
                <span className="infobox-val">清单</span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">主人</span>
                <span className="infobox-val">{site.owner}</span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">作品</span>
                <span className="infobox-val">
                  电影 {stats.byType.movie} · 书籍 {stats.byType.book} · 音乐{" "}
                  {stats.byType.music}
                </span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">年份</span>
                <span className="infobox-val">
                  {stats.yearRange.from && stats.yearRange.to
                    ? `${stats.yearRange.from} – ${stats.yearRange.to}`
                    : "—"}
                </span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">编号</span>
                <span className="infobox-val num">
                  001 – {String(stats.total).padStart(3, "0")}
                </span>
              </div>
            </div>

            <p className="mt-4 text-[15px] leading-[1.8] text-ink-soft">
              三种作品，三种原色。点任意一栏，只看这一类。
            </p>
          </div>
          <div className="col-span-12 md:col-span-9 lg:col-span-7 lg:col-start-6">
            <CollectionRuler counts={stats.byType} total={stats.total} />
          </div>
        </div>
      </section>

      {/* ── today ────────────────────────────────────────── */}
      {daily ? (
        <section className="mx-auto mt-16 max-w-[1440px] px-5 sm:px-8">
          <div className="sticky top-24 z-20 flex items-baseline justify-between border-b border-line bg-paper py-4">
            <span className="flex items-baseline gap-4">
              <span className="meta text-ink-faint">01</span>
              <span className="label-bar">
                <FourDots />
                Today
              </span>
            </span>
            <span className="meta hidden sm:block">每日一件 · 今天就是它，零点后换一件</span>
            <span className="meta sm:hidden">每日一件</span>
          </div>

          <div className="mt-8 grid grid-cols-1 items-stretch gap-y-6 sm:grid-cols-12 sm:gap-x-8">
            <Link
              href={`/work/${daily.id}`}
              className="group max-w-[220px] self-start sm:col-span-4 sm:max-w-none lg:col-span-3"
            >
              <div
                className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-mist shadow-[0_1px_3px_rgb(16_19_22/0.07)] transition-shadow duration-500 group-hover:shadow-[0_10px_28px_-14px_rgb(16_19_22/0.35)]"
                style={{ aspectRatio: aspect(daily.coverRatio) }}
              >
                {/* a filing tab in the work's colour replaces the heavy frame */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 z-10 h-[3px]"
                  style={{ background: dailyColor }}
                />
                <Cover
                  src={daily.cover}
                  fallbackSrc={daily.coverRemote}
                  title={daily.title}
                  type={daily.type}
                  className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
            </Link>

            <div className="flex flex-col sm:col-span-8 lg:col-span-9">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="specimen-no">No.{daily.no}</span>
                  <span className="meta" style={{ color: dailyColor }}>
                    {typeLabel(daily.type)}
                  </span>
                  {daily.year ? (
                    <span className="num text-[13px] text-ink-faint">{daily.year}</span>
                  ) : null}
                </span>
                {daily.rating !== null ? (
                  <span className="flex items-baseline gap-2">
                    <span className="meta">我的评分</span>
                    <Rating value={daily.rating} color={dailyColor} />
                  </span>
                ) : null}
              </div>

              <h2 className="mt-3 font-serif text-[30px] leading-[1.12] tracking-[-0.015em] sm:text-[42px]">
                <Link href={`/work/${daily.id}`} className="underlink">
                  {daily.title}
                </Link>
              </h2>
              <span
                aria-hidden
                className="mt-4 block h-[3px] w-12"
                style={{ background: dailyColor }}
              />

              {dailySubline ? (
                <p className="mt-3 text-[15px] text-ink-soft">{dailySubline}</p>
              ) : null}

              {daily.review || daily.summary ? (
                <p
                  className="mt-5 line-clamp-3 max-w-[62ch] border-l-[3px] pl-4 text-[16px] leading-[1.85] text-ink-soft"
                  style={{ borderColor: dailyColor }}
                >
                  {daily.review || daily.summary}
                </p>
              ) : null}

              {daily.tags.length ? (
                <p className="mt-4 flex flex-wrap gap-1.5">
                  {daily.tags.slice(0, 6).map((tag) => (
                    <Link
                      key={tag}
                      href={`/library?tag=${encodeURIComponent(tag)}`}
                      className="rounded-full px-2.5 py-0.5 text-[12px] text-ink-soft transition-colors hover:text-ink"
                      style={{
                        background: `color-mix(in srgb, ${dailyColor} 12%, transparent)`,
                      }}
                    >
                      {tag}
                    </Link>
                  ))}
                </p>
              ) : null}

              {/* specs sink to the bottom as one data band, so the air collects
                  in a single interval instead of three floating blocks */}
              <div className="mt-auto pt-8">
                <dl
                  className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 sm:grid-cols-3 lg:grid-cols-6 lg:[&>*+*]:border-l lg:[&>*+*]:pl-5"
                  style={{ borderTopColor: `color-mix(in srgb, ${dailyColor} 32%, var(--line))` }}
                >
                  {dailySpecs.map((spec) => (
                    <div key={spec.label} className="min-w-0">
                      <dt className="meta text-[11px]">{spec.label}</dt>
                      <dd className="num mt-1 truncate text-[15px] text-ink">{spec.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href={`/work/${daily.id}`} className="btn">
                    查看详情
                  </Link>
                  <Link href="/random" className="btn btn-ghost inline-flex items-center gap-2">
                    <Dices className="h-4 w-4" strokeWidth={1.6} />
                    换一件
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── spotlight ────────────────────────────────────── */}
      {spotlight.length ? (
        <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
          <div className="sticky top-24 z-20 flex items-baseline justify-between border-b border-line bg-paper py-4">
            <span className="flex items-baseline gap-4">
              <span className="meta text-ink-faint">02</span>
              <span className="label-bar">Selected</span>
            </span>
            <span className="num text-[15px]">
              {String(spotlight.length).padStart(2, "0")} / {String(stats.total).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-x-3 gap-y-10 sm:gap-x-6 sm:gap-y-12">
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
                    className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-mist"
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
                    <span className="absolute left-2.5 top-2.5 flex h-6 items-center rounded-full bg-ink/80 px-2.5 backdrop-blur-sm">
                      <span className="specimen-no !text-paper text-[11px]">No.{work.no}</span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <h3 className="truncate text-[21px] font-semibold">{work.title}</h3>
                    <span
                      className="shrink-0 text-[12px] font-medium uppercase tracking-[0.08em]"
                      style={{ color: TYPE_MAP[work.type]?.ink }}
                    >
                      {typeLabel(work.type)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[16px] text-ink-soft">{workMetaLine(work)}</p>
                  {index === 0 && work.review ? (
                    <p className="mt-4 line-clamp-3 max-w-2xl border-l border-line pl-4 text-[16px] leading-[1.9] text-ink-soft">
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
        <div className="sticky top-24 z-20 flex items-baseline justify-between border-b border-line bg-paper py-4">
          <span className="flex items-baseline gap-4">
            <span className="meta text-ink-faint">03</span>
            <span className="label-bar">
              <FourDots />
              The wall
            </span>
          </span>
          <Link
            href="/library"
            className="text-[15px] font-medium uppercase tracking-[0.08em] underline decoration-2 underline-offset-4"
          >
            全部 {stats.total} 件 →
          </Link>
        </div>

        <div className="mt-10 columns-2 gap-x-4 md:columns-3 md:gap-x-6 xl:columns-4 [&>*]:mb-8 [&>*]:break-inside-avoid sm:[&>*]:mb-12">
          {wallItems.map((work, index) => (
            <Reveal key={work.id} delay={(index % 8) * 40}>
              <WorkCard work={work} uniform />
            </Reveal>
          ))}
        </div>

        {!wallItems.length && !spotlight.length ? (
          <p className="py-28 text-center text-[17px] text-ink-soft">
            这里还是空的。登录后台，粘一个豆瓣链接就能开始。
          </p>
        ) : null}
      </section>

      {/* ── closing note ─────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-[1440px] px-5 sm:px-8">
        <div className="grid grid-cols-12 items-start gap-4 border-t border-line pt-10 md:gap-8">
          <p className="col-span-12 max-w-xl text-[16px] leading-[1.95] text-ink-soft md:col-span-7">
            这里没有算法，只有收藏日期和手写的短评。想找具体某一件，用顶部搜索；只想随便看看，就去
            <Link
              href="/library"
              className="mx-1 underline decoration-2 underline-offset-4 hover:text-ink"
            >
              清单
            </Link>
            按类型、年份或标签筛一遍。
          </p>
          <p className="col-span-12 break-words text-balance text-right text-[clamp(15px,1.25vw,18px)] font-semibold uppercase leading-[1.4] tracking-[0.04em] text-ink-faint md:col-span-5">
            {site.taglineEn}
          </p>
        </div>
      </section>
    </div>
  );
}
