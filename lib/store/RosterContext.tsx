'use client';
import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Player } from '../schema';

/**
 * RosterContext
 * 
 * Manages player roster state.
 * Separated from other contexts to prevent re-renders when roster changes.
 * This context changes infrequently (only during roster setup).
 */

type RosterState = {
  players: Player[];
};

type RosterAction =
  | { type: 'UPSERT_PLAYER'; player: Player }
  | { type: 'SET_TEAM_ROSTER'; team_code: string; players: Player[] }
  | { type: 'LOAD_SAMPLE_ROSTER' }
  | { type: 'LOAD_PLAYERS'; players: Player[] };

const initialRosterState: RosterState = {
  players: []
};

function rosterReducer(state: RosterState, action: RosterAction): RosterState {
  switch (action.type) {
    case 'UPSERT_PLAYER': {
      const filtered = state.players.filter(
        p => p.player_id !== action.player.player_id || p.team_code !== action.player.team_code
      );
      return { ...state, players: filtered.concat([action.player]) };
    }
    case 'SET_TEAM_ROSTER': {
      const others = state.players.filter(p => p.team_code !== action.team_code);
      return { ...state, players: others.concat(action.players) };
    }
    case 'LOAD_SAMPLE_ROSTER': {
      const sample = [
        ["KB","1","Kylan Blackmon","CHA"],
        ["DM","2","Dezayne Mingo","CHA"],
        ["BB","3","Ben Bradford","CHA"],
        ["MF","5","Major Freeman","CHA"],
        ["KM","7","Kuluel Mading","CHA"],
        ["FO","8","Frank Oguche","CHA"],
        ["SE","9","Spencer Elliott","CHA"],
        ["DH","10","Damoni Harrison","CHA"],
        ["DG","11","David Gomez","CHA"],
        ["AC","12","Arden Conyers","CHA"],
        ["EB","15","Ethan Butler","CHA"],
        ["JE","25","Jarne Eyenga","CHA"],
        ["NR","31","Nick Richart","CHA"],
        ["RV","44","Raul Villar","CHA"],
        ["AB","49","Anton Bonke","CHA"]
      ];
      const players: Player[] = sample.map(([id, jersey, name, team]) => ({ 
        player_id: id, 
        jersey, 
        name, 
        team_code: team 
      }));
      return { ...state, players };
    }
    case 'LOAD_PLAYERS':
      return { ...state, players: action.players };
    default:
      return state;
  }
}

const RosterContext = createContext<{ state: RosterState; dispatch: React.Dispatch<RosterAction> }>({
  state: initialRosterState,
  dispatch: () => {}
});

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(rosterReducer, initialRosterState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
}

export function useRosterContext() {
  return useContext(RosterContext);
}

// Custom hook to get player lookup map (memoized for performance)
export function usePlayerLookup() {
  const { state } = useRosterContext();
  return useMemo(() => {
    const map = new Map<string, Player>();
    state.players.forEach(player => {
      map.set(player.player_id, player);
    });
    return map;
  }, [state.players]);
}

// Custom hook to get players for a specific team
export function useTeamPlayers(teamCode?: string) {
  const { state } = useRosterContext();
  return useMemo(() => {
    if (!teamCode) return [];
    return state.players.filter(p => p.team_code === teamCode);
  }, [state.players, teamCode]);
}

