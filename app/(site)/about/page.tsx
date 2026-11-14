import Link from "next/link";
import type { Metadata } from "next";
import { getStats } from "@/lib/db";
import { site, WORK_TYPES } from "@/site.config";

export const metadata: Metadata = {
  title: "关于",
  description: "这间标本室的来历、方法与数据来源。",
};

export default function AboutPage() {
  const stats = getStats();
  const maxRating = Math.max(...stats.ratingBuckets.map((bucket) => bucket.count), 1);

  return (
    <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
      <header className="pb-14 pt-12 sm:pt-16">
        <p className="meta mb-4 flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-line-strong" />
          Colophon
        </p>
        <h1 className="max-w-2xl font-display text-[46px] leading-[1.05] tracking-[-0.04em] text-ink sm:text-[76px]">
          {site.about.heading}
        </h1>
      </header>

      <div className="grid grid-cols-12 gap-x-10 gap-y-12 border-t border-line pt-10">
        <div className="col-span-12 md:col-span-7">
          {site.about.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "text-[17px] leading-[2.1] text-ink first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-[56px] first-letter:leading-[0.8] first-letter:text-ink"
                  : "mt-6 text-[17px] leading-[2.1] text-ink-soft"
              }
            >
              {paragraph}
            </p>
          ))}

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <a href={`mailto:${site.email}`} className="btn">
              写信给我
            </a>
            <Link href="/library" className="meta underlink text-ink-soft hover:text-ink">
              看看藏品
            </Link>
          </div>
        </div>

        <aside className="col-span-12 md:col-span-5">
          <div className="border border-line p-6">
            <p className="meta mb-5">Collection at a glance</p>

            <div className="mb-8 flex items-baseline gap-3">
              <span className="num font-display text-[52px] leading-none text-ink">
                {String(stats.total).padStart(3, "0")}
              </span>
              <span className="meta pb-2">specimens</span>
            </div>

            <ul className="space-y-3">
              {WORK_TYPES.map((type) => {
                const count = stats.byType[type.key] ?? 0;
                const width = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <li key={type.key}>
                    <div className="flex items-baseline justify-between text-[15px]">
                      <span className="text-ink">{type.zh}</span>
                      <span className="num text-ink-soft">{count}</span>
                    </div>
                    <div className="mt-1.5 h-px w-full bg-line">
                      <div
                        className="h-px"
                        style={{ width: `${Math.max(width, 1)}%`, backgroundColor: type.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 border-t border-line pt-5">
              <p className="meta mb-3">Rating spread</p>
              <div className="flex h-16 items-end gap-2">
                {stats.ratingBuckets.map((bucket) => (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full bg-ink/80 transition-all"
                      style={{ height: `${Math.max((bucket.count / maxRating) * 100, 2)}%` }}
                    />
                    <span className="num text-[10px] text-ink-faint">{bucket.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-ink-soft">
                平均 {stats.averageRating ? stats.averageRating.toFixed(2) : "—"} / 5.00
              </p>
            </div>

            {stats.topTags.length ? (
              <div className="mt-8 border-t border-line pt-5">
                <p className="meta mb-3">Most used tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.topTags.slice(0, 10).map((tag) => (
                    <Link
                      key={tag.tag}
                      href={`/library?tag=${encodeURIComponent(tag.tag)}`}
                      className="border border-line px-2 py-0.5 text-[12px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    >
                      {tag.tag}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {/* legend & playful bits */}
      <section className="mt-20 grid grid-cols-12 gap-x-10 gap-y-10 border-t border-line pt-8">
        <div className="col-span-12 md:col-span-5">
          <p className="meta mb-4">Legend · 图例</p>
          <ul className="space-y-2 text-[15px] text-ink-soft">
            <li>
              <span className="mr-2 inline-block h-2.5 w-2.5 bg-ink align-middle" />
              已收藏 · 看过、读完、听过
            </li>
            <li>
              <span className="mr-2 inline-block h-2.5 w-2.5 border border-ink align-middle" />
              进行中 · 还没结束
            </li>
            <li>
              <span className="mr-2 inline-block h-2.5 w-2.5 border border-line-strong align-middle" />
              想接触 · 躺在清单里
            </li>
            <li className="pt-2 text-[13px] text-ink-faint">
              四色分别代表电影、剧集、书籍、音乐；每件作品有一个三位编号，编号不会回收。
            </li>
          </ul>
        </div>

        <div className="col-span-12 md:col-span-7">
          <p className="meta mb-4">How to poke around · 玩法</p>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-3 text-[15px] text-ink-soft sm:grid-cols-2">
            <li>
              <kbd className="mr-2 border border-line px-1.5 py-0.5 text-[12px] text-ink">?</kbd>
              叫出快捷键清单
            </li>
            <li>
              <kbd className="mr-2 border border-line px-1.5 py-0.5 text-[12px] text-ink">/</kbd>
              直接开始搜索
            </li>
            <li>
              <Link href="/random" className="underlink">
                抽签
              </Link>
              ：从「想接触」里随便挑一件，按 R 再抽
            </li>
            <li>
              <Link href="/library?sort=random" className="underlink">
                摇一摇
              </Link>
              ：把整个藏品库洗成随机顺序
            </li>
            <li className="sm:col-span-2">
              <kbd className="mr-2 border border-line px-1.5 py-0.5 text-[12px] text-ink">
                ↑ ↑ ↓ ↓ ← → ← → B A
              </kbd>
              有一个隐藏版面
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-20 border-t border-line pt-8">
        <p className="meta mb-4">Colophon</p>
        <p className="max-w-2xl text-[15px] leading-[2] text-ink-faint">
          {site.about.colophon}
        </p>
        <p className="mt-6 font-display text-[18px] italic text-ink-faint">{site.taglineEn}</p>
      </section>
    </div>
  );
}
