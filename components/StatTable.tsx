'use client';
import React, { useMemo } from 'react';
import type { PossessionStatMode, PlayerPossessionStat } from '../lib/schema';
import { useStore } from '../lib/store';

type Audience = 'offense' | 'defense';

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

type StatCategory = {
  id: PossessionStatMode;
  label: string;
  description?: string;
  audience: Audience;
  stats: StatDefinition[];
};

const shotTypeOptions = ['layup', 'dunk', 'floater', 'jumper', 'hook'];
const shotDistanceOptions = [
  'Restricted Area — 0 to 4 feet',
  'Paint (Non-Restricted) — 4 to 10 feet',
  'Short Mid-Range — 10 to 16 feet',
  'Long Mid-Range — 16 feet to 3-point line (~22 feet)',
  'Three-Point (Corner) — ~22 feet',
  'Three-Point (Above the Break) — 22 to 23 feet',
  'Deep Three / Logo Range — 25+ feet'
];
const contestedOptions = ['uncontested', 'light', 'heavy'];
const yesNoOptions = ['yes', 'no'];
const foulTypeOptions = ['shooting', 'loose ball', 'offensive', 'moving screen', 'technical', 'flagrant', 'reach', 'block'];
const foulLocationOptions = ['perimeter', 'wing', 'corner', 'paint', 'backcourt', 'transition'];
const transitionRoles = ['ball handler', 'lane runner', 'rim runner', 'trail', 'spacer'];
const screenLocationOptions = ['slot', 'top', 'wing', 'corner', 'elbow', 'nail', 'baseline', 'paint', 'backcourt'];
const hustleGrades = ['great', 'solid', 'late', 'did not'];

const shotAttemptDetailFields: StatDetailField[] = [
  { key: 'shot_type', label: 'Shot Type', type: 'select', options: shotTypeOptions },
  { key: 'shot_distance', label: 'Distance', type: 'select', options: shotDistanceOptions },
  { key: 'contested', label: 'Contest', type: 'select', options: contestedOptions },
  { key: 'movement_prior', label: 'Movement Prior', type: 'select', options: ['towards basket', 'away from basket', 'moving right', 'moving left', 'standstill'] },
  { key: 'dribbles', label: 'Dribbles Before Shot', type: 'number' },
  { key: 'fade', label: 'Fade Type', type: 'select', options: ['none', 'left', 'right', 'straight'] },
  { key: 'shot_creation', label: 'Creation', type: 'select', options: ['off dribble', 'off screen', 'spot up', 'handoff'] },
  { key: 'primary_defender', label: 'Primary Defender', type: 'defender' },
  { key: 'made', label: 'Made?', type: 'select', options: yesNoOptions },
  { key: 'shot_value', label: 'Shot Value', type: 'select', options: ['2', '3'] },
  { key: 'assisted', label: 'Assisted?', type: 'select', options: yesNoOptions },
  { key: 'foul_drawn', label: 'Foul Drawn?', type: 'select', options: yesNoOptions }
];

const assistDetailFields: StatDetailField[] = [
  { key: 'assist_type', label: 'Type', type: 'select', options: ['drive and kick', 'post entry', 'handoff', 'skip', 'swing', 'transition'] },
  { key: 'shot_result', label: 'Shot Made?', type: 'select', options: yesNoOptions },
  { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'late clock swing, baseline drift...' }
];

const offReboundDetailFields: StatDetailField[] = [
  { key: 'rebound_type', label: 'Type', type: 'select', options: ['tip', 'secure', 'scrum'] },
  { key: 'location', label: 'Location', type: 'select', options: foulLocationOptions },
  { key: 'putback', label: 'Putback Attempt?', type: 'select', options: yesNoOptions }
];

const foulDrawnDetailFields: StatDetailField[] = [
  { key: 'foul_type', label: 'Type', type: 'select', options: foulTypeOptions },
  { key: 'location', label: 'Location', type: 'select', options: foulLocationOptions },
  { key: 'intentional', label: 'Intentional?', type: 'select', options: yesNoOptions }
];

const freeThrowDetailFields: StatDetailField[] = [
  { key: 'makes_out_of', label: 'Makes / Attempts', type: 'text', placeholder: 'e.g., 2/2' }
];

const stealDetailFields: StatDetailField[] = [
  { key: 'steal_type', label: 'Type', type: 'select', options: ['strip', 'jump', 'interception', 'dig'] },
  { key: 'location', label: 'Location', type: 'select', options: foulLocationOptions }
];

