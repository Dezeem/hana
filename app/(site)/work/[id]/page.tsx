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

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8 sm:pt-12">
        <Link href="/library" className="meta underlink inline-flex items-center gap-2 text-ink-soft hover:text-ink">
          <ArrowLeft className="h-3 w-3" strokeWidth={1.4} />
          返回藏品库
        </Link>

        <div className="mt-10 grid grid-cols-12 gap-x-10 gap-y-12">
          {/* cover */}
          <div className="col-span-12 sm:col-span-7 lg:col-span-5 xl:col-span-4">
            <div className="sm:sticky sm:top-24">
              <div
                className="relative w-full overflow-hidden bg-line/30"
                style={{ aspectRatio: aspect(work.coverRatio), maxHeight: "78vh" }}
              >
                <Cover
                  src={work.cover}
                  fallbackSrc={work.coverRemote}
                  title={work.title}
                  type={work.type}
                  eager
                  className="h-full w-full"
                />
                <span className="pointer-events-none absolute left-0 top-0 bg-paper/90 px-2.5 py-1 backdrop-blur-sm">
                  <span className="specimen-no">No.{work.no}</span>
                </span>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="meta">Collected</p>
                  <p className="num mt-1 text-[12px] text-ink-soft">
                    {formatDate(work.finishedOn ?? work.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="meta">Status</p>
                  <p className="mt-1 text-[12px] text-ink-soft">{STATUS_META[work.status].zh}</p>
                </div>
              </div>

              {work.doubanUrl ? (
                <a
                  href={work.doubanUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="meta mt-5 inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-ink"
                >
                  豆瓣条目
                  <ExternalLink className="h-3 w-3" strokeWidth={1.4} />
                </a>
              ) : null}
            </div>
          </div>

          {/* content */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-8">
            <div className="flex items-center gap-3">
              <span className="inline-block h-[7px] w-[7px]" style={{ backgroundColor: type?.color }} />
              <span className="meta" style={{ color: type?.color }}>
                {type?.en} / {type?.zh}
              </span>
              <span className="h-px flex-1" style={{ backgroundColor: type?.color, opacity: 0.35 }} />
            </div>

            <h1 className="mt-5 font-display text-[32px] leading-[1.15] tracking-[-0.02em] text-ink sm:text-[44px]">
              {work.title}
            </h1>
            {work.originalTitle ? (
              <p className="mt-2 font-display text-[15px] italic text-ink-soft">{work.originalTitle}</p>
            ) : null}

            <p className="mt-6 font-serif text-[14px] text-ink-soft">
              {[work.creator, work.year ? String(work.year) : ""].filter(Boolean).join(" · ")}
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-x-12 gap-y-6 border-y border-line py-6">
              <div>
                <p className="meta mb-2">我的评分</p>
                <Rating value={work.rating} size="lg" />
              </div>
              {work.doubanRating !== null ? (
                <div>
                  <p className="meta mb-2">豆瓣评分</p>
                  <p className="num text-2xl text-ink-faint">{work.doubanRating.toFixed(1)}</p>
                </div>
              ) : null}
              <div className="ml-auto text-right">
                <p className="meta mb-2">Tags</p>
                <div className="flex max-w-[18rem] flex-wrap justify-end gap-1.5">
                  {work.tags.length ? (
                    work.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/library?tag=${encodeURIComponent(tag)}`}
                        className="border border-line px-2 py-0.5 text-[11px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                      >
                        {tag}
                      </Link>
                    ))
                  ) : (
                    <span className="text-[12px] text-ink-faint">—</span>
                  )}
                </div>
              </div>
            </div>

            {work.review ? (
              <blockquote className="mt-10 border-l border-line pl-6 sm:pl-8">
                <p className="meta mb-3">短评 · Note</p>
                <p className="whitespace-pre-line font-serif text-[15px] leading-[2.1] text-ink sm:text-[16px]">
                  {work.review}
                </p>
              </blockquote>
            ) : null}

            {work.summary ? (
              <div className="mt-10">
                <p className="meta mb-3">简介 · Synopsis</p>
                <p className="whitespace-pre-line font-serif text-[13px] leading-[2] text-ink-soft">
                  {work.summary}
                </p>
              </div>
            ) : null}

            {details.length ? (
              <dl className="mt-12 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-line pt-6 sm:grid-cols-2">
                {details.map((item) => (
                  <div key={item.label} className="flex gap-4 text-[12px]">
                    <dt className="meta w-20 shrink-0 pt-[3px]">{item.label}</dt>
                    <dd className="text-ink-soft">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <nav className="mt-14 flex items-center justify-between gap-6 border-t border-line pt-6">
              {prev ? (
                <Link href={`/work/${prev.id}`} className="group flex items-center gap-3 text-left">
                  <ArrowLeft className="h-3.5 w-3.5 text-ink-faint transition-transform group-hover:-translate-x-1" strokeWidth={1.4} />
                  <span>
                    <span className="meta block">上一件</span>
                    <span className="mt-1 block max-w-[11rem] truncate font-serif text-[13px] text-ink">
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
                    <span className="mt-1 block max-w-[11rem] truncate font-serif text-[13px] text-ink">
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
              <h2 className="meta text-ink">同标签藏品 · Related</h2>
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
