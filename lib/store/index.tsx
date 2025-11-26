'use client';
import React, { useEffect } from 'react';
import { GameProvider, useGameContext } from './GameContext';
import { RosterProvider, useRosterContext } from './RosterContext';
import { PossessionProvider, usePossessionContext } from './PossessionContext';
import { StatsProvider, useStatsContext } from './StatsContext';

/**
 * Unified Store Provider
 * 
 * Combines all context providers in a single component.
 * Each context manages its own domain, preventing unnecessary re-renders.
 * 
 * Architecture Benefits:
 * - GameContext: Changes only during game setup
 * - RosterContext: Changes only during roster management  
 * - PossessionContext: Changes during possession recording
 * - StatsContext: Changes frequently during stat entry (isolated from others)
 * 
 * This separation means stat entry no longer triggers re-renders in game/roster components.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      <RosterProvider>
        <PossessionProvider>
          <StatsProvider>
            <PersistenceLayer>
              {children}
            </PersistenceLayer>
          </StatsProvider>
        </PossessionProvider>
      </RosterProvider>
    </GameProvider>
  );
}

/**
 * PersistenceLayer Component
 * 
 * Handles loading and saving state to localStorage.
 * Separated into its own component to keep provider logic clean.
 */
function PersistenceLayer({ children }: { children: React.ReactNode }) {
  const gameContext = useGameContext();
  const rosterContext = useRosterContext();
  const possessionContext = usePossessionContext();
  const statsContext = useStatsContext();

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cb_labeler_state_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Load game state
        if (parsed.games || parsed.currentGameId) {
          gameContext.dispatch({ 
            type: 'LOAD_GAMES', 
            games: parsed.games || [] 
          });
          if (parsed.currentGameId) {
            const currentGame = (parsed.games || []).find((g: any) => g.game_id === parsed.currentGameId);
            if (currentGame) {
              gameContext.dispatch({ type: 'SET_CURRENT_GAME', game: currentGame });
            }
          }
        }

        // Load roster state
        if (parsed.players) {
          rosterContext.dispatch({ 
            type: 'LOAD_PLAYERS', 
            players: parsed.players 
          });
        }

        // Load possession state
        if (parsed.possessions || parsed.possPlayers || parsed.possPhases || 
            parsed.actionGroups || parsed.playerActions || parsed.nextPossId) {
          possessionContext.dispatch({
            type: 'LOAD_POSSESSIONS',
            data: {
              possessions: parsed.possessions || [],
              possPlayers: parsed.possPlayers || [],
              possPhases: parsed.possPhases || [],
              actionGroups: parsed.actionGroups || [],
              playerActions: parsed.playerActions || [],
              nextPossId: parsed.nextPossId || 1
            }
          });
        }

        // Load stats state
        if (parsed.possessionStats) {
          statsContext.dispatch({ 
            type: 'LOAD_STATS', 
            stats: parsed.possessionStats 
          });
        }
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  }, []); // Only run on mount

  // Save state to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const combinedState = {
        games: gameContext.state.games,
        currentGameId: gameContext.state.currentGameId,
        players: rosterContext.state.players,
        possessions: possessionContext.state.possessions,
        possPlayers: possessionContext.state.possPlayers,
        possPhases: possessionContext.state.possPhases,
        actionGroups: possessionContext.state.actionGroups,
        playerActions: possessionContext.state.playerActions,
        possessionStats: statsContext.state.possessionStats,
        nextPossId: possessionContext.state.nextPossId
      };
      localStorage.setItem('cb_labeler_state_v1', JSON.stringify(combinedState));
    }, 500); // Debounce writes by 500ms

    return () => clearTimeout(timer);
  }, [
    gameContext.state,
    rosterContext.state,
    possessionContext.state,
    statsContext.state
  ]);

  return <>{children}</>;
}

// Re-export all contexts and hooks for convenience
export { useGameContext, useCurrentGame } from './GameContext';
export { useRosterContext, usePlayerLookup, useTeamPlayers } from './RosterContext';
export { usePossessionContext, usePossessionLineup } from './PossessionContext';
export { useStatsContext, usePossessionStats } from './StatsContext';

/**
 * Legacy useStore hook for backward compatibility
 * 
 * This provides a combined state view similar to the original monolithic store.
 * Use this during migration, but prefer specific context hooks for better performance.
 */
export function useStore() {
  const gameContext = useGameContext();
  const rosterContext = useRosterContext();
  const possessionContext = usePossessionContext();
  const statsContext = useStatsContext();

  // Combine all states into one object (like the original store)
  const state = {
    ...gameContext.state,
    ...rosterContext.state,
    ...possessionContext.state,
    ...statsContext.state
  };

  // Create a unified dispatch that routes actions to the correct context
  const dispatch = (action: any) => {
    // Route action to appropriate context based on action type
    switch (action.type) {
      // Game actions
      case 'SET_CURRENT_GAME':
      case 'CLEAR_CURRENT_GAME':
        gameContext.dispatch(action);
        break;
      
      // Roster actions
      case 'UPSERT_PLAYER':
      case 'SET_TEAM_ROSTER':
      case 'LOAD_SAMPLE_ROSTER':
        rosterContext.dispatch(action);
        break;
      
      // Possession actions
      case 'START_POSSESSION':
      case 'UPSERT_POSSESSION':
      case 'ADD_POSSESSION_PLAYERS':
      case 'ADD_PHASE':
      case 'ADD_GROUP':
      case 'ADD_ACTION':
      case 'DELETE_ACTION':
      case 'RESET_CURRENT_POSSESSION':
        possessionContext.dispatch(action);
        break;
      
      // Stats actions
      case 'UPSERT_POSSESSION_STAT':
      case 'DELETE_POSSESSION_STAT':
        statsContext.dispatch(action);
        break;
      
      // Load state (special case - loads into all contexts)
      case 'LOAD_STATE':
        const payload = action.payload;
        if (payload.games || payload.currentGameId) {
          gameContext.dispatch({ type: 'LOAD_GAMES', games: payload.games || [] });
          if (payload.currentGameId) {
            const currentGame = (payload.games || []).find((g: any) => g.game_id === payload.currentGameId);
            if (currentGame) {
              gameContext.dispatch({ type: 'SET_CURRENT_GAME', game: currentGame });
            }
          }
        }
        if (payload.players) {
          rosterContext.dispatch({ type: 'LOAD_PLAYERS', players: payload.players });
        }
        if (payload.possessions || payload.possPlayers) {
          possessionContext.dispatch({ type: 'LOAD_POSSESSIONS', data: payload });
        }
        if (payload.possessionStats) {
          statsContext.dispatch({ type: 'LOAD_STATS', stats: payload.possessionStats });
        }
        break;
      
      default:
        console.warn('Unknown action type:', action.type);
    }
  };

  return { state, dispatch };
}

