
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import type { Possession } from '../lib/schema';

type Props = {
  activeGameId?: string;
  activePossId?: number | null;
  onComplete?: (possession: Possession) => void;
};

export default function OutcomePanel({ activeGameId, activePossId, onComplete }: Props) {
  const { state, dispatch } = useStore();
  const lastPoss = useMemo(() => {
    return [...state.possessions].sort((a,b)=> (a.game_id+a.poss_id) > (b.game_id+b.poss_id) ? 1 : -1).slice(-1)[0];
  }, [state.possessions]);
  const [possed, setPossed] = useState<Possession>(lastPoss || ({
    game_id: activeGameId || state.currentGameId || '', poss_id: activePossId ?? state.nextPossId-1, period: 1, offense_team: 'CHA', defense_team: 'OPP'
  } as any));
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setPossed(prev => ({
      ...prev,
      game_id: activeGameId || state.currentGameId || prev.game_id || '',
      poss_id: activePossId ?? prev.poss_id ?? state.nextPossId-1
    }));
  }, [activeGameId, activePossId, state.currentGameId, state.nextPossId]);

  const save = () => {
    dispatch({ type: 'UPSERT_POSSESSION', possession: possed });
    setStatus(`Saved outcome for possession ${possed.poss_id}.`);
    onComplete?.(possed);
  };

  /**
   * RENDER: Outcome Panel
   * 
   * Captures the final result of a possession:
   * - Outcome type (made shot, turnover, etc.)
   * - Scoring details (points, shooter, assist)
   * - Rebounding and foul information
   * - Notes for context
   * 
   * Mobile Optimization:
   * - Grid-4 layout collapses to single column on mobile
   * - All form fields have proper touch targets
   * - Clear visual hierarchy
   */
  return (
    <div className="card">
      <h3>Outcome & Notes</h3>
      
      {/* Outcome details form */}
      <div className="grid grid-4">
        <div>
          <label>Game</label>
          <input value={possed.game_id} onChange={e=> setPossed({...possed, game_id: e.target.value})}/>
        </div>
        <div>
          <label>Poss ID</label>
          <input type="number" value={possed.poss_id} onChange={e=> setPossed({...possed, poss_id: parseInt(e.target.value||'1')})}/>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label>Outcome</label>
          <select value={possed.outcome_type||''} onChange={e=> setPossed({...possed, outcome_type: e.target.value})}>
            <option value="">—</option>
            <option>2pm</option>
            <option>3pm</option>
            <option>miss_dreb</option>
            <option>miss_oreb</option>
            <option>ft_make</option>
            <option>ft_miss</option>
            <option>turnover_live</option>
            <option>turnover_dead</option>
            <option>offensive_foul</option>
            <option>end_period</option>
          </select>
        </div>
        <div>
          <label>Points (O)</label>
          <input type="number" value={possed.points_scored_offense ?? ''} onChange={e=> setPossed({...possed, points_scored_offense: e.target.value?parseInt(e.target.value):undefined})}/>
        </div>
        <div>
          <label>Points (D)</label>
          <input type="number" value={possed.points_scored_defense ?? ''} onChange={e=> setPossed({...possed, points_scored_defense: e.target.value?parseInt(e.target.value):undefined})}/>
        </div>
        <div>
          <label>Shooter</label>
          <input value={possed.shooter_id||''} onChange={e=> setPossed({...possed, shooter_id: e.target.value})}/>
        </div>
        <div>
          <label>Assist</label>
          <input value={possed.assisted_by_id||''} onChange={e=> setPossed({...possed, assisted_by_id: e.target.value})}/>
        </div>
        <div>
          <label>Shot Loc</label>
          <select value={possed.shot_location||''} onChange={e=> setPossed({...possed, shot_location: e.target.value})}>
            <option value="">—</option>
            <option>rim</option>
            <option>paint</option>
            <option>midrange</option>
            <option>three</option>
          </select>
        </div>
        <div>
          <label>Contest</label>
          <select value={possed.shot_contested||''} onChange={e=> setPossed({...possed, shot_contested: e.target.value})}>
            <option value="">—</option>
            <option>uncontested</option>
            <option>contested</option>
          </select>
        </div>
        <div>
          <label>Reb Type</label>
          <select value={possed.rebound_type||''} onChange={e=> setPossed({...possed, rebound_type: e.target.value})}>
            <option value="">—</option>
            <option>DREB</option>
            <option>OREB</option>
          </select>
        </div>
        <div>
          <label>Rebounder</label>
          <input value={possed.rebounder_id||''} onChange={e=> setPossed({...possed, rebounder_id: e.target.value})}/>
        </div>
        <div>
          <label>2nd Chance</label>
          <select value={possed.is_second_chance ?? 0} onChange={e=> setPossed({...possed, is_second_chance: parseInt(e.target.value) as any})}>
            <option value={0}>0</option>
            <option value={1}>1</option>
          </select>
        </div>
        <div>
          <label>TO Player</label>
          <input value={possed.turnover_player_id||''} onChange={e=> setPossed({...possed, turnover_player_id: e.target.value})}/>
        </div>
        <div>
          <label>TO Type</label>
          <input value={possed.turnover_type||''} onChange={e=> setPossed({...possed, turnover_type: e.target.value})}/>
        </div>
        <div>
          <label>Fouled</label>
          <input value={possed.fouled_player_id||''} onChange={e=> setPossed({...possed, fouled_player_id: e.target.value})}/>
        </div>
        <div>
          <label>Foul Type</label>
          <input value={possed.foul_type||''} onChange={e=> setPossed({...possed, foul_type: e.target.value})}/>
        </div>
      </div>

      {/* Notes section */}
      <div style={{ marginTop: 12 }}>
        <label>Notes</label>
        <textarea value={possed.notes||''} onChange={e=> setPossed({...possed, notes: e.target.value})}/>
      </div>

      {/* Save button and status */}
      <div className="row" style={{marginTop:12}}>
        <button className="primary" onClick={save}>Save Outcome</button>
      </div>
      {status && <div className="small" style={{ marginTop: 8, color: 'var(--good)' }}>{status}</div>}
    </div>
  );
}
