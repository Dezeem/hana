import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR } from "@/lib/db/client";

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/** Only these widths are generated, so the cache stays small and predictable. */
const WIDTHS = new Set([240, 360, 480, 720, 1000]);
const RESIZABLE = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"]);

const IMMUTABLE = "public, max-age=31536000, immutable";
const CACHE_DIR = path.join(UPLOAD_DIR, ".cache");

function imageResponse(data: Buffer | Uint8Array, type: string) {
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": IMMUTABLE,
      "Content-Length": String(data.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Serves uploaded covers straight from the data volume so the archive keeps
 * working when the container is rebuilt.
 *
 * `?w=` yields a downscaled webp, cached next to the uploads on first request:
 * the stored covers are 1000px wide, but a grid tile only needs ~360px, and
 * shipping the full file for every tile was the single biggest page weight.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (segments.some((segment) => segment.startsWith("."))) {
    return new Response("Not found", { status: 404 });
  }

  const root = path.resolve(UPLOAD_DIR);
  const target = path.resolve(root, segments.join("/"));

  if (!target.startsWith(root + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ext = path.extname(target).toLowerCase();
  const requested = Number(new URL(request.url).searchParams.get("w"));
  const width = WIDTHS.has(requested) ? requested : null;

  if (width && RESIZABLE.has(ext)) {
    const name = `${path.basename(target, ext)}-w${width}.webp`;
    const cached = path.join(CACHE_DIR, name);

    const hit = await fs.readFile(cached).catch(() => null);
    if (hit) return imageResponse(hit, "image/webp");

    const source = await fs.readFile(target).catch(() => null);
    if (!source) return new Response("Not found", { status: 404 });

    try {
      const resized = await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(cached, resized).catch(() => {});
      return imageResponse(resized, "image/webp");
    } catch (error) {
      console.error(`[media] resize failed for ${target}:`, error);
    }
  }

  const data = await fs.readFile(target).catch(() => null);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  return imageResponse(data, MIME[ext] ?? "application/octet-stream");
}
