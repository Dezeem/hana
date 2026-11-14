import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR, one } from "./client";
import { createWork } from "./mutations";
import { SEED_ENTRIES } from "./seed-data";
import { coverSvg, ratioForIndex } from "../covers";

function seedFileName(entryType: string, index: number) {
  return `seed-${entryType}-${String(index).padStart(2, "0")}.svg`;
}

/**
 * Regenerates any missing procedural cover. Cheap and idempotent, so it can
 * run on every boot: if a volume is restored without its uploads, the demo
 * archive still renders instead of showing a wall of empty frames.
 */
export function ensureSeedCovers(): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  SEED_ENTRIES.forEach((entry, index) => {
    const position = index + 1;
    const file = path.join(UPLOAD_DIR, seedFileName(entry.type, position));
    // Seed plates are regenerated on every boot: they are a few KB of SVG and
    // this keeps them in sync when the cover generator changes.
    const ratio = ratioForIndex(position);
    fs.writeFileSync(
      file,
      coverSvg({
        seed: position * 37 + 11,
        type: entry.type,
        title: entry.title,
        index: position,
        ratio,
      }),
      "utf8",
    );
  });
}

/** Populates the archive with the demo collection the first time it boots. */
export function seedIfEmpty(): number {
  const row = one<{ c: number }>("SELECT COUNT(*) AS c FROM works");
  if ((row?.c ?? 0) > 0) {
    ensureSeedCovers();
    return 0;
  }

  ensureSeedCovers();

  SEED_ENTRIES.forEach((entry, index) => {
    const position = index + 1;
    const ratio = ratioForIndex(position);
    createWork({
      type: entry.type,
      title: entry.title,
      originalTitle: entry.originalTitle,
      creator: entry.creator,
      year: entry.year,
      cover: `/media/${seedFileName(entry.type, position)}`,
      coverRatio: ratio,
      summary: entry.summary,
      review: entry.review,
      rating: entry.rating,
      status: entry.status,
      tags: entry.tags,
      meta: entry.meta ?? {},
      featured: entry.featured ?? false,
      finishedOn: entry.finishedOn,
    });
  });

  console.log(`[hana] seeded ${SEED_ENTRIES.length} demo works`);
  return SEED_ENTRIES.length;
}
