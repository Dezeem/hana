import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR } from "@/lib/db/client";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export type LocalCover = { path: string; ratio: number };

/**
 * Subject pages embed a thumbnail (`s_ratio_poster`, ~270px), which is far too
 * small for the archive grid. Douban's CDN serves every derivative from the
 * same asset id, so swapping the size segment recovers the 1000px+ original
 * without a second lookup.
 */
export function upgradeCoverUrl(url: string): string {
  return url
    .replace(/\/view\/photo\/s_ratio_poster\//i, "/view/photo/l/")
    .replace(/\/view\/photo\/s_ratio\//i, "/view/photo/l/")
    .replace(/\/view\/photo\/m\//i, "/view/photo/l/")
    .replace(/\/view\/subject\/[sml]\//i, "/view/subject/l/");
}

/**
 * Downloads a Douban image and re-encodes it locally.
 *
 * Douban serves covers behind a Referer check, so hot-linking breaks once the
 * site is deployed. Everything imported is therefore copied into DATA_DIR and
 * served from there; failures are non-fatal and the remote URL is kept as a
 * fallback.
 */
export async function localizeCover(url: string, key: string): Promise<LocalCover | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;

  const source = upgradeCoverUrl(url);

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const response = await fetch(source, {
      headers: {
        "User-Agent": process.env.DOUBAN_USER_AGENT || UA,
        Referer: "https://douban.com/",
      },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[cover] download failed ${response.status} for ${source}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const hash = crypto.createHash("sha1").update(key).digest("hex").slice(0, 16);
    const fileName = `import-${hash}.webp`;
    const target = path.join(UPLOAD_DIR, fileName);

    const image = sharp(buffer, { limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    await image
      .resize({ width: 1000, height: 1500, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(target);

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const ratio = width && height ? Number((width / height).toFixed(3)) : 0.72;

    return { path: `/media/${fileName}`, ratio };
  } catch (error) {
    console.error("[cover] localization failed:", error);
    return null;
  }
}
