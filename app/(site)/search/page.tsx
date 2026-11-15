import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { WorkCard } from "@/components/work-card";
import { listTags, listWorks } from "@/lib/db";
import { searchWorks } from "@/lib/search";
import { TYPE_MAP } from "@/site.config";
import { FourBar } from "@/components/primary-bits";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  return {
    title: q ? `搜索「${q}」` : "搜索",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").slice(0, 80).trim();

  const hits = query ? searchWorks(query, 60) : [];
  const works = hits.map((hit) => hit.work);
  const tags = listTags().slice(0, 16);
  const recent = query ? [] : listWorks({ limit: 8 }).items;

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
      <header className="pb-10 pt-12 sm:pt-16">
        <p className="meta mb-4 flex items-center gap-3">
          <FourBar className="h-1 w-8 shrink-0" />
          Full-text search
        </p>

        <form action="/search" method="get" className="max-w-2xl">
          <div className="flex items-end gap-4 border-b border-ink pb-3">
            <Search className="mb-1.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.4} />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="标题、导演、标签，或一句短评"
              autoFocus={!query}
              aria-label="搜索藏品"
              className="w-full bg-transparent text-[26px] font-medium text-ink outline-none placeholder:text-ink-faint sm:text-[36px]"
            />
            <button type="submit" className="meta shrink-0 pb-1.5 text-ink-soft hover:text-ink">
              检索
            </button>
          </div>
        </form>

        <p className="mt-5 text-[16px] text-ink-soft">
          {query ? (
            <>
              找到 <span className="num text-ink">{works.length}</span> 件与「{query}」相关的藏品
            </>
          ) : (
            "输入关键词开始检索。标题、原名、创作者、标签、简介与短评都会被匹配。"
          )}
        </p>
      </header>

      {works.length ? (
        <div className="columns-1 gap-x-5 sm:columns-2 md:columns-3 xl:columns-4 [&>*]:mb-9 [&>*]:break-inside-avoid">
          {works.map((work, index) => (
            <Reveal key={work.id} delay={(index % 6) * 40} className="break-inside-avoid">
              <WorkCard work={work} eager={index < 4} />
            </Reveal>
          ))}
        </div>
      ) : query ? (
        <div className="border-t border-line py-24 text-center">
          <p className="text-[32px] font-semibold uppercase tracking-[-0.02em] text-ink-faint">Nothing matched</p>
          <p className="mx-auto mt-4 max-w-sm text-[16px] leading-relaxed text-ink-soft">
            没有找到「{query}」。试试更短的关键词，或者按标签浏览。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {tags.slice(0, 8).map((tag) => (
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
      ) : (
        <div className="grid grid-cols-12 gap-x-8 gap-y-12 border-t border-line pt-8">
          <section className="col-span-12 md:col-span-4">
            <h2 className="meta mb-4 text-ink">常用标签</h2>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Link
                  key={tag.tag}
                  href={`/search?q=${encodeURIComponent(tag.tag)}`}
                  className="border border-line px-2 py-0.5 text-[12px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {tag.tag}
                  <span className="ml-1 opacity-75">{tag.count}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="col-span-12 md:col-span-8">
            <h2 className="meta mb-4 text-ink">最近收录</h2>
            <ul>
              {recent.map((work) => (
                <li key={work.id}>
                  <Link
                    href={`/work/${work.id}`}
                    className="flex items-center gap-4 border-b border-line py-3 transition-colors hover:bg-ink/[0.02]"
                  >
                    <span className="specimen-no w-10 shrink-0">No.{work.no}</span>
                    <span className="min-w-0 flex-1 truncate text-[16px] text-ink">
                      {work.title}
                    </span>
                    <span className="meta shrink-0" style={{ color: TYPE_MAP[work.type]?.color }}>
                      {TYPE_MAP[work.type]?.zh}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
