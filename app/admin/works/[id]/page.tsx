import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { WorkForm } from "@/components/admin/work-form";
import { deleteWorkAction } from "@/app/actions/works";
import { requireAdmin } from "@/lib/auth/session";
import { getWork } from "@/lib/db";

export const metadata: Metadata = {
  title: "编辑作品",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditWorkPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const work = getWork(Number(id));
  if (!work) notFound();

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[900px] px-5 py-10 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="meta mb-3">Editing · No.{work.no}</p>
            <h1 className="font-display text-[28px] leading-tight text-ink">{work.title}</h1>
          </div>
          <Link href={`/work/${work.id}`} className="meta underlink text-ink-soft hover:text-ink">
            在站点中查看 ↗
          </Link>
        </div>

        <WorkForm work={work} />

        <section className="mt-16 border border-movie/40 p-5">
          <h2 className="meta text-movie">Danger zone</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            删除后无法恢复。作品会从藏品库、年表和首页同时消失，但已下载的封面文件会保留在数据目录里。
          </p>
          <form action={deleteWorkAction} className="mt-4">
            <input type="hidden" name="id" value={work.id} />
            <button
              type="submit"
              className="border border-movie px-3 py-1.5 text-[12px] tracking-[0.06em] text-movie transition-colors hover:bg-movie hover:text-paper"
            >
              删除这件作品
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
