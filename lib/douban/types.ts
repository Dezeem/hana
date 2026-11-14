import type { WorkType } from "@/site.config";
import type { WorkMeta } from "@/lib/db/types";

export type ImportErrorCode =
  | "IMPORT_INVALID"
  | "IMPORT_BLOCKED"
  | "IMPORT_NOT_FOUND"
  | "IMPORT_TIMEOUT"
  | "IMPORT_NETWORK"
  | "IMPORT_PARSE_FAILED";

export type DoubanDraft = {
  type: WorkType;
  title: string;
  originalTitle: string;
  creator: string;
  year: number | null;
  coverRemote: string;
  summary: string;
  doubanId: string;
  doubanUrl: string;
  doubanRating: number | null;
  meta: WorkMeta;
  /** which parsing strategy produced this draft */
  strategy: string;
};

export type ImportSuccess = {
  ok: true;
  draft: DoubanDraft;
  elapsedMs: number;
};

export type ImportFailure = {
  ok: false;
  code: ImportErrorCode;
  message: string;
  hint: string;
  url: string;
};

export type ImportResult = ImportSuccess | ImportFailure;

export type SuggestItem = {
  id: string;
  title: string;
  subtitle: string;
  pic: string;
  url: string;
  type: string;
  year: string;
};

export const ERROR_COPY: Record<ImportErrorCode, { message: string; hint: string }> = {
  IMPORT_INVALID: {
    message: "这串内容不像豆瓣链接或条目编号。",
    hint: "可以直接粘贴 https://movie.douban.com/subject/1292052/ ，或只填数字 1292052 并先选好类型。",
  },
  IMPORT_BLOCKED: {
    message: "豆瓣拒绝了这次请求（很可能是风控）。",
    hint: "换个网络、降低频率，或在 .env 里配置 DOUBAN_COOKIE / DOUBAN_PROXY 后再试。也可以直接在下面手动填写。",
  },
  IMPORT_NOT_FOUND: {
    message: "豆瓣上没有找到这个条目。",
    hint: "确认条目编号是否正确，或先搜索标题找到候选条目。",
  },
  IMPORT_TIMEOUT: {
    message: "请求豆瓣超时了。",
    hint: "稍后重试，或调大 DOUBAN_TIMEOUT_MS。",
  },
  IMPORT_NETWORK: {
    message: "连不上豆瓣。",
    hint: "检查服务器网络或代理设置，也可以直接手动填写。",
  },
  IMPORT_PARSE_FAILED: {
    message: "抓到了页面，但没能解析出作品信息。",
    hint: "豆瓣页面结构偶有变化，这种情况直接手动填写即可，链接会帮你保留。",
  },
};
