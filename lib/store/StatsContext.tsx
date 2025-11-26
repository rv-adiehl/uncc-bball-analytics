'use client';
import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { PlayerPossessionStat } from '../schema';

/**
 * StatsContext
 * 
 * Manages player possession stats state.
 * Separated from other contexts because this changes VERY frequently during stat entry.
 * By isolating this, we prevent re-renders of unrelated components.
 */

type StatsState = {
  possessionStats: PlayerPossessionStat[];
};

type StatsAction =
  | { type: 'UPSERT_POSSESSION_STAT'; row: PlayerPossessionStat }
  | { type: 'DELETE_POSSESSION_STAT'; statId: string }
  | { type: 'LOAD_STATS'; stats: PlayerPossessionStat[] };

const initialStatsState: StatsState = {
  possessionStats: []
};

function statsReducer(state: StatsState, action: StatsAction): StatsState {
  switch (action.type) {
    case 'UPSERT_POSSESSION_STAT': {
      const filtered = state.possessionStats.filter(stat => stat.id !== action.row.id);
      return { ...state, possessionStats: filtered.concat([action.row]) };
    }
    case 'DELETE_POSSESSION_STAT': {
      const filtered = state.possessionStats.filter(stat => stat.id !== action.statId);
      return { ...state, possessionStats: filtered };
    }
    case 'LOAD_STATS':
      return { 
        ...state, 
        possessionStats: action.stats.map(stat => ({
          ...stat,
          action_seq: stat.action_seq || 1
        }))
      };
    default:
      return state;
  }
}

const StatsContext = createContext<{ state: StatsState; dispatch: React.Dispatch<StatsAction> }>({
  state: initialStatsState,
  dispatch: () => {}
});

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(statsReducer, initialStatsState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStatsContext() {
  return useContext(StatsContext);
}

// Custom hook to get stats for a specific possession
export function usePossessionStats(gameId?: string, possId?: number, actionSeq?: number) {
  const { state } = useStatsContext();
  return useMemo(() => {
    if (!gameId || possId == null) return [];
    let filtered = state.possessionStats.filter(
      stat => stat.game_id === gameId && stat.poss_id === possId
    );
    if (actionSeq != null) {
      filtered = filtered.filter(stat => (stat.action_seq || 1) === actionSeq);
    }
    return filtered;
  }, [state.possessionStats, gameId, possId, actionSeq]);
}

