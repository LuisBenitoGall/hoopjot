import type { GuideBridgeKey, GuideLocale, GuidePosition } from './types';

export const guidePointIds = [
  'P01',
  'P02',
  'P03',
  'P04',
  'P05',
  'P06',
  'P07',
  'P08',
  'P09',
  'P10',
  'P11',
  'P12',
  'P13',
  'P14',
  'P15',
  'P16',
  'P17',
  'P18',
  'P19',
  'P20',
  'P21',
  'P22',
  'P23',
  'P24',
  'P25',
  'P26',
  'P27',
  'P28',
  'P29',
  'P30',
] as const;

export type GuidePointId = (typeof guidePointIds)[number];

export type GuideRoleInterventionType = 'INSERT' | 'OVERRIDE';
export type GuideBridgeInterventionType = 'BRIDGE';
export type GuideInterventionType = GuideRoleInterventionType | GuideBridgeInterventionType;
export type GuideRoleMode = 'insert' | 'override';

export type GuideSlotId =
  | 'after_role_influence_before_common_principle'
  | 'after_role_variation_before_become_useful'
  | 'replace_level_specific_content'
  | 'after_body_and_laterality_before_body_as_tool'
  | 'after_rebound_role_variation_before_never_do'
  | 'after_transition_state_blocks_before_arrive_early_close'
  | 'replace_positional_screen_responsibility'
  | 'replace_generic_fundamentals_priority'
  | 'replace_generic_video_questions'
  | 'after_common_team_examples_before_invisible_work'
  | 'after_information_from_your_place_before_speaking_close'
  | 'replace_phase_specific_content'
  | 'replace_invisible_actions_and_questions';

export interface GuideInterventionSlotSource {
  roleMode: GuideRoleMode;
  slotId: GuideSlotId;
  bridgeAllowed: boolean;
  bridgePlacement: 'after_primary_intervention_before_core_closing' | null;
}

export interface GuideMarkdownBlockSource {
  title: string;
  content: string;
}

export interface GuideCorePointSource {
  id: GuidePointId;
  number: number;
  title: string;
  chapterId: string;
  content: string;
}

export interface GuideCoreChapterSource {
  id: string;
  number: number;
  title: string;
  pointIds: GuidePointId[];
}

export interface GuideCoreRuleSource {
  id: string;
  number: number;
  title: string;
}

export interface GuideCoreSource {
  title: string;
  subtitle: string;
  introduction: GuideMarkdownBlockSource;
  chapters: GuideCoreChapterSource[];
  points: GuideCorePointSource[];
  rulesIntro: string;
  rules: GuideCoreRuleSource[];
  closing: GuideMarkdownBlockSource;
}

export interface GuideInterventionSource<TType extends GuideInterventionType = GuideInterventionType> {
  pointId: GuidePointId;
  type: TType;
  content: string;
}

export interface GuideRoleSource {
  position: GuidePosition;
  interventions: GuideInterventionSource<GuideRoleInterventionType>[];
}

export interface GuideBridgeSource {
  bridgeKey: GuideBridgeKey;
  interventions: GuideInterventionSource<GuideBridgeInterventionType>[];
}

export interface GuideLocaleSourceBundle {
  core: GuideCoreSource;
  roles: Record<GuidePosition, GuideRoleSource>;
  bridges: Record<GuideBridgeKey, GuideBridgeSource>;
}

export interface GuideSourceBundle {
  schemaVersion: 1;
  editorialVersion: string;
  implementationContractVersion: string;
  coreOnlyPointIds: GuidePointId[];
  interventionSlots: Partial<Record<GuidePointId, GuideInterventionSlotSource>>;
  locales: Record<GuideLocale, GuideLocaleSourceBundle>;
}
