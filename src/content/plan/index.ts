import { defaultLocale, isSupportedLocale, type SupportedLocale } from '../../i18n/locales';
import { planContentV1, planContentVersion } from './v1';
import type { PlanLocaleContent } from './types';

export { planContentV1, planContentVersion };
export type {
  PlanClosingContent,
  PlanHeroContent,
  PlanHowItWorksStepContent,
  PlanLocaleContent,
  PlanProfileSnapshotContent,
  PlanSectionContent,
  PlanSubBlockContent,
  VersionedPlanContent,
} from './types';

export function getPlanContent(locale: string | undefined): PlanLocaleContent {
  const supportedLocale: SupportedLocale = isSupportedLocale(locale) ? locale : defaultLocale;

  return planContentV1.locales[supportedLocale];
}

export const linkedPlanGuidelineIds = Array.from(
  new Set(
    Object.values(planContentV1.locales.en.developmentMap.sections).flatMap((section) =>
      section.subBlocks.flatMap((subBlock) => subBlock.guidelineIds),
    ),
  ),
);
