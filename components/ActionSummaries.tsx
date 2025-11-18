'use client';
import React, { useMemo } from 'react';
import { useStore } from '../lib/store';
import type { PlayerPossessionStat } from '../lib/schema';
import { STAT_DEFINITION_LOOKUP } from './StatTable';

type Props = {
  gameId?: string;
  possId?: number | null;
};

type PlayerMeta = {
  name: string;
  jersey?: string;
  team_code: string;
};

type GroupedStats = {
  actionSeq: number;
  stats: PlayerPossessionStat[];
};

type SummaryRow = {
  key: string;
  statKey: string;
  label: string;
  audience: 'offense' | 'defense';
  count: number;
  players: string[];
  actions: number[];
};

function usePossessionStatData(gameId?: string, possId?: number | null) {
  const { state } = useStore();
  const activeGameId = gameId || state.currentGameId;

  const stats = useMemo(() => {
    if (!activeGameId || possId == null) return [] as PlayerPossessionStat[];
    return state.possessionStats
      .filter(stat => stat.game_id === activeGameId && stat.poss_id === possId)
      .sort((a, b) => {
        const seqDiff = (a.action_seq || 1) - (b.action_seq || 1);
        if (seqDiff !== 0) return seqDiff;
        return (a.created_at || 0) - (b.created_at || 0);
      });
  }, [state.possessionStats, activeGameId, possId]);

  const playerLookup = useMemo(() => {
    const map: Record<string, PlayerMeta> = {};
    state.players.forEach(player => {
      map[player.player_id] = {
        name: player.name || player.player_id,
        jersey: player.jersey,
        team_code: player.team_code
      };
    });
    return map;
  }, [state.players]);

  return { stats, playerLookup };
}

export function ActionTimeline({ gameId, possId }: Props) {
  const { stats, playerLookup } = usePossessionStatData(gameId, possId);

  const grouped: GroupedStats[] = useMemo(() => {
    const map = new Map<number, PlayerPossessionStat[]>();
    stats.forEach(stat => {
      const seq = stat.action_seq || 1;
      if (!map.has(seq)) map.set(seq, []);
      map.get(seq)!.push(stat);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([actionSeq, rows]) => ({ actionSeq, stats: rows }));
  }, [stats]);

  if (!stats.length) {
    return (
      <div className="card action-summary-card">
        <h3>Action Timeline</h3>
        <div className="small">Actions will appear here as you tag stats for this possession.</div>
      </div>
    );
  }

  return (
    <div className="card action-summary-card">
      <h3>Action Timeline</h3>
      {grouped.map(group => (
        <div key={group.actionSeq} className="action-summary-row">
          <div className="action-summary-header">
            <div className="action-title">Action {group.actionSeq}</div>
            <div className="small">{group.stats.length} tag{group.stats.length === 1 ? '' : 's'}</div>
          </div>
          <div className="action-summary-tags">
            {group.stats.map(stat => {
              const player = playerLookup[stat.player_id] || { name: stat.player_id || 'Unknown', team_code: stat.team_code };
              const def = STAT_DEFINITION_LOOKUP.get(stat.stat_key);
              const audience = def?.audience || 'offense';
              const label = def?.label || stat.stat_key;
              return (
                <span key={stat.id} className={`action-chip ${audience}`}>
                  <span className="action-chip-player">{player.name}</span>
                  <span className="action-chip-label">{label}</span>
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PossessionSummaryCard({ gameId, possId }: Props) {
  const { stats, playerLookup } = usePossessionStatData(gameId, possId);

  const summaryRows: SummaryRow[] = useMemo(() => {
    if (!stats.length) return [];
    const map = new Map<string, SummaryRow>();
    stats.forEach(stat => {
      const def = STAT_DEFINITION_LOOKUP.get(stat.stat_key);
      const label = def?.label || stat.stat_key;
      const audience = def?.audience || 'offense';
      const mapKey = `${stat.stat_key}::${audience}`;
      if (!map.has(mapKey)) {
        map.set(mapKey, {
          key: mapKey,
          statKey: stat.stat_key,
          label,
          audience,
          count: 0,
          players: [],
          actions: []
        });
      }
      const entry = map.get(mapKey)!;
      entry.count += 1;
      const playerName = playerLookup[stat.player_id]?.name || stat.player_id || 'Unknown';
      if (playerName && !entry.players.includes(playerName)) {
        entry.players.push(playerName);
      }
      const actionSeq = stat.action_seq || 1;
      if (!entry.actions.includes(actionSeq)) {
        entry.actions.push(actionSeq);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [stats, playerLookup]);

  if (!stats.length) {
    return (
      <div className="poss-summary">
        <div className="small">No action stats recorded for this possession yet.</div>
      </div>
    );
  }

  return (
    <div className="poss-summary">
      <div className="poss-summary-header">
        <div className="poss-summary-title">Action Summary</div>
        <div className="small">{stats.length} total tag{stats.length === 1 ? '' : 's'}</div>
      </div>
      <div className="poss-summary-rows">
        {summaryRows.map(row => (
          <div key={row.key} className="poss-summary-row">
            <div>
              <div className="poss-summary-label">{row.label}</div>
              <div className="small">{row.audience === 'offense' ? 'Offense' : 'Defense'}</div>
            </div>
            <div className="poss-summary-meta">
              <div>
                <div className="poss-summary-count">{row.count}</div>
                <div className="small">tags</div>
              </div>
              <div>
                <div className="poss-summary-subtitle">Players</div>
                <div className="small">{row.players.join(', ')}</div>
              </div>
              <div>
                <div className="poss-summary-subtitle">Actions</div>
                <div className="small">#{row.actions.sort((a, b) => a - b).join(', ')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
