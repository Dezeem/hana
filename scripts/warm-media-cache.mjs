#!/usr/bin/env node
/**
 * Pre-generate downscaled cover variants so the first visitor on a cold
 * container never waits for sharp while the grid loads.
 *
 * Mirrors the cache contract in app/media/[...path]/route.ts: files land at
 * data/uploads/.cache/<name>-w<width>.webp and are served with an immutable
 * cache header. Safe to re-run; existing variants are skipped.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const CACHE_DIR = path.join(UPLOAD_DIR, ".cache");

const WIDTHS = [240, 360, 480, 720];
const RESIZABLE = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"]);
const QUALITY = 78;
const CONCURRENCY = 4;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (RESIZABLE.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

async function ensureVariant(file, width) {
  const ext = path.extname(file).toLowerCase();
  const name = `${path.basename(file, ext)}-w${width}.webp`;
  const cached = path.join(CACHE_DIR, name);

  try {
    await fs.access(cached);
    return "skip";
  } catch {
    // not cached yet
  }

  const source = await fs.readFile(file);
  const resized = await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();

  await fs.writeFile(cached, resized);
  return "write";
}

async function main() {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const files = await walk(UPLOAD_DIR);
  if (!files.length) {
    console.log(`[media] no source images in ${UPLOAD_DIR}`);
    return;
  }

  const jobs = files.flatMap((file) => WIDTHS.map((width) => ({ file, width })));
  console.log(
    `[media] ${files.length} sources × ${WIDTHS.length} widths = ${jobs.length} variants`,
  );

  let cursor = 0;
  let written = 0;
  let skipped = 0;
  let failed = 0;
  const total = jobs.length;

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < total) {
      const job = jobs[cursor++];
      try {
        const result = await ensureVariant(job.file, job.width);
        if (result === "write") written++;
        else skipped++;
      } catch (error) {
        failed++;
        console.warn(`[media] failed ${path.basename(job.file)} @${job.width}:`, error.message);
      }
      const done = written + skipped + failed;
      if (done % 50 === 0 || done === total) {
        process.stdout.write(`\r[media] ${done}/${total}  written=${written} skipped=${skipped} failed=${failed}`);
      }
    }
  });

  await Promise.all(workers);
  process.stdout.write("\n");
  console.log(`[media] done — cache at ${CACHE_DIR}`);
}

main().catch((error) => {
  console.error("[media] warm-up aborted:", error);
  process.exitCode = 1;
});
