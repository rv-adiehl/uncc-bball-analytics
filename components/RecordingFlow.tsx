'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import PossessionBuilder from './PossessionBuilder';
import StatTable from './StatTable';
import OutcomePanel from './OutcomePanel';
import type { Possession } from '../lib/schema';
import { ActionTimeline, PossessionSummaryCard } from './ActionSummaries';

type FlowStep = 1 | 2 | 3;

const flowSteps: { id: FlowStep; label: string; detail: string }[] = [
  { id: 1, label: 'Start a new possession', detail: 'Set the period, teams, lineups, and possession metadata.' },
  { id: 2, label: 'Define action stats', detail: 'Track player stats for the current action, then move to the next or finish.' },
  { id: 3, label: 'Complete the possession', detail: 'Capture the possession outcome and notes before moving on.' }
];

const periodLabel = (value: number) => {
  if (value === 1) return '1st Half';
  if (value === 2) return '2nd Half';
  return `OT${value - 2}`;
};

type ActionMode = 'set' | 'transition';

export default function RecordingFlow() {
  const { state } = useStore();
  const [activeStep, setActiveStep] = useState<FlowStep>(1);
  const [highestStepUnlocked, setHighestStepUnlocked] = useState<FlowStep>(1);
  const [activePossId, setActivePossId] = useState<number | null>(null);
  const [periodOptions, setPeriodOptions] = useState<number[]>([1, 2]);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentActionSeq, setCurrentActionSeq] = useState(1);
  const [currentActionMode, setCurrentActionMode] = useState<ActionMode>('set');
  const currentGameId = state.currentGameId;

  const activateStep = (next: FlowStep) => {
    setActiveStep(next);
    setHighestStepUnlocked(prev => (next > prev ? next : prev));
  };

  useEffect(() => {
    // reset flow when switching games
    setActiveStep(1);
    setHighestStepUnlocked(1);
    setActivePossId(null);
    setPeriodOptions([1, 2]);
    setCurrentPeriod(1);
    setGameEnded(false);
    setCurrentActionSeq(1);
    setCurrentActionMode('set');
  }, [currentGameId]);

  const handlePossessionStarted = (poss: Possession) => {
    setActivePossId(poss.poss_id);
    setCurrentActionSeq(1);
    setCurrentActionMode('set');
    activateStep(2);
  };

  const openOutcomeStep = () => {
    activateStep(3);
    setHighestStepUnlocked(prev => (prev < 3 ? 3 : prev));
  };

  const handlePossessionComplete = () => {
    setActivePossId(null);
    setActiveStep(1);
    setHighestStepUnlocked(1);
    setCurrentActionSeq(1);
    setCurrentActionMode('set');
  };

  const addOvertime = () => {
    setPeriodOptions(prev => {
      const nextValue = (prev.length ? Math.max(...prev) : 2) + 1;
      setCurrentPeriod(nextValue);
      setGameEnded(false);
      return [...prev, nextValue];
    });
  };

  const sortedPeriods = useMemo(() => [...periodOptions].sort((a, b) => a - b), [periodOptions]);

  const markPeriodComplete = () => {
    const idx = sortedPeriods.indexOf(currentPeriod);
    if (idx >= 0 && idx < sortedPeriods.length - 1) {
      setCurrentPeriod(sortedPeriods[idx + 1]);
    } else {
      setGameEnded(true);
    }
  };
  const disableFlow = !currentGameId;
  const canStartPossession = Boolean(currentGameId) && !gameEnded;
  const canLogActions = Boolean(activePossId);

  const incrementActionSeq = () => {
    setCurrentActionSeq(prev => prev + 1);
  };

  const handleActionSeqChange = (value: number) => {
    if (!Number.isFinite(value) || value < 1) return;
    setCurrentActionSeq(Math.floor(value));
  };

  const renderBody = () => {
    if (disableFlow) {
      return (
        <div className="card">
          <h3>Recording Flow</h3>
          <div className="small">Create or load a game to begin recording possessions.</div>
        </div>
      );
    }
    switch (activeStep) {
      case 1:
        return (
          <div className="card">
            <h3>1 • Start Possession</h3>
            {!canStartPossession && <div className="small" style={{ color: 'var(--warn)', marginBottom: 8 }}>Game is marked complete. Add overtime or resume play to keep charting.</div>}
            <PossessionBuilder activePeriod={currentPeriod} onStarted={handlePossessionStarted} canStart={canStartPossession} />
          </div>
        );
      case 2:
        return (
          <>
            {/* Action Configuration Card */}
            <div className="card">
              <h3>2 • Action Stat Sheet</h3>
              {!canLogActions && (
                <div className="small" style={{ color: 'var(--warn)' }}>
                  Start a possession before defining stats for an action.
                </div>
              )}
              {canLogActions && (
                <>
                  {/* Action Controls: Responsive grid for mobile */}
                  <div className="grid grid-3" style={{ marginBottom: 8 }}>
                    <div>
                      <label>Action #</label>
                      <input
                        type="number"
                        min={1}
                        value={currentActionSeq}
                        onChange={e => handleActionSeqChange(parseInt(e.target.value || '1', 10))}
                      />
                    </div>
                    <div>
                      <label>Action Context</label>
                      <select value={currentActionMode} onChange={e => setCurrentActionMode(e.target.value as ActionMode)}>
                        <option value="set">Set / Half Court</option>
                        <option value="transition">Transition</option>
                      </select>
                    </div>
                  </div>
                  {/* Guidance Text */}
                  <div className="small" style={{ padding: '8px 0' }}>
                    Tag each player involved, add rebound + shot context, then advance.
                  </div>
                </>
              )}
            </div>

            {/* Stat Grid: Main data entry interface */}
            {canLogActions && (
              <StatTable
                gameId={currentGameId ?? undefined}
                possId={activePossId ?? undefined}
                actionSeq={currentActionSeq}
                mode={currentActionMode}
              />
            )}

            {/* Action Timeline: Shows completed actions */}
            {canLogActions && (
              <ActionTimeline gameId={currentGameId ?? undefined} possId={activePossId ?? undefined} />
            )}

            {/* Action Controls: Navigation buttons */}
            {canLogActions && (
              <div className="card">
                <div className="flow-actions">
                  <button className="ghost" onClick={incrementActionSeq}>Add another action</button>
                  <button className="primary" onClick={openOutcomeStep}>Complete possession</button>
                </div>
              </div>
            )}
          </>
        );
      case 3:
        return (
          <div className="card">
            <h3>3 • Possession Outcome</h3>
            <PossessionSummaryCard gameId={currentGameId ?? undefined} possId={activePossId ?? undefined} />
            <OutcomePanel activeGameId={currentGameId} activePossId={activePossId || undefined} onComplete={handlePossessionComplete} />
            <div className="flow-actions" style={{ marginTop: 12 }}>
              <button className="ghost" onClick={() => setActiveStep(2)} disabled={!activePossId}>
                Back to action stats
              </button>
              <div className="small">Finalize result, notes, and move to next possession.</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flow-layout">
      <div className="flow-sidebar">
        <div className="card">
          <h3>Possession Flow</h3>
          <ol className="flow-steps">
            {flowSteps.map(step => {
              const disabled = step.id > highestStepUnlocked;
              return (
                <li key={step.id} className={step.id === activeStep ? 'active' : undefined}>
                  <button onClick={() => !disabled && setActiveStep(step.id)} disabled={disabled}>
                    <strong>{step.id}. {step.label}</strong>
                    <div className="small">{step.detail}</div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="card">
          <h3>Game Progress</h3>
          <div className="small">Active period</div>
          <select value={currentPeriod} onChange={e => {
            const next = parseInt(e.target.value, 10);
            if (!Number.isNaN(next)) setCurrentPeriod(next);
          }}>
            {sortedPeriods.map(value => (
              <option key={value} value={value}>{periodLabel(value)}</option>
            ))}
          </select>
          <div className="small" style={{ marginTop: 8 }}>Controls</div>
          <div className="flow-actions">
            <button className="ghost" onClick={markPeriodComplete}>{currentPeriod >= 2 && sortedPeriods.indexOf(currentPeriod) === sortedPeriods.length - 1 ? 'Half / period complete' : 'Advance to next period'}</button>
            <button className="ghost" onClick={addOvertime}>Add overtime period</button>
            {!gameEnded && <button className="ghost" onClick={() => setGameEnded(true)}>End game</button>}
            {gameEnded && <button className="primary" onClick={() => setGameEnded(false)}>Resume charting</button>}
          </div>
          {gameEnded && <div className="small" style={{ marginTop: 8, color: 'var(--warn)' }}>Game marked complete. Add overtime or resume to continue charting.</div>}
        </div>
      </div>
      <div className="flow-main">
        {renderBody()}
      </div>
    </div>
  );
}
