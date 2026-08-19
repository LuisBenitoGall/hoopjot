import type { Guideline, Skill } from '../../domain';

// MVP starter seed for editorial review. App logic imports content through the
// catalog/repository modules so this file can be expanded or replaced later.
export const starterCatalogVersion = '0.1.0';

export const starterSkills = [
  {
    id: 'att.onball.protect-dribble',
    code: 'ATT-ONB-PROTECT',
    category: 'attack',
    subcategory: 'on_ball',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['dribble', 'pressure', 'fundamentals'],
    active: true
  },
  {
    id: 'att.offball.passing-window',
    code: 'ATT-OFF-PASS-WINDOW',
    category: 'attack',
    subcategory: 'off_ball',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['spacing', 'passing', 'off_ball'],
    active: true
  },
  {
    id: 'att.finish.two-foot-balance',
    code: 'ATT-FIN-2FT-BALANCE',
    category: 'attack',
    subcategory: 'finishing',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['finishing', 'balance', 'footwork'],
    active: true
  },
  {
    id: 'def.onball.contain-drive',
    code: 'DEF-ONB-CONTAIN',
    category: 'defense',
    subcategory: 'on_ball',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['containment', 'footwork', 'on_ball'],
    active: true
  },
  {
    id: 'def.offball.player-ball-vision',
    code: 'DEF-OFF-VISION',
    category: 'defense',
    subcategory: 'off_ball',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['vision', 'positioning', 'off_ball'],
    active: true
  },
  {
    id: 'def.rebound.find-player',
    code: 'DEF-REB-FIND',
    category: 'defense',
    subcategory: 'rebounding',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['rebounding', 'contact', 'positioning'],
    active: true
  },
  {
    id: 'transition.offense.run-first',
    code: 'TRN-OFF-RUN',
    category: 'transition',
    subcategory: 'offensive_transition',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['tempo', 'spacing', 'offense'],
    active: true
  },
  {
    id: 'transition.defense.stop-ball',
    code: 'TRN-DEF-STOP-BALL',
    category: 'transition',
    subcategory: 'defensive_transition',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['defense', 'communication', 'transition'],
    active: true
  },
  {
    id: 'comm.screen.call-early',
    code: 'COMM-SCREEN-EARLY',
    category: 'communication',
    subcategory: 'communication',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['screen', 'talk', 'team'],
    active: true
  },
  {
    id: 'decision.extra-pass-window',
    code: 'DEC-EXTRA-PASS',
    category: 'decision_making',
    subcategory: 'decision_making',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['advantage', 'passing', 'reads'],
    active: true
  },
  {
    id: 'habits.prep.one-cue',
    code: 'HAB-PREP-ONE-CUE',
    category: 'habits',
    subcategory: 'preparation',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['focus', 'preparation', 'habits'],
    active: true
  },
  {
    id: 'habits.confidence.next-play-reset',
    code: 'HAB-CONF-RESET',
    category: 'habits',
    subcategory: 'confidence_attention',
    level: 'foundation',
    positionAffinity: ['all'] as ['all'],
    tags: ['confidence', 'attention', 'reset'],
    active: true
  }
] satisfies Skill[];

export const starterGuidelines = [
  {
    id: 'att.onball.protect-outside-hip',
    skillIds: ['att.onball.protect-dribble'],
    category: 'attack',
    subcategory: 'on_ball',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.att_onball_protect_outside_hip',
    active: true
  },
  {
    id: 'att.offball.show-target-window',
    skillIds: ['att.offball.passing-window'],
    category: 'attack',
    subcategory: 'off_ball',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.att_offball_show_target_window',
    active: true
  },
  {
    id: 'att.finish.two-foot-balance',
    skillIds: ['att.finish.two-foot-balance'],
    category: 'attack',
    subcategory: 'finishing',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.att_finish_two_foot_balance',
    active: true
  },
  {
    id: 'def.onball.contain-first-step',
    skillIds: ['def.onball.contain-drive'],
    category: 'defense',
    subcategory: 'on_ball',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.def_onball_contain_first_step',
    active: true
  },
  {
    id: 'def.offball.see-player-ball',
    skillIds: ['def.offball.player-ball-vision'],
    category: 'defense',
    subcategory: 'off_ball',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.def_offball_see_player_ball',
    active: true
  },
  {
    id: 'def.rebound.find-player-first',
    skillIds: ['def.rebound.find-player'],
    category: 'defense',
    subcategory: 'rebounding',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.def_rebound_find_player_first',
    active: true
  },
  {
    id: 'transition.run-immediately',
    skillIds: ['transition.offense.run-first'],
    category: 'transition',
    subcategory: 'offensive_transition',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.transition_run_immediately',
    active: true
  },
  {
    id: 'transition.stop-ball-early',
    skillIds: ['transition.defense.stop-ball'],
    category: 'transition',
    subcategory: 'defensive_transition',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.transition_stop_ball_early',
    active: true
  },
  {
    id: 'comm.screen.call-early',
    skillIds: ['comm.screen.call-early'],
    category: 'communication',
    subcategory: 'communication',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game'],
    translationKey: 'guidelines.comm_screen_call_early',
    active: true
  },
  {
    id: 'decision.extra-pass-window',
    skillIds: ['decision.extra-pass-window'],
    category: 'decision_making',
    subcategory: 'decision_making',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game', 'learning'],
    translationKey: 'guidelines.decision_extra_pass_window',
    active: true
  },
  {
    id: 'habits.prep.one-cue',
    skillIds: ['habits.prep.one-cue'],
    category: 'habits',
    subcategory: 'preparation',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game', 'learning'],
    translationKey: 'guidelines.habits_prep_one_cue',
    active: true
  },
  {
    id: 'habits.confidence.next-play-reset',
    skillIds: ['habits.confidence.next-play-reset'],
    category: 'habits',
    subcategory: 'confidence_attention',
    level: 'foundation',
    positions: ['all'] as ['all'],
    contexts: ['practice', 'game', 'learning'],
    translationKey: 'guidelines.habits_confidence_next_play_reset',
    active: true
  }
] satisfies Guideline[];
