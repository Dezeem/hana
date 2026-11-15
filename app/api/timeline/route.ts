import { getTimelinePage } from "@/lib/db";
import { workFactsLine } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Incremental timeline feed. Only the fields the timeline renders are sent,
 * so each response stays a few dozen kilobytes instead of the megabytes the
 * full 700-work page used to serialise.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const since = Number(searchParams.get("since"));
  const before = Number(searchParams.get("before"));
  const requested = Number(searchParams.get("limit") ?? 3);

  const page = getTimelinePage({
    since: Number.isFinite(since) && since > 1800 ? since : null,
    before: Number.isFinite(before) && before > 0 ? before : null,
    limit: Number.isFinite(requested) ? requested : 3,
  });

  return Response.json(
    {
      groups: page.groups.map((group) => ({
        year: group.year,
        works: group.works.map((work) => ({
          id: work.id,
          type: work.type,
          title: work.title,
          creator: work.creator,
          year: work.year,
          cover: work.cover,
          summary: work.summary,
          facts: workFactsLine(work),
        })),
      })),
      nextCursor: page.nextCursor,
      rangeTotal: page.rangeTotal,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
