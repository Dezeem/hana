import { searchWorks } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").slice(0, 80);
  const requested = Number(searchParams.get("limit") ?? 8);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 24) : 8;

  const hits = searchWorks(query, limit);

  return Response.json(
    {
      query,
      results: hits.map((hit) => ({
        id: hit.work.id,
        no: hit.work.no,
        title: hit.work.title,
        creator: hit.work.creator,
        year: hit.work.year,
        type: hit.work.type,
        cover: hit.work.cover,
        matched: hit.matchedFields,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
