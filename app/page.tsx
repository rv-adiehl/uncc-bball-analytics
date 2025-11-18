'use client';
import React, { useMemo, useState } from 'react';
import { StoreProvider, useStore } from '../lib/store';
import GameSetup from '../components/GameSetup';
import RosterEditor from '../components/RosterEditor';
import RecordingFlow from '../components/RecordingFlow';
import ExportPanel from '../components/ExportPanel';

function AppInner() {
  const [step, setStep] = useState<number>(1);
  const { state } = useStore();
  const currentGame = useMemo(() => state.games.find(g => g.game_id === state.currentGameId), [state.games, state.currentGameId]);
  const ourPlayers = state.players.filter(p => p.team_code === currentGame?.our_team_code).length;
  const oppPlayers = state.players.filter(p => p.team_code === currentGame?.opp_team_code).length;
  const canStartRecording = Boolean(currentGame && ourPlayers > 0 && oppPlayers > 0);
  return (
    <>
      <div className="stepper">
        <button className={step===1?'step active':'step'} onClick={()=>setStep(1)}>1 • Game & Roster</button>
        <button className={step===2?'step active':'step'} onClick={()=>setStep(2)} disabled={!canStartRecording}>2 • Recording Flow</button>
        <button className={step===3?'step active':'step'} onClick={()=>setStep(3)}>3 • Review & Export</button>
      </div>
      <div style={{height:12}} />
      {step===1 && (
        <>
          <GameSetup/>
          <RosterEditor/>
          <div className="card flow-card" style={{ marginTop: 16 }}>
            <h3>Ready to record?</h3>
            <div className="small">Once the game and both rosters are loaded, move into the guided recording flow.</div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="primary" onClick={()=>setStep(2)} disabled={!canStartRecording}>Game setup complete → Start charting</button>
              {!canStartRecording && <div className="small" style={{ color: 'var(--warn)' }}>Load a game and both team rosters to continue.</div>}
            </div>
          </div>
        </>
      )}
      {step===2 && (
        <RecordingFlow/>
      )}
      {step===3 && (
        <ExportPanel/>
      )}
    </>
  );
}

export default function Page() {
  return <StoreProvider><AppInner/></StoreProvider>;
}
