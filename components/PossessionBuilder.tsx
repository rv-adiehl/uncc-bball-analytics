
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import type { Possession, PossessionPlayer } from '../lib/schema';

type Props = {
  activePeriod?: number;
  onStarted?: (possession: Possession) => void;
  canStart?: boolean;
};

const MAX_CLOCK_SECONDS = 20 * 60;

function normalizeClockInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const sanitized = trimmed.replace(/[^\d:]/g, '');
  if (!sanitized) return '';
  if (!sanitized.replace(/:/g, '')) return '';
  const parts = sanitized.split(':');
  if (parts.length > 2) return null;

  let minutes = 0;
  let seconds = 0;
  if (parts.length === 2) {
    const [minPart, secPart] = parts;
    if (minPart && !/^\d+$/.test(minPart)) return null;
    if (secPart && !/^\d+$/.test(secPart)) return null;
    minutes = minPart ? parseInt(minPart, 10) : 0;
    seconds = secPart ? parseInt(secPart, 10) : 0;
  } else {
    const digits = parts[0];
    if (!/^\d+$/.test(digits)) return null;
    if (digits.length <= 2) {
      seconds = parseInt(digits, 10);
    } else {
      minutes = parseInt(digits.slice(0, digits.length - 2), 10);
      seconds = parseInt(digits.slice(-2), 10);
    }
  }

  minutes = Math.max(0, minutes);
  seconds = Math.max(0, seconds);
  if (seconds > 59) {
    minutes += Math.floor(seconds / 60);
    seconds = seconds % 60;
  }
  let total = minutes * 60 + seconds;
  total = Math.min(Math.max(total, 0), MAX_CLOCK_SECONDS);
  const finalMinutes = Math.floor(total / 60);
  const finalSeconds = total % 60;
  return `${finalMinutes}:${finalSeconds.toString().padStart(2, '0')}`;
}

function buildLineupArray(rows: PossessionPlayer[]) {
  const arr = ['', '', '', '', ''];
  rows.forEach(row => {
    const slot = row.lineup_slot - 1;
    if (slot >= 0 && slot < arr.length) {
      arr[slot] = row.player_id;
    }
  });
  return arr;
}

function clampInteger(value: string, min: number, max: number) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return undefined;
  return Math.min(Math.max(parsed, min), max);
}

