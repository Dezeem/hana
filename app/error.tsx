"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[hana] page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-display text-[21px] italic leading-none text-ink">Hana</span>
          <span className="meta pb-[2px]">花间</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-center px-5 py-24 sm:px-8">
        <p className="meta mb-6 flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-line-strong" />
          Something tore the page
        </p>

        <h1 className="max-w-xl font-display text-[40px] leading-[1.1] tracking-[-0.02em] text-ink sm:text-[58px]">
          这一页没能装裱起来。
        </h1>
        <p className="mt-6 max-w-md font-serif text-[14px] leading-[2] text-ink-soft">
          服务端出了点问题。可以先重试一次；如果反复出现，检查数据库文件是否可写、依赖是否完整。
        </p>

        {error.digest ? (
          <p className="num mt-4 text-[11px] text-ink-faint">digest · {error.digest}</p>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <button type="button" onClick={reset} className="btn">
            重试
          </button>
          <Link href="/" className="meta underlink text-ink-soft hover:text-ink">
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}
