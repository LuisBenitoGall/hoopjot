import type { GuideBridgeKey, GuideLocale, GuidePosition } from './types';
import type {
  GuideCoreChapterSource,
  GuideCoreRuleSource,
  GuideInterventionSlotSource,
  GuideMarkdownBlockSource,
  GuidePointId,
} from './sourceTypes';

export type GuidePrimaryPartId =
  | 'full'
  | 'level_1'
  | 'level_2'
  | 'level_3'
  | 'phase_1'
  | 'phase_2'
  | 'phase_3';

export type GuidePointTemplateFragment =
  | {
      kind: 'core';
      content: string;
    }
  | {
      kind: 'primary';
      partId: GuidePrimaryPartId;
    }
  | {
      kind: 'bridge';
    };

export interface GuideCompiledPointTemplate {
  id: GuidePointId;
  number: number;
  title: string;
  chapterId: string;
  slot?: GuideInterventionSlotSource;
  fragments: GuidePointTemplateFragment[];
}

export interface GuideCompiledCore {
  title: string;
  subtitle: string;
  introduction: GuideMarkdownBlockSource;
  chapters: GuideCoreChapterSource[];
  pointTemplates: GuideCompiledPointTemplate[];
  rulesIntro: string;
  rules: GuideCoreRuleSource[];
  closing: GuideMarkdownBlockSource;
}

export interface GuideCompiledIntervention {
  pointId: GuidePointId;
  content: string;
  parts?: Partial<Record<GuidePrimaryPartId, string>>;
}

export interface GuideCompiledRole {
  position: GuidePosition;
  interventions: Partial<Record<GuidePointId, GuideCompiledIntervention>>;
}

export interface GuideCompiledBridge {
  bridgeKey: GuideBridgeKey;
  interventions: Partial<Record<GuidePointId, GuideCompiledIntervention>>;
}

export interface GuideCompiledLocaleBundle {
  core: GuideCompiledCore;
  roles: Record<GuidePosition, GuideCompiledRole>;
  bridges: Record<GuideBridgeKey, GuideCompiledBridge>;
}

export interface GuideCompiledBundle {
  schemaVersion: 1;
  editorialVersion: string;
  implementationContractVersion: string;
  coreOnlyPointIds: GuidePointId[];
  locales: Record<GuideLocale, GuideCompiledLocaleBundle>;
}

export interface ResolvedGuidePoint {
  id: GuidePointId;
  number: number;
  title: string;
  chapterId: string;
  content: string;
}

export interface ResolvedGuideChapter {
  id: string;
  number: number;
  title: string;
  pointIds: GuidePointId[];
}

export interface ResolvedGuide {
  locale: GuideLocale;
  primaryPosition: GuidePosition;
  secondaryPosition: GuidePosition | null;
  bridgeKey: GuideBridgeKey | null;
  title: string;
  subtitle: string;
  introduction: GuideMarkdownBlockSource;
  chapters: ResolvedGuideChapter[];
  points: ResolvedGuidePoint[];
  rulesIntro: string;
  rules: GuideCoreRuleSource[];
  closing: GuideMarkdownBlockSource;
}
