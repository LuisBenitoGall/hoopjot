import type { PlayerPosition } from '../../domain';
import {
  playerPositionToGuidePosition,
  toGuidePosition,
  toGuideSelectionFromPlayerProfile,
} from './positionMapping';

describe('Guide position mapping', () => {
  it('maps Hoopjot player positions to editorial Guide positions', () => {
    const expectedMappings: Array<[PlayerPosition, string]> = [
      ['point_guard', 'PG'],
      ['shooting_guard', 'SG'],
      ['small_forward', 'SF'],
      ['power_forward', 'PF'],
      ['center', 'C'],
    ];

    expect(Object.entries(playerPositionToGuidePosition)).toHaveLength(expectedMappings.length);

    for (const [playerPosition, guidePosition] of expectedMappings) {
      expect(toGuidePosition(playerPosition)).toBe(guidePosition);
    }
  });

  it('creates a Guide selection from existing player profile position fields', () => {
    expect(
      toGuideSelectionFromPlayerProfile({
        locale: 'es',
        primaryPosition: 'shooting_guard',
        secondaryPosition: 'point_guard',
      }),
    ).toEqual({
      locale: 'es',
      primaryPosition: 'SG',
      secondaryPosition: 'PG',
    });
  });

  it('keeps a missing secondary position as null', () => {
    expect(
      toGuideSelectionFromPlayerProfile({
        locale: 'en',
        primaryPosition: 'center',
      }),
    ).toEqual({
      locale: 'en',
      primaryPosition: 'C',
      secondaryPosition: null,
    });
  });
});
