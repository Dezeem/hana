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
  const wallItems = wall.items.filter((work) => !spotlight.some((item) => item.id === work.id));
  const latest = listWorks({ sort: "collected", limit: 5 }).items;

  const dailyColor = daily ? TYPE_MAP[daily.type]?.color : undefined;
  const dailySpecs = daily ? dailySpecCells(daily) : [];

  return (
    <div>
      {/* ── hero ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <FourBar />
        <div className="grid grid-cols-12 items-start gap-x-8 gap-y-14 border-b border-line pb-16 pt-12 sm:pt-16">
          <div className="col-span-12 lg:col-span-7">
            <span className="label-bar">Personal list</span>

            <h1 className="mt-8 text-[clamp(42px,8.2vw,118px)] font-semibold leading-[0.94] tracking-[-0.045em]">
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
            <div className="ml-auto w-full max-w-[460px]">
              <div
                className="flex items-baseline justify-between border-b-2 pb-2"
                style={{ borderBottomColor: "var(--ink)" }}
              >
                <span className="label-bar">Latest</span>
                <span className="meta">最近收进来的五件</span>
              </div>

              <ol>
                {latest.map((work) => (
                  <li key={work.id}>
                    <Link
                      href={`/work/${work.id}`}
                      className="group flex items-baseline gap-3 border-b border-line py-3"
                    >
                      <span className="num shrink-0 text-[12px] text-ink-faint">
                        {work.no}
                      </span>
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 self-center"
                        style={{ background: TYPE_MAP[work.type]?.color }}
                      />
                      <span className="truncate text-[17px] font-medium decoration-2 underline-offset-4 group-hover:underline">
                        {work.title}
                      </span>
                      <span className="toc-leader" />
                      <span className="num shrink-0 text-[13px] text-ink-soft">
                        {formatDate(work.finishedOn) || "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>

              <Link
                href="/library"
                className="mt-5 inline-flex items-center text-[13px] font-medium uppercase tracking-[0.08em] underline decoration-2 underline-offset-4 hover:text-ink-soft"
              >
                全部 {stats.total} 件 →
              </Link>
            </div>
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
        <div className="grid grid-cols-12 gap-x-8 gap-y-10 border-b border-line py-12">
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
          <div className="flex items-baseline justify-between border-b border-line py-4">
            <span className="label-bar">
              <FourDots />
              Today
            </span>
            <span className="meta">每日一件 · 今天就是它，零点后换一件</span>
          </div>

          <div className="mt-8 grid grid-cols-12 items-stretch gap-x-8 gap-y-6">
            <Link
              href={`/work/${daily.id}`}
              className="group col-span-5 sm:col-span-4 lg:col-span-3"
            >
              <div
                className="relative overflow-hidden rounded-[var(--radius-card)] border-2 bg-mist"
                style={{
                  aspectRatio: aspect(daily.coverRatio),
                  borderColor: TYPE_MAP[daily.type]?.color,
                }}
              >
                <Cover
                  src={daily.cover}
                  fallbackSrc={daily.coverRemote}
                  title={daily.title}
                  type={daily.type}
                  className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
            </Link>

            <div className="col-span-7 flex flex-col sm:col-span-8 lg:col-span-9">
              <p className="meta flex flex-wrap items-center gap-x-3">
                <span className="num text-ink">No.{daily.no}</span>
                <span style={{ color: dailyColor }}>{typeLabel(daily.type)}</span>
                {daily.year ? <span>{daily.year}</span> : null}
              </p>

              <h2 className="mt-3 font-display text-[28px] leading-[1.08] tracking-[-0.03em] sm:text-[40px]">
                <Link href={`/work/${daily.id}`} className="underlink">
                  {daily.title}
                </Link>
              </h2>

              <p className="mt-2 text-[15px] text-ink-soft">
                {workMetaLine(daily) || daily.originalTitle || "—"}
              </p>

              {daily.review || daily.summary ? (
                <p
                  className="mt-4 line-clamp-3 max-w-[62ch] border-l-2 pl-4 text-[15px] leading-[1.85] text-ink-soft"
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

              <dl
                className="mt-6 grid flex-1 grid-cols-2 content-center gap-x-6 gap-y-4 border-t pt-5 sm:grid-cols-3 lg:grid-cols-6"
                style={{ borderTopColor: `color-mix(in srgb, ${dailyColor} 32%, var(--line))` }}
              >
                {dailySpecs.map((spec) => (
                  <div key={spec.label} className="min-w-0">
                    <dt className="meta">{spec.label}</dt>
                    <dd className="num mt-1 truncate text-[16px] text-ink">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                <Link href={`/work/${daily.id}`} className="btn">
                  查看详情
                </Link>
                <Link href="/random" className="btn btn-ghost inline-flex items-center gap-2">
                  <Dices className="h-4 w-4" strokeWidth={1.6} />
                  换一件
                </Link>
                {daily.rating !== null ? (
                  <span className="ml-auto">
                    <Rating value={daily.rating} color={TYPE_MAP[daily.type]?.color} />
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── spotlight ────────────────────────────────────── */}
      {spotlight.length ? (
        <section className="mx-auto max-w-[1440px] px-5 sm:px-8">
          <div className="flex items-baseline justify-between border-b border-line py-4">
            <span className="label-bar">Selected</span>
            <span className="num text-[15px]">
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
        <div className="flex items-baseline justify-between border-b border-line py-4">
          <span className="label-bar">
            <FourDots />
            The wall
          </span>
          <Link
            href="/library"
            className="text-[15px] font-medium uppercase tracking-[0.08em] underline decoration-2 underline-offset-4"
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
          <p className="py-28 text-center text-[17px] text-ink-soft">
            这里还是空的。登录后台，粘一个豆瓣链接就能开始。
          </p>
        ) : null}
      </section>

      {/* ── closing note ─────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-[1440px] px-5 sm:px-8">
        <div className="grid grid-cols-12 items-start gap-8 border-t border-line pt-10">
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
