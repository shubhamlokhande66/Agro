import { NextResponse } from "next/server";
import { getCottonNews } from "@/lib/server/cottonNews";

export const dynamic = "force-dynamic";

/** India cotton headlines from the last 5 days, for the News Feed page (refreshed hourly) */
export async function GET() {
  try {
    const data = await getCottonNews();
    return NextResponse.json(data, {
      headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "News unavailable" },
      { status: 502 },
    );
  }
}
