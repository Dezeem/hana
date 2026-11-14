import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "登录",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-display text-[21px] italic leading-none text-ink">{site.name}</span>
          <span className="meta pb-[2px]">后台</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="meta mb-4">Curator access</p>
          <h1 className="font-display text-[32px] leading-tight text-ink">
            这是你的标本室，
            <br />
            请出示钥匙。
          </h1>
          <p className="mt-4 mb-10 font-serif text-[13px] leading-relaxed text-ink-soft">
            访客无需登录即可浏览全部藏品；只有站长需要密码来录入与编辑。
          </p>

          <LoginForm next={next} />
        </div>
      </main>

      <footer className="border-t border-line px-5 py-4 sm:px-8">
        <Link href="/" className="meta underlink text-ink-soft">
          ← 返回站点
        </Link>
      </footer>
    </div>
  );
}
