/**
 * Site-wide configuration.
 * This is the only file you need to touch to make Hana yours.
 */

export type WorkType = "movie" | "book" | "music";

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
  done: { zh: "已完成", en: "Finished" },
  doing: { zh: "进行中", en: "In progress" },
  wish: { zh: "待开始", en: "Up next" },
};

export const site = {
  name: "Hana",
  /** shown next to the logo, handwritten-feeling */
  nameZh: "花间",
  owner: "Hana",
  title: "Hana — a private list in primary colours",
  tagline: "一份按原色编号的私人清单。",
  taglineEn: "Films, books and albums, kept in primary colours.",
  description:
    "一个人的电影、书和唱片。每件都有编号、年份，和一段写给自己的短评。",
  descriptionEn:
    "A one-person list of films, books and albums — numbered, dated and kept in primary colours.",
  email: "hello@hana.studio",
  nav: [
    { href: "/library", label: "清单", labelEn: "Index" },
    { href: "/timeline", label: "按年", labelEn: "Years" },
    { href: "/random", label: "随机", labelEn: "Shuffle" },
    { href: "/about", label: "关于", labelEn: "About" },
  ],
  about: {
    heading: "关于这个站",
    paragraphs: [
      "我习惯把看过的东西记下来。不是为了统计，而是因为记忆会风干——一部电影的某个镜头、一本书读到折角的那一页、一张专辑第三轨的贝斯，当时觉得不会忘，几个月后只剩一个模糊的好印象。",
      "所以有了这个站。它最早是一本纸质笔记，用铅笔编号，贴票根和书腰。搬到屏幕上之后，我尽量保留那种手写的秩序：每件作品一个编号，加上类型、年份、创作者，和一段属于我自己的短评。",
      "条目大多取自豆瓣的公开资料，封面与简介只是索引；真正的内容是短评，它们不客观，也不打算客观。",
    ],
    colophon:
      "Built with Next.js, SQLite and a strict grid. Cover plates in the demo archive are generated procedurally. Public metadata is referenced from Douban for personal archival purposes only.",
  },
} as const;

export const PAGE_SIZE = 24;
