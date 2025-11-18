const ESPN_BASE = "https://site.web.api.espn.com/apis/site/v2/sports/basketball";

export const ESPN_LEAGUES = {
  mbb: "mens-college-basketball",
  wbb: "womens-college-basketball"
} as const;

export type EspnSport = keyof typeof ESPN_LEAGUES;

export type EspnTeamRef = {
  id: string;
  displayName: string;
  shortDisplayName?: string | null;
  abbreviation?: string | null;
  slug?: string | null;
  location?: string | null;
  href?: string | null;
};

export type EspnRosterPlayer = {
  playerId: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  jersey?: string | null;
  position?: string | null;
  positionAbbr?: string | null;
  class?: string | null;
  status?: string | null;
  heightInches?: number | null;
  weightLbs?: number | null;
};

export type EspnRosterPayload = {
  team: {
    teamId: string;
    teamDisplayName?: string | null;
    teamShortName?: string | null;
    teamAbbreviation?: string | null;
    season?: number | null;
  };
  roster: EspnRosterPlayer[];
};

const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (espn-roster-fetcher; +https://example.com)",
  Accept: "application/json, text/plain, */*"
};

const teamCache = new Map<string, { expires: number; data: EspnTeamRef[] }>();

async function espnGet(url: string, params?: Record<string, string | number | undefined>) {
  const target = new URL(url, ESPN_BASE);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        target.searchParams.set(key, String(value));
      }
    });
  }
  const res = await fetch(target, { headers: DEFAULT_HEADERS, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ESPN request failed (${res.status}) for ${target.toString()}`);
  }
  return res.json();
}

export async function fetchEspnTeams(sport: EspnSport = "mbb", groups = "50") {
  const cacheKey = `${sport}:${groups}`;
  const cached = teamCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expires > now) {
    return cached.data;
  }
  const league = ESPN_LEAGUES[sport];
  const url = `${ESPN_BASE}/${league}/teams`;
  const data = await espnGet(url, { groups, limit: 2000 });
  const items =
    data?.items ||
    data?.sports?.[0]?.leagues?.[0]?.teams ||
    [];
  const flattened: EspnTeamRef[] = [];
  for (const item of items) {
    const team = item?.team || item;
    if (!team) continue;
    const id = team.id || team.uid?.split(":").pop();
    if (!id) continue;
    flattened.push({
      id: String(id),
      displayName: team.displayName || team.name || "",
      shortDisplayName: team.shortDisplayName || team.nickname || "",
      abbreviation: team.abbreviation || "",
      slug: team.slug || "",
      location: team.location || "",
      href: team.href || team.links?.[0]?.href || ""
    });
  }
  const uniq = Array.from(
    new Map(flattened.map((team) => [team.id, team])).values()
  );
  teamCache.set(cacheKey, { expires: now + 1000 * 60 * 60 * 6, data: uniq });
  return uniq;
}

type AnyObject = Record<string, any>;

function flattenEntry(entry: AnyObject): EspnRosterPlayer {
  const athlete = entry.athlete || entry;
  const position = entry.position || athlete.position || {};
  const experience = athlete.experience || {};
  const status = athlete.status || {};
  const jersey = entry.jersey ?? athlete.jersey;
  return {
    playerId: String(athlete.id ?? ""),
    fullName: athlete.displayName || athlete.shortName,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    jersey: jersey != null ? String(jersey) : undefined,
    position: position.displayName || position.abbreviation,
    positionAbbr: position.abbreviation,
    class: experience.displayValue || experience.classification,
    status: status.name || status.type,
    heightInches: athlete.height ?? null,
    weightLbs: athlete.weight ?? null
  };
}

export async function fetchEspnRoster(args: { sport?: EspnSport; teamId: string; season?: number | null }) {
  const sport = args.sport ?? "mbb";
  const league = ESPN_LEAGUES[sport];
  const url = `${ESPN_BASE}/${league}/teams/${args.teamId}/roster`;
  const rosterPayload = await espnGet(url, {
    season: args.season ?? undefined
  });
  const teamData = rosterPayload?.team ?? {};
  const entries: AnyObject[] = rosterPayload?.athletes ?? [];
  const roster = entries.map((entry: AnyObject) => flattenEntry(entry));
  const payload: EspnRosterPayload = {
    team: {
      teamId: String(teamData?.id || teamData?.uid?.split(":").pop() || args.teamId),
      teamDisplayName: teamData?.displayName,
      teamShortName: teamData?.shortDisplayName,
      teamAbbreviation: teamData?.abbreviation,
      season: rosterPayload?.season?.year ?? args.season ?? null
    },
    roster
  };
  return payload;
}
