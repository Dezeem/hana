import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR } from "@/lib/db/client";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Stores a manually uploaded cover in the data volume and converts it to WebP,
 * mirroring what the importer does with Douban artwork.
 */
export async function storeUpload(
  file: File | null,
): Promise<{ path: string; ratio: number } | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_BYTES) {
    console.error(`[upload] file too large: ${file.size} bytes`);
    return null;
  }
  if (!file.type.startsWith("image/")) {
    console.error(`[upload] unsupported type: ${file.type}`);
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 16);
  const fileName = `upload-${hash}.webp`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const image = sharp(buffer, { limitInputPixels: 40_000_000 });
  const metadata = await image.metadata();
  await image
    .resize({ width: 1200, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(UPLOAD_DIR, fileName));

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const ratio = width && height ? Number((width / height).toFixed(3)) : 0.72;

  return { path: `/media/${fileName}`, ratio };
}
