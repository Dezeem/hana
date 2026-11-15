import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Search, X } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { bulkAction } from "@/app/actions/works";
import { requireAdmin } from "@/lib/auth/session";
import { listWorksForAdmin } from "@/lib/db";
import type { WorkStatus } from "@/site.config";
import { STATUS_META, WORK_TYPES, type WorkType } from "@/site.config";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "作品管理",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 40;
const TYPE_KEYS = new Set(WORK_TYPES.map((item) => item.key));
const STATUS_KEYS = new Set(Object.keys(STATUS_META));

const SORTS = [
  { key: "updated", label: "最近编辑" },
  { key: "created", label: "最近收录" },
  { key: "collected", label: "收藏日" },
  { key: "rating", label: "我的评分" },
  { key: "year", label: "作品年份" },
  { key: "title", label: "标题" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];
const SORT_KEYS = new Set<string>(SORTS.map((item) => item.key));

function one(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim();
}

export default async function AdminWorksPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  const q = one(params.q).slice(0, 80);
  const rawType = one(params.type);
  const type = TYPE_KEYS.has(rawType as WorkType) ? (rawType as WorkType) : null;
  const rawStatus = one(params.status);
  const status = STATUS_KEYS.has(rawStatus) ? (rawStatus as WorkStatus) : null;
  const tag = one(params.tag).slice(0, 40);
  const unreviewed = one(params.unreviewed) === "1";
  const untagged = one(params.untagged) === "1";
  const rawSort = one(params.sort);
  const sort: SortKey = SORT_KEYS.has(rawSort) ? (rawSort as SortKey) : "updated";
  const page = Math.max(Number(one(params.page)) || 1, 1);

  const { items, total } = listWorksForAdmin({
    q: q || undefined,
    types: type ? [type] : undefined,
    status: status ?? undefined,
    tags: tag ? [tag] : undefined,
    unreviewed,
    untagged,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const base: Record<string, string> = {};
  if (q) base.q = q;
  if (type) base.type = type;
  if (status) base.status = status;
  if (tag) base.tag = tag;
  if (unreviewed) base.unreviewed = "1";
  if (untagged) base.untagged = "1";
  if (sort !== "updated") base.sort = sort;
  if (page > 1) base.page = String(page);

  function href(overrides: Record<string, string | null> = {}): string {
    const search = new URLSearchParams(base);
    for (const [key, value] of Object.entries(overrides)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    // Any filter or sort change starts again from the first page.
    search.delete("page");
    const query = search.toString();
    return query ? `/admin/works?${query}` : "/admin/works";
  }

  function pageHref(target: number): string {
    const search = new URLSearchParams(base);
    if (target > 1) search.set("page", String(target));
    else search.delete("page");
    const query = search.toString();
    return query ? `/admin/works?${query}` : "/admin/works";
  }

  const backQuery = new URLSearchParams(base).toString();
  const hasFilters = Boolean(q || type || status || tag || unreviewed || untagged);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="meta mb-3">Manage</p>
            <h1 className="font-display text-[30px] leading-none text-ink">作品管理</h1>
            <p className="mt-3 text-[16px] text-ink-soft">
              共 {total} 件{hasFilters ? "（已筛选）" : ""}，第 {Math.min(page, pages)} / {pages} 页。
            </p>
          </div>
          <Link href="/admin/works/new" className="btn">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
            新建作品
          </Link>
        </div>

        {/* search */}
        <form method="get" action="/admin/works" className="mt-8 flex flex-wrap items-center gap-2">
          {type ? <input type="hidden" name="type" value={type} /> : null}
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          {sort !== "updated" ? <input type="hidden" name="sort" value={sort} /> : null}
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
              strokeWidth={1.6}
              aria-hidden
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="搜标题 / 创作者 / 标签 / 短评"
              aria-label="搜索作品"
              className="w-full border border-line bg-transparent py-2 pl-8 pr-8 text-[15px] text-ink outline-none transition-colors focus:border-ink"
            />
            {q ? (
              <Link
                href={href({ q: null })}
                aria-label="清除搜索"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.6} />
              </Link>
            ) : null}
          </label>
          <button type="submit" className="btn px-3 py-2 text-[12px]">
            搜索
          </button>
          {hasFilters ? (
            <Link href="/admin/works" className="meta underline decoration-2 underline-offset-4">
              重置
            </Link>
          ) : null}
        </form>

        {/* filters */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="meta w-10 shrink-0">类型</span>
            <Link
              href={href({ type: null })}
              className={cn(
                "border px-3 py-1 text-[12px] transition-colors",
                !type ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:text-ink",
              )}
            >
              全部
            </Link>
            {WORK_TYPES.map((item) => (
              <Link
                key={item.key}
                href={href({ type: type === item.key ? null : item.key })}
                className={cn(
                  "flex items-center gap-2 border px-3 py-1 text-[12px] transition-colors",
                  type === item.key
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft hover:text-ink",
                )}
              >
                <span
                  className="inline-block h-[6px] w-[6px]"
                  style={{ backgroundColor: type === item.key ? "currentColor" : item.color }}
                />
                {item.zh}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="meta w-10 shrink-0">状态</span>
            <Link
              href={href({ status: null })}
              className={cn(
                "border px-3 py-1 text-[12px] transition-colors",
                !status
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-soft hover:text-ink",
              )}
            >
              全部
            </Link>
            {(Object.keys(STATUS_META) as WorkStatus[]).map((key) => (
              <Link
                key={key}
                href={href({ status: status === key ? null : key })}
                className={cn(
                  "border px-3 py-1 text-[12px] transition-colors",
                  status === key
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft hover:text-ink",
                )}
              >
                {STATUS_META[key].zh}
              </Link>
            ))}
            {tag ? (
              <Link
                href={href({ tag: null })}
                className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-ink px-3 py-1 text-[12px] text-ink"
              >
                标签：{tag}
                <X className="h-3 w-3" strokeWidth={1.8} />
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="meta w-10 shrink-0">维护</span>
            <Link
              href={href({ unreviewed: unreviewed ? null : "1" })}
              className={cn(
                "border px-3 py-1 text-[12px] transition-colors",
                unreviewed
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-soft hover:text-ink",
              )}
            >
              未写短评
            </Link>
            <Link
              href={href({ untagged: untagged ? null : "1" })}
              className={cn(
                "border px-3 py-1 text-[12px] transition-colors",
                untagged
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-soft hover:text-ink",
              )}
            >
              没有标签
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="meta w-10 shrink-0">排序</span>
            {SORTS.map((item) => (
              <Link
                key={item.key}
                href={href({ sort: item.key === "updated" ? null : item.key })}
                className={cn(
                  "border px-3 py-1 text-[12px] transition-colors",
                  sort === item.key
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <form action={bulkAction} className="mt-8">
          <div className="flex flex-wrap items-center gap-3 border-y border-line py-3">
            <span className="meta">批量操作</span>
            <select
              name="op"
              className="cursor-pointer border border-line bg-transparent px-2 py-1 text-[12px] text-ink outline-none focus:border-ink"
              defaultValue="done"
            >
              <option value="done">标记为已完成</option>
              <option value="doing">标记为进行中</option>
              <option value="wish">标记为待开始</option>
              <option value="tag">添加标签</option>
              <option value="untag">移除标签</option>
              <option value="feature">设为首页推荐</option>
              <option value="unfeature">取消首页推荐</option>
              <option value="delete">删除所选</option>
            </select>
            <input
              name="tag"
              placeholder="标签，逗号分隔"
              aria-label="批量标签"
              className="w-40 border border-line bg-transparent px-2 py-1 text-[12px] text-ink outline-none placeholder:text-ink-faint focus:border-ink"
            />
            <select
              name="bulkType"
              aria-label="批量修改类型"
              className="cursor-pointer border border-line bg-transparent px-2 py-1 text-[12px] text-ink outline-none focus:border-ink"
              defaultValue=""
            >
              <option value="">类型不变</option>
              {WORK_TYPES.map((item) => (
                <option key={item.key} value={item.key}>
                  改为{item.zh}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-ghost px-3 py-1 text-[12px]">
              应用到所选
            </button>
            <input type="hidden" name="back" value={backQuery} />
            <span className="meta ml-auto hidden sm:block">勾选行首复选框后执行</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="w-8 py-3" />
                  <th className="meta py-3 font-normal">No.</th>
                  <th className="meta py-3 font-normal">标题</th>
                  <th className="meta hidden py-3 font-normal sm:table-cell">类型</th>
                  <th className="meta hidden py-3 font-normal md:table-cell">标签</th>
                  <th className="meta hidden py-3 font-normal lg:table-cell">短评</th>
                  <th className="meta hidden py-3 font-normal md:table-cell">评分</th>
                  <th className="meta hidden py-3 font-normal lg:table-cell">更新</th>
                  <th className="meta py-3 text-right font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((work) => (
                  <tr key={work.id} className="border-t border-line align-middle">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        name="ids"
                        value={work.id}
                        aria-label={`选择 ${work.title}`}
                        className="h-3.5 w-3.5 accent-ink"
                      />
                    </td>
                    <td className="specimen-no py-3">{work.no}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-7 shrink-0 overflow-hidden bg-mist">
                          {work.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={work.cover} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/admin/works/${work.id}`}
                            className="block max-w-[16rem] truncate text-[16px] text-ink decoration-2 underline-offset-4 hover:underline"
                          >
                            {work.title}
                          </Link>
                          <span className="block max-w-[16rem] truncate text-[12px] text-ink-faint">
                            {[work.creator, work.year, STATUS_META[work.status].zh]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        {work.featured ? (
                          <span className="meta shrink-0 text-music">推荐</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="meta hidden py-3 sm:table-cell">
                      {WORK_TYPES.find((item) => item.key === work.type)?.zh}
                    </td>
                    <td className="hidden py-3 md:table-cell">
                      {work.tags.length ? (
                        <span className="flex flex-wrap gap-1">
                          {work.tags.slice(0, 2).map((item) => (
                            <Link
                              key={item}
                              href={href({ tag: item })}
                              className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                            >
                              {item}
                            </Link>
                          ))}
                          {work.tags.length > 2 ? (
                            <span className="num px-1 text-[11px] text-ink-faint">
                              +{work.tags.length - 2}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-[12px] text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="hidden max-w-[18rem] py-3 lg:table-cell">
                      {work.review ? (
                        <span
                          title={work.review}
                          className="block truncate text-[13px] text-ink-soft"
                        >
                          {work.review}
                        </span>
                      ) : (
                        <span className="text-[12px] text-ink-faint">未写</span>
                      )}
                    </td>
                    <td className="num hidden py-3 text-[15px] text-ink-soft md:table-cell">
                      {work.rating?.toFixed(1) ?? "—"}
                    </td>
                    <td className="num hidden py-3 text-[12px] text-ink-faint lg:table-cell">
                      {formatDate(work.updatedAt)}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/works/${work.id}`}
                        className="meta underlink text-ink-soft hover:text-ink"
                      >
                        编辑
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>

        {pages > 1 ? (
          <nav className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4">
            <span className="meta">
              第 {Math.min(page, pages)} / {pages} 页 · 每页 {PAGE_SIZE} 件
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="btn btn-ghost px-3 py-1 text-[12px]">
                  上一页
                </Link>
              ) : (
                <span className="meta opacity-40">上一页</span>
              )}
              {page < pages ? (
                <Link href={pageHref(page + 1)} className="btn btn-ghost px-3 py-1 text-[12px]">
                  下一页
                </Link>
              ) : (
                <span className="meta opacity-40">下一页</span>
              )}
            </div>
          </nav>
        ) : null}

        {!items.length ? (
          <div className="py-24 text-center">
            <p className="text-[26px] font-semibold uppercase text-ink-faint">Nothing yet</p>
            <p className="mt-3 text-[16px] text-ink-soft">
              {hasFilters ? "没有符合条件的作品，换个关键词或清掉筛选。" : "这个分类下还没有作品。"}
            </p>
          </div>
        ) : null}
      </main>
    </>
  );
}
