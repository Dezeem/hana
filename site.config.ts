/**
 * Site-wide configuration.
 * This is the only file you need to touch to make Hana yours.
 */

export type WorkType = "movie" | "series" | "book" | "music";

export type TypeMeta = {
  key: WorkType;
  zh: string;
  en: string;
  /** block colour (De Stijl primary) used for fills, dots and rules */
  color: string;
  /** readable variant for type set as text on paper */
  ink: string;
  /** Douban host used when only a numeric id is supplied */
  host: string;
  /** Douban category slug used by the suggest endpoint */
  suggestPath: string;
};

export const WORK_TYPES: TypeMeta[] = [
  {
    key: "movie",
    zh: "电影",
    en: "Films",
    color: "var(--c-movie)",
    ink: "var(--c-movie)",
    host: "movie.douban.com",
    suggestPath: "movie",
  },
  {
    key: "series",
    zh: "剧集",
    en: "Series",
    color: "var(--c-series)",
    ink: "var(--c-series)",
    host: "movie.douban.com",
    suggestPath: "movie",
  },
  {
    key: "book",
    zh: "书籍",
    en: "Books",
    color: "var(--c-book)",
    ink: "var(--ink)",
    host: "book.douban.com",
    suggestPath: "book",
  },
  {
    key: "music",
    zh: "音乐",
    en: "Music",
    color: "var(--c-music)",
    ink: "var(--ink)",
    host: "music.douban.com",
    suggestPath: "music",
  },
];

export const TYPE_MAP: Record<WorkType, TypeMeta> = WORK_TYPES.reduce(
  (acc, item) => ({ ...acc, [item.key]: item }),
  {} as Record<WorkType, TypeMeta>,
);

export type WorkStatus = "done" | "doing" | "wish";

export const STATUS_META: Record<WorkStatus, { zh: string; en: string }> = {
  done: { zh: "已收藏", en: "Collected" },
  doing: { zh: "进行中", en: "In progress" },
  wish: { zh: "想接触", en: "Wishlist" },
};

export const site = {
  name: "Hana",
  /** shown next to the logo, handwritten-feeling */
  nameZh: "花间",
  owner: "Hana",
  title: "Hana — a private archive in primary colours",
  tagline: "把看过的、读过的、听过的，一件件压进标本册。",
  taglineEn: "A private archive of films, series, books and albums.",
  description:
    "Hana 是一个人的作品档案：电影、剧集、书籍与音乐，用红、蓝、黄、黑标记分类，逐件编号，用极大的字排出来。",
  descriptionEn:
    "Hana is a one-person archive for films, series, books and albums — numbered, classified and marked out in red, blue, yellow and black.",
  email: "hello@hana.studio",
  nav: [
    { href: "/library", label: "藏品", labelEn: "Library" },
    { href: "/timeline", label: "年表", labelEn: "Timeline" },
    { href: "/about", label: "关于", labelEn: "About" },
  ],
  about: {
    heading: "关于这份档案",
    paragraphs: [
      "我习惯把看过的东西记下来。不是为了统计，而是因为记忆会风干——一部电影的某个镜头、一本书读到折角的那一页、一张专辑第三轨的贝斯，如果不写下来，几个月后就只剩一个模糊的好印象。",
      "所以有了 Hana。它最初只是一本纸质笔记，用铅笔编号，贴上票根和书腰。搬到屏幕之后，我尽量保留那种手写档案的秩序：每件作品有一个编号，有类型、年份、创作者，以及一段属于我自己的短评。",
      "这里的条目大多来自豆瓣的公开资料，封面与简介仅是索引；真正的内容是那些短评，它们不客观，也不打算客观。",
    ],
    colophon:
      "Built with Next.js, SQLite and a strict grid. Cover plates in the demo archive are generated procedurally. Public metadata is referenced from Douban for personal archival purposes only.",
  },
} as const;

export const PAGE_SIZE = 24;
