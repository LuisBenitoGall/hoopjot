import type { PlayerPosition } from '../../domain';
import type { GuideLocale, GuidePosition, GuideSelection } from './types';

export const playerPositionToGuidePosition = {
  center: 'C',
  point_guard: 'PG',
  power_forward: 'PF',
  shooting_guard: 'SG',
  small_forward: 'SF',
} as const satisfies Record<PlayerPosition, GuidePosition>;

export interface GuideSelectionFromPlayerProfileInput {
  locale: GuideLocale;
  primaryPosition: PlayerPosition;
  secondaryPosition?: PlayerPosition | null;
}

export function toGuidePosition(position: PlayerPosition): GuidePosition {
  return playerPositionToGuidePosition[position];
}

export function toGuideSelectionFromPlayerProfile({
  locale,
  primaryPosition,
  secondaryPosition,
}: GuideSelectionFromPlayerProfileInput): GuideSelection {
  return {
    locale,
    primaryPosition: toGuidePosition(primaryPosition),
    secondaryPosition: secondaryPosition ? toGuidePosition(secondaryPosition) : null,
  };
}
