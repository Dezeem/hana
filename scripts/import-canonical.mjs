#!/usr/bin/env node
/**
 * Imports a doubak canonical/1.x archive into Hana.
 *
 * Reads `marks.ndjson` (what the owner wrote: status, rating, comment, tags)
 * and `subjects.ndjson` (the catalog cache: title, aliases, info, cover) from a
 * directory, joins them on `(medium, subject.id)` and upserts one `works` row
 * per mark. `.json` files are accepted too, either as a JSON array or NDJSON.
 *
 * Spec: https://github.com/Doubak/doubak-data-specs/tree/main/canonical/v1
 *
 * Usage:
 *   node scripts/import-canonical.mjs data/import [--dry] [--covers]
 *                                                  [--replace] [--from-subjects]
 *                                                  [--limit N]
 */
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { DatabaseSync } from "node:sqlite";
import sharp from "sharp";

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "hana.db");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const DRY = flag("dry");
const REPLACE = flag("replace");
const WITH_COVERS = flag("covers");
const COVERS_ONLY = flag("covers-only");
const FROM_SUBJECTS = flag("from-subjects");
const LIMIT = Number(argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0);
const SOURCE = argv.find((a) => !a.startsWith("--")) ?? path.join("data", "import");

/** canonical `medium` → Hana `works.type`. Unsupported media are counted, not coerced. */
const MEDIUM_MAP = { movie: "movie", tv: "series", book: "book", music: "music" };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// ── reading ───────────────────────────────────────────────────────────────────

