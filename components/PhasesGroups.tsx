
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import type { PossPhase, ActionGroup } from '../lib/schema';

type Props = {
  activeGameId?: string;
  activePossId?: number | null;
  activePhaseOrder?: number;
  activeGroupOrder?: number;
  onPhaseCreated?: (phaseOrder: number) => void;
  onGroupCreated?: (groupOrder: number, phaseOrder: number) => void;
};

export default function PhasesGroups({
  activeGameId,
  activePossId,
  activePhaseOrder,
  activeGroupOrder,
  onPhaseCreated,
  onGroupCreated
}: Props) {
  const { state, dispatch } = useStore();
  const lastPoss = useMemo(() => {
    return [...state.possessions].sort((a,b)=> (a.game_id+a.poss_id) > (b.game_id+b.poss_id) ? 1 : -1).slice(-1)[0];
  }, [state.possessions]);
  const [phase, setPhase] = useState<PossPhase>({
    game_id: activeGameId || lastPoss?.game_id || state.currentGameId || '',
    poss_id: activePossId ?? lastPoss?.poss_id ?? 1,
    phase_order: activePhaseOrder || 1,
    phase_type: 'half_court',
    phase_label: ''
  });

  const [group, setGroup] = useState<ActionGroup>({
    game_id: phase.game_id,
    poss_id: phase.poss_id,
    phase_order: phase.phase_order,
    group_order: activeGroupOrder || 1,
    group_label: '',
    trigger_type: ''
  });

  useEffect(() => {
    const nextGame = activeGameId || state.currentGameId || '';
    setPhase(prev => ({
      ...prev,
      game_id: nextGame || prev.game_id || ''
    }));
    setGroup(prev => ({ ...prev, game_id: nextGame || prev.game_id || '' }));
  }, [activeGameId, state.currentGameId]);

  useEffect(() => {
    if (activePossId == null) return;
    setPhase(prev => ({ ...prev, poss_id: activePossId }));
    setGroup(prev => ({ ...prev, poss_id: activePossId }));
  }, [activePossId]);

  useEffect(() => {
    if (activePhaseOrder == null) return;
    setPhase(prev => ({ ...prev, phase_order: activePhaseOrder }));
    setGroup(prev => ({ ...prev, phase_order: activePhaseOrder }));
  }, [activePhaseOrder]);

  useEffect(() => {
    if (activeGroupOrder == null) return;
    setGroup(prev => ({ ...prev, group_order: activeGroupOrder }));
  }, [activeGroupOrder]);

  const addPhase = () => {
    if (!phase.game_id) { alert('Start a possession first.'); return; }
    dispatch({ type: 'ADD_PHASE', row: phase });
    setGroup(g=> ({ ...g, game_id: phase.game_id, poss_id: phase.poss_id, phase_order: phase.phase_order }));
    setPhase(p => ({ ...p, phase_order: p.phase_order + 1 }));
    onPhaseCreated?.(phase.phase_order);
  };
  const addGroup = () => {
    if (!group.game_id) { alert('Create a phase first.'); return; }
    dispatch({ type: 'ADD_GROUP', row: group });
    setGroup(g => ({ ...g, group_order: g.group_order + 1 }));
    onGroupCreated?.(group.group_order, group.phase_order);
  };

  const phaseList = state.possPhases.filter(p => p.game_id===phase.game_id && p.poss_id===phase.poss_id).sort((a,b)=>a.phase_order-b.phase_order);
  const groupList = state.actionGroups.filter(g => g.game_id===phase.game_id && g.poss_id===phase.poss_id).sort((a,b)=> a.phase_order===b.phase_order ? a.group_order-b.group_order : a.phase_order-b.phase_order);

  return (
    <div className="card">
      <h3>Phases & Groups (per possession)</h3>
      <div className="grid grid-4">
        <div><label>Game</label><input value={phase.game_id} onChange={e=> setPhase({...phase, game_id: e.target.value})}/></div>
        <div><label>Poss ID</label><input type="number" value={phase.poss_id} onChange={e=> setPhase({...phase, poss_id: parseInt(e.target.value||'1')})}/></div>
        <div><label>Phase Order</label><input type="number" value={phase.phase_order} onChange={e=> setPhase({...phase, phase_order: parseInt(e.target.value||'1')})}/></div>
        <div><label>Phase Type</label>
          <select value={phase.phase_type||''} onChange={e=> setPhase({...phase, phase_type: e.target.value})}>
            <option>transition</option><option>entry</option><option>half_court</option><option>post_shot</option><option>second_chance</option><option>press_break</option><option>ato</option><option>blob</option><option>slob</option>
          </select>
        </div>
        <div><label>Phase Label</label><input value={phase.phase_label||''} onChange={e=> setPhase({...phase, phase_label: e.target.value})}/></div>
        <div><label>Off Set (override)</label><input value={phase.offensive_set||''} onChange={e=> setPhase({...phase, offensive_set: e.target.value})}/></div>
        <div><label>Def Set (override)</label><input value={phase.defensive_set||''} onChange={e=> setPhase({...phase, defensive_set: e.target.value})}/></div>
        <div><label>Press Type</label><input value={phase.press_type||''} onChange={e=> setPhase({...phase, press_type: e.target.value})}/></div>
      </div>
      <div className="row" style={{marginTop:8}}>
        <button className="primary" onClick={addPhase}>Add Phase</button>
      </div>

      <hr className="sep"/>
      <h3>Groups inside a Phase</h3>
      <div className="grid grid-4">
        <div><label>Phase Order</label><input type="number" value={group.phase_order} onChange={e=> setGroup({...group, phase_order: parseInt(e.target.value||'1')})}/></div>
        <div><label>Group Order</label><input type="number" value={group.group_order} onChange={e=> setGroup({...group, group_order: parseInt(e.target.value||'1')})}/></div>
        <div><label>Label</label><input value={group.group_label||''} onChange={e=> setGroup({...group, group_label: e.target.value})}/></div>
        <div><label>Trigger</label><input value={group.trigger_type||''} onChange={e=> setGroup({...group, trigger_type: e.target.value})} placeholder="PnR / DHO / Spain / Horns / Ghost ..."/></div>
      </div>
      <div className="row" style={{marginTop:8}}>
        <button className="ghost" onClick={addGroup}>Add Group</button>
      </div>

      <hr className="sep"/>
      <div className="grid grid-2">
        <div>
          <div className="section-title">Phases</div>
          <table className="table">
            <thead><tr><th>#</th><th>Type</th><th>Label</th><th>Off</th><th>Def</th></tr></thead>
            <tbody>{phaseList.map((p,i)=>(<tr key={i}><td>{p.phase_order}</td><td>{p.phase_type}</td><td>{p.phase_label}</td><td>{p.offensive_set}</td><td>{p.defensive_set}</td></tr>))}</tbody>
          </table>
        </div>
        <div>
          <div className="section-title">Groups</div>
          <table className="table">
            <thead><tr><th>Phase</th><th>Grp</th><th>Label</th><th>Trigger</th></tr></thead>
            <tbody>{groupList.map((g,i)=>(<tr key={i}><td>{g.phase_order}</td><td>{g.group_order}</td><td>{g.group_label}</td><td>{g.trigger_type}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
