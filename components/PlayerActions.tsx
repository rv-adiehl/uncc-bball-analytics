
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { ACTOR_ROLES, TAG_CODES } from '../lib/schema';
import type { PlayerAction } from '../lib/schema';

type Props = {
  activeGameId?: string;
  activePossId?: number | null;
  activePhaseOrder?: number;
  activeGroupOrder?: number;
  onActionLogged?: (action: PlayerAction) => void;
};

export default function PlayerActions({
  activeGameId,
  activePossId,
  activePhaseOrder,
  activeGroupOrder,
  onActionLogged
}: Props) {
  const { state, dispatch } = useStore();
  const currentGame = useMemo(() => state.games.find(g => g.game_id === state.currentGameId), [state.games, state.currentGameId]);
  const ourCode = currentGame?.our_team_code || 'CHA';
  const oppCode = currentGame?.opp_team_code || 'OPP';
  const [filter, setFilter] = useState({ game_id: activeGameId || state.currentGameId || '', poss_id: activePossId ?? state.nextPossId-1, phase_order: activePhaseOrder || 1, group_order: activeGroupOrder || 1 });
  const rosterCHA = state.players.filter(p=>p.team_code=== ourCode);
  const rosterOPP = state.players.filter(p=>p.team_code=== oppCode);
  const [row, setRow] = useState<PlayerAction>({
    game_id: filter.game_id, poss_id: filter.poss_id, team_code: ourCode, player_id: '', role_side: 'O', actor_role: 'BH',
    phase_order: filter.phase_order, group_order: filter.group_order, action_seq: 1,
    action_type: 'HCO_CBR', result: 'Yes', value: undefined, opportunity_flag: 1, responsibility_weight: 1,
    context_subtype: '', t_rel_sec: undefined, shot_clock_at_action: undefined, created_by: '', comments: ''
  });

  useEffect(() => {
    setFilter(prev => ({
      ...prev,
      game_id: activeGameId || prev.game_id,
      poss_id: activePossId ?? prev.poss_id,
      phase_order: activePhaseOrder || prev.phase_order,
      group_order: activeGroupOrder || prev.group_order
    }));
  }, [activeGameId, activePossId, activePhaseOrder, activeGroupOrder]);

  useEffect(() => {
    setRow(prev => ({
      ...prev,
      game_id: filter.game_id,
      poss_id: filter.poss_id,
      phase_order: filter.phase_order,
      group_order: filter.group_order
    }));
  }, [filter.game_id, filter.poss_id, filter.phase_order, filter.group_order]);

  const actionsForPoss = useMemo(()=> state.playerActions.filter(a=> a.game_id===filter.game_id && a.poss_id===filter.poss_id).sort((a,b)=> (a.phase_order-b.phase_order) || (a.group_order-b.group_order) || ((a.action_seq||0)-(b.action_seq||0))), [state.playerActions, filter]);

  const add = () => {
    if (!row.game_id || !row.poss_id || !row.player_id) { alert('Set game/possession and player'); return; }
    dispatch({ type: 'ADD_ACTION', row });
    setRow(prev => ({ ...prev, action_seq: (prev.action_seq||1)+1 }));
    onActionLogged?.(row);
  };

  const deleteAction = (idx: number) => {
    dispatch({ type: 'DELETE_ACTION', index: idx });
  };

  return (
    <div className="card">
      <h3>Player Actions</h3>
      <div className="grid grid-4">
        <div><label>Game</label><input value={filter.game_id} onChange={e=>{ const v=e.target.value; setFilter({...filter, game_id:v}); setRow({...row, game_id:v}); }}/></div>
        <div><label>Poss ID</label><input type="number" value={filter.poss_id} onChange={e=>{ const v=parseInt(e.target.value||'1'); setFilter({...filter, poss_id:v}); setRow({...row, poss_id:v}); }}/></div>
        <div><label>Phase #</label><input type="number" value={filter.phase_order} onChange={e=>{ const v=parseInt(e.target.value||'1'); setFilter({...filter, phase_order:v}); setRow({...row, phase_order:v}); }}/></div>
        <div><label>Group #</label><input type="number" value={filter.group_order} onChange={e=>{ const v=parseInt(e.target.value||'1'); setFilter({...filter, group_order:v}); setRow({...row, group_order:v}); }}/></div>
      </div>

      <div className="grid grid-4" style={{marginTop:8}}>
        <div><label>Team</label>
          <select value={row.team_code} onChange={e=> setRow({...row, team_code: e.target.value})}>
            <option>CHA</option><option>OPP</option>
          </select>
        </div>
        <div><label>Player</label>
          <select value={row.player_id} onChange={e=> setRow({...row, player_id: e.target.value})}>
            <option value="">—</option>
            {(row.team_code==='CHA' ? rosterCHA : rosterOPP).map(p=> <option key={p.player_id} value={p.player_id}>{p.player_id} • {p.name}</option>)}
          </select>
        </div>
        <div><label>Side</label>
          <select value={row.role_side} onChange={e=> setRow({...row, role_side: e.target.value as any})}>
            <option value="O">O</option><option value="D">D</option>
          </select>
        </div>
        <div><label>Actor Role</label>
          <select value={row.actor_role} onChange={e=> setRow({...row, actor_role: e.target.value as any})}>
            {ACTOR_ROLES.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label>Action Type</label>
          <select value={row.action_type} onChange={e=> setRow({...row, action_type: e.target.value})}>
            {TAG_CODES.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label>Result</label>
          <select value={row.result} onChange={e=> setRow({...row, result: e.target.value as any})}>
            <option>Yes</option><option>No</option><option>Success</option><option>Fail</option><option>N/A</option>
          </select>
        </div>
        <div><label>Value (num)</label><input type="number" step="0.1" value={row.value ?? ''} onChange={e=> setRow({...row, value: e.target.value? parseFloat(e.target.value): undefined})}/></div>
        <div><label>Seq in Group</label><input type="number" value={row.action_seq || 1} onChange={e=> setRow({...row, action_seq: parseInt(e.target.value||'1')})}/></div>
        <div><label>Opportunity (0/1)</label><select value={(row.opportunity_flag||1)} onChange={e=> setRow({...row, opportunity_flag: parseInt(e.target.value) as 0|1})}><option value={1}>1</option><option value={0}>0</option></select></div>
        <div><label>Responsibility Weight</label><input type="number" step="0.1" value={row.responsibility_weight ?? 1} onChange={e=> setRow({...row, responsibility_weight: e.target.value? parseFloat(e.target.value): undefined})}/></div>
        <div><label>Context</label><input value={row.context_subtype||''} onChange={e=> setRow({...row, context_subtype: e.target.value})}/></div>
        <div><label>t_rel_sec</label><input type="number" step="0.1" value={row.t_rel_sec ?? ''} onChange={e=> setRow({...row, t_rel_sec: e.target.value? parseFloat(e.target.value): undefined})}/></div>
        <div><label>SC @ action</label><input type="number" step="1" value={row.shot_clock_at_action ?? ''} onChange={e=> setRow({...row, shot_clock_at_action: e.target.value? parseInt(e.target.value): undefined})}/></div>
        <div><label>Created by</label><input value={row.created_by||''} onChange={e=> setRow({...row, created_by: e.target.value})}/></div>
        <div className="grid" style={{gridTemplateColumns:'1fr'}}>
          <label>Comments</label><textarea value={row.comments||''} onChange={e=> setRow({...row, comments: e.target.value})}/></div>
      </div>
      <div className="row" style={{marginTop:8}}>
        <button className="primary" onClick={add}>Add Action</button>
      </div>

      <hr className="sep" />
      <div className="section-title">Actions for this possession</div>
      <table className="table">
        <thead><tr><th>#</th><th>Team</th><th>Player</th><th>O/D</th><th>Role</th><th>Phase</th><th>Group</th><th>Seq</th><th>Type</th><th>Result</th><th>Val</th><th>Ctx</th><th></th></tr></thead>
        <tbody>
          {actionsForPoss.map((a,i)=> (
            <tr key={i}><td>{i+1}</td><td>{a.team_code}</td><td>{a.player_id}</td><td>{a.role_side}</td><td>{a.actor_role}</td><td>{a.phase_order}</td><td>{a.group_order}</td><td>{a.action_seq}</td><td>{a.action_type}</td><td>{a.result}</td><td>{a.value??''}</td><td>{a.context_subtype}</td>
            <td><button className="danger" onClick={()=> deleteAction(state.playerActions.indexOf(a))}>×</button></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
