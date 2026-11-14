"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { saveWork, type SaveState } from "@/app/actions/works";
import type { Work, WorkMeta } from "@/lib/db/types";
import type { DoubanDraft } from "@/lib/douban/types";
import { STATUS_META, WORK_TYPES, type WorkStatus, type WorkType } from "@/site.config";
import { cn } from "@/lib/utils";
import { DoubanImport } from "./douban-import";

type Values = {
  type: WorkType;
  title: string;
  originalTitle: string;
  creator: string;
  year: string;
  rating: string;
  status: WorkStatus;
  tags: string;
  summary: string;
  review: string;
  doubanUrl: string;
  doubanId: string;
  doubanRating: string;
  cover: string;
  coverRemote: string;
  coverRatio: string;
  meta: string;
  featured: boolean;
  finishedOn: string;
};

function initialValues(work?: Work | null): Values {
  return {
    type: work?.type ?? "movie",
    title: work?.title ?? "",
    originalTitle: work?.originalTitle ?? "",
    creator: work?.creator ?? "",
    year: work?.year ? String(work.year) : "",
    rating: work?.rating !== null && work?.rating !== undefined ? String(work.rating) : "",
    status: work?.status ?? "done",
    tags: work?.tags.join(", ") ?? "",
    summary: work?.summary ?? "",
    review: work?.review ?? "",
    doubanUrl: work?.doubanUrl ?? "",
    doubanId: work?.doubanId ?? "",
    doubanRating:
      work?.doubanRating !== null && work?.doubanRating !== undefined
        ? String(work.doubanRating)
        : "",
    cover: work?.cover ?? "",
    coverRemote: work?.coverRemote ?? "",
    coverRatio: String(work?.coverRatio ?? 0.72),
    meta: JSON.stringify(work?.meta ?? {}),
    featured: work?.featured ?? false,
    finishedOn: work?.finishedOn?.slice(0, 10) ?? "",
  };
}

function SubmitBar({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-10 flex items-center justify-between gap-4 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
      <div className="flex items-center gap-5">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "保存中…" : isEdit ? "保存修改" : "收录作品"}
        </button>
        <Link href="/admin/works" className="meta underlink text-ink-soft hover:text-ink">
          取消
        </Link>
      </div>
      <span className="meta hidden sm:block">
        {isEdit ? "editing specimen" : "new specimen"}
      </span>
    </div>
  );
}

