import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Cover } from "@/components/cover";
import { Rating } from "@/components/rating";
import { Reveal } from "@/components/reveal";
import { WorkCard } from "@/components/work-card";
import { getNeighbours, getRelated, getWork } from "@/lib/db";
import { workJsonLd } from "@/lib/structured-data";
import { STATUS_META, TYPE_MAP } from "@/site.config";
import { aspect, formatDate, typeLabel } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

function SectionHead({ no, zh, en }: { no: string; zh: string; en: string }) {
  return (
    <div className="sticky top-24 z-10 flex items-baseline gap-4 border-b border-line bg-paper pb-2 pt-3">
      <span className="num text-[13px] text-ink-faint">{no}</span>
      <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">{zh}</h2>
      <span className="meta ml-auto">{en}</span>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const work = getWork(Number(id));
  if (!work) return { title: "未找到作品" };
  return {
    title: work.title,
    description: work.review || work.summary || `${typeLabel(work.type)} · ${work.creator}`,
    openGraph: {
      title: work.title,
      description: work.review || work.summary,
      images: work.cover ? [{ url: work.cover }] : undefined,
    },
  };
}

export default async function WorkPage({ params }: PageProps) {
  const { id } = await params;
  const work = getWork(Number(id));
  if (!work) notFound();

  const related = getRelated(work, 8);
  const { prev, next } = getNeighbours(work.id);
  const type = TYPE_MAP[work.type];
  // Region comes from the fetched meta block, so the header says something
  // concrete instead of guessing a genre from tags.
  const region = work.meta.region ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = workJsonLd(work, baseUrl);
  const details: { label: string; value: string }[] = [];

  if (work.meta.director?.length) details.push({ label: "导演", value: work.meta.director.join(" / ") });
  if (work.meta.cast?.length) details.push({ label: "主演", value: work.meta.cast.join(" / ") });
  if (work.meta.runtime) details.push({ label: "片长", value: work.meta.runtime });
  if (work.meta.episodes) details.push({ label: "集数", value: String(work.meta.episodes) });
  if (work.meta.region) details.push({ label: "地区", value: work.meta.region });
  if (work.meta.publisher) details.push({ label: "出版", value: work.meta.publisher });
  if (work.meta.isbn) details.push({ label: "ISBN", value: work.meta.isbn });
  if (work.meta.pages) details.push({ label: "页数", value: work.meta.pages });
  if (work.meta.albumType) details.push({ label: "专辑类型", value: work.meta.albumType });
  if (work.meta.tracks) details.push({ label: "曲目", value: String(work.meta.tracks) });
  if (work.meta.language) details.push({ label: "语言 / 介质", value: work.meta.language });

  // Wiki-style contents: sections are numbered by those actually present.
  const sections = [
    { id: "facts", zh: "基本信息", en: "Facts" },
    ...(work.review ? [{ id: "note", zh: "短评", en: "Note" }] : []),
    ...(work.summary ? [{ id: "synopsis", zh: "简介", en: "Synopsis" }] : []),
    ...(work.tags.length ? [{ id: "tags", zh: "标签", en: "Tags" }] : []),
  ].map((section, index) => ({ ...section, no: String(index + 1).padStart(2, "0") }));

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8 sm:pt-12">
        <Link href="/library" className="meta underlink inline-flex items-center gap-2 text-ink-soft hover:text-ink">
          <ArrowLeft className="h-3 w-3" strokeWidth={1.4} />
          返回清单
        </Link>

        <div className="mt-10 grid grid-cols-12 gap-x-10 gap-y-12">
          {/* cover */}
          <div className="col-span-12 sm:col-span-7 lg:col-span-5 xl:col-span-4">
            <div className="sm:sticky sm:top-24">
              <div
                className="relative w-full overflow-hidden rounded-[var(--radius-card)] bg-mist"
                style={{ aspectRatio: aspect(work.coverRatio), maxHeight: "78vh" }}
              >
                <Cover
                  src={work.cover}
                  fallbackSrc={work.coverRemote}
                  title={work.title}
                  type={work.type}
                  eager
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 520px"
                  className="h-full w-full"
                />
                {/* narrow screens keep the horizontal badge; wide ones get the spine */}
                <span className="pointer-events-none absolute left-0 top-0 bg-paper/90 px-2.5 py-1 backdrop-blur-sm sm:hidden">
                  <span className="specimen-no">No.{work.no}</span>
                </span>
                <span className="vertical-rl pointer-events-none absolute right-0 top-0 hidden h-full border-l border-line bg-paper/90 px-2 py-3 backdrop-blur-sm sm:block">
                  <span className="specimen-no text-[12px] tracking-[0.3em]">
                    No.{work.no} — {work.year ?? "—"}
                  </span>
                </span>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="meta">Collected</p>
                  <p className="num mt-1 text-[15px] text-ink-soft">
                    {formatDate(work.finishedOn ?? work.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="meta">Status</p>
                  <p className="mt-1 text-[15px] text-ink-soft">{STATUS_META[work.status].zh}</p>
                </div>
              </div>

              <nav className="mt-6 hidden sm:block">
              <p className="meta border-b border-line pb-2">Contents · 目录</p>
              <ol>
                {sections.map((section) => (
                  <li key={section.id} className="border-b border-line last:border-0">
                    <a href={`#${section.id}`} className="group flex items-baseline py-2 text-[15px]">
                      <span className="num w-8 text-ink-faint">{section.no}</span>
                      <span className="text-ink-soft decoration-2 underline-offset-4 group-hover:text-ink group-hover:underline">
                        {section.zh}
                      </span>
                      <span className="toc-leader" />
                      <span className="meta">{section.en}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                {work.doubanUrl ? (
                  <a
                    href={work.doubanUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="meta inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                  >
                    豆瓣条目
                    <ExternalLink className="h-3 w-3" strokeWidth={1.4} />
                  </a>
                ) : null}
                <Link
                  href="/random"
                  className="meta inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                >
                  随机一件
                  <ArrowRight className="h-3 w-3" strokeWidth={1.4} />
                </Link>
              </div>
            </div>
          </div>

          {/* content */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-8">
            <div className="flex items-center gap-3">
              <span className="inline-block h-[7px] w-[7px]" style={{ backgroundColor: type?.color }} />
              <span className="meta" style={{ color: type?.color }}>
                {type?.en} / {type?.zh}
                {region ? <span className="text-ink-soft"> · {region}</span> : null}
              </span>
              <span className="h-px flex-1" style={{ backgroundColor: type?.color, opacity: 0.35 }} />
            </div>

            <h1 className="mt-5 font-serif text-[44px] font-medium leading-[1.04] tracking-[-0.01em] text-ink sm:text-[76px]">
              {work.title}
            </h1>
            <div
              className="mt-6 h-1 w-16 rounded-full"
              style={{ background: TYPE_MAP[work.type]?.color }}
              aria-hidden
            />
            {work.originalTitle ? (
              <p className="mt-2 font-display text-[17px] italic text-ink-soft">{work.originalTitle}</p>
            ) : null}

            <p className="mt-6 text-[16px] text-ink-soft">
              {[work.creator, work.year ? String(work.year) : ""].filter(Boolean).join(" · ") ||
                "—"}
            </p>

            {/* specimen card — an infobox tinted with the work's type colour */}
            <div
              className="infobox infobox-tinted mt-8"
              style={{ "--tc": type?.color } as CSSProperties}
            >
              <div className="infobox-head">
                <span className="meta">Info · 作品信息</span>
                <span className="specimen-no">No.{work.no}</span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">类型</span>
                <span className="infobox-val">{type?.zh ?? "—"}</span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">编号</span>
                <span className="infobox-val num">{work.no}</span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">年份</span>
                <span className="infobox-val num">{work.year ?? "—"}</span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">状态</span>
                <span className="infobox-val">{STATUS_META[work.status].zh}</span>
              </div>
              <div className="infobox-row">
                <span className="infobox-key">我的评分</span>
                <span className="infobox-val num">
                  {work.rating !== null ? `${work.rating.toFixed(0)} / 5` : "未评分"}
                </span>
              </div>
              {work.finishedOn ? (
                <div className="infobox-row">
                  <span className="infobox-key">收藏日</span>
                  <span className="infobox-val num">{formatDate(work.finishedOn)}</span>
                </div>
              ) : null}
              {work.doubanRating !== null ? (
                <div className="infobox-row">
                  <span className="infobox-key">豆瓣评分</span>
                  <span className="infobox-val num">{work.doubanRating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 border-y border-line py-5">
              <div>
                <p className="meta mb-1.5">我的评分</p>
                <Rating value={work.rating} size="lg" color={TYPE_MAP[work.type]?.color} />
              </div>
              {work.doubanRating !== null ? (
                <div>
                  <p className="meta mb-1">豆瓣评分</p>
                  <p className="num text-[26px] text-ink-faint">{work.doubanRating.toFixed(1)}</p>
                </div>
              ) : null}
              <div className="ml-auto">
                <p className="meta mb-1.5 text-right">收藏于</p>
                <p className="num text-right text-[15px] text-ink-soft">
                  {formatDate(work.finishedOn ?? work.createdAt)}
                </p>
              </div>
            </div>

            {sections.map((section) => (
              <section key={section.id} id={section.id} className="mt-14 scroll-mt-28">
                <SectionHead no={section.no} zh={section.zh} en={section.en} />

                {section.id === "facts" ? (
                  details.length ? (
                    <div
                      className="infobox infobox-tinted mt-6"
                      style={{ "--tc": type?.color } as CSSProperties}
                    >
                      {details.map((item) => (
                        <div key={item.label} className="infobox-row">
                          <span className="infobox-key">{item.label}</span>
                          <span className="infobox-val">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-6 text-[16px] text-ink-soft">
                      这件只留下了标题与年份，没有更多字段。
                    </p>
                  )
                ) : null}

                {section.id === "note" ? (
                  <blockquote className="cquote mt-6">
                    <p className="whitespace-pre-line font-serif text-[21px] leading-[1.9] text-ink sm:text-[23px]">
                      {work.review}
                    </p>
                  </blockquote>
                ) : null}

                {section.id === "synopsis" ? (
                  <p className="mt-6 whitespace-pre-line text-[17px] leading-[1.95] text-ink-soft">
                    {work.summary}
                  </p>
                ) : null}

                {section.id === "tags" ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {work.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/library?tag=${encodeURIComponent(tag)}`}
                        style={{ "--tc": TYPE_MAP[work.type]?.color } as CSSProperties}
                        className="border border-line px-2.5 py-1 text-[13px] text-ink-soft transition-colors hover:border-[var(--tc)] hover:text-ink"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}

            <nav className="mt-14 flex items-center justify-between gap-6 border-t border-line pt-6">
              {prev ? (
                <Link href={`/work/${prev.id}`} className="group flex items-center gap-3 text-left">
                  <ArrowLeft className="h-3.5 w-3.5 text-ink-faint transition-transform group-hover:-translate-x-1" strokeWidth={1.4} />
                  <span>
                    <span className="meta block">上一件</span>
                    <span className="mt-1 block max-w-[11rem] truncate text-[16px] text-ink">
                      {prev.title}
                    </span>
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/work/${next.id}`} className="group flex items-center gap-3 text-right">
                  <span>
                    <span className="meta block">下一件</span>
                    <span className="mt-1 block max-w-[11rem] truncate text-[16px] text-ink">
                      {next.title}
                    </span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-faint transition-transform group-hover:translate-x-1" strokeWidth={1.4} />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="mt-28 border-t border-line">
          <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8">
            <div className="flex items-baseline justify-between">
              <h2 className="meta text-ink">同标签作品 · Related</h2>
              <span className="meta">{related.length} pieces</span>
            </div>
            <div className="mt-8 flex gap-5 overflow-x-auto pb-6">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 40}>
                  <WorkCard work={item} variant="rail" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
