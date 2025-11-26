
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import type { Game } from '../lib/schema';
import type { EspnTeamRef } from '../lib/espn';

type GameForm = Omit<Game, 'game_id'>;

const cleanTeamToken = (value?: string) =>
  (value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const cleanDate = (value?: string) =>
  (value || '')
    .trim()
    .replace(/[./]/g, '-')
    .replace(/[^0-9-]/g, '');

const generateGameCode = (form: GameForm) => {
  const date = cleanDate(form.date);
  const our = cleanTeamToken(form.our_team_code || 'CHA');
  const opp = cleanTeamToken(form.opp_team_code) || cleanTeamToken(form.opponent);
  if (!date || !our || !opp) return '';
  const connector = form.home_away === 'A' ? 'AT' : 'VS';
  return `${date}-${our}-${connector}-${opp}`;
};

export default function GameSetup() {
  const { state, dispatch } = useStore();
  const defaultGame: GameForm = {
    date: '',
    opponent: '',
    home_away: 'H',
    competition: '',
    our_team_code: 'CHA',
    opp_team_code: 'OPP',
    notes: ''
  };
  const [game, setGame] = useState<GameForm>(defaultGame);
  const [teams, setTeams] = useState<EspnTeamRef[]>([]);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const currentGame = useMemo(() => state.games.find(g => g.game_id === state.currentGameId), [state.games, state.currentGameId]);
  const isLocked = Boolean(state.currentGameId);
  const generatedGameId = isLocked && currentGame
    ? currentGame.game_id
    : generateGameCode(game);

  useEffect(() => {
    if (currentGame) {
      const { game_id: _discard, ...rest } = currentGame;
      setGame(prev => ({ ...prev, ...rest }));
    }
  }, [currentGame]);

  useEffect(() => {
    let isMounted = true;
    const loadTeams = async () => {
      setTeamsLoading(true);
      setTeamsError(null);
      try {
        const res = await fetch('/api/espn/teams?sport=mbb');
        if (!res.ok) {
          throw new Error('Failed to load NCAA teams');
        }
        const data = await res.json();
        if (isMounted) {
          setTeams(data.teams || []);
        }
      } catch (err) {
        if (isMounted) {
          setTeamsError(err instanceof Error ? err.message : 'Unable to load NCAA teams.');
        }
      } finally {
        if (isMounted) setTeamsLoading(false);
      }
    };
    loadTeams();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTeamSelect = (side: 'our' | 'opp', teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    setGame(prev => {
      const next = { ...prev };
      if (side === 'our') {
        next.our_team_espn_id = teamId || undefined;
        next.our_team_name = team?.displayName;
        if (team?.abbreviation && (!next.our_team_code || next.our_team_code === 'CHA')) {
          next.our_team_code = team.abbreviation;
        }
      } else {
        next.opp_team_espn_id = teamId || undefined;
        next.opp_team_name = team?.displayName;
        if (team?.abbreviation && (!next.opp_team_code || next.opp_team_code === 'OPP')) {
          next.opp_team_code = team.abbreviation;
        }
        if (team && (!next.opponent || next.opponent === '')) {
          next.opponent = team.shortDisplayName || team.displayName || next.opponent;
        }
      }
      return next;
    });
  };

  const setCurrent = () => {
    if (!generatedGameId) {
      alert('Add a date and matchup (team codes or opponent) to generate a game code.');
      return;
    }
    dispatch({ type: 'SET_CURRENT_GAME', game: { ...game, game_id: generatedGameId } });
  };

  const resetGame = () => {
    setGame(defaultGame);
    dispatch({ type: 'CLEAR_CURRENT_GAME' });
  };

  /**
   * RENDER: Game Setup Form
   * 
   * This component handles:
   * - NCAA team selection (auto-imports rosters)
   * - Game metadata (date, location, codes)
   * - Game identification and locking
   * 
   * Mobile Optimization:
   * - Grid collapses to single column on mobile
   * - Large touch targets for all inputs
   * - Clear visual hierarchy
   */
  return (
    <div className="card">
      <h3>Game Setup</h3>
      {/* Team Selection: ESPN NCAA integration */}
      <div className="grid grid-2" style={{ marginBottom: 12 }}>
        <div>
          <label>Our Team (NCAA)</label>
          <select value={game.our_team_espn_id || ''} onChange={e => handleTeamSelect('our', e.target.value)} disabled={isLocked}>
            <option value="">{teamsLoading ? 'Loading teams…' : 'Select team'}</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.displayName}{team.abbreviation ? ` (${team.abbreviation})` : ''}
              </option>
            ))}
          </select>
          <div className="small">Used when auto-importing rosters.</div>
        </div>
        <div>
          <label>Opponent (NCAA)</label>
          <select value={game.opp_team_espn_id || ''} onChange={e => handleTeamSelect('opp', e.target.value)} disabled={isLocked}>
            <option value="">{teamsLoading ? 'Loading teams…' : 'Select team'}</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.displayName}{team.abbreviation ? ` (${team.abbreviation})` : ''}
              </option>
            ))}
          </select>
          <div className="small">Pick the opponent you want to import from ESPN.</div>
        </div>
      </div>

      {/* Game Details: Core metadata */}
      <div className="grid grid-4">
        <div>
          <label>Game Code</label>
          <input value={generatedGameId} placeholder="2025-11-11-CHA-VS-DAV" readOnly disabled />
          <div className="small">Auto-generated from date + matchup (locked)</div>
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={game.date||''} onChange={e=>setGame({...game, date: e.target.value})} placeholder="2025-11-11" disabled={isLocked} />
        </div>
        <div>
          <label>Opponent</label>
          <input value={game.opponent||''} onChange={e=>setGame({...game, opponent: e.target.value})} placeholder="DAV" disabled={isLocked} />
        </div>
        <div>
          <label>Home / Away</label>
          <select value={game.home_away} onChange={e=>setGame({...game, home_away: e.target.value as any})} disabled={isLocked}>
            <option value="H">Home</option>
            <option value="A">Away</option>
            <option value="N">Neutral</option>
          </select>
        </div>
        <div>
          <label>Our Team Code</label>
          <input value={game.our_team_code||''} onChange={e=>setGame({...game, our_team_code: e.target.value})} disabled={isLocked} />
        </div>
        <div>
          <label>Opp Team Code</label>
          <input value={game.opp_team_code||''} onChange={e=>setGame({...game, opp_team_code: e.target.value})} disabled={isLocked} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label>Notes</label>
          <textarea value={game.notes||''} onChange={e=>setGame({...game, notes: e.target.value})} disabled={isLocked} />
        </div>
      </div>

      {/* Error Display */}
      {teamsError && <div className="small" style={{ color: 'var(--bad)', marginTop: 8 }}>Unable to load NCAA teams: {teamsError}</div>}
      
      {/* Actions: Create/Reset game */}
      <div className="row" style={{marginTop:12}}>
        <button className="primary" onClick={setCurrent} disabled={isLocked}>Create / Load Game</button>
        <button className="ghost" onClick={resetGame} disabled={!isLocked}>Reset Game Setup</button>
        <div className="small">Current: <span className="badge">{state.currentGameId || '—'}</span></div>
      </div>
    </div>
  );
}