export default function PossessionBuilder({ activePeriod, onStarted, canStart = true }: Props) {
  const { state, dispatch } = useStore();
  const currentGame = useMemo(() => state.games.find(g => g.game_id === state.currentGameId), [state.games, state.currentGameId]);
  const defaultOffense = currentGame?.our_team_code || 'CHA';
  const defaultDefense = currentGame?.opp_team_code || 'OPP';
  const [form, setForm] = useState<Possession>({
    game_id: state.currentGameId || '',
    poss_id: state.nextPossId,
    period: activePeriod || 1,
    offense_team: defaultOffense,
    defense_team: defaultDefense,
    start_clock: '', end_clock: '',
    possession_type: 'half_court',
    offensive_set: '', defensive_set: '', press_type: '',
    ball_advancer_player_id: '', time_to_cross_half_sec: undefined, time_to_enter_set_sec: undefined
  } as any);

  const ourPlayers = useMemo(() => state.players.filter(p => p.team_code === form.offense_team || p.team_code === form.defense_team), [state.players, form.offense_team, form.defense_team]);
  const offenseRoster = useMemo(()=> state.players.filter(p => p.team_code === form.offense_team), [state.players, form.offense_team]);
  const defenseRoster = useMemo(()=> state.players.filter(p => p.team_code === form.defense_team), [state.players, form.defense_team]);

  const [off5, setOff5] = useState<string[]>(['','','','','']);
  const [def5, setDef5] = useState<string[]>(['','','','','']);
  const lastAppliedLineupRef = useRef<string>();
  const [clockDrafts, setClockDrafts] = useState<{ start_clock: string; end_clock: string }>({ start_clock: '', end_clock: '' });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      game_id: state.currentGameId || '',
      poss_id: state.nextPossId,
      offense_team: prev.offense_team || defaultOffense,
      defense_team: prev.defense_team || defaultDefense
    }));
  }, [state.currentGameId, state.nextPossId, defaultOffense, defaultDefense]);

  useEffect(() => {
    if (activePeriod != null) {
      setForm(prev => ({ ...prev, period: activePeriod }));
    }
  }, [activePeriod]);

  useEffect(() => {
    setClockDrafts({
      start_clock: form.start_clock || '',
      end_clock: form.end_clock || ''
    });
  }, [form.start_clock, form.end_clock]);

  useEffect(() => {
    if (!state.currentGameId) return;
    const rowsForGame = state.possPlayers.filter(r => r.game_id === state.currentGameId);
    if (!rowsForGame.length) return;
    const lastPossId = rowsForGame.reduce((max, row) => Math.max(max, row.poss_id), 0);
    if (!lastPossId) return;
    const key = `${state.currentGameId}:${lastPossId}`;
    if (lastAppliedLineupRef.current === key) return;
    const lastRows = rowsForGame.filter(r => r.poss_id === lastPossId);
    if (!lastRows.length) return;
    lastAppliedLineupRef.current = key;
    const offenseRows = lastRows.filter(r => r.on_offense_at_start === 1);
    const defenseRows = lastRows.filter(r => r.on_offense_at_start === 0);
    setOff5(buildLineupArray(offenseRows));
    setDef5(buildLineupArray(defenseRows));
    const offenseTeam = offenseRows[0]?.team_code;
    const defenseTeam = defenseRows[0]?.team_code;
    if (offenseTeam || defenseTeam) {
      setForm(prev => ({
        ...prev,
        offense_team: offenseTeam || prev.offense_team,
        defense_team: defenseTeam || prev.defense_team
      }));
    }
  }, [state.currentGameId, state.possPlayers]);

  useEffect(() => {
    lastAppliedLineupRef.current = undefined;
  }, [state.currentGameId]);

  useEffect(() => {
    if (form.ball_advancer_player_id && !off5.includes(form.ball_advancer_player_id)) {
      setForm(prev => ({ ...prev, ball_advancer_player_id: '' }));
    }
  }, [off5, form.ball_advancer_player_id]);

  const handleClockChange = (field: 'start_clock' | 'end_clock') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let sanitized = raw.replace(/[^\d:]/g, '');
    const firstColon = sanitized.indexOf(':');
    if (firstColon !== -1) {
      const before = sanitized.slice(0, firstColon + 1);
      const after = sanitized.slice(firstColon + 1).replace(/:/g, '');
      sanitized = before + after;
    }
    setClockDrafts(prev => ({ ...prev, [field]: sanitized }));
  };

  const handleClockBlur = (field: 'start_clock' | 'end_clock') => () => {
    const raw = clockDrafts[field] || '';
    const formatted = normalizeClockInput(raw);
    if (formatted === null) {
      setClockDrafts(prev => ({ ...prev, [field]: form[field] || '' }));
      return;
    }
    setClockDrafts(prev => ({ ...prev, [field]: formatted }));
    setForm(prev => {
      if ((prev[field] || '') === formatted) return prev;
      return { ...prev, [field]: formatted };
    });
  };

  const commitClockForSave = (field: 'start_clock' | 'end_clock') => {
    const raw = clockDrafts[field] || '';
    const formatted = normalizeClockInput(raw);
    const safeValue = formatted ?? '';
    if (safeValue !== clockDrafts[field]) {
      setClockDrafts(prev => ({ ...prev, [field]: safeValue }));
    }
    setForm(prev => {
      if ((prev[field] || '') === safeValue) return prev;
      return { ...prev, [field]: safeValue };
    });
    return safeValue;
  };

  const handleIntegerFieldChange = (field: 'time_to_cross_half_sec' | 'time_to_enter_set_sec', min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(prev => {
      if (!value) {
        if (prev[field] == null) return prev;
        return { ...prev, [field]: undefined };
      }
      const clamped = clampInteger(value, min, max);
      if (clamped == null) return prev;
      if (prev[field] === clamped) return prev;
      return { ...prev, [field]: clamped };
    });
  };

  const ballAdvancerOptions = useMemo(() => off5
    .filter(pid => !!pid)
    .map(pid => {
      const player = offenseRoster.find(p => p.player_id === pid);
      return { id: pid, label: player ? `${player.player_id} • ${player.name}` : pid };
    }), [off5, offenseRoster]);

  const start = () => {
    if (!canStart) { alert('Game flow is paused. Resume or start a new period before adding possessions.'); return; }
    if (!state.currentGameId) { alert('Create/Load a game first.'); return; }
    const startClock = commitClockForSave('start_clock');
    const endClock = commitClockForSave('end_clock');
    const poss: Possession = { ...form, start_clock: startClock, end_clock: endClock, game_id: state.currentGameId!, poss_id: state.nextPossId };
    dispatch({ type: 'START_POSSESSION', possession: poss });

    // lineup rows
    const rows: PossessionPlayer[] = [];
    off5.forEach((pid, idx) => pid && rows.push({ game_id: poss.game_id, poss_id: poss.poss_id, team_code: poss.offense_team, player_id: pid, lineup_slot: idx+1, on_offense_at_start: 1 }));
    def5.forEach((pid, idx) => pid && rows.push({ game_id: poss.game_id, poss_id: poss.poss_id, team_code: poss.defense_team, player_id: pid, lineup_slot: idx+1, on_offense_at_start: 0 }));
    if (rows.length !== 10) { if(!confirm('You did not enter 10 lineup players. Continue?')) return; }
    dispatch({ type: 'ADD_POSSESSION_PLAYERS', rows });
    // bump fields for next possession
    setForm(prev => ({ ...prev, poss_id: prev.poss_id + 1 }));
    onStarted?.(poss);
  };

  return (
    <div className="card">
      <h3>Possession Builder</h3>
      <div className="grid grid-4">
        <div><label>Game</label><div className="badge">{state.currentGameId || '—'}</div></div>
        <div><label>Next Poss ID</label><div className="badge">{state.nextPossId}</div></div>
        <div><label>Period</label><input type="number" min={1} max={5} value={form.period} onChange={e=>setForm({...form, period: parseInt(e.target.value||'1')})}/></div>
        <div><label>Type</label>
          <select value={form.possession_type||''} onChange={e=>setForm({...form, possession_type: e.target.value})}>
            <option>fast_break</option><option>secondary_break</option><option>half_court</option><option>blob</option><option>slob</option><option>press_break</option><option>ato</option>
          </select>
        </div>
        <div><label>Offense Team</label>
          <select value={form.offense_team} onChange={e=>setForm({...form, offense_team: e.target.value})}>
            {[defaultOffense, defaultDefense].map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
        <div><label>Defense Team</label>
          <select value={form.defense_team} onChange={e=>setForm({...form, defense_team: e.target.value})}>
            {[defaultDefense, defaultOffense].map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
        <div><label>Start Clock (mm:ss)</label><input value={clockDrafts.start_clock} onChange={handleClockChange('start_clock')} onBlur={handleClockBlur('start_clock')} placeholder="0:00"/></div>
        <div><label>End Clock (mm:ss)</label><input value={clockDrafts.end_clock} onChange={handleClockChange('end_clock')} onBlur={handleClockBlur('end_clock')} placeholder="0:00"/></div>
        <div><label>Offensive Set</label><input value={form.offensive_set||''} onChange={e=>setForm({...form, offensive_set: e.target.value})}/></div>
        <div><label>Defensive Set</label><input value={form.defensive_set||''} onChange={e=>setForm({...form, defensive_set: e.target.value})}/></div>
        <div><label>Press Type</label><input value={form.press_type||''} onChange={e=>setForm({...form, press_type: e.target.value})}/></div>
        <div><label>Ball Advancer</label>
          <select value={form.ball_advancer_player_id||''} onChange={e=>setForm({...form, ball_advancer_player_id: e.target.value})}>
            <option value="">—</option>
            {ballAdvancerOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div><label>Time to Cross (s)</label><input type="number" min={0} max={10} step={1} value={form.time_to_cross_half_sec ?? ''} onChange={handleIntegerFieldChange('time_to_cross_half_sec', 0, 10)}/></div>
        <div><label>Time to Enter Set (s)</label><input type="number" min={0} max={30} step={1} value={form.time_to_enter_set_sec ?? ''} onChange={handleIntegerFieldChange('time_to_enter_set_sec', 0, 30)}/></div>
      </div>

      <div className="grid grid-2" style={{marginTop:12}}>
        <div className="card">
          <h3>Offense Lineup ({form.offense_team})</h3>
          {off5.map((v,idx)=>(
            <div className="row" key={idx}>
              <label>Slot {idx+1}</label>
              <select value={v} onChange={e=>{ const cp=[...off5]; cp[idx]=e.target.value; setOff5(cp); }}>
                <option value="">—</option>
                {offenseRoster.map(p=> <option key={p.player_id} value={p.player_id}>{p.player_id} • {p.name}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Defense Lineup ({form.defense_team})</h3>
          {def5.map((v,idx)=>(
            <div className="row" key={idx}>
              <label>Slot {idx+1}</label>
              <select value={v} onChange={e=>{ const cp=[...def5]; cp[idx]=e.target.value; setDef5(cp); }}>
                <option value="">—</option>
                {defenseRoster.map(p=> <option key={p.player_id} value={p.player_id}>{p.player_id} • {p.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{marginTop:12}}>
        <button className="primary" onClick={start} disabled={!canStart}>Start / Record Possession</button>
        <div className="small">Tip: Lineups can be partial while you chart; you can fill missing ids later.</div>
      </div>
    </div>
  );
}
