import fs from "node:fs/promises";
import path from "node:path";
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

/**
 * Serves uploaded covers straight from the data volume so the archive keeps
 * working when the container is rebuilt.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const root = path.resolve(UPLOAD_DIR);
  const target = path.resolve(root, segments.join("/"));

  if (!target.startsWith(root + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  const data = await fs.readFile(target).catch(() => null);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(target).toLowerCase();
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
