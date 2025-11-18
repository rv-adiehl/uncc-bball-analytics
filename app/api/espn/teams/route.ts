import { NextResponse } from "next/server";
import { fetchEspnTeams, type EspnSport } from "../../../../lib/espn";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = (searchParams.get("sport") || "mbb") as EspnSport;
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const teams = await fetchEspnTeams(sport);
    const filtered = query
      ? teams.filter((team) => {
          const fields = [
            team.displayName,
            team.shortDisplayName,
            team.abbreviation,
            team.slug,
            team.location
          ];
          return fields.some((field) =>
            (field || "").toLowerCase().includes(query)
          );
        })
      : teams;
    return NextResponse.json({ teams: filtered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
