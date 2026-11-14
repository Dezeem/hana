"use client";

import { useState, useTransition } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { importDoubanAction, searchSuggestAction } from "@/app/actions/works";
import type { DoubanDraft, SuggestItem } from "@/lib/douban/types";
import { WORK_TYPES, type WorkType } from "@/site.config";
import { cn } from "@/lib/utils";

type Props = {
  type: WorkType;
  onTypeChange: (type: WorkType) => void;
  onImported: (draft: DoubanDraft) => void;
  onUrlResolved: (url: string) => void;
};

type Notice = { kind: "ok" | "err" | "info"; text: string; hint?: string };

/**
 * Paste a Douban URL or id and let the server fill the form.
 * Import is always allowed to fail: on any error the message explains why and
 * the manual fields below stay untouched.
 */
export function DoubanImport({ type, onTypeChange, onImported, onUrlResolved }: Props) {
  const [source, setSource] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [candidates, setCandidates] = useState<SuggestItem[]>([]);
  const [pending, startTransition] = useTransition();

  function runImport(value: string) {
    startTransition(async () => {
      setNotice({ kind: "info", text: "正在向豆瓣查询…" });
      const result = await importDoubanAction(value, type);

      if (result.ok) {
        onImported(result.draft);
        onUrlResolved(result.draft.doubanUrl);
        setCandidates([]);
        setNotice({
          kind: "ok",
          text: `已抓取《${result.draft.title}》，用时 ${result.elapsedMs}ms。请核对下方字段并补充你的短评。`,
        });
        return;
      }

      setNotice({ kind: "err", text: result.message, hint: result.hint });
      if (result.url) onUrlResolved(result.url);

      const list = await searchSuggestAction(value, type);
      setCandidates(list);
      if (list.length) {
        setNotice({
          kind: "info",
          text: `${result.message} 下面是豆瓣搜索到的候选，点一个可以再试一次。`,
          hint: result.hint,
        });
      }
    });
  }

  return (
    <section className="border border-line">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-ink-soft" strokeWidth={1.4} />
          <span className="meta text-ink">从豆瓣导入</span>
        </div>
        <span className="meta">optional</span>
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-wrap gap-2">
          {WORK_TYPES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onTypeChange(item.key)}
              className={cn(
                "border px-2.5 py-1 text-[11px] transition-colors",
                type === item.key
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
              )}
            >
              {item.zh}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" strokeWidth={1.4} />
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (source.trim()) runImport(source.trim());
                }
              }}
              placeholder="粘贴豆瓣链接或条目编号，也可以直接输入标题搜索"
              className="field pl-6"
            />
          </div>
          <button
            type="button"
            disabled={pending || !source.trim()}
            onClick={() => runImport(source.trim())}
            className="btn shrink-0"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {pending ? "抓取中" : "抓取并填表"}
          </button>
        </div>

        {notice ? (
          <div
            className={cn(
              "mt-4 border-l-2 pl-3 py-1 text-[12px] leading-relaxed",
              notice.kind === "ok" && "border-book text-book",
              notice.kind === "err" && "border-movie text-movie",
              notice.kind === "info" && "border-line-strong text-ink-soft",
            )}
          >
            <p>{notice.text}</p>
            {notice.hint ? <p className="mt-1 text-[11px] opacity-80">{notice.hint}</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            豆瓣没有公开 API，抓取成功率取决于网络环境。失败也没关系，直接在下面手动填写即可，链接会帮你保留。
          </p>
        )}

        {candidates.length ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {candidates.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSource(item.url);
                    runImport(item.url);
                  }}
                  className="flex w-full items-center gap-3 py-2 text-left transition-colors hover:bg-ink/[0.03]"
                >
                  <span className="h-10 w-7 shrink-0 overflow-hidden bg-line/50">
                    {item.pic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.pic} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[13px] text-ink">{item.title}</span>
                    <span className="block truncate text-[11px] text-ink-soft">{item.subtitle}</span>
                  </span>
                  <span className="meta shrink-0">选择</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
