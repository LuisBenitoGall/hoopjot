/// <reference types="node" />
// @vitest-environment node

import { readFileSync } from 'node:fs';

import {
  compileGuideSourceBundle,
  defaultGuideCompiledBundleOutputPath,
  serializeGuideCompiledBundle,
} from './guideCompilation';
import { loadAndValidateGuideSources } from './sourceIngestion';
import { guidePointIds } from './sourceTypes';
import { guideBridgeKeys, guideLocales, guidePositions } from './types';

const sourceBundle = loadAndValidateGuideSources();
const compiledBundle = compileGuideSourceBundle(sourceBundle);

describe('Guide slot compilation', () => {
  it('keeps compiled content modular as Core, Roles, and Bridges per locale', () => {
    expect(Object.keys(compiledBundle.locales)).toEqual(guideLocales);

    for (const locale of guideLocales) {
      expect(compiledBundle.locales[locale].core.pointTemplates.map((point) => point.id)).toEqual(
        guidePointIds,
      );
      expect(Object.keys(compiledBundle.locales[locale].roles)).toEqual(guidePositions);
      expect(Object.keys(compiledBundle.locales[locale].bridges)).toEqual(guideBridgeKeys);
    }
  });

  it('compiles all registry intervention slots into stable point templates', () => {
    const expectedSlotIds = Object.fromEntries(
      Object.entries(sourceBundle.interventionSlots).map(([pointId, slot]) => [
        pointId,
        slot?.slotId,
      ]),
    );

    for (const locale of guideLocales) {
      const templates = compiledBundle.locales[locale].core.pointTemplates.filter(
        (template) => template.slot,
      );

      expect(templates).toHaveLength(13);
      expect(Object.fromEntries(templates.map((template) => [template.id, template.slot?.slotId]))).toEqual(
        expectedSlotIds,
      );
    }
  });

  it('does not precompile 25 or 50 resolved Guides', () => {
    expect(compiledBundle).not.toHaveProperty('guides');
    expect(compiledBundle).not.toHaveProperty('resolvedGuides');
    expect(compiledBundle).not.toHaveProperty('selectionCases');
  });

  it('generates compiledBundle.json deterministically', () => {
    const firstBuild = serializeGuideCompiledBundle(compileGuideSourceBundle(loadAndValidateGuideSources()));
    const secondBuild = serializeGuideCompiledBundle(compileGuideSourceBundle(loadAndValidateGuideSources()));
    const generatedBundle = readFileSync(defaultGuideCompiledBundleOutputPath, 'utf8');

    expect(firstBuild).toBe(secondBuild);
    expect(generatedBundle).toBe(firstBuild);
  });
});
