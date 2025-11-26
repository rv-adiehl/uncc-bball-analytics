'use client';
import React, { useCallback } from 'react';
import type { PlayerPossessionStat, PossessionStatMode } from '../lib/schema';

/**
 * StatTableRow Component
 * 
 * Extracted and memoized row component for StatTable.
 * Each row renders independently, preventing unnecessary re-renders
 * when other rows' stats change.
 */

type StatDefinition = {
  key: string;
  label: string;
  mode: PossessionStatMode;
  description?: string;
  detailFields?: StatDetailField[];
};

type StatDetailField = {
  key: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'textarea' | 'defender';
  options?: string[];
  placeholder?: string;
};

type DetailContext = {
  defenseLineupIds: string[];
  playerLookup: Record<string, { jersey: string; name: string; team_code: string }>;
};

type Props = {
  playerId: string;
  playerTeam: string;
  playerMeta?: { jersey: string; name: string; team_code: string };
  categoryStats: StatDefinition[];
  actionSeq: number;
  statLookup: Map<string, PlayerPossessionStat>;
  detailContext: DetailContext;
  onToggle: (playerId: string, playerTeam: string, def: StatDefinition) => void;
  onFieldChange: (stat: PlayerPossessionStat, field: StatDetailField, value: any) => void;
  makeStatLookupKey: (playerId: string, teamCode: string, statKey: string, mode: PossessionStatMode, seq: number) => string;
};

const StatTableRow = ({
  playerId,
  playerTeam,
  playerMeta,
  categoryStats,
  actionSeq,
  statLookup,
  detailContext,
  onToggle,
  onFieldChange,
  makeStatLookupKey
}: Props) => {
  if (!playerId) {
    // Empty slot
    return (
      <tr>
        <td className="stat-player-cell">
          <div className="stat-lineup-name">
            <span className="stat-jersey">—</span>
            <span>Empty slot</span>
          </div>
        </td>
        {categoryStats.map((_, idx) => (
          <td key={idx} className="stat-cell">
            <div className="stat-cell-empty small">—</div>
          </td>
        ))}
      </tr>
    );
  }

  return (
    <tr>
      <td className="stat-player-cell">
        <div className="stat-lineup-name">
          <span className="stat-jersey">{playerMeta?.jersey || '—'}</span>
          <span>{playerMeta?.name || playerId}</span>
        </div>
      </td>
      {categoryStats.map(statDef => {
        const lookupKey = makeStatLookupKey(playerId, playerTeam, statDef.key, statDef.mode, actionSeq);
        const statRow = statLookup.get(lookupKey);
        
        return (
          <td key={`${playerId}-${statDef.key}`} className="stat-cell">
            <div className={`stat-pill ${statRow ? 'active' : ''}`}>
              <div className="stat-pill-top">
                <button
                  type="button"
                  className="stat-pill-toggle"
                  onClick={() => onToggle(playerId, playerTeam, statDef)}
                >
                  {statRow ? 'Clear' : 'Tag'}
                </button>
              </div>
              {statRow && (
                <div className="stat-pill-details">
                  {statDef.detailFields ? (
                    <StatDetailInputs
                      stat={statRow}
                      fields={statDef.detailFields}
                      context={detailContext}
                      onFieldChange={onFieldChange}
                    />
                  ) : (
                    <div className="small">Tagged</div>
                  )}
                </div>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
};

// Memoize to prevent re-renders when other rows change
export default React.memo(StatTableRow, (prevProps, nextProps) => {
  // Only re-render if relevant props change
  return (
    prevProps.playerId === nextProps.playerId &&
    prevProps.playerTeam === nextProps.playerTeam &&
    prevProps.actionSeq === nextProps.actionSeq &&
    prevProps.statLookup === nextProps.statLookup &&
    prevProps.categoryStats === nextProps.categoryStats
  );
});

/**
 * StatDetailInputs Component
 * 
 * Renders the detail input fields for a stat.
 * Extracted for clarity and potential future optimization.
 */
type StatDetailInputsProps = {
  stat: PlayerPossessionStat;
  fields: StatDetailField[];
  context: DetailContext;
  onFieldChange: (stat: PlayerPossessionStat, field: StatDetailField, value: any) => void;
};

const StatDetailInputs = React.memo(({ stat, fields, context, onFieldChange }: StatDetailInputsProps) => {
  return (
    <div className="stat-detail-grid">
      {fields.map(field => {
        const value = stat.payload?.[field.key] ?? '';
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
          const rawValue = field.type === 'number' 
            ? (e.target.value ? Number(e.target.value) : undefined) 
            : e.target.value;
          onFieldChange(stat, field, rawValue);
        };

        if (field.type === 'textarea') {
          return (
            <label key={field.key}>
              <span>{field.label}</span>
              <textarea 
                value={value as string} 
                placeholder={field.placeholder} 
                onChange={handleChange} 
              />
            </label>
          );
        }
        
        if (field.type === 'select') {
          return (
            <label key={field.key}>
              <span>{field.label}</span>
              <select value={value as string} onChange={handleChange}>
                <option value="">—</option>
                {field.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          );
        }
        
        if (field.type === 'defender') {
          const defenders = context.defenseLineupIds.filter(Boolean);
          return (
            <label key={field.key}>
              <span>{field.label}</span>
              <select value={value as string} onChange={handleChange}>
                <option value="">—</option>
                {defenders.map(pid => (
                  <option key={pid} value={pid}>
                    {context.playerLookup[pid]?.jersey || pid} {context.playerLookup[pid]?.name || ''}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        
        return (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={value as string | number}
              placeholder={field.placeholder}
              onChange={handleChange}
            />
          </label>
        );
      })}
    </div>
  );
});

StatDetailInputs.displayName = 'StatDetailInputs';

