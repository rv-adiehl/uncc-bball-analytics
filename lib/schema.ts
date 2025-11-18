
export type ID = string;

export type Player = {
  player_id: string;
  jersey?: string;
  name: string;
  position?: string;
  team_code: string; // e.g., CHA or OPP
  height_in?: number;
  weight_lb?: number;
};

export type Game = {
  game_id: string;
  date?: string;
  opponent?: string;
  home_away?: "H" | "A" | "N";
  competition?: string;
  our_team_code?: string;
  opp_team_code?: string;
  our_team_name?: string;
  opp_team_name?: string;
  our_team_espn_id?: string;
  opp_team_espn_id?: string;
  notes?: string;
};

export type Possession = {
  game_id: string;
  poss_id: number;
  period: number;
  offense_team: string;
  defense_team: string;
  start_clock?: string;
  end_clock?: string;
  duration_sec?: number;
  start_type?: string;
  start_location?: string;
  possession_type?: string;
  offensive_set?: string;
  defensive_set?: string;
  press_type?: string;
  ball_advancer_player_id?: string;
  time_to_cross_half_sec?: number;
  time_to_enter_set_sec?: number;
  shot_clock_used_sec?: number;
  outcome_type?: string;
  points_scored_offense?: number;
  points_scored_defense?: number;
  shooter_id?: string;
  assisted_by_id?: string;
  shot_location?: string;
  shot_contested?: string;
  rebound_type?: string;
  rebounder_id?: string;
  is_second_chance?: number;
  turnover_player_id?: string;
  turnover_type?: string;
  fouled_player_id?: string;
  foul_type?: string;
  notes?: string;
};

export type PossessionPlayer = {
  game_id: string;
  poss_id: number;
  team_code: string;
  player_id: string;
  lineup_slot: number; // 1..5
  on_offense_at_start: 0 | 1;
  primary_matchup?: string;
  plus_minus_this_poss?: number;
};

export type PossPhase = {
  game_id: string;
  poss_id: number;
  phase_order: number;
  phase_type?: string; // transition/entry/half_court/post_shot/second_chance/press_break/ato/blob/slob
  phase_label?: string;
  offensive_set?: string;
  defensive_set?: string;
  press_type?: string;
  start_rel_sec?: number;
  end_rel_sec?: number;
  start_clock?: string;
  end_clock?: string;
  notes?: string;
};

export type ActionGroup = {
  game_id: string;
  poss_id: number;
  phase_order: number;
  group_order: number;
  group_label?: string;
  trigger_type?: string; // PnR, DHO, Spain, Horns, Ghost, etc.
  start_rel_sec?: number;
  end_rel_sec?: number;
  shot_clock_start?: number;
  shot_clock_end?: number;
  notes?: string;
};

export type PlayerAction = {
  game_id: string;
  poss_id: number;
  team_code: string;
  player_id: string;
  role_side: "O" | "D";
  actor_role?: string; // BH,S1,S2,R,P,SP1,SP2,OBD,SD,TAG,XOUT,TRAP,RR,ADV...
  phase_order: number;
  group_order: number;
  action_seq?: number; // order within a group if desired
  action_type: string; // tag_code
  result?: "Yes" | "No" | "Success" | "Fail" | "N/A";
  value?: number; // numeric value, e.g., 3.1 seconds
  opportunity_flag?: 0 | 1;
  responsibility_weight?: number; // 0..1 or 0..100 as you choose
  context_subtype?: string; // ICE/Drop/TopLock/etc.
  t_rel_sec?: number;
  shot_clock_at_action?: number;
  created_by?: string;
  comments?: string;
};

export type PossessionStatMode = "set_offense" | "set_defense" | "transition_offense" | "transition_defense";

export type PlayerPossessionStat = {
  id: string;
  game_id: string;
  poss_id: number;
  team_code: string;
  player_id: string;
  stat_key: string;
  mode: PossessionStatMode;
  action_seq?: number;
  payload?: Record<string, string | number | boolean | string[] | null | undefined>;
  notes?: string;
  created_at: number;
};

export const TAG_CODES = [
  "TRD_MU","TRD_CF","TRD_PD122",
  "TRO_SF","TRO_CD","TRO_PA",
  "TAG_UP","BO",
  "HCD1_OTO","HCD1_ST","HCD1_PEL","HCD1_CB","HCD1_23D",
  "HCD2_BSD","HCD2_PEL","HCD2_OBS","HCD2_PT",
  "HCO_CBR","HCO_SET_SCR","HCO_DDCS","HCO_PUD",
  "ADVANCE_BALL","ENTER_SET",
  "PASS","DEFLECTION","CONTEST","PAINT_TOUCH","REVERSAL",
  "SHOT_2","SHOT_3","FOUL","TURNOVER","REBOUND_O","REBOUND_D"
] as const;

export const ACTOR_ROLES = ["BH","S1","S2","S3","R","P","SP1","SP2","TAG","XOUT","TRAP","ADV","CNR","WING","TOP","LOW","HIGH"] as const;

export const PHASE_TYPES = ["transition","entry","half_court","post_shot","second_chance","press_break","ato","blob","slob"] as const;
export const POSSESSION_TYPES = ["fast_break","secondary_break","half_court","blob","slob","press_break","ato"] as const;
export const OUTCOMES = ["2pm","3pm","miss_dreb","miss_oreb","ft_make","ft_miss","turnover_live","turnover_dead","offensive_foul","end_period"] as const;
export const SHOT_LOCATIONS = ["rim","paint","midrange","three"] as const;
export const CONTEST = ["uncontested","contested"] as const;
