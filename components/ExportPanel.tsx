
'use client';
import React from 'react';
import { useStore } from '../lib/store';
import { csvActionGroups, csvPlayerActions, csvPossessions, csvPossessionPlayers, csvPossPhases, csvPossessionActionDetails, csvPossessionStats, downloadCSV } from '../lib/csv';

export default function ExportPanel() {
  const { state } = useStore();

  const exportAll = () => {
    downloadCSV('cb_possessions.csv', csvPossessions(state.possessions));
    downloadCSV('cb_possession_players.csv', csvPossessionPlayers(state.possPlayers));
    downloadCSV('cb_poss_phases.csv', csvPossPhases(state.possPhases));
    downloadCSV('cb_action_groups.csv', csvActionGroups(state.actionGroups));
    const actions = csvPlayerActions(state.playerActions);
    downloadCSV('cb_player_actions.csv', actions);
    downloadCSV('cb_player_tags_long.csv', actions);
    downloadCSV('cb_possession_stats.csv', csvPossessionStats(state.possessionStats));
    downloadCSV(
      'cb_possession_action_detail.csv',
      csvPossessionActionDetails(state.possessionStats, state.possessions)
    );
  };

  const individualExports = [
    {
      key: 'possessions',
      label: 'Possessions',
      filename: 'cb_possessions.csv',
      run: () => csvPossessions(state.possessions),
      count: state.possessions.length
    },
    {
      key: 'possession_players',
      label: 'Possession Players',
      filename: 'cb_possession_players.csv',
      run: () => csvPossessionPlayers(state.possPlayers),
      count: state.possPlayers.length
    },
    {
      key: 'phases',
      label: 'Possession Phases',
      filename: 'cb_poss_phases.csv',
      run: () => csvPossPhases(state.possPhases),
      count: state.possPhases.length
    },
    {
      key: 'action_groups',
      label: 'Action Groups',
      filename: 'cb_action_groups.csv',
      run: () => csvActionGroups(state.actionGroups),
      count: state.actionGroups.length
    },
    {
      key: 'player_actions',
      label: 'Player Actions',
      filename: 'cb_player_actions.csv',
      run: () => csvPlayerActions(state.playerActions),
      count: state.playerActions.length
    },
    {
      key: 'player_tags_long',
      label: 'Player Tags (Long)',
      filename: 'cb_player_tags_long.csv',
      run: () => csvPlayerActions(state.playerActions),
      count: state.playerActions.length
    },
    {
      key: 'possession_stats',
      label: 'Possession Stats',
      filename: 'cb_possession_stats.csv',
      run: () => csvPossessionStats(state.possessionStats),
      count: state.possessionStats.length
    },
    {
      key: 'possession_action_detail',
      label: 'Possession + Action Detail',
      filename: 'cb_possession_action_detail.csv',
      run: () => csvPossessionActionDetails(state.possessionStats, state.possessions),
      count: state.possessionStats.length
    }
  ];

  const handleIndividualDownload = (filename: string, builder: () => string) => {
    const csv = builder();
    downloadCSV(filename, csv);
  };

  /**
   * RENDER: Export Panel
   * 
   * Provides CSV export functionality:
   * - Quick stats overview with badges
   * - Bulk export (all CSVs at once)
   * - Individual CSV downloads
   * 
   * Mobile Optimization:
   * - Badges wrap naturally on small screens
   * - Grid-2 layout collapses to single column on mobile
   * - Export buttons are touch-friendly
   */
  return (
    <div className="card">
      <h3>Review & Export</h3>
      
      {/* Data summary badges - wraps nicely on mobile */}
      <div className="row">
        <div className="badge">Possessions: {state.possessions.length}</div>
        <div className="badge">Lineups: {state.possPlayers.length}</div>
        <div className="badge">Phases: {state.possPhases.length}</div>
        <div className="badge">Groups: {state.actionGroups.length}</div>
        <div className="badge">Actions: {state.playerActions.length}</div>
        <div className="badge">Possession Stats: {state.possessionStats.length}</div>
      </div>

      {/* Bulk export button */}
      <div className="row" style={{marginTop:12}}>
        <button className="success" onClick={exportAll}>Export All CSVs</button>
        <div className="small">
          Downloads the original schema plus a new possession + action detail CSV that joins every tagged stat to its possession context.
        </div>
      </div>

      {/* Individual export cards - responsive grid */}
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        {individualExports.map(item => (
          <div key={item.key} className="card" style={{ padding: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div><strong>{item.label}</strong></div>
                <div className="small">{item.count} rows</div>
              </div>
              <button
                className="primary"
                onClick={() => handleIndividualDownload(item.filename, item.run)}
                disabled={item.count === 0}
                style={{ flexShrink: 0 }}
              >
                Download
              </button>
            </div>
            <div className="small" style={{ marginTop: 4, wordBreak: 'break-all' }}>
              {item.filename}
            </div>
          </div>
        ))}
      </div>

      <hr className="sep"/>
      <div className="small">Tip: Your work auto-saves to the browser. To reset, clear your browser storage for this site.</div>
    </div>
  );
}
