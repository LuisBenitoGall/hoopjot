export const guideLocales = ['es', 'en'] as const;
export type GuideLocale = (typeof guideLocales)[number];

export const guidePositions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export type GuidePosition = (typeof guidePositions)[number];

export const guideBridgeKeys = [
  'PG_SG',
  'PG_SF',
  'PG_PF',
  'PG_C',
  'SG_SF',
  'SG_PF',
  'SG_C',
  'SF_PF',
  'SF_C',
  'PF_C',
] as const;
export type GuideBridgeKey = (typeof guideBridgeKeys)[number];

export interface GuideSelection {
  locale: GuideLocale;
  primaryPosition: GuidePosition;
  secondaryPosition?: GuidePosition | null;
}
