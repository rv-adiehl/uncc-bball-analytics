
import { ActionGroup, PlayerAction, Possession, PossessionPlayer, PossPhase, PlayerPossessionStat } from './schema';

const POSSESSION_HEADERS: (keyof Possession)[] = ["game_id","poss_id","period","offense_team","defense_team","start_clock","end_clock","duration_sec","start_type","start_location","possession_type","offensive_set","defensive_set","press_type","ball_advancer_player_id","time_to_cross_half_sec","time_to_enter_set_sec","shot_clock_used_sec","outcome_type","points_scored_offense","points_scored_defense","shooter_id","assisted_by_id","shot_location","shot_contested","rebound_type","rebounder_id","is_second_chance","turnover_player_id","turnover_type","fouled_player_id","foul_type","notes"];
const POSSESSION_PLAYER_HEADERS: (keyof PossessionPlayer)[] = ["game_id","poss_id","team_code","player_id","lineup_slot","on_offense_at_start","primary_matchup","plus_minus_this_poss"];
const POSS_PHASE_HEADERS: (keyof PossPhase)[] = ["game_id","poss_id","phase_order","phase_type","phase_label","offensive_set","defensive_set","press_type","start_rel_sec","end_rel_sec","start_clock","end_clock","notes"];
const ACTION_GROUP_HEADERS: (keyof ActionGroup)[] = ["game_id","poss_id","phase_order","group_order","group_label","trigger_type","start_rel_sec","end_rel_sec","shot_clock_start","shot_clock_end","notes"];
const PLAYER_ACTION_HEADERS: (keyof PlayerAction)[] = ["game_id","poss_id","team_code","player_id","role_side","actor_role","phase_order","group_order","action_seq","action_type","result","value","opportunity_flag","responsibility_weight","context_subtype","t_rel_sec","shot_clock_at_action","created_by","comments"];
const POSSESSION_STAT_BASE_HEADERS = ["id","game_id","poss_id","team_code","player_id","stat_key","mode","action_seq","created_at","notes"] as const;

function toCSV<T extends object>(rows: T[], headers: (keyof T)[]): string {
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const head = headers.join(',');
  const body = rows.map(r => headers.map(h => esc((r as any)[h])).join(',')).join('\n');
  return head + '\n' + body + (rows.length ? '\n' : '');
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function csvPossessions(rows: Possession[]): string {
  return toCSV(rows, POSSESSION_HEADERS);
}

export function csvPossessionPlayers(rows: PossessionPlayer[]): string {
  return toCSV(rows, POSSESSION_PLAYER_HEADERS);
}

export function csvPossPhases(rows: PossPhase[]): string {
  return toCSV(rows, POSS_PHASE_HEADERS);
}

export function csvActionGroups(rows: ActionGroup[]): string {
  return toCSV(rows, ACTION_GROUP_HEADERS);
}

export function csvPlayerActions(rows: PlayerAction[]): string {
  return toCSV(rows, PLAYER_ACTION_HEADERS);
}

export function csvPossessionStats(rows: PlayerPossessionStat[]): string {
  const payloadKeys = Array.from(
    new Set(
      rows.flatMap(row => Object.keys(row.payload || {}))
    )
  ).sort();

  type CSVRow = Record<string, string | number | null | undefined>;
  const csvRows: CSVRow[] = rows.map(row => {
    const payloadColumns: CSVRow = {};
    for (const key of payloadKeys) {
      const value = row.payload ? row.payload[key] : undefined;
      if (Array.isArray(value)) {
        payloadColumns[`payload_${key}`] = value.map(item => String(item)).join('|');
      } else if (value && typeof value === 'object') {
        payloadColumns[`payload_${key}`] = JSON.stringify(value);
      } else {
        payloadColumns[`payload_${key}`] = value as any;
      }
    }
    return {
      id: row.id,
      game_id: row.game_id,
      poss_id: row.poss_id,
      team_code: row.team_code,
      player_id: row.player_id,
      stat_key: row.stat_key,
      mode: row.mode,
      action_seq: row.action_seq ?? '',
      created_at: row.created_at,
      notes: row.notes || '',
      ...payloadColumns
    };
  });

  const statHeaders: string[] = [...POSSESSION_STAT_BASE_HEADERS];
  const headers = statHeaders.concat(payloadKeys.map(key => `payload_${key}`));
  return toCSV(csvRows, headers as (keyof CSVRow)[]);
}

export function csvPossessionActionDetails(rows: PlayerPossessionStat[], possessions: Possession[]): string {
  const possMap = new Map<string, Possession>();
  possessions.forEach(poss => {
    possMap.set(`${poss.game_id}:${poss.poss_id}`, poss);
  });

  const payloadKeys = Array.from(
    new Set(
      rows.flatMap(row => Object.keys(row.payload || {}))
    )
  ).sort();

  type CSVRow = Record<string, string | number | null | undefined>;
  const possHeaders = POSSESSION_HEADERS.map(header => `poss_${String(header)}`);

  const csvRows: CSVRow[] = rows.map(row => {
    const payloadColumns: CSVRow = {};
    for (const key of payloadKeys) {
      const value = row.payload ? row.payload[key] : undefined;
      if (Array.isArray(value)) {
        payloadColumns[`payload_${key}`] = value.map(item => String(item)).join('|');
      } else if (value && typeof value === 'object') {
        payloadColumns[`payload_${key}`] = JSON.stringify(value);
      } else {
        payloadColumns[`payload_${key}`] = value as any;
      }
    }

    const poss = possMap.get(`${row.game_id}:${row.poss_id}`);
    const possColumns: CSVRow = {};
    if (poss) {
      POSSESSION_HEADERS.forEach(header => {
        possColumns[`poss_${String(header)}`] = (poss as any)[header];
      });
    }

    return {
      ...possColumns,
      id: row.id,
      game_id: row.game_id,
      poss_id: row.poss_id,
      team_code: row.team_code,
      player_id: row.player_id,
      stat_key: row.stat_key,
      mode: row.mode,
      action_seq: row.action_seq ?? '',
      created_at: row.created_at,
      notes: row.notes || '',
      ...payloadColumns
    };
  });

  const statHeaders: string[] = [...POSSESSION_STAT_BASE_HEADERS];
  const headers = possHeaders
    .concat(statHeaders)
    .concat(payloadKeys.map(key => `payload_${key}`));
  return toCSV(csvRows, headers as (keyof CSVRow)[]);
}
