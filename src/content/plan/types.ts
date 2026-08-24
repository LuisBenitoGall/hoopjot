import type { SupportedLocale } from '../../i18n/locales';

export interface PlanHeroContent {
  bodyTemplate: string;
  title: string;
}

export interface PlanProfileSnapshotContent {
  title: string;
}

export interface PlanHowItWorksStepContent {
  body: string;
  title: string;
}

export interface PlanSubBlockContent {
  coreIdea?: string;
  cue?: string;
  guidelineIds: string[];
  id: string;
  principles: string[];
  title: string;
}

export interface PlanSectionContent {
  id: string;
  intro: string;
  number: string;
  subBlocks: PlanSubBlockContent[];
  title: string;
}

export interface PlanClosingContent {
  body: string;
  title: string;
}

export interface PlanLocaleContent {
  closing: PlanClosingContent;
  developmentMap: {
    sections: PlanSectionContent[];
  };
  hero: PlanHeroContent;
  howHoopjotWorks: {
    steps: PlanHowItWorksStepContent[];
  };
  profileSnapshot: PlanProfileSnapshotContent;
}

export interface VersionedPlanContent {
  locales: Record<SupportedLocale, PlanLocaleContent>;
  version: string;
}