function findFile(dir, base) {
  for (const ext of [".ndjson", ".json"]) {
    const file = path.join(dir, `${base}${ext}`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

/** Yields parsed records from NDJSON, a JSON array, or a `{subjects:[…]}` wrapper. */
async function* readRecords(file) {
  const raw = await fsp.readFile(file, "utf8");
  const trimmed = raw.trimStart();

  if (trimmed.startsWith("[")) {
    for (const record of JSON.parse(raw)) yield record;
    return;
  }
  if (trimmed.startsWith("{")) {
    // Either the first NDJSON line or a single wrapper object.
    const firstLineEnd = raw.indexOf("\n");
    const looksLikeWrapper =
      firstLineEnd === -1 || !raw.slice(0, firstLineEnd).trimEnd().endsWith("}");
    if (looksLikeWrapper) {
      const parsed = JSON.parse(raw);
      const list =
        parsed.subjects ?? parsed.marks ?? parsed.records ?? parsed.data ?? parsed.items ?? null;
      if (Array.isArray(list)) {
        for (const record of list) yield record;
        return;
      }
    }
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(file, "utf8"),
    crlfDelay: Infinity,
  });
  let lineNo = 0;
  for await (const line of rl) {
    lineNo += 1;
    const text = line.trim();
    if (!text) continue;
    try {
      yield JSON.parse(text);
    } catch {
      stats.badLines.push(`${path.basename(file)}:${lineNo}`);
    }
  }
}

// ── canonical helpers ─────────────────────────────────────────────────────────

const stats = {
  subjects: 0,
  marks: 0,
  badLines: [],
  inserted: 0,
  updated: 0,
  skipped: {},
  unsupported: {},
  covers: 0,
  coverFailed: 0,
};

function bump(bag, key) {
  bag[key] = (bag[key] ?? 0) + 1;
}

/**
 * Revision fields are a time series, not a snapshot: a field can disappear from
 * a later observation (`omitted_fields`) without being cleared. Walk newest →
 * oldest and take the first revision that actually carried the field.
 */
function fieldFrom(revisions, key) {
  for (let i = revisions.length - 1; i >= 0; i -= 1) {
    const revision = revisions[i];
    const fields = revision?.fields;
    if (!fields || typeof fields !== "object" || !(key in fields)) continue;
    const omitted = new Set(
      (revision.observations ?? []).flatMap((observation) => observation?.omitted_fields ?? []),
    );
    if (omitted.has(key)) continue;
    return fields[key];
  }
  return undefined;
}

/** `cover_url` is digest-exempt and explicitly "not guaranteed to be latest". */
function latestCover(revisions) {
  for (let i = revisions.length - 1; i >= 0; i -= 1) {
    const url = revisions[i]?.fields?.cover_url;
    if (typeof url === "string" && url) return url;
  }
  return "";
}

function newestTimestamp(revisions) {
  let latest = "";
  for (const revision of revisions) {
    for (const value of [revision?.last_observed_at, revision?.first_observed_at]) {
      if (typeof value === "string" && value > latest) latest = value;
    }
  }
  return latest;
}

function infoList(info, ...keys) {
  if (!info || typeof info !== "object") return [];
  for (const key of keys) {
    const value = info[key];
    if (Array.isArray(value) && value.length) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) return [value.trim()];
  }
  return [];
}

function infoText(info, ...keys) {
  return infoList(info, ...keys).join(" / ");
}

function firstYear(text) {
  const match = String(text ?? "").match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

/**
 * `info` is only present for subjects whose detail page was ever captured; list
 * captures keep a slash-joined `raw_meta` instead. For those, the first year in
 * the blob is the release / publication / issue year in every medium we have
 * seen, so it is a safe fallback for the year label only — we never guess names.
 */
function yearOf(type, info, rawMeta) {
  if (type === "book") return firstYear(infoText(info, "出版年", "出版时间")) ?? firstYear(rawMeta);
  if (type === "music") return firstYear(infoText(info, "发行时间")) ?? firstYear(rawMeta);
  return firstYear(infoText(info, "上映日期", "首播")) ?? firstYear(rawMeta);
}

function isoDay(partial) {
  const iso = partial?.iso;
  const precision = partial?.precision;
  if (typeof iso !== "string") return null;
  if (!["second", "minute", "hour", "day"].includes(precision)) return null;
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function tagsValue(tags) {
  if (!Array.isArray(tags)) return "";
  const cleaned = tags.map((tag) => String(tag).trim()).filter(Boolean);
  const unique = [...new Set(cleaned)];
  return unique.length ? `,${unique.join(",")},` : "";
}

function buildMeta(type, info) {
  const meta = {};
  if (type === "movie" || type === "series") {
    const director = infoList(info, "导演");
    const cast = infoList(info, "主演").slice(0, 6);
    const runtime = infoText(info, "片长");
    const region = infoText(info, "制片国家/地区");
    const language = infoText(info, "语言");
    if (director.length) meta.director = director;
    if (cast.length) meta.cast = cast;
    if (runtime) meta.runtime = runtime;
    if (region) meta.region = region;
    if (language) meta.language = language;
    if (type === "series") {
      const episodes = infoList(info, "集数")[0]?.match(/\d+/)?.[0];
      if (episodes) meta.episodes = Number(episodes);
    }
    const awards = infoList(info, "获奖");
    if (awards.length) meta.awards = awards;
  } else if (type === "book") {
    const publisher = infoText(info, "出版社");
    const isbn = infoText(info, "ISBN");
    const pages = infoText(info, "页数");
    const language = infoText(info, "语言");
    if (publisher) meta.publisher = publisher;
    if (isbn) meta.isbn = isbn;
    if (pages) meta.pages = pages;
    if (language) meta.language = language;
  } else if (type === "music") {
    const albumType = infoText(info, "专辑类型");
    const publisher = infoText(info, "出版者");
    const medium = infoText(info, "介质");
    if (albumType) meta.albumType = albumType;
    if (publisher) meta.publisher = publisher;
    if (medium) meta.language = medium;
    const tracks = infoList(info, "曲目")[0]?.match(/\d+/)?.[0];
    if (tracks) meta.tracks = Number(tracks);
  }
  return meta;
}

function headingOf(subject, title) {
  const split = splitHeading(title, originalTitleOf(subject.type, subject.info, subject.aliases));
  return { title: split.title, original_title: split.originalTitle };
}

function creatorOf(type, info, aliases, rawMeta) {
  if (type === "book") return infoText(info, "作者");
  if (type === "music") {
    // Album pages key the artist only in `raw_meta` ("Artist / date / type…").
    const named = infoText(info, "表演者", "艺术家");
    if (named) return named;
    return String(rawMeta ?? "").split("/")[0].trim();
  }
  return infoText(info, "导演") || (aliases ?? [])[0] || "";
}

function originalTitleOf(type, info, aliases) {
  if (type === "book") return infoText(info, "原作名");
  const alias = infoList(info, "又名", "原名")[0];
  if (alias) return alias;
  return Array.isArray(aliases) && aliases.length ? String(aliases[0]) : "";
}

/**
 * List pages fold the original title into the heading (`敦刻尔克 / Dunkirk`).
 * 60% of this archive looks like that, so split it into the two columns Hana
 * already has — but only when the left side is Chinese and there is exactly one
 * separator, so a real "A / B" name is never mangled.
 */
function splitHeading(rawTitle, existingOriginal) {
  const clean = rawTitle.trim();
  const parts = clean.split(" / ");
  const keep = { title: clean, originalTitle: existingOriginal };

  if (parts.length !== 2) return keep;

  const [left, right] = parts.map((part) => part.trim());
  if (!left || !right) return keep;
  if (!/[\u4e00-\u9fff]/.test(left)) return keep;
  if (/[\u4e00-\u9fff]/.test(right)) return keep;

  // Keep 又名/原作名 when the detail page had one; otherwise the heading's tail
  // is the original title.
  return { title: left, originalTitle: existingOriginal || right };
}

// ── covers ────────────────────────────────────────────────────────────────────

function upgradeCoverUrl(url) {
  return url
    .replace(/\/view\/photo\/s_ratio_poster\//i, "/view/photo/l/")
    .replace(/\/view\/photo\/s_ratio\//i, "/view/photo/l/")
    .replace(/\/view\/photo\/m\//i, "/view/photo/l/")
    .replace(/\/view\/subject\/[sml]\//i, "/view/subject/l/");
}

async function localizeCover(url) {
  const source = upgradeCoverUrl(url);
  const response = await fetch(source, {
    headers: { "User-Agent": process.env.DOUBAN_USER_AGENT || UA, Referer: "https://douban.com/" },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`http ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1000) throw new Error(`tiny body ${buffer.length}`);

  const hash = crypto.createHash("sha1").update(source).digest("hex").slice(0, 16);
  const fileName = `import-${hash}.webp`;
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });

  const image = sharp(buffer, { limitInputPixels: 40_000_000 });
  const metadata = await image.metadata();
  await image
    .resize({ width: 1000, height: 1500, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(UPLOAD_DIR, fileName));

  const ratio =
    metadata.width && metadata.height
      ? Number((metadata.width / metadata.height).toFixed(3))
      : 0.72;
  return { path: `/media/${fileName}`, ratio };
}

// ── main ──────────────────────────────────────────────────────────────────────

/**
 * `--covers-only` fills in covers for rows that already know their remote URL.
 * Each row is committed as soon as its image lands, so an interrupted run can
 * simply be started again.
 */
async function backfillCovers() {
  const db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA busy_timeout = 5000");

  const pending = db
    .prepare("SELECT id, cover_remote FROM works WHERE cover = '' AND cover_remote <> '' ORDER BY id")
    .all();
  const update = db.prepare("UPDATE works SET cover = ?, cover_ratio = ?, updated_at = ? WHERE id = ?");

  console.log(`db      ${DB_FILE}`);
  console.log(`covers pending ${pending.length}`);

  const now = () => new Date().toISOString();
  let ok = 0;
  let failed = 0;

  for (const [index, row] of pending.entries()) {
    try {
      const stored = await localizeCover(row.cover_remote);
      update.run(stored.path, stored.ratio, now(), row.id);
      ok += 1;
    } catch (error) {
      failed += 1;
      console.error(`cover failed id=${row.id}: ${error.message}`);
    }
    if ((index + 1) % 50 === 0 || index + 1 === pending.length) {
      console.log(`progress ${index + 1}/${pending.length} ok=${ok} failed=${failed}`);
    }
  }

  console.log(`covers done ok=${ok} failed=${failed}`);
  db.close();
}

if (COVERS_ONLY) {
  if (!fs.existsSync(DB_FILE)) {
    console.error(`no database at ${DB_FILE}`);
    process.exit(1);
  }
  await backfillCovers();
  process.exit(0);
}

if (!fs.existsSync(DB_FILE)) {
  console.error(`no database at ${DB_FILE}\nrun the app once (or \`npm run dev\`) to create the schema first`);
  process.exit(1);
}

const subjectsFile = findFile(SOURCE, "subjects");
const marksFile = findFile(SOURCE, "marks");

if (!subjectsFile) {
  console.error(`no subjects.ndjson / subjects.json found in ${SOURCE}`);
  process.exit(1);
}
if (!marksFile && !FROM_SUBJECTS) {
  console.error(`no marks.ndjson / marks.json found in ${SOURCE} (pass --from-subjects to import catalog only)`);
  process.exit(1);
}

console.log(`source  ${path.resolve(SOURCE)}`);
console.log(`db      ${DB_FILE}`);
console.log(`mode    ${DRY ? "dry-run" : "write"}${REPLACE ? " · replace" : ""}${WITH_COVERS ? " · covers" : ""}`);

const catalog = new Map(); // `${medium}:${id}` → projected subject
for await (const record of readRecords(subjectsFile)) {
  stats.subjects += 1;
  const medium = record?.medium;
  const id = record?.id;
  if (!medium || !id) {
    bump(stats.skipped, "subject-without-id");
    continue;
  }
  const revisions = Array.isArray(record.revisions) ? record.revisions : [];
  const type = MEDIUM_MAP[medium];
  const info = fieldFrom(revisions, "info");
  const aliases = fieldFrom(revisions, "aliases");
  const upstreamDeleted = record.upstream_deleted === true;

  catalog.set(`${medium}:${id}`, {
    type,
    unsupported: !type,
    medium,
    id: String(id),
    url: typeof record.url === "string" ? record.url : "",
    deleted: upstreamDeleted,
    title: upstreamDeleted ? null : fieldFrom(revisions, "title"),
    aliases: Array.isArray(aliases) ? aliases : [],
    info: info && typeof info === "object" ? info : null,
    cover: latestCover(revisions),
    rawMeta: fieldFrom(revisions, "raw_meta"),
    observedAt: newestTimestamp(revisions),
  });
}

const rows = [];
const marks = marksFile ? readRecords(marksFile) : null;

if (marks) {
  for await (const record of marks) {
    stats.marks += 1;
    const medium = record?.medium;
    const subjectId = record?.subject?.id;
    if (!medium || !subjectId) {
      bump(stats.skipped, "mark-without-subject");
      continue;
    }
    const subject = catalog.get(`${medium}:${subjectId}`);
    if (!subject) {
      bump(stats.skipped, `no-subject:${medium}`);
      continue;
    }
    if (subject.unsupported) {
      bump(stats.unsupported, medium);
      continue;
    }
    if (subject.deleted) {
      bump(stats.skipped, "subject-deleted");
      continue;
    }
    const title = typeof subject.title === "string" ? subject.title.trim() : "";
    if (!title) {
      bump(stats.skipped, "subject-title-null");
      continue;
    }

    const revisions = Array.isArray(record.revisions) ? record.revisions : [];
    const status = fieldFrom(revisions, "status");
    if (!["done", "doing", "wish"].includes(status)) {
      bump(stats.skipped, `bad-status:${status ?? "missing"}`);
      continue;
    }

    const rating = fieldFrom(revisions, "rating");
    const comment = fieldFrom(revisions, "comment");
    const tags = fieldFrom(revisions, "tags");
    const markedAt = fieldFrom(revisions, "marked_at");

    rows.push({
      type: subject.type,
      ...headingOf(subject, title),
      creator: creatorOf(subject.type, subject.info, subject.aliases, subject.rawMeta),
      year: yearOf(subject.type, subject.info, subject.rawMeta),
      cover: "",
      cover_remote: subject.cover,
      cover_ratio: 0.72,
      summary: "",
      review: typeof comment === "string" ? comment : "",
      rating: Number.isInteger(rating) ? rating : null,
      status,
      tags: tagsValue(tags),
      douban_id: subject.id,
      douban_url: subject.url,
      douban_rating: null,
      meta: JSON.stringify(buildMeta(subject.type, subject.info)),
      finished_on: status === "done" ? isoDay(markedAt) : null,
      observed_at: subject.observedAt,
    });
  }
} else {
  for (const subject of catalog.values()) {
    if (subject.unsupported || subject.deleted) continue;
    const title = typeof subject.title === "string" ? subject.title.trim() : "";
    if (!title) continue;
    rows.push({
      type: subject.type,
      ...headingOf(subject, title),
      creator: creatorOf(subject.type, subject.info, subject.aliases, subject.rawMeta),
      year: yearOf(subject.type, subject.info, subject.rawMeta),
      cover: "",
      cover_remote: subject.cover,
      cover_ratio: 0.72,
      summary: "",
      review: "",
      rating: null,
      status: "done",
      tags: "",
      douban_id: subject.id,
      douban_url: subject.url,
      douban_rating: null,
      meta: JSON.stringify(buildMeta(subject.type, subject.info)),
      finished_on: null,
      observed_at: subject.observedAt,
    });
  }
}

// One row per subject: keep the most recently observed mark when duplicates exist.
const bySubject = new Map();
for (const row of rows) {
  const key = `${row.type}:${row.douban_id}`;
  const existing = bySubject.get(key);
  if (!existing || (row.observed_at ?? "") >= (existing.observed_at ?? "")) bySubject.set(key, row);
}
let workRows = [...bySubject.values()];
if (LIMIT > 0) workRows = workRows.slice(0, LIMIT);

if (WITH_COVERS) {
  for (const row of workRows) {
    if (!row.cover_remote) continue;
    try {
      const stored = await localizeCover(row.cover_remote);
      row.cover = stored.path;
      row.cover_ratio = stored.ratio;
      stats.covers += 1;
    } catch (error) {
      stats.coverFailed += 1;
      console.warn(`cover failed ${row.douban_id} ${row.title}: ${error.message}`);
    }
  }
}

const db = new DatabaseSync(DB_FILE);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA busy_timeout = 5000");

const hasWorks = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'works'")
  .get();
if (!hasWorks) {
  console.error(`${DB_FILE} has no works table — start the app once so it can create the schema`);
  process.exit(1);
}

const now = new Date().toISOString();
const findExisting = db.prepare("SELECT id, featured FROM works WHERE douban_id = ? AND type = ?");
const insertWork = db.prepare(`INSERT INTO works (
  type, title, original_title, creator, year, cover, cover_remote, cover_ratio,
  summary, review, rating, status, tags, douban_id, douban_url, douban_rating,
  meta, featured, finished_on, created_at, updated_at
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const updateWork = db.prepare(`UPDATE works SET
  title = ?, original_title = ?, creator = ?, year = ?, cover = ?, cover_remote = ?,
  cover_ratio = ?, summary = ?, review = ?, rating = ?, status = ?, tags = ?,
  douban_url = ?, douban_rating = ?, meta = ?, finished_on = ?, updated_at = ?
  WHERE id = ?`);

function apply(list) {
  db.exec("BEGIN");
  try {
    runAll(list);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function runAll(list) {
  if (REPLACE) db.prepare("DELETE FROM works").run();
  for (const row of list) {
    const existing = findExisting.get(row.douban_id, row.type);
    if (existing) {
      updateWork.run(
        row.title,
        row.original_title,
        row.creator,
        row.year,
        row.cover,
        row.cover_remote,
        row.cover_ratio,
        row.summary,
        row.review,
        row.rating,
        row.status,
        row.tags,
        row.douban_url,
        row.douban_rating,
        row.meta,
        row.finished_on,
        now,
        existing.id,
      );
      stats.updated += 1;
    } else {
      insertWork.run(
        row.type,
        row.title,
        row.original_title,
        row.creator,
        row.year,
        row.cover,
        row.cover_remote,
        row.cover_ratio,
        row.summary,
        row.review,
        row.rating,
        row.status,
        row.tags,
        row.douban_id,
        row.douban_url,
        row.douban_rating,
        row.meta,
        0,
        row.finished_on,
        now,
        now,
      );
      stats.inserted += 1;
    }
  }
}

if (DRY) {
  stats.inserted = REPLACE
    ? workRows.length
    : workRows.filter((row) => !findExisting.get(row.douban_id, row.type)).length;
  stats.updated = REPLACE ? 0 : workRows.length - stats.inserted;
} else {
  apply(workRows);
}

const counts = db.prepare("SELECT type, COUNT(*) AS c FROM works GROUP BY type ORDER BY c DESC").all();
const statuses = db.prepare("SELECT status, COUNT(*) AS c FROM works GROUP BY status").all();

console.log(`\nsubjects ${stats.subjects} · marks ${stats.marks} · rows ${workRows.length}`);
console.log(`${DRY ? "would insert" : "inserted"} ${stats.inserted} · ${DRY ? "would update" : "updated"} ${stats.updated}`);
if (WITH_COVERS) console.log(`covers ${stats.covers} ok · ${stats.coverFailed} failed`);

const skipped = Object.entries(stats.skipped);
if (skipped.length) console.log(`skipped: ${skipped.map(([k, v]) => `${k}=${v}`).join(", ")}`);
const unsupported = Object.entries(stats.unsupported);
if (unsupported.length) {
  console.log(`unsupported medium (not a Hana type): ${unsupported.map(([k, v]) => `${k}=${v}`).join(", ")}`);
}
if (stats.badLines.length) {
  console.log(`unparseable lines ${stats.badLines.length}: ${stats.badLines.slice(0, 5).join(", ")}`);
}

console.log(`\nnow in db: ${counts.map((r) => `${r.type}=${r.c}`).join(" · ") || "empty"}`);
console.log(`by status: ${statuses.map((r) => `${r.status}=${r.c}`).join(" · ") || "empty"}`);

if (!DRY) {
  db.prepare(
    "INSERT INTO _meta (key, value) VALUES ('canonical_import', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(now);
}
db.close();
