import { countWorks } from "@/lib/db";
import { hasFts } from "@/lib/db/client";

export async function GET() {
  try {
    return Response.json({
      status: "ok",
      works: countWorks(),
      fts: hasFts(),
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] database unavailable:", error);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
