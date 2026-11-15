import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Dices } from "lucide-react";
import { Cover } from "@/components/cover";
import { DrawKeyHint } from "@/components/draw-key-hint";
import { FourDots } from "@/components/primary-bits";
import { Rating } from "@/components/rating";
import { getRandomWork, getStats } from "@/lib/db";
import { STATUS_META, TYPE_MAP } from "@/site.config";
import { aspect, typeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "抽签",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ from?: string }> };

export default async function DrawPage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  const stats = getStats();

  const wantsWishlist = from !== "all" && stats.byStatus.wish > 0;
  const work = getRandomWork(wantsWishlist ? "wish" : undefined);
  const nextHref = `/random?from=${wantsWishlist ? "wish" : "all"}&n=${Date.now().toString(36)}`;
  const type = work ? TYPE_MAP[work.type] : null;

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
      <div className="flex items-baseline justify-between border-b border-line py-4">
        <span className="label-bar">
          <FourDots />
          Draw
        </span>
        <span className="meta">
          {wantsWishlist
            ? `从 ${stats.byStatus.wish} 件「想接触」里抽`
            : `从全部 ${stats.total} 件里抽`}
        </span>
      </div>

      {!work ? (
        <p className="py-32 text-center text-[17px] text-ink-soft">
          标本册还是空的，没有可以抽的东西。
        </p>
      ) : (
        <>
          <div className="mt-12 grid grid-cols-12 gap-x-10 gap-y-12">
            <div className="col-span-12 sm:col-span-5 lg:col-span-4">
              <div
                className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-mist"
                style={{ aspectRatio: aspect(work.coverRatio), maxHeight: "70vh" }}
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
                <span className="pointer-events-none absolute left-0 top-0 bg-paper/90 px-2.5 py-1 backdrop-blur-sm">
                  <span className="specimen-no">No.{work.no}</span>
                </span>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="meta">Status</p>
                  <p className="mt-1 text-[15px] text-ink-soft">{STATUS_META[work.status].zh}</p>
                </div>
                <div className="text-right">
                  <p className="meta">Rating</p>
                  <div className="mt-1 flex justify-end">
                    <Rating value={work.rating} color={TYPE_MAP[work.type]?.color} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-[7px] w-[7px]"
                  style={{ backgroundColor: type?.color }}
                />
                <span className="meta" style={{ color: type?.color }}>
                  {type?.en} / {type?.zh}
                </span>
                <span
                  className="h-px flex-1"
                  style={{ backgroundColor: type?.color, opacity: 0.35 }}
                />
                <span className="meta">{typeLabel(work.type)}</span>
              </div>

              <h1 className="mt-5 font-display text-[40px] leading-[1.04] tracking-[-0.04em] text-ink sm:text-[68px]">
                {work.title}
              </h1>
              {work.originalTitle ? (
                <p className="mt-2 font-display text-[17px] italic text-ink-soft">
                  {work.originalTitle}
                </p>
              ) : null}

              <p className="mt-6 text-[16px] text-ink-soft">
                {[work.creator, work.year ? String(work.year) : ""].filter(Boolean).join(" · ") ||
                  "—"}
              </p>

              {work.review ? (
                <blockquote className="mt-8 border-l border-line pl-6 sm:pl-8">
                  <p className="meta mb-3">短评 · Note</p>
                  <p className="whitespace-pre-line font-serif text-[19px] leading-[1.9] text-ink">
                    {work.review}
                  </p>
                </blockquote>
              ) : null}

              {work.tags.length ? (
                <div className="mt-8 flex flex-wrap gap-1.5">
                  {work.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/library?tag=${encodeURIComponent(tag)}`}
                      className="border border-line px-2 py-0.5 text-[12px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-6">
                <Link href={nextHref} className="btn inline-flex items-center gap-2">
                  <Dices className="h-4 w-4" strokeWidth={1.6} />
                  再抽一件
                </Link>
                <Link
                  href={`/work/${work.id}`}
                  className="inline-flex items-center gap-2 text-[15px] font-medium uppercase tracking-[0.08em] underline decoration-2 underline-offset-4"
                >
                  打开这件
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />
                </Link>
                <div className="ml-auto flex items-center gap-4">
                  <Link
                    href={`/random?from=${wantsWishlist ? "all" : "wish"}`}
                    className="meta underlink"
                  >
                    {wantsWishlist ? "改成从全部抽" : "改成从想接触抽"}
                  </Link>
                  <DrawKeyHint />
                </div>
              </div>
            </div>
          </div>

          <p className="mt-16 border-t border-line pt-6 text-[15px] leading-[1.9] text-ink-soft">
            抽签不是推荐算法——它没有偏好，也不学习你。抽到不喜欢的，就再抽一次；抽到忘记了的，
            正好重看一遍。
          </p>
        </>
      )}
    </div>
  );
}