const blockDetailFields: StatDetailField[] = [
  { key: 'block_type', label: 'Type', type: 'select', options: ['primary', 'help', 'chase down', 'closeout'] },
  { key: 'recovered', label: 'Recovered?', type: 'select', options: yesNoOptions }
];

const deflectionDetailFields: StatDetailField[] = [
  { key: 'result', label: 'Result', type: 'select', options: ['kept alive', 'turnover', 'out of bounds'] }
];

const defensiveReboundDetailFields: StatDetailField[] = [
  { key: 'rebound_contested', label: 'Contested?', type: 'select', options: ['yes', 'no'] },
  { key: 'outlet', label: 'Outlet Result', type: 'select', options: ['push', 'secure', 'foul'] }
];

function makeStatLookupKey(playerId: string, teamCode: string | undefined, statKey: string, mode: PossessionStatMode, seq: number) {
  return `${playerId || ''}::${teamCode || ''}::${statKey}::${mode}::${seq}`;
}

const offenseStats: StatDefinition[] = [
  {
    key: 'shot_attempt',
    label: 'Shot Attempt',
    mode: 'set_offense',
    description: 'Track shot type, movement and context.',
    detailFields: shotAttemptDetailFields
  },
  {
    key: 'screen_action',
    label: 'Screen Action',
    mode: 'set_offense',
    description: 'Capture on/off ball screening, direction, rate notes.',
    detailFields: [
      { key: 'screen_type', label: 'Screen Type', type: 'select', options: ['off ball', 'on ball'] },
      { key: 'screen_location', label: 'Location', type: 'select', options: screenLocationOptions },
      { key: 'screen_direction', label: 'Direction', type: 'select', options: ['right', 'left', 'center'] },
      { key: 'screen_outcome', label: 'Outcome', type: 'select', options: ['freed shooter', 'switch', 'hedged', 'drop'] }
    ]
  },
  {
    key: 'assist',
    label: 'Assist',
    mode: 'set_offense',
    description: 'Tag who created the bucket and key context.',
    detailFields: assistDetailFields
  },
  {
    key: 'spacing_issue',
    label: 'Spacing Issue',
    mode: 'set_offense',
    description: 'Flag lane congestion, double teams, poor spacing.',
    detailFields: [
      { key: 'issue_type', label: 'Issue', type: 'select', options: ['lane congestion', 'double team', 'non-threat in zone', 'mismatch ignored'] },
      { key: 'location', label: 'Location', type: 'select', options: ['corner', 'wing', 'top', 'paint'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    key: 'turnover',
    label: 'Turnover',
    mode: 'set_offense',
    description: 'Capture turnover type and floor level.',
    detailFields: [
      { key: 'turnover_type', label: 'Type', type: 'select', options: ['live ball', 'dead ball', 'screen foul', 'travel', 'bad pass', 'charge'] },
      { key: 'court_level', label: 'Court Level', type: 'select', options: ['backcourt', 'perimeter', 'wing', 'paint'] },
      { key: 'action_context', label: 'Action Context', type: 'select', options: ['screen', 'handoff', 'dribble', 'long pass', 'short pass'] }
    ]
  },
  {
    key: 'mismatch',
    label: 'Mismatch',
    mode: 'set_offense',
    description: 'Track mismatch creation and attack rate.',
    detailFields: [
      { key: 'created_by', label: 'Created By', type: 'select', options: ['off ball', 'on ball', 'transition'] },
      { key: 'attacked', label: 'Mismatch Attacked?', type: 'select', options: ['yes', 'no'] },
      { key: 'ignored_by', label: 'Ignored By', type: 'text', placeholder: 'player ids' }
    ]
  },
  {
    key: 'off_rebound',
    label: 'Rebound Collected',
    mode: 'set_offense',
    description: 'Capture extra possessions created.',
    detailFields: offReboundDetailFields
  },
  {
    key: 'foul_drawn',
    label: 'Foul Drawn',
    mode: 'set_offense',
    description: 'Track when we put the defense in jeopardy.',
    detailFields: foulDrawnDetailFields
  },
  {
    key: 'free_throw',
    label: 'Free Throws',
    mode: 'set_offense',
    description: 'Track makes and misses from the stripe.',
    detailFields: freeThrowDetailFields
  }
];

const defenseStats: StatDefinition[] = [
  {
    key: 'stance',
    label: 'Stance',
    mode: 'set_defense',
    detailFields: [
      { key: 'stance_quality', label: 'Quality', type: 'select', options: ['elite', 'solid', 'late', 'upright'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    key: 'contest',
    label: 'Contest',
    mode: 'set_defense',
    detailFields: [
      { key: 'contest_type', label: 'Type', type: 'select', options: ['late', 'strong', 'none'] },
      { key: 'shot_type', label: 'Shot Type', type: 'select', options: ['two', 'three'] }
    ]
  },
  {
    key: 'deflection',
    label: 'Deflection',
    mode: 'set_defense',
    detailFields: deflectionDetailFields
  },
  {
    key: 'steal',
    label: 'Steal',
    mode: 'set_defense',
    description: 'Track when we take the ball away.',
    detailFields: stealDetailFields
  },
  {
    key: 'block',
    label: 'Block',
    mode: 'set_defense',
    description: 'Document rim protection events.',
    detailFields: blockDetailFields
  },
  {
    key: 'def_foul',
    label: 'Foul Committed',
    mode: 'set_defense',
    description: 'Log foul type, location and intent.',
    detailFields: [
      { key: 'foul_type', label: 'Type', type: 'select', options: foulTypeOptions },
      { key: 'location', label: 'Location', type: 'select', options: foulLocationOptions },
      { key: 'intentional', label: 'Intentional?', type: 'select', options: yesNoOptions }
    ]
  },
  {
    key: 'boxout',
    label: 'Box Out',
    mode: 'set_defense',
    detailFields: [
      { key: 'position', label: 'Position', type: 'select', options: ['paint', 'perimeter', 'weak side'] },
      { key: 'outcome', label: 'Outcome', type: 'select', options: ['secured', 'lost', 'tip'] }
    ]
  },
  {
    key: 'rotation',
    label: 'Rotation',
    mode: 'set_defense',
    detailFields: [
      { key: 'rotation_style', label: 'Style', type: 'select', options: ['tag', 'scram', 'x-out', 'switch', 'late'] },
      { key: 'tied_to', label: 'Tied to Action', type: 'text', placeholder: 'PnR, flare, etc.' }
    ]
  },
  {
    key: 'def_rebound',
    label: 'Def Rebound',
    mode: 'set_defense',
    description: 'Secure the stop.',
    detailFields: defensiveReboundDetailFields
  }
];

const transitionOffenseStats: StatDefinition[] = [
  {
    key: 'transition_shot_attempt',
    label: 'Shot Attempt',
    mode: 'transition_offense',
    description: 'Log the quality of the attempt in the open floor.',
    detailFields: shotAttemptDetailFields
  },
  {
    key: 'transition_assist',
    label: 'Assist',
    mode: 'transition_offense',
    description: 'Credit the playmaker who created the transition look.',
    detailFields: assistDetailFields
  },
  {
    key: 'transition_off_rebound',
    label: 'Rebound Collected',
    mode: 'transition_offense',
    description: 'Capture extra possessions created on the break.',
    detailFields: offReboundDetailFields
  },
  {
    key: 'transition_foul_drawn',
    label: 'Foul Drawn',
    mode: 'transition_offense',
    description: 'Track when we force fouls while pushing pace.',
    detailFields: foulDrawnDetailFields
  },
  {
    key: 'transition_free_throw',
    label: 'Free Throws',
    mode: 'transition_offense',
    description: 'Tag free throws earned directly from transition.',
    detailFields: freeThrowDetailFields
  },
  {
    key: 'transition_finish',
    label: 'Transition Finish',
    mode: 'transition_offense',
    detailFields: [
      { key: 'advantage', label: 'Advantage', type: 'select', options: ['3v2', '2v1', '1v0', 'even'] },
      { key: 'passes', label: '# Passes', type: 'number' },
      { key: 'result', label: 'Result', type: 'select', options: ['made', 'miss', 'turnover', 'foul drawn'] }
    ]
  },
  {
    key: 'transition_involvement',
    label: 'Involvement',
    mode: 'transition_offense',
    description: 'Identify who touched the break and what their role was.',
    detailFields: [
      { key: 'role', label: 'Role', type: 'select', options: transitionRoles },
      { key: 'touched_ball', label: 'Touched Ball?', type: 'select', options: yesNoOptions },
      { key: 'foul_drawn', label: 'Foul Drawn?', type: 'select', options: yesNoOptions }
    ]
  },
  {
    key: 'transition_hustle',
    label: 'Hustle Detail',
    mode: 'transition_offense',
    description: 'Use on players who didn’t finish the play but impacted it.',
    detailFields: [
      { key: 'ran_floor', label: 'Ran Floor', type: 'select', options: hustleGrades },
      { key: 'lane_fill', label: 'Filled Lane', type: 'select', options: hustleGrades },
      { key: 'pass_read', label: 'Pass Read', type: 'select', options: hustleGrades }
    ]
  }
];

const transitionDefenseStats: StatDefinition[] = [
  {
    key: 'transition_deflection',
    label: 'Deflection',
    mode: 'transition_defense',
    description: 'Track hands on the ball while scrambling back.',
    detailFields: deflectionDetailFields
  },
  {
    key: 'transition_steal',
    label: 'Steal',
    mode: 'transition_defense',
    description: 'Document live-ball takeaways in transition.',
    detailFields: stealDetailFields
  },
  {
    key: 'transition_block',
    label: 'Block',
    mode: 'transition_defense',
    description: 'Capture rim protection against the break.',
    detailFields: blockDetailFields
  },
  {
    key: 'transition_def_rebound',
    label: 'Def Rebound',
    mode: 'transition_defense',
    description: 'Secure the stop and trigger the break back.',
    detailFields: defensiveReboundDetailFields
  },
  {
    key: 'transition_stop',
    label: 'Transition Stop',
    mode: 'transition_defense',
    detailFields: [
      { key: 'time_to_match', label: 'Time to Match (s)', type: 'number' },
      { key: 'contest', label: 'Contest', type: 'select', options: contestedOptions },
      { key: 'foul', label: 'Foul?', type: 'select', options: ['no', 'yes'] }
    ]
  },
  {
    key: 'transition_def_involvement',
    label: 'Stop Involvement',
    mode: 'transition_defense',
    description: 'Track who influenced the stop in transition.',
    detailFields: [
      { key: 'assignment', label: 'Assignment', type: 'select', options: ['ball', 'rim', 'shooter', 'match-up', 'safety'] },
      { key: 'made_play', label: 'Made Play?', type: 'select', options: yesNoOptions },
      { key: 'foul_committed', label: 'Foul Committed?', type: 'select', options: yesNoOptions }
    ]
  },
  {
    key: 'transition_def_hustle',
    label: 'Hustle',
    mode: 'transition_defense',
    description: 'Grade floor sprint, communication and lane coverage.',
    detailFields: [
      { key: 'run_back', label: 'Run Back', type: 'select', options: hustleGrades },
      { key: 'matched_up', label: 'Matched Up', type: 'select', options: hustleGrades },
      { key: 'communicated', label: 'Communicated', type: 'select', options: hustleGrades }
    ]
  }
];

export const STAT_CATEGORIES: StatCategory[] = [
  { id: 'set_offense', label: 'Set – Offense', description: 'Five-man offensive detail.', audience: 'offense', stats: offenseStats },
  { id: 'set_defense', label: 'Set – Defense', description: 'Track stance, contests, rotations.', audience: 'defense', stats: defenseStats },
  { id: 'transition_offense', label: 'Transition – Offense', description: 'Advantage, finish, pass rate.', audience: 'offense', stats: transitionOffenseStats },
  { id: 'transition_defense', label: 'Transition – Defense', description: 'Recovery speed, stops, fouls.', audience: 'defense', stats: transitionDefenseStats }
];

export const STAT_DEFINITION_LOOKUP = (() => {
  const map = new Map<string, { label: string; audience: Audience; mode: PossessionStatMode; category: StatCategory; stat: StatDefinition }>();
  STAT_CATEGORIES.forEach(category => {
    category.stats.forEach(stat => {
      map.set(stat.key, { label: stat.label, audience: category.audience, mode: stat.mode, category, stat });
    });
  });
  return map;
})();

type ActionMode = 'set' | 'transition';

type Props = {
  possId?: number | null;
  gameId?: string;
  teamCode?: string;
  actionSeq: number;
  mode: ActionMode;
};

type PlayerMeta = {
  jersey: string;
  name: string;
  team_code: string;
};

type DetailContext = {
  defenseLineupIds: string[];
  playerLookup: Record<string, PlayerMeta>;
};

type LineupEntry = {
  player_id: string;
  team_code: string;
  lineup_slot: number;
};

function padToFive(players: LineupEntry[]): LineupEntry[] {
  const padded = [...players];
  let nextSlot = padded.length ? Math.max(...padded.map(p => p.lineup_slot)) + 1 : 1;
  while (padded.length < 5) {
    padded.push({ player_id: '', team_code: '', lineup_slot: nextSlot });
    nextSlot += 1;
  }
  return padded;
}

export default function StatTable({ possId, gameId, teamCode, actionSeq, mode }: Props) {
  const { state, dispatch } = useStore();
  const activeGameId = gameId || state.currentGameId;

  const possPlayers = useMemo(() => {
    if (!activeGameId || possId == null) return [];
    return state.possPlayers.filter(row => row.game_id === activeGameId && row.poss_id === possId);
  }, [state.possPlayers, activeGameId, possId]);

  const playerLookup = useMemo(() => {
    const map: Record<string, PlayerMeta> = {};
    state.players.forEach(player => {
      const jerseyLabel = player.jersey ? `#${player.jersey}` : player.player_id;
      map[player.player_id] = {
        jersey: jerseyLabel,
        name: player.name,
        team_code: player.team_code
      };
    });
    return map;
  }, [state.players]);

  const offenseLineup = useMemo<LineupEntry[]>(() => {
    return possPlayers
      .filter(row => row.on_offense_at_start === 1 && (!teamCode || row.team_code === teamCode))
      .sort((a, b) => a.lineup_slot - b.lineup_slot)
      .map(row => ({ player_id: row.player_id, team_code: row.team_code, lineup_slot: row.lineup_slot }));
  }, [possPlayers, teamCode]);

  const defenseLineup = useMemo<LineupEntry[]>(() => {
    return possPlayers
      .filter(row => row.on_offense_at_start === 0 && (!teamCode || row.team_code === teamCode))
      .sort((a, b) => a.lineup_slot - b.lineup_slot)
      .map(row => ({ player_id: row.player_id, team_code: row.team_code, lineup_slot: row.lineup_slot }));
  }, [possPlayers, teamCode]);

  const visibleCategoryIds = mode === 'transition'
    ? ['transition_offense', 'transition_defense']
    : ['set_offense', 'set_defense'];

  const visibleCategories = STAT_CATEGORIES.filter(cat => visibleCategoryIds.includes(cat.id));

  const statsForPoss = useMemo(() => {
    if (!activeGameId || possId == null) return [];
    return state.possessionStats.filter(stat =>
      stat.game_id === activeGameId &&
      stat.poss_id === possId &&
      (stat.action_seq || 1) === actionSeq
    );
  }, [state.possessionStats, activeGameId, possId, actionSeq]);

  const statLookup = useMemo(() => {
    const map = new Map<string, PlayerPossessionStat>();
    statsForPoss.forEach(stat => {
      const key = makeStatLookupKey(stat.player_id, stat.team_code, stat.stat_key, stat.mode, stat.action_seq || 1);
      map.set(key, stat);
    });
    return map;
  }, [statsForPoss]);

  const handleToggle = (playerId: string, playerTeamCode: string, def: StatDefinition) => {
    if (!activeGameId || possId == null || !playerId) return;
    const lookupKey = makeStatLookupKey(playerId, playerTeamCode, def.key, def.mode, actionSeq);
    const existing = statLookup.get(lookupKey);
    if (existing) {
      dispatch({ type: 'DELETE_POSSESSION_STAT', statId: existing.id });
    } else {
      const resolvedTeamCode = playerTeamCode || playerLookup[playerId]?.team_code || teamCode || '';
      const next: PlayerPossessionStat = {
        id: `${activeGameId}:${possId}:${resolvedTeamCode}:${playerId}:${def.key}:${def.mode}:${actionSeq}`,
        game_id: activeGameId,
        poss_id: possId,
        team_code: resolvedTeamCode,
        player_id: playerId,
        stat_key: def.key,
        mode: def.mode,
        action_seq: actionSeq,
        payload: {},
        created_at: Date.now()
      };
      dispatch({ type: 'UPSERT_POSSESSION_STAT', row: next });
    }
  };

  const renderDetailInputs = (stat: PlayerPossessionStat, fields?: StatDetailField[], context?: DetailContext) => {
    if (!fields || !stat) return null;
    const handleFieldChange = (field: StatDetailField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const rawValue = field.type === 'number' ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value;
      const next: PlayerPossessionStat = {
        ...stat,
        payload: {
          ...(stat.payload || {}),
          [field.key]: rawValue
        }
      };
      dispatch({ type: 'UPSERT_POSSESSION_STAT', row: next });
    };

    return (
      <div className="stat-detail-grid">
        {fields.map(field => {
          const value = stat.payload?.[field.key] ?? '';
          if (field.type === 'textarea') {
            return (
              <label key={field.key}>
                <span>{field.label}</span>
                <textarea value={value as string} placeholder={field.placeholder} onChange={handleFieldChange(field)} />
              </label>
            );
          }
          if (field.type === 'select') {
            return (
              <label key={field.key}>
                <span>{field.label}</span>
                <select value={value as string} onChange={handleFieldChange(field)}>
                  <option value="">—</option>
                  {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            );
          }
          if (field.type === 'defender') {
            const defenders = context?.defenseLineupIds.filter(Boolean) || [];
            return (
              <label key={field.key}>
                <span>{field.label}</span>
                <select value={value as string} onChange={handleFieldChange(field)}>
                  <option value="">—</option>
                  {defenders.map(pid => (
                    <option key={pid} value={pid}>
                      {context?.playerLookup[pid]?.jersey || pid} {context?.playerLookup[pid]?.name || ''}
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
                onChange={handleFieldChange(field)}
              />
            </label>
          );
        })}
      </div>
    );
  };

  if (!activeGameId || possId == null) {
    return (
      <div className="card">
        <h3>Possession Stats</h3>
        <div className="small">Start a possession to unlock per-player stat tracking.</div>
      </div>
    );
  }

  if (!visibleCategories.length) {
    return null;
  }

  const detailContext: DetailContext = { defenseLineupIds: defenseLineup.map(entry => entry.player_id).filter(Boolean), playerLookup };

  return (
    <div className="card stat-table">
      <h3>Possession Stat Grid</h3>
      <div className="small">
        {mode === 'transition'
          ? 'Transition context active – showing transition offense/defense stats.'
          : 'Set/half-court context active – showing set offense/defense stats.'}
      </div>
      <div className="stat-sections">
        {visibleCategories.map(category => {
          const sourceLineup = category.audience === 'offense' ? offenseLineup : defenseLineup;
          const lineup = padToFive(sourceLineup);
          return (
            <section key={category.id} className="stat-block">
              <header>
                <div>
                  <div className="stat-heading">{category.label}</div>
                  {category.description && <div className="small">{category.description}</div>}
                </div>
              </header>
              <div className="stat-scroll">
                <table className="stat-grid-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      {category.stats.map(stat => (
                        <th key={stat.key}>
                          <div>{stat.label}</div>
                          {stat.description && <div className="small">{stat.description}</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineup.map((entry, idx) => {
                      const playerId = entry.player_id;
                      const playerTeam = entry.team_code;
                      const meta = playerLookup[playerId];
                      const rowKey = `${category.id}-${playerTeam || 'UNK'}-${playerId || 'empty'}-${entry.lineup_slot || idx}`;
                      return (
                        <tr key={rowKey}>
                          <td className="stat-player-cell">
                            <div className="stat-lineup-name">
                              <span className="stat-jersey">{meta?.jersey || '—'}</span>
                              <span>{meta?.name || (playerId ? playerId : 'Empty slot')}</span>
                            </div>
                          </td>
                          {category.stats.map(statDef => {
                            const lookupKey = playerId ? makeStatLookupKey(playerId, playerTeam, statDef.key, statDef.mode, actionSeq) : undefined;
                            const statRow = lookupKey ? statLookup.get(lookupKey) : undefined;
                            return (
                              <td key={`${playerId || idx}-${statDef.key}`} className="stat-cell">
                                {playerId ? (
                                  <div className={`stat-pill ${statRow ? 'active' : ''}`}>
                                    <div className="stat-pill-top">
                                      <button
                                        type="button"
                                        className="stat-pill-toggle"
                                        onClick={() => handleToggle(playerId, playerTeam, statDef)}
                                      >
                                        {statRow ? 'Clear' : 'Tag'}
                                      </button>
                                    </div>
                                    {statRow && (
                                      <div className="stat-pill-details">
                                        {statDef.detailFields
                                          ? renderDetailInputs(statRow, statDef.detailFields, detailContext)
                                          : <div className="small">Tagged</div>}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="stat-cell-empty small">—</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
