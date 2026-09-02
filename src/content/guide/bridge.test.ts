import { getBridgeKey, guidePositionRank, isGuideBridgeKey } from './bridge';
import { guideBridgeKeys, guidePositions, type GuidePosition } from './types';

describe('Guide bridge normalization', () => {
  it('uses the canonical Guide position rank', () => {
    expect(guidePositionRank).toEqual({
      PG: 0,
      SG: 1,
      SF: 2,
      PF: 3,
      C: 4,
    });
  });

  it('returns null when there is no usable secondary position', () => {
    for (const position of guidePositions) {
      expect(getBridgeKey(position)).toBeNull();
      expect(getBridgeKey(position, null)).toBeNull();
      expect(getBridgeKey(position, position)).toBeNull();
    }
  });

  it.each([
    ['PG', 'SG', 'PG_SG'],
    ['SG', 'PG', 'PG_SG'],
    ['PG', 'SF', 'PG_SF'],
    ['SF', 'PG', 'PG_SF'],
    ['PG', 'PF', 'PG_PF'],
    ['PF', 'PG', 'PG_PF'],
    ['PG', 'C', 'PG_C'],
    ['C', 'PG', 'PG_C'],
    ['SG', 'SF', 'SG_SF'],
    ['SF', 'SG', 'SG_SF'],
    ['SG', 'PF', 'SG_PF'],
    ['PF', 'SG', 'SG_PF'],
    ['SG', 'C', 'SG_C'],
    ['C', 'SG', 'SG_C'],
    ['SF', 'PF', 'SF_PF'],
    ['PF', 'SF', 'SF_PF'],
    ['SF', 'C', 'SF_C'],
    ['C', 'SF', 'SF_C'],
    ['PF', 'C', 'PF_C'],
    ['C', 'PF', 'PF_C'],
  ] as const)(
    'normalizes %s + %s to the order-independent bridge %s',
    (primary, secondary, expectedBridgeKey) => {
      expect(getBridgeKey(primary, secondary)).toBe(expectedBridgeKey);
    },
  );

  it('recognizes every canonical bridge key', () => {
    expect(guideBridgeKeys).toHaveLength(10);

    for (const bridgeKey of guideBridgeKeys) {
      expect(isGuideBridgeKey(bridgeKey)).toBe(true);
    }
  });

  it('normalizes every mixed position pair to an existing canonical bridge key', () => {
    const normalizedBridgeKeys = new Set<string>();

    for (const primary of guidePositions) {
      for (const secondary of guidePositions) {
        if (primary === secondary) {
          continue;
        }

        const bridgeKey = getBridgeKey(primary, secondary);
        expect(bridgeKey).not.toBeNull();
        if (!bridgeKey) {
          throw new Error(`Expected bridge key for ${primary} + ${secondary}`);
        }
        normalizedBridgeKeys.add(bridgeKey);
      }
    }

    expect([...normalizedBridgeKeys].sort()).toEqual([...guideBridgeKeys].sort());
  });

  it('does not derive bridge keys from non-position profile fields', () => {
    const unrelatedProfileFacts = {
      alias: 'Iria',
      competitiveLevel: 'club',
      dominantHand: 'left',
      heightCm: 178,
    };
    const selection = {
      primaryPosition: 'SF' as GuidePosition,
      secondaryPosition: 'PF' as GuidePosition,
    };

    expect(unrelatedProfileFacts).toMatchObject({ alias: 'Iria' });
    expect(getBridgeKey(selection.primaryPosition, selection.secondaryPosition)).toBe('SF_PF');
  });
});
