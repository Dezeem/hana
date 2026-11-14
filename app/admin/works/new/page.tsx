import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { WorkForm } from "@/components/admin/work-form";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "新建作品",
  robots: { index: false, follow: false },
};

export default async function NewWorkPage() {
  await requireAdmin();

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[900px] px-5 py-10 sm:px-8">
        <div className="mb-8">
          <p className="meta mb-3">New specimen</p>
          <h1 className="font-display text-[30px] leading-none text-ink">收录一件作品</h1>
          <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-ink-soft">
            粘贴豆瓣链接可以自动填表；抓不到也没关系，下面的字段随时可以手写。
          </p>
        </div>

        <WorkForm />
      </main>
    </>
  );
}
