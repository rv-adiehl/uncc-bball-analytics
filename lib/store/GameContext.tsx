'use client';
import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Game } from '../schema';

/**
 * GameContext
 * 
 * Manages game-level state (game metadata and current game selection).
 * Separated from other contexts to prevent re-renders when game state changes.
 * This context changes infrequently (only during game setup).
 */

type GameState = {
  games: Game[];
  currentGameId?: string;
};

type GameAction =
  | { type: 'SET_CURRENT_GAME'; game: Game }
  | { type: 'CLEAR_CURRENT_GAME' }
  | { type: 'LOAD_GAMES'; games: Game[] };

const initialGameState: GameState = {
  games: [],
  currentGameId: undefined
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CURRENT_GAME':
      return {
        ...state,
        currentGameId: action.game.game_id,
        games: state.games.filter(g => g.game_id !== action.game.game_id).concat([action.game])
      };
    case 'CLEAR_CURRENT_GAME':
      return {
        ...state,
        currentGameId: undefined
      };
    case 'LOAD_GAMES':
      return {
        ...state,
        games: action.games
      };
    default:
      return state;
  }
}

const GameContext = createContext<{ state: GameState; dispatch: React.Dispatch<GameAction> }>({
  state: initialGameState,
  dispatch: () => {}
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  return useContext(GameContext);
}

// Custom hook to get current game (prevents re-renders when games list changes)
export function useCurrentGame() {
  const { state } = useGameContext();
  return useMemo(
    () => state.games.find(g => g.game_id === state.currentGameId),
    [state.games, state.currentGameId]
  );
}

