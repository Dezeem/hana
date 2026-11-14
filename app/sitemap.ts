import type { MetadataRoute } from "next";
import { listWorks } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "/library", "/timeline", "/about"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const works = listWorks({ limit: 96 }).items.map((work) => ({
    url: `${base}/work/${work.id}`,
    lastModified: new Date(work.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...works];
}
