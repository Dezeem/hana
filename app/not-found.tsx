import Link from "next/link";

export default function NotFound() {
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
          Missing specimen
        </p>

        <h1 className="font-display text-[84px] leading-[0.92] tracking-[-0.04em] text-ink sm:text-[150px]">
          404
        </h1>
        <p className="mt-6 max-w-md text-[17px] leading-[2] text-ink-soft">
          这一页不在标本册里。也许它被重新编号了，或者从来没有被收录过。
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link href="/library" className="btn">
            回到藏品库
          </Link>
          <Link href="/random" className="text-[15px] font-medium uppercase tracking-[0.08em] underline decoration-2 underline-offset-4">
            随便抽一件
          </Link>
          <Link href="/" className="meta underlink text-ink-soft hover:text-ink">
            返回首页
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-12 gap-6 border-t border-line pt-6">
          <p className="col-span-12 text-[15px] leading-relaxed text-ink-faint sm:col-span-6">
            This page is not part of the archive. Every work lives at a stable number — if a
            link brought you here, it was probably retired by hand.
          </p>
          <p className="col-span-12 meta text-right sm:col-span-6">No. — / —</p>
        </div>
      </main>
    </div>
  );
}
