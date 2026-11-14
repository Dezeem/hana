import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { bulkAction } from "@/app/actions/works";
import { requireAdmin } from "@/lib/auth/session";
import { listWorks } from "@/lib/db";
import { STATUS_META, WORK_TYPES, type WorkType } from "@/site.config";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "藏品管理",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TYPE_KEYS = new Set(WORK_TYPES.map((item) => item.key));

export default async function AdminWorksPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const rawType = typeof params.type === "string" ? params.type : "";
  const type = TYPE_KEYS.has(rawType as WorkType) ? (rawType as WorkType) : null;

  const { items, total } = listWorks({
    types: type ? [type] : undefined,
    limit: 96,
  });

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="meta mb-3">Manage</p>
            <h1 className="font-display text-[30px] leading-none text-ink">藏品管理</h1>
            <p className="mt-3 text-[16px] text-ink-soft">
              共 {total} 件，当前显示 {items.length} 件。
            </p>
          </div>
          <Link href="/admin/works/new" className="btn">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
            新建作品
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link
            href="/admin/works"
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
              href={`/admin/works?type=${item.key}`}
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

        <form action={bulkAction} className="mt-8">
          <div className="flex flex-wrap items-center gap-3 border-y border-line py-3">
            <span className="meta">批量操作</span>
            <select
              name="op"
              className="cursor-pointer border border-line bg-transparent px-2 py-1 text-[12px] text-ink outline-none focus:border-ink"
              defaultValue="done"
            >
              <option value="done">标记为已收藏</option>
              <option value="doing">标记为进行中</option>
              <option value="wish">标记为想接触</option>
              <option value="feature">设为首页展品</option>
              <option value="unfeature">取消首页展品</option>
              <option value="delete">删除所选</option>
            </select>
            <button type="submit" className="btn-ghost btn px-3 py-1 text-[12px]">
              应用到所选
            </button>
            <span className="meta ml-auto">勾选行首复选框后执行</span>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="w-8 py-3" />
                <th className="meta py-3 font-normal">No.</th>
                <th className="meta py-3 font-normal">标题</th>
                <th className="meta hidden py-3 font-normal sm:table-cell">类型</th>
                <th className="meta hidden py-3 font-normal md:table-cell">状态</th>
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
                        <span className="block max-w-[16rem] truncate text-[16px] text-ink">
                          {work.title}
                        </span>
                        <span className="block max-w-[16rem] truncate text-[12px] text-ink-faint">
                          {[work.creator, work.year].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {work.featured ? (
                        <span className="meta shrink-0 text-music">精选</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="meta hidden py-3 sm:table-cell">
                    {WORK_TYPES.find((item) => item.key === work.type)?.zh}
                  </td>
                  <td className="hidden py-3 text-[15px] text-ink-soft md:table-cell">
                    {STATUS_META[work.status].zh}
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
        </form>

        {!items.length ? (
          <div className="py-24 text-center">
            <p className="text-[26px] font-semibold uppercase text-ink-faint">Empty archive</p>
            <p className="mt-3 text-[16px] text-ink-soft">
              这个分类下还没有藏品。
            </p>
          </div>
        ) : null}
      </main>
    </>
  );
}
