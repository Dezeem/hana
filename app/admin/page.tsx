import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/session";
import { getStats, listWorks } from "@/lib/db";
import { DATA_DIR, DB_FILE, hasFts } from "@/lib/db/client";
import { WORK_TYPES } from "@/site.config";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "后台",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard() {
  await requireAdmin();

  const stats = getStats();
  const recent = listWorks({ limit: 8 });
  const featuredCount = listWorks({ featuredOnly: true, limit: 100 }).total;

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="meta mb-3">Dashboard</p>
            <h1 className="font-display text-[30px] leading-none text-ink">藏品概览</h1>
            <p className="mt-3 font-serif text-[13px] text-ink-soft">
              共 {stats.total} 件藏品，其中 {featuredCount} 件被选为首页展品。
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/works/new" className="btn">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.6} />
              新建作品
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {WORK_TYPES.map((type) => (
            <div key={type.key} className="bg-paper p-5">
              <div className="flex items-center gap-2">
                <span className="inline-block h-[7px] w-[7px]" style={{ backgroundColor: type.color }} />
                <span className="meta">{type.zh}</span>
              </div>
              <p className="num mt-4 font-display text-[34px] leading-none text-ink">
                {String(stats.byType[type.key] ?? 0).padStart(2, "0")}
              </p>
              <Link
                href={`/admin/works?type=${type.key}`}
                className="meta mt-3 inline-block underlink text-ink-soft hover:text-ink"
              >
                管理 →
              </Link>
            </div>
          ))}
        </div>

        <section className="mt-14">
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="meta text-ink">最近收录</h2>
            <Link href="/admin/works" className="meta underlink text-ink-soft hover:text-ink">
              全部藏品 →
            </Link>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="meta py-3 font-normal">No.</th>
                <th className="meta py-3 font-normal">标题</th>
                <th className="meta hidden py-3 font-normal sm:table-cell">类型</th>
                <th className="meta hidden py-3 font-normal md:table-cell">评分</th>
                <th className="meta hidden py-3 font-normal md:table-cell">收录</th>
                <th className="meta py-3 text-right font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {recent.items.map((work) => (
                <tr key={work.id} className="border-t border-line">
                  <td className="specimen-no py-3">{work.no}</td>
                  <td className="max-w-[18rem] truncate py-3 font-serif text-[13px] text-ink">
                    {work.title}
                  </td>
                  <td className="meta hidden py-3 sm:table-cell">
                    {WORK_TYPES.find((type) => type.key === work.type)?.zh}
                  </td>
                  <td className="num hidden py-3 text-[12px] text-ink-soft md:table-cell">
                    {work.rating?.toFixed(1) ?? "—"}
                  </td>
                  <td className="num hidden py-3 text-[12px] text-ink-soft md:table-cell">
                    {formatDate(work.createdAt)}
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

          {!recent.items.length ? (
            <p className="py-16 text-center font-serif text-[13px] text-ink-soft">
              还没有藏品，点右上角「新建作品」开始。
            </p>
          ) : null}
        </section>

        <section className="mt-14 border-t border-line pt-6">
          <h2 className="meta mb-4 text-ink">系统状态</h2>
          <dl className="grid grid-cols-1 gap-y-2 text-[12px] sm:grid-cols-2">
            <div className="flex gap-4">
              <dt className="meta w-24 shrink-0 pt-[3px]">数据库</dt>
              <dd className="break-all text-ink-soft">{DB_FILE}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="meta w-24 shrink-0 pt-[3px]">数据目录</dt>
              <dd className="break-all text-ink-soft">{DATA_DIR}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="meta w-24 shrink-0 pt-[3px]">全文检索</dt>
              <dd className="text-ink-soft">{hasFts() ? "FTS5 已启用" : "FTS5 不可用，已降级为 LIKE"}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="meta w-24 shrink-0 pt-[3px]">平均评分</dt>
              <dd className="text-ink-soft">
                {stats.averageRating ? stats.averageRating.toFixed(2) : "—"}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </>
  );
}
