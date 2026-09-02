/// <reference types="node" />
// @vitest-environment node

import { readFileSync } from 'node:fs';

import {
  defaultGuideSourceBundleOutputPath,
  loadAndValidateGuideSources,
  serializeGuideSourceBundle,
} from './sourceIngestion';
import { guidePointIds } from './sourceTypes';
import { guideBridgeKeys, guidePositions, type GuideBridgeKey, type GuidePosition } from './types';

const bundle = loadAndValidateGuideSources();

function interventionShape(
  interventions: readonly { pointId: string; type: string }[],
): string[] {
  return interventions.map((intervention) => `${intervention.pointId}:${intervention.type}`);
}

function allRoleInterventions(locale: 'es' | 'en') {
  return guidePositions.flatMap((position) => bundle.locales[locale].roles[position].interventions);
}

function allBridgeInterventions(locale: 'es' | 'en') {
  return guideBridgeKeys.flatMap(
    (bridgeKey) => bundle.locales[locale].bridges[bridgeKey].interventions,
  );
}

describe('Guide source ingestion', () => {
  it('parses Core ES into 6 chapters, 30 ordered points, and 12 Rules', () => {
    const core = bundle.locales.es.core;

    expect(core.chapters).toHaveLength(6);
    expect(core.points.map((point) => point.id)).toEqual(guidePointIds);
    expect(core.points[0].id).toBe('P01');
    expect(core.points.at(-1)?.id).toBe('P30');
    expect(core.rules).toHaveLength(12);
  });

  it('parses Core EN into 6 chapters, 30 ordered points, and 12 Rules', () => {
    const core = bundle.locales.en.core;

    expect(core.chapters).toHaveLength(6);
    expect(core.points.map((point) => point.id)).toEqual(guidePointIds);
    expect(core.points[0].id).toBe('P01');
    expect(core.points.at(-1)?.id).toBe('P30');
    expect(core.rules).toHaveLength(12);
  });

  it('finds and validates the 5 Spanish role packs', () => {
    expect(Object.keys(bundle.locales.es.roles)).toEqual(guidePositions);

    for (const position of guidePositions) {
      expect(bundle.locales.es.roles[position].position).toBe(position);
      expect(bundle.locales.es.roles[position].interventions).toHaveLength(13);
    }
  });

  it('finds and validates the 5 English role packs', () => {
    expect(Object.keys(bundle.locales.en.roles)).toEqual(guidePositions);

    for (const position of guidePositions) {
      expect(bundle.locales.en.roles[position].position).toBe(position);
      expect(bundle.locales.en.roles[position].interventions).toHaveLength(13);
    }
  });

  it('finds and validates the 10 Spanish hybrid bridges', () => {
    expect(Object.keys(bundle.locales.es.bridges)).toEqual(guideBridgeKeys);

    for (const bridgeKey of guideBridgeKeys) {
      expect(bundle.locales.es.bridges[bridgeKey].bridgeKey).toBe(bridgeKey);
      expect(bundle.locales.es.bridges[bridgeKey].interventions.length).toBeGreaterThan(0);
    }
  });

  it('finds and validates the 10 English hybrid bridges', () => {
    expect(Object.keys(bundle.locales.en.bridges)).toEqual(guideBridgeKeys);

    for (const bridgeKey of guideBridgeKeys) {
      expect(bundle.locales.en.bridges[bridgeKey].bridgeKey).toBe(bridgeKey);
      expect(bundle.locales.en.bridges[bridgeKey].interventions.length).toBeGreaterThan(0);
    }
  });

  it('keeps role-pack interventions limited to INSERT and OVERRIDE', () => {
    for (const intervention of [...allRoleInterventions('es'), ...allRoleInterventions('en')]) {
      expect(['INSERT', 'OVERRIDE']).toContain(intervention.type);
    }
  });

  it('keeps bridge interventions limited to BRIDGE', () => {
    for (const intervention of [...allBridgeInterventions('es'), ...allBridgeInterventions('en')]) {
      expect(intervention.type).toBe('BRIDGE');
    }
  });

  it('does not include Core-only points in role or bridge interventions', () => {
    const coreOnlyPoints = new Set([
      'P02',
      'P05',
      'P12',
      'P13',
      'P14',
      'P15',
      'P16',
      'P17',
      'P18',
      'P19',
      'P20',
      'P23',
      'P24',
      'P25',
      'P28',
      'P29',
      'P30',
    ]);

    for (const intervention of [
      ...allRoleInterventions('es'),
      ...allRoleInterventions('en'),
      ...allBridgeInterventions('es'),
      ...allBridgeInterventions('en'),
    ]) {
      expect(coreOnlyPoints.has(intervention.pointId)).toBe(false);
    }
  });

  it('does not allow P01 or OVERRIDE interventions in bridges', () => {
    for (const intervention of [...allBridgeInterventions('es'), ...allBridgeInterventions('en')]) {
      expect(intervention.pointId).not.toBe('P01');
      expect(intervention.type).not.toBe('OVERRIDE');
    }
  });

  it('keeps Core, role packs, and bridges structurally equivalent across ES and EN', () => {
    expect(bundle.locales.es.core.points.map((point) => point.id)).toEqual(
      bundle.locales.en.core.points.map((point) => point.id),
    );

    for (const position of guidePositions) {
      expect(interventionShape(bundle.locales.es.roles[position].interventions)).toEqual(
        interventionShape(bundle.locales.en.roles[position].interventions),
      );
    }

    for (const bridgeKey of guideBridgeKeys) {
      expect(interventionShape(bundle.locales.es.bridges[bridgeKey].interventions)).toEqual(
        interventionShape(bundle.locales.en.bridges[bridgeKey].interventions),
      );
    }
  });

  it('validates registry positions, bridge keys, point order, and selection cases', () => {
    expect(guidePositions).toHaveLength(5);
    expect(guideBridgeKeys).toHaveLength(10);
    expect(guidePointIds).toHaveLength(30);

    const selectionCases: Array<{
      primaryPosition: GuidePosition;
      secondaryPosition: GuidePosition | null;
      bridgeKey: GuideBridgeKey | null;
    }> = guidePositions.flatMap((primaryPosition) => [
      { primaryPosition, secondaryPosition: null, bridgeKey: null },
      ...guidePositions
        .filter((secondaryPosition) => secondaryPosition !== primaryPosition)
        .map((secondaryPosition) => ({
          primaryPosition,
          secondaryPosition,
          bridgeKey: [primaryPosition, secondaryPosition].sort(
            (left, right) =>
              guidePositions.indexOf(left as GuidePosition) -
              guidePositions.indexOf(right as GuidePosition),
          ).join('_') as GuideBridgeKey,
        })),
    ]);

    expect(selectionCases).toHaveLength(25);
  });

  it('generates a deterministic intermediate bundle', () => {
    const firstBuild = serializeGuideSourceBundle(loadAndValidateGuideSources());
    const secondBuild = serializeGuideSourceBundle(loadAndValidateGuideSources());
    const generatedBundle = readFileSync(defaultGuideSourceBundleOutputPath, 'utf8');

    expect(firstBuild).toBe(secondBuild);
    expect(generatedBundle).toBe(firstBuild);
  });

  it('excludes editorial metadata from generated player-facing content blocks', () => {
    const serialized = serializeGuideSourceBundle(bundle);

    expect(serialized).not.toContain('Estado editorial');
    expect(serialized).not.toContain('Editorial status');
    expect(serialized).not.toContain('PROPÓSITO DEL ROL');
    expect(serialized).not.toContain('ROLE PURPOSE');
    expect(serialized).not.toContain('PROPÓSITO DEL BRIDGE');
    expect(serialized).not.toContain('BRIDGE PURPOSE');
    expect(serialized).not.toContain('**Tipo:**');
    expect(serialized).not.toContain('**Type:**');
  });
});
