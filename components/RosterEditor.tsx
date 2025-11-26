
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import type { Player } from '../lib/schema';

type Side = 'our' | 'opp';

type PlayerFormState = {
  player_id: string;
  name: string;
  jersey: string;
  position: string;
  height_in: string;
  weight_lb: string;
  team_code: string;
};

const makeDefaultForm = (teamCode: string): PlayerFormState => ({
  player_id: '',
  name: '',
  jersey: '',
  position: '',
  height_in: '',
  weight_lb: '',
  team_code: teamCode
});

const formatHeight = (height?: number) => {
  if (!height) return '—';
  const feet = Math.floor(height / 12);
  const inches = Math.round(height - feet * 12);
  return `${feet}'${inches}"`;
};

const formatWeight = (weight?: number) => {
  if (!weight) return '—';
  return `${weight} lbs`;
};

const parseSeasonYear = (date?: string) => {
  if (!date) return undefined;
  const [yearStr, monthStr = '1'] = date.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year)) return undefined;
  if (Number.isFinite(month)) {
    return month >= 7 ? year + 1 : year;
  }
  return year;
};

export default function RosterEditor() {
  const { state, dispatch } = useStore();
  const currentGame = useMemo(() => state.games.find(g => g.game_id === state.currentGameId), [state.games, state.currentGameId]);
  const ourTeamCode = currentGame?.our_team_code || 'CHA';
  const oppTeamCode = currentGame?.opp_team_code || 'OPP';
  const teamLabel: Record<Side, string> = {
    our: currentGame?.our_team_name || ourTeamCode,
    opp: currentGame?.opp_team_name || currentGame?.opponent || oppTeamCode
  };
  const [forms, setForms] = useState<Record<Side, PlayerFormState>>({
    our: makeDefaultForm(ourTeamCode),
    opp: makeDefaultForm(oppTeamCode)
  });
  const [editingIds, setEditingIds] = useState<Record<Side, string | null>>({ our: null, opp: null });
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    setForms({ our: makeDefaultForm(ourTeamCode), opp: makeDefaultForm(oppTeamCode) });
    setEditingIds({ our: null, opp: null });
  }, [ourTeamCode, oppTeamCode]);

  const { ourPlayers, oppPlayers, otherPlayers } = useMemo(() => {
    const ours: Player[] = [];
    const opps: Player[] = [];
    const others: Player[] = [];
    state.players.forEach(player => {
      if (player.team_code === ourTeamCode) {
        ours.push(player);
      } else if (player.team_code === oppTeamCode) {
        opps.push(player);
      } else {
        others.push(player);
      }
    });
    const sorter = (a: Player, b: Player) => (a.jersey || '').localeCompare(b.jersey || '') || a.name.localeCompare(b.name);
    ours.sort(sorter);
    opps.sort(sorter);
    others.sort((a, b) => a.team_code.localeCompare(b.team_code) || sorter(a, b));
    return { ourPlayers: ours, oppPlayers: opps, otherPlayers: others };
  }, [state.players, ourTeamCode, oppTeamCode]);

  const updateForm = (side: Side, field: keyof PlayerFormState, value: string) => {
    setForms(prev => ({ ...prev, [side]: { ...prev[side], [field]: value } }));
  };

  const parseNumberField = (value: string) => {
    if (value.trim() === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const savePlayer = (side: Side) => {
    const form = forms[side];
    if (!form.player_id.trim() || !form.name.trim()) return;
    const payload: Player = {
      player_id: form.player_id.trim(),
      name: form.name.trim(),
      jersey: form.jersey.trim() || undefined,
      position: form.position.trim() || undefined,
      team_code: form.team_code,
      height_in: parseNumberField(form.height_in),
      weight_lb: parseNumberField(form.weight_lb)
    };
    dispatch({ type: 'UPSERT_PLAYER', player: payload });
    setForms(prev => ({ ...prev, [side]: makeDefaultForm(form.team_code) }));
    setEditingIds(prev => ({ ...prev, [side]: null }));
  };

  const startEdit = (side: Side, player: Player) => {
    setForms(prev => ({
      ...prev,
      [side]: {
        team_code: player.team_code,
        player_id: player.player_id,
        name: player.name,
        jersey: player.jersey || '',
        position: player.position || '',
        height_in: player.height_in != null ? String(player.height_in) : '',
        weight_lb: player.weight_lb != null ? String(player.weight_lb) : ''
      }
    }));
    setEditingIds(prev => ({ ...prev, [side]: player.player_id }));
  };

  const cancelEdit = (side: Side) => {
    setForms(prev => ({ ...prev, [side]: makeDefaultForm(prev[side].team_code) }));
    setEditingIds(prev => ({ ...prev, [side]: null }));
  };

  const importRoster = async (side: Side) => {
    if (!currentGame) {
      setImportStatus('Load a game before importing a roster.');
      return;
    }
    const espnId = side === 'our' ? currentGame.our_team_espn_id : currentGame.opp_team_espn_id;
    if (!espnId) {
      setImportStatus('Select an NCAA team in Game Setup first.');
      return;
    }
    const teamCode = side === 'our' ? ourTeamCode : oppTeamCode;
    const teamFriendly = teamLabel[side] || teamCode;
    setImportStatus(`Importing ${teamFriendly} roster…`);
    try {
      const params = new URLSearchParams({ sport: 'mbb', teamId: espnId });
      const season = parseSeasonYear(currentGame.date);
      if (season) params.set('season', String(season));
      const res = await fetch(`/api/espn/roster?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch roster from ESPN.');
      }
      const data = await res.json();
      const roster: Player[] = (data.roster || []).map((athlete: any): Player => ({
        player_id: athlete.playerId || `${teamCode}-${athlete.fullName}`,
        name: athlete.fullName || 'Unknown',
        jersey: athlete.jersey || '',
        position: athlete.positionAbbr || athlete.position || undefined,
        team_code: teamCode,
        height_in: athlete.heightInches ?? undefined,
        weight_lb: athlete.weightLbs ?? undefined
      })).filter((p: Player) => p.player_id && p.name);
      dispatch({ type: 'SET_TEAM_ROSTER', team_code: teamCode, players: roster });
      setForms(prev => ({ ...prev, [side]: makeDefaultForm(teamCode) }));
      setEditingIds(prev => ({ ...prev, [side]: null }));
      setImportStatus(`Imported ${roster.length} players for ${teamFriendly}.`);
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : 'Unable to import roster.');
    }
  };

  useEffect(() => {
    if (!currentGame?.game_id) return;
    if (!currentGame.our_team_espn_id && !currentGame.opp_team_espn_id) return;
    let cancelled = false;
    const run = async () => {
      if (currentGame.our_team_espn_id) {
        await importRoster('our');
        if (cancelled) return;
      }
      if (currentGame.opp_team_espn_id) {
        await importRoster('opp');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [currentGame?.game_id, currentGame?.our_team_espn_id, currentGame?.opp_team_espn_id]);

  /**
   * RENDER ROSTER COLUMN: Team-specific roster management
   * 
   * Each side (our/opp) gets its own column with:
   * - Player entry form (responsive grid layout)
   * - Roster table (horizontally scrollable on mobile)
   * - Edit/delete actions
   * 
   * Mobile Optimization:
   * - Form fields stack vertically on small screens
   * - Table scrolls horizontally to preserve all columns
   * - Touch-friendly buttons
   */
  const renderRosterColumn = (side: Side, players: Player[]) => {
    const form = forms[side];
    const editingId = editingIds[side];
    const teamCode = side === 'our' ? ourTeamCode : oppTeamCode;
    return (
      <div 
        key={side} 
        style={{ 
          border: '1px solid var(--border)', 
          borderRadius: 10, 
          padding: 12,
          minWidth: 0,  // Critical: Allows flex/grid children to shrink below content size
          width: '100%',  // Ensures it respects parent container width
        }}
      >
        {/* Team Header */}
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="small" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{side === 'our' ? 'Our Team' : 'Opponent'}</div>
            <h4 style={{ margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamLabel[side]}</h4>
          </div>
          <span className="badge" style={{ flexShrink: 0 }}>{teamCode}</span>
        </div>

        {/* Player Entry Form: Responsive grid collapses on mobile */}
        <div className="grid grid-2" style={{ marginBottom: 8 }}>
          <div>
            <label>Player ID</label>
            <input value={form.player_id} onChange={e => updateForm(side, 'player_id', e.target.value)} placeholder="KB" />
          </div>
          <div>
            <label>Jersey</label>
            <input value={form.jersey} onChange={e => updateForm(side, 'jersey', e.target.value)} placeholder="1" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Name</label>
            <input value={form.name} onChange={e => updateForm(side, 'name', e.target.value)} placeholder="Kylan Blackmon" />
          </div>
          <div>
            <label>Position</label>
            <input value={form.position} onChange={e => updateForm(side, 'position', e.target.value)} placeholder="G/F" />
          </div>
          <div>
            <label>Height (in)</label>
            <input type="number" inputMode="numeric" value={form.height_in} onChange={e => updateForm(side, 'height_in', e.target.value)} placeholder="78" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Weight (lbs)</label>
            <input type="number" inputMode="numeric" value={form.weight_lb} onChange={e => updateForm(side, 'weight_lb', e.target.value)} placeholder="210" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <button className="primary" onClick={() => savePlayer(side)}>{editingId ? 'Save Player' : 'Add Player'}</button>
          {editingId && <button className="ghost" onClick={() => cancelEdit(side)}>Cancel</button>}
        </div>

        {/* Roster Table: Scrolls horizontally, contained within parent */}
        <div style={{ 
          overflowX: 'auto', 
          marginTop: 12,
          width: '100%',  // Ensure it respects parent width
          WebkitOverflowScrolling: 'touch',  // Smooth scrolling on iOS
        }}>
          <table className="table" style={{ 
            width: '100%',  // Table uses full available width but allows scroll if needed
            tableLayout: 'auto',  // Allow natural column sizing
          }}>
            <thead>
              <tr>
                <th style={{ minWidth: 40, width: '8%' }}>#</th>
                <th style={{ minWidth: 150, width: '40%' }}>Name</th>
                <th style={{ minWidth: 45, width: '10%' }}>Pos</th>
                <th style={{ minWidth: 60, width: '15%' }}>Ht</th>
                <th style={{ minWidth: 60, width: '15%' }}>Wt</th>
                <th style={{ minWidth: 70, width: '12%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px' }}>No players yet.</td></tr>
              )}
              {players.map(player => (
                <tr key={player.player_id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{player.jersey || '—'}</td>
                  <td style={{ 
                    maxWidth: 200,  // Prevent extremely long names from breaking layout
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={player.name}>{player.name}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{player.position || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatHeight(player.height_in)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatWeight(player.weight_lb)}</td>
                  <td>
                    <button 
                      className="ghost" 
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: 12,
                        whiteSpace: 'nowrap'
                      }} 
                      onClick={() => startEdit(side, player)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /**
   * MAIN RENDER: Roster Management Interface
   * 
   * Provides:
   * - Auto-import status display
   * - Two-column layout (our team vs opponent)
   * - Additional teams section if needed
   * 
   * Layout Strategy:
   * - Single column on mobile for better usability
   * - Two columns on tablet+ for side-by-side comparison
   */
  return (
    <div className="card">
      <h3>Roster</h3>
      
      {/* Import Status Banner */}
      <div style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div>
          <div className="small">NCAA rosters import automatically when you create or load a game.</div>
          {currentGame ? (
            <div className="small">Game: <strong>{currentGame.game_id}</strong></div>
          ) : (
            <div className="small" style={{ color: 'var(--warn)' }}>Create / load a game to enable imports.</div>
          )}
        </div>
        {importStatus && <div className="small" style={{ marginTop: 6 }}>{importStatus}</div>}
      </div>

      {/* Roster Columns: Responsive grid for our team and opponent 
          Key: Using minmax(0, 1fr) prevents columns from expanding beyond container
      */}
      <div className="grid" style={{ 
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 16,
        width: '100%',  // Explicit width constraint
      }}>
        {renderRosterColumn('our', ourPlayers)}
        {renderRosterColumn('opp', oppPlayers)}
      </div>

      {/* Additional Teams: Only shown if players from other teams exist */}
      {otherPlayers.length > 0 && (
        <>
          <hr className="sep" />
          <div>
            <h4>Additional Teams</h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 80 }}>Team</th>
                    <th style={{ minWidth: 100 }}>ID</th>
                    <th style={{ minWidth: 150 }}>Name</th>
                    <th style={{ minWidth: 50 }}>#</th>
                  </tr>
                </thead>
                <tbody>
                  {otherPlayers.map(player => (
                    <tr key={`${player.team_code}-${player.player_id}`}>
                      <td>{player.team_code}</td>
                      <td>{player.player_id}</td>
                      <td>{player.name}</td>
                      <td>{player.jersey || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