export function WorkForm({ work }: { work?: Work | null }) {
  const [state, formAction] = useActionState<SaveState, FormData>(saveWork, { ok: false });
  const [values, setValues] = useState<Values>(() => initialValues(work));

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleImported(draft: DoubanDraft) {
    setValues((prev) => ({
      ...prev,
      type: draft.type,
      title: draft.title || prev.title,
      originalTitle: draft.originalTitle || prev.originalTitle,
      creator: draft.creator || prev.creator,
      year: draft.year ? String(draft.year) : prev.year,
      summary: draft.summary || prev.summary,
      doubanUrl: draft.doubanUrl,
      doubanId: draft.doubanId,
      doubanRating: draft.doubanRating ? String(draft.doubanRating) : "",
      coverRemote: draft.coverRemote || prev.coverRemote,
      meta: JSON.stringify(draft.meta ?? {}),
    }));
  }

  const metaPreview = ((): [string, string][] => {
    try {
      const parsed = JSON.parse(values.meta) as WorkMeta;
      return Object.entries(parsed)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => [key, Array.isArray(value) ? value.join(" / ") : String(value)]);
    } catch {
      return [];
    }
  })();

  return (
    <form action={formAction} className="space-y-6">
      {work ? <input type="hidden" name="id" value={work.id} /> : null}
      <input type="hidden" name="type" value={values.type} />
      <input type="hidden" name="status" value={values.status} />
      <input type="hidden" name="meta" value={values.meta} />
      <input type="hidden" name="cover" value={values.cover} />
      <input type="hidden" name="coverRemote" value={values.coverRemote} />
      <input type="hidden" name="coverRatio" value={values.coverRatio} />
      <input type="hidden" name="doubanId" value={values.doubanId} />
      <input type="hidden" name="doubanRating" value={values.doubanRating} />

      <DoubanImport
        type={values.type}
        onTypeChange={(type) => set("type", type)}
        onImported={handleImported}
        onUrlResolved={(url) => set("doubanUrl", url)}
      />

      <section className="border border-line">
        <div className="border-b border-line px-5 py-3">
          <span className="meta text-ink">基础信息</span>
        </div>
        <div className="grid grid-cols-1 gap-6 px-5 py-6 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="meta mb-2 block">标题 *</span>
            <input
              name="title"
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="例如：牯岭街少年杀人事件"
              className="field text-[17px]"
              required
            />
            {state.fieldErrors?.title ? (
              <span className="mt-1 block text-[12px] text-movie">{state.fieldErrors.title}</span>
            ) : null}
          </label>

          <label>
            <span className="meta mb-2 block">原名 / 外语名</span>
            <input
              name="originalTitle"
              value={values.originalTitle}
              onChange={(event) => set("originalTitle", event.target.value)}
              placeholder="A Brighter Summer Day"
              className="field"
            />
          </label>

          <label>
            <span className="meta mb-2 block">创作者</span>
            <input
              name="creator"
              value={values.creator}
              onChange={(event) => set("creator", event.target.value)}
              placeholder="导演 / 作者 / 表演者"
              className="field"
            />
          </label>

          <label>
            <span className="meta mb-2 block">年份</span>
            <input
              name="year"
              value={values.year}
              onChange={(event) => set("year", event.target.value)}
              inputMode="numeric"
              placeholder="1991"
              className="field num"
            />
          </label>

          <div>
            <span className="meta mb-2 block">类型</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {WORK_TYPES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => set("type", item.key)}
                  className={cn(
                    "flex items-center gap-2 border px-2.5 py-1 text-[12px] transition-colors",
                    values.type === item.key
                      ? "border-ink text-ink"
                      : "border-line text-ink-soft hover:text-ink",
                  )}
                >
                  <span
                    className="inline-block h-[6px] w-[6px]"
                    style={{
                      backgroundColor: values.type === item.key ? item.color : "transparent",
                      border: `1px solid ${item.color}`,
                    }}
                  />
                  {item.zh}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border border-line">
        <div className="border-b border-line px-5 py-3">
          <span className="meta text-ink">我的记录</span>
        </div>
        <div className="grid grid-cols-1 gap-6 px-5 py-6 sm:grid-cols-2">
          <label>
            <span className="meta mb-2 block">我的评分（0 — 5）</span>
            <input
              name="rating"
              value={values.rating}
              onChange={(event) => set("rating", event.target.value)}
              inputMode="decimal"
              placeholder="4.5"
              className="field num"
            />
          </label>

          <label>
            <span className="meta mb-2 block">收录日期</span>
            <input
              name="finishedOn"
              type="date"
              value={values.finishedOn}
              onChange={(event) => set("finishedOn", event.target.value)}
              className="field num"
            />
          </label>

          <div className="sm:col-span-2">
            <span className="meta mb-2 block">状态</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {(Object.keys(STATUS_META) as WorkStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => set("status", status)}
                  className={cn(
                    "border px-3 py-1 text-[12px] transition-colors",
                    values.status === status
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-ink-soft hover:text-ink",
                  )}
                >
                  {STATUS_META[status].zh}
                </button>
              ))}
            </div>
          </div>

          <label className="sm:col-span-2">
            <span className="meta mb-2 block">标签（逗号分隔）</span>
            <input
              name="tags"
              value={values.tags}
              onChange={(event) => set("tags", event.target.value)}
              placeholder="台湾新电影, 青春, 长镜头"
              className="field"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="meta mb-2 block">短评</span>
            <textarea
              name="review"
              value={values.review}
              onChange={(event) => set("review", event.target.value)}
              rows={5}
              placeholder="写一点只有你自己能写的话。"
              className="field resize-none leading-[1.9]"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="meta mb-2 block">简介（来自豆瓣，可编辑）</span>
            <textarea
              name="summary"
              value={values.summary}
              onChange={(event) => set("summary", event.target.value)}
              rows={4}
              className="field resize-none leading-[1.9]"
            />
          </label>
        </div>
      </section>

      <section className="border border-line">
        <div className="border-b border-line px-5 py-3">
          <span className="meta text-ink">封面与来源</span>
        </div>
        <div className="grid grid-cols-1 gap-6 px-5 py-6 sm:grid-cols-[160px_1fr]">
          <div>
            <div className="w-[160px] overflow-hidden rounded-[var(--radius-card)] border border-line bg-mist" style={{ aspectRatio: "0.72" }}>
              {values.cover || values.coverRemote ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={values.cover || values.coverRemote}
                  alt="封面预览"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[12px] text-ink-faint">
                  暂无封面
                </div>
              )}
            </div>
            <label className="mt-3 block">
              <span className="meta mb-1 block">上传封面</span>
              <input
                type="file"
                name="coverFile"
                accept="image/*"
                className="w-full text-[12px] text-ink-soft file:mr-2 file:border file:border-line file:bg-transparent file:px-2 file:py-1 file:text-[12px]"
              />
            </label>
          </div>

          <div className="space-y-6">
            <label>
              <span className="meta mb-2 block">豆瓣链接</span>
              <input
                name="doubanUrl"
                value={values.doubanUrl}
                onChange={(event) => set("doubanUrl", event.target.value)}
                placeholder="https://movie.douban.com/subject/1292052/"
                className="field break-all"
              />
            </label>

            {metaPreview.length ? (
              <div>
                <span className="meta mb-2 block">抓取到的附加信息</span>
                <dl className="space-y-1 border-l border-line pl-3 text-[12px]">
                  {metaPreview.map(([key, value]) => (
                    <div key={key} className="flex gap-3">
                      <dt className="w-16 shrink-0 text-ink-faint">{key}</dt>
                      <dd className="text-ink-soft">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="featured"
                checked={values.featured}
                onChange={(event) => set("featured", event.target.checked)}
                className="h-3.5 w-3.5 accent-ink"
              />
              <span className="text-[15px] text-ink-soft">在首页「精选展品」中展示</span>
            </label>
          </div>
        </div>
      </section>

      {state.error ? (
        <p className="border-l border-movie pl-3 text-[15px] text-movie">{state.error}</p>
      ) : null}

      <SubmitBar isEdit={Boolean(work)} />
    </form>
  );
}
