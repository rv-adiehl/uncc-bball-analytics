'use client';
import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Possession, PossessionPlayer, PossPhase, ActionGroup, PlayerAction } from '../schema';

/**
 * PossessionContext
 * 
 * Manages possession-related state (possessions, lineups, phases, groups, actions).
 * Separated from other contexts to prevent re-renders when possession data changes.
 * This context changes during active recording sessions.
 */

type PossessionState = {
  possessions: Possession[];
  possPlayers: PossessionPlayer[];
  possPhases: PossPhase[];
  actionGroups: ActionGroup[];
  playerActions: PlayerAction[];
  nextPossId: number;
};

type PossessionAction =
  | { type: 'START_POSSESSION'; possession: Possession }
  | { type: 'UPSERT_POSSESSION'; possession: Possession }
  | { type: 'ADD_POSSESSION_PLAYERS'; rows: PossessionPlayer[] }
  | { type: 'ADD_PHASE'; row: PossPhase }
  | { type: 'ADD_GROUP'; row: ActionGroup }
  | { type: 'ADD_ACTION'; row: PlayerAction }
  | { type: 'DELETE_ACTION'; index: number }
  | { type: 'RESET_CURRENT_POSSESSION' }
  | { type: 'LOAD_POSSESSIONS'; data: Partial<PossessionState> };

const initialPossessionState: PossessionState = {
  possessions: [],
  possPlayers: [],
  possPhases: [],
  actionGroups: [],
  playerActions: [],
  nextPossId: 1
};

function possessionReducer(state: PossessionState, action: PossessionAction): PossessionState {
  switch (action.type) {
    case 'START_POSSESSION': {
      const poss = action.possession;
      return {
        ...state,
        possessions: state.possessions.concat([poss]),
        nextPossId: Math.max(state.nextPossId, poss.poss_id + 1)
      };
    }
    case 'UPSERT_POSSESSION': {
      const filtered = state.possessions.filter(
        p => !(p.game_id === action.possession.game_id && p.poss_id === action.possession.poss_id)
      );
      return { ...state, possessions: filtered.concat([action.possession]) };
    }
    case 'ADD_POSSESSION_PLAYERS':
      return { ...state, possPlayers: state.possPlayers.concat(action.rows) };
    case 'ADD_PHASE':
      return { ...state, possPhases: state.possPhases.concat([action.row]) };
    case 'ADD_GROUP':
      return { ...state, actionGroups: state.actionGroups.concat([action.row]) };
    case 'ADD_ACTION':
      return { ...state, playerActions: state.playerActions.concat([action.row]) };
    case 'DELETE_ACTION': {
      const copy = state.playerActions.slice();
      copy.splice(action.index, 1);
      return { ...state, playerActions: copy };
    }
    case 'RESET_CURRENT_POSSESSION':
      // no-op placeholder (state is already accumulated)
      return state;
    case 'LOAD_POSSESSIONS':
      return {
        ...state,
        ...action.data,
        nextPossId: action.data.nextPossId || state.nextPossId || 1
      };
    default:
      return state;
  }
}

const PossessionContext = createContext<{ state: PossessionState; dispatch: React.Dispatch<PossessionAction> }>({
  state: initialPossessionState,
  dispatch: () => {}
});

export function PossessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(possessionReducer, initialPossessionState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <PossessionContext.Provider value={value}>{children}</PossessionContext.Provider>;
}

export function usePossessionContext() {
  return useContext(PossessionContext);
}

// Custom hook to get possession players for a specific possession
export function usePossessionLineup(gameId?: string, possId?: number) {
  const { state } = usePossessionContext();
  return useMemo(() => {
    if (!gameId || possId == null) return [];
    return state.possPlayers.filter(row => row.game_id === gameId && row.poss_id === possId);
  }, [state.possPlayers, gameId, possId]);
}

