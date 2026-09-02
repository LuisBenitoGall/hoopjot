import { guideBridgeKeys, type GuideBridgeKey, type GuidePosition } from './types';

export const guidePositionRank = {
  PG: 0,
  SG: 1,
  SF: 2,
  PF: 3,
  C: 4,
} as const satisfies Record<GuidePosition, number>;

const guideBridgeKeySet = new Set<string>(guideBridgeKeys);

export function getBridgeKey(
  primary: GuidePosition,
  secondary?: GuidePosition | null,
): GuideBridgeKey | null {
  if (!secondary || secondary === primary) {
    return null;
  }

  const [left, right] = [primary, secondary].sort(
    (a, b) => guidePositionRank[a] - guidePositionRank[b],
  );
  const bridgeKey = `${left}_${right}`;

  if (!isGuideBridgeKey(bridgeKey)) {
    throw new Error(`Missing canonical Guide bridge key: ${bridgeKey}`);
  }

  return bridgeKey;
}

export function isGuideBridgeKey(value: string): value is GuideBridgeKey {
  return guideBridgeKeySet.has(value);
}
