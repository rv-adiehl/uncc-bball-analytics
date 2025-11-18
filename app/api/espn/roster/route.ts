import { NextResponse } from "next/server";
import { fetchEspnRoster, type EspnSport } from "../../../../lib/espn";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }
    const sport = (searchParams.get("sport") || "mbb") as EspnSport;
    const seasonParam = searchParams.get("season");
    const season = seasonParam ? Number(seasonParam) : undefined;
    const payload = await fetchEspnRoster({ sport, teamId, season: Number.isFinite(season) ? season : undefined });
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
