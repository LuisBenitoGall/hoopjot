/// <reference types="node" />

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  defaultGuideEditorialRoot,
  loadAndValidateGuideSources,
} from './sourceIngestion';
import type {
  GuideCompiledBridge,
  GuideCompiledBundle,
  GuideCompiledCore,
  GuideCompiledIntervention,
  GuideCompiledPointTemplate,
  GuideCompiledRole,
  GuidePointTemplateFragment,
  GuidePrimaryPartId,
} from './compiledTypes';
import type {
  GuideCorePointSource,
  GuideInterventionSlotSource,
  GuidePointId,
  GuideRoleInterventionType,
  GuideSourceBundle,
} from './sourceTypes';
import {
  guideBridgeKeys,
  guideLocales,
  guidePositions,
  type GuideBridgeKey,
  type GuideLocale,
  type GuidePosition,
} from './types';

const moduleDir = dirname(fileURLToPath(import.meta.url));

export const defaultGuideCompiledBundleOutputPath = join(
  moduleDir,
  'generated/compiledBundle.json',
);

type BoundaryPlacement = 'before' | 'after';
type PrimaryPartRecord = Partial<Record<GuidePrimaryPartId, string>>;

interface InsertBoundary {
  anchor: string;
  placement: BoundaryPlacement;
}

interface ReplaceBoundary {
  start: string;
  end: string;
}

const insertBoundaries: Record<
  GuideLocale,
  Record<Extract<GuidePointId, 'P01' | 'P03' | 'P06' | 'P07' | 'P08' | 'P21' | 'P22'>, InsertBoundary>
> = {
  es: {
    P01: {
      anchor: 'Tu función en pista influirá en las primeras responsabilidades que debas dominar.',
      placement: 'after',
    },
    P03: {
      anchor: 'Todas necesitan resultar fiables en aquello que les corresponde.',
      placement: 'after',
    },
    P06: {
      anchor: 'Tu físico es una herramienta.',
      placement: 'before',
    },
    P07: {
      anchor:
        'Lo que nunca deberías hacer es convertir el rebote en una reacción completamente improvisada.',
      placement: 'before',
    },
    P08: {
      anchor: 'Correr bien no consiste únicamente en correr rápido.',
      placement: 'before',
    },
    P21: {
      anchor: 'El baloncesto contiene mucho trabajo que no aparece en el resumen estadístico.',
      placement: 'before',
    },
    P22: {
      anchor: 'Aprende qué información puedes aportar desde tu lugar en pista.',
      placement: 'after',
    },
  },
  en: {
    P01: {
      anchor: 'Your role on the court will influence the first responsibilities you need to master.',
      placement: 'after',
    },
    P03: {
      anchor: 'All of them need to be reliable in the responsibilities that belong to them.',
      placement: 'after',
    },
    P06: {
      anchor: 'Your physical qualities are a tool.',
      placement: 'before',
    },
    P07: {
      anchor: 'What you should never do is turn rebounding into a completely improvised reaction.',
      placement: 'before',
    },
    P08: {
      anchor: 'Running well is not only about running fast.',
      placement: 'before',
    },
    P21: {
      anchor: 'Basketball contains a lot of work that does not appear in the box score.',
      placement: 'before',
    },
    P22: {
      anchor: 'Learn what information you can provide from your place on the court.',
      placement: 'after',
    },
  },
};

const replaceBoundaries: Record<
  GuideLocale,
  Record<Extract<GuidePointId, 'P09' | 'P10' | 'P11' | 'P27'>, ReplaceBoundary>
> = {
  es: {
    P09: {
      start:
        'Según tu función tendrás que aprender a poner bloqueos, utilizarlos, rechazarlos, cambiar ángulos, continuar, abrirte, volver a bloquear o leer la reacción defensiva.',
      end:
        'Según tu función tendrás que aprender a poner bloqueos, utilizarlos, rechazarlos, cambiar ángulos, continuar, abrirte, volver a bloquear o leer la reacción defensiva.',
    },
    P10: {
      start: 'Entre los fundamentos están:',
      end: 'Necesitas saber cuáles sostienen ahora mismo tu juego.',
    },
    P11: {
      start: 'Pregúntate:',
      end: '- ¿Qué decisiones repiten?',
    },
    P27: {
      start: 'Hay acciones que cambian posesiones sin aparecer claramente en una estadística tradicional.',
      end: 'El principio es común.',
    },
  },
  en: {
    P09: {
      start:
        'Depending on your role, you will need to learn how to set screens, use them, reject them, change angles, roll, pop, re-screen or read the defensive reaction.',
      end:
        'Depending on your role, you will need to learn how to set screens, use them, reject them, change angles, roll, pop, re-screen or read the defensive reaction.',
    },
    P10: {
      start: 'Fundamentals include:',
      end: 'You need to know which ones currently support your game.',
    },
    P11: {
      start: 'Ask yourself:',
      end: '- What decisions do they repeat?',
    },
    P27: {
      start: 'Some actions change possessions without clearly appearing in a traditional statistic.',
      end: 'The principle is the same.',
    },
  },
};

export function compileGuideSourceBundle(sourceBundle: GuideSourceBundle): GuideCompiledBundle {
  return {
    schemaVersion: 1,
    editorialVersion: sourceBundle.editorialVersion,
    implementationContractVersion: sourceBundle.implementationContractVersion,
    coreOnlyPointIds: sourceBundle.coreOnlyPointIds,
    locales: buildRecord(guideLocales, (locale) => ({
      core: compileCore(locale, sourceBundle),
      roles: buildRecord(guidePositions, (position) =>
        compileRole(position, sourceBundle.locales[locale].roles[position].interventions),
      ),
      bridges: buildRecord(guideBridgeKeys, (bridgeKey) =>
        compileBridge(bridgeKey, sourceBundle.locales[locale].bridges[bridgeKey].interventions),
      ),
    })),
  };
}

export function writeGuideCompiledBundle({
  guideRootDir = defaultGuideEditorialRoot,
  outputPath = defaultGuideCompiledBundleOutputPath,
}: {
  guideRootDir?: string;
  outputPath?: string;
} = {}): GuideCompiledBundle {
  const bundle = compileGuideSourceBundle(loadAndValidateGuideSources(guideRootDir));
  const serialized = serializeGuideCompiledBundle(bundle);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, 'utf8');

  return bundle;
}

export function serializeGuideCompiledBundle(bundle: GuideCompiledBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

function compileCore(locale: GuideLocale, sourceBundle: GuideSourceBundle): GuideCompiledCore {
  const source = sourceBundle.locales[locale].core;
  const coreOnlyPointIds = new Set(sourceBundle.coreOnlyPointIds);

  return {
    title: source.title,
    subtitle: source.subtitle,
    introduction: source.introduction,
    chapters: source.chapters,
    pointTemplates: source.points.map((point) =>
      compilePointTemplate(locale, point, sourceBundle.interventionSlots[point.id], coreOnlyPointIds),
    ),
    rulesIntro: source.rulesIntro,
    rules: source.rules,
    closing: source.closing,
  };
}

function compilePointTemplate(
  locale: GuideLocale,
  point: GuideCorePointSource,
  slot: GuideInterventionSlotSource | undefined,
  coreOnlyPointIds: ReadonlySet<GuidePointId>,
): GuideCompiledPointTemplate {
  if (!slot) {
    assert(coreOnlyPointIds.has(point.id), `${point.id} has no slot and is not Core-only`);

    return {
      ...copyPointIdentity(point),
      fragments: coreFragments(point.content),
    };
  }

  if (slot.roleMode === 'insert') {
    return compileInsertTemplate(locale, point, slot);
  }

  return compileOverrideTemplate(locale, point, slot);
}

function compileInsertTemplate(
  locale: GuideLocale,
  point: GuideCorePointSource,
  slot: GuideInterventionSlotSource,
): GuideCompiledPointTemplate {
  const boundary = insertBoundaries[locale][point.id as keyof (typeof insertBoundaries)[GuideLocale]];
  assert(boundary, `Missing insert boundary for ${locale} ${point.id}`);

  const split =
    boundary.placement === 'after'
      ? splitAfterLine(point.content, boundary.anchor, `${locale} ${point.id}`)
      : splitBeforeLine(point.content, boundary.anchor, `${locale} ${point.id}`);

  return {
    ...copyPointIdentity(point),
    slot,
    fragments: withBridgeSlot(
      [coreFragment(split.before), primaryFragment('full')],
      slot,
      coreFragment(split.after),
    ),
  };
}

function compileOverrideTemplate(
  locale: GuideLocale,
  point: GuideCorePointSource,
  slot: GuideInterventionSlotSource,
): GuideCompiledPointTemplate {
  if (point.id === 'P04') {
    return compileLevelOverrideTemplate(locale, point, slot);
  }

  if (point.id === 'P26') {
    return compilePhaseOverrideTemplate(locale, point, slot);
  }

  const boundary =
    replaceBoundaries[locale][point.id as keyof (typeof replaceBoundaries)[GuideLocale]];
  assert(boundary, `Missing override boundary for ${locale} ${point.id}`);
  const split = replaceLineRange(point.content, boundary, `${locale} ${point.id}`);

  return {
    ...copyPointIdentity(point),
    slot,
    fragments: withBridgeSlot(
      [coreFragment(split.before), primaryFragment('full')],
      slot,
      coreFragment(split.after),
    ),
  };
}

function compileLevelOverrideTemplate(
  locale: GuideLocale,
  point: GuideCorePointSource,
  slot: GuideInterventionSlotSource,
): GuideCompiledPointTemplate {
  const headings =
    locale === 'es'
      ? ['### NIVEL 1 · SER ÚTIL', '### NIVEL 2 · INTERVENIR CON SEGURIDAD', '### NIVEL 3 · CREAR O AMPLIAR VENTAJAS']
      : ['### LEVEL 1 · BE USEFUL', '### LEVEL 2 · CONTRIBUTE WITH CONTROL', '### LEVEL 3 · CREATE OR EXTEND ADVANTAGES'];
  const closingStart =
    locale === 'es'
      ? 'No necesitas llegar al tercer nivel abandonando los dos anteriores.'
      : 'You do not need to reach the third level by abandoning the first two.';
  const lines = splitLines(point.content);
  const headingIndexes = headings.map((heading) => findLineIndex(lines, heading, `${locale} P04`));
  const closingIndex = findLineIndex(lines, closingStart, `${locale} P04`);

  assert(
    headingIndexes[0] < headingIndexes[1] &&
      headingIndexes[1] < headingIndexes[2] &&
      headingIndexes[2] < closingIndex,
    `${locale} P04 level boundaries are out of order`,
  );

  return {
    ...copyPointIdentity(point),
    slot,
    fragments: withBridgeSlot(
      [
        coreFragment(trimMarkdownBlock(lines.slice(0, headingIndexes[0]))),
        coreFragment(headings[0]),
        primaryFragment('level_1'),
        coreFragment(headings[1]),
        primaryFragment('level_2'),
        coreFragment(headings[2]),
        primaryFragment('level_3'),
      ],
      slot,
      coreFragment(trimMarkdownBlock(lines.slice(closingIndex))),
    ),
  };
}

function compilePhaseOverrideTemplate(
  locale: GuideLocale,
  point: GuideCorePointSource,
  slot: GuideInterventionSlotSource,
): GuideCompiledPointTemplate {
  const headings =
    locale === 'es'
      ? ['### FASE 1 · FIABILIDAD', '### FASE 2 · IMPACTO', '### FASE 3 · AMPLIAR EL JUEGO']
      : ['### PHASE 1 · RELIABILITY', '### PHASE 2 · IMPACT', '### PHASE 3 · EXPAND YOUR GAME'];
  const closingStart =
    locale === 'es'
      ? 'No avances únicamente porque una habilidad nueva resulte más entretenida.'
      : 'Do not move on simply because a new skill is more entertaining.';
  const lines = splitLines(point.content);
  const headingIndexes = headings.map((heading) => findLineIndex(lines, heading, `${locale} P26`));
  const closingIndex = findLineIndex(lines, closingStart, `${locale} P26`);
  const phaseHeaderBlocks = headingIndexes.map((headingIndex, index) => {
    const nextBoundary = headingIndexes[index + 1] ?? closingIndex;
    return extractPhaseHeadingAndObjective(lines, headingIndex, nextBoundary, `${locale} P26`);
  });

  return {
    ...copyPointIdentity(point),
    slot,
    fragments: withBridgeSlot(
      [
        coreFragment(trimMarkdownBlock(lines.slice(0, headingIndexes[0]))),
        coreFragment(phaseHeaderBlocks[0]),
        primaryFragment('phase_1'),
        coreFragment(phaseHeaderBlocks[1]),
        primaryFragment('phase_2'),
        coreFragment(phaseHeaderBlocks[2]),
        primaryFragment('phase_3'),
      ],
      slot,
      coreFragment(trimMarkdownBlock(lines.slice(closingIndex))),
    ),
  };
}

function compileRole(
  position: GuidePosition,
  interventions: readonly {
    pointId: GuidePointId;
    type: GuideRoleInterventionType;
    content: string;
  }[],
): GuideCompiledRole {
  return {
    position,
    interventions: buildInterventionRecord(interventions),
  };
}

function compileBridge(
  bridgeKey: GuideBridgeKey,
  interventions: readonly { pointId: GuidePointId; content: string }[],
): GuideCompiledBridge {
  return {
    bridgeKey,
    interventions: buildBridgeInterventionRecord(interventions),
  };
}

function buildInterventionRecord(
  interventions: readonly { pointId: GuidePointId; content: string }[],
): Partial<Record<GuidePointId, GuideCompiledIntervention>> {
  const records = interventions.map((intervention) => [
    intervention.pointId,
    compilePrimaryIntervention(intervention),
  ]);

  return Object.fromEntries(records) as Partial<Record<GuidePointId, GuideCompiledIntervention>>;
}

function buildBridgeInterventionRecord(
  interventions: readonly { pointId: GuidePointId; content: string }[],
): Partial<Record<GuidePointId, GuideCompiledIntervention>> {
  const records = interventions.map((intervention) => [
    intervention.pointId,
    {
      pointId: intervention.pointId,
      content: intervention.content,
    },
  ]);

  return Object.fromEntries(records) as Partial<Record<GuidePointId, GuideCompiledIntervention>>;
}

function compilePrimaryIntervention(intervention: {
  pointId: GuidePointId;
  content: string;
}): GuideCompiledIntervention {
  if (intervention.pointId === 'P04') {
    return {
      pointId: intervention.pointId,
      content: intervention.content,
      parts: extractOrderedSections(intervention.content, ['level_1', 'level_2', 'level_3']),
    };
  }

  if (intervention.pointId === 'P26') {
    return {
      pointId: intervention.pointId,
      content: intervention.content,
      parts: extractOrderedSections(intervention.content, ['phase_1', 'phase_2', 'phase_3']),
    };
  }

  return {
    pointId: intervention.pointId,
    content: intervention.content,
  };
}

function extractOrderedSections(
  content: string,
  partIds: readonly Exclude<GuidePrimaryPartId, 'full'>[],
): PrimaryPartRecord {
  const lines = splitLines(content);
  const headingIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^##\s+(?:NIVEL|LEVEL|FASE|PHASE)\s+[123]\s+·\s+/.test(line.trim()));

  assert(
    headingIndexes.length === partIds.length,
    `Expected ${partIds.length} ordered sections, received ${headingIndexes.length}`,
  );

  return Object.fromEntries(
    headingIndexes.map((heading, index) => {
      const nextHeadingIndex = headingIndexes[index + 1]?.index ?? lines.length;
      return [
        partIds[index],
        trimMarkdownBlock(lines.slice(heading.index + 1, nextHeadingIndex)),
      ];
    }),
  ) as PrimaryPartRecord;
}

function withBridgeSlot(
  beforeBridge: GuidePointTemplateFragment[],
  slot: GuideInterventionSlotSource,
  afterBridge: GuidePointTemplateFragment,
): GuidePointTemplateFragment[] {
  return cleanFragments([
    ...beforeBridge,
    ...(slot.bridgeAllowed ? [bridgeFragment()] : []),
    afterBridge,
  ]);
}

function copyPointIdentity(point: GuideCorePointSource): Omit<GuideCompiledPointTemplate, 'fragments'> {
  return {
    id: point.id,
    number: point.number,
    title: point.title,
    chapterId: point.chapterId,
  };
}

function coreFragments(content: string): GuidePointTemplateFragment[] {
  return cleanFragments([coreFragment(content)]);
}

function coreFragment(content: string): GuidePointTemplateFragment {
  return {
    kind: 'core',
    content,
  };
}

function primaryFragment(partId: GuidePrimaryPartId): GuidePointTemplateFragment {
  return {
    kind: 'primary',
    partId,
  };
}

function bridgeFragment(): GuidePointTemplateFragment {
  return {
    kind: 'bridge',
  };
}

function cleanFragments(fragments: GuidePointTemplateFragment[]): GuidePointTemplateFragment[] {
  return fragments.filter(
    (fragment) => fragment.kind !== 'core' || fragment.content.trim().length > 0,
  );
}

function splitAfterLine(
  content: string,
  anchor: string,
  context: string,
): { before: string; after: string } {
  const lines = splitLines(content);
  const index = findLineIndex(lines, anchor, context);

  return {
    before: trimMarkdownBlock(lines.slice(0, index + 1)),
    after: trimMarkdownBlock(lines.slice(index + 1)),
  };
}

function splitBeforeLine(
  content: string,
  anchor: string,
  context: string,
): { before: string; after: string } {
  const lines = splitLines(content);
  const index = findLineIndex(lines, anchor, context);

  return {
    before: trimMarkdownBlock(lines.slice(0, index)),
    after: trimMarkdownBlock(lines.slice(index)),
  };
}

function replaceLineRange(
  content: string,
  boundary: ReplaceBoundary,
  context: string,
): { before: string; after: string } {
  const lines = splitLines(content);
  const startIndex = findLineIndex(lines, boundary.start, context);
  const endIndex = findLineIndex(lines, boundary.end, context);

  assert(startIndex <= endIndex, `${context} replacement boundary is out of order`);

  return {
    before: trimMarkdownBlock(lines.slice(0, startIndex)),
    after: trimMarkdownBlock(lines.slice(endIndex + 1)),
  };
}

function extractPhaseHeadingAndObjective(
  lines: readonly string[],
  headingIndex: number,
  nextBoundary: number,
  context: string,
): string {
  const objectiveEndIndex = lines.findIndex(
    (line, index) =>
      index > headingIndex && index < nextBoundary && /^\*\*.+\*\*$/.test(line.trim()),
  );

  assert(objectiveEndIndex > headingIndex, `${context} phase objective is missing`);

  return trimMarkdownBlock(lines.slice(headingIndex, objectiveEndIndex + 1));
}

function findLineIndex(lines: readonly string[], anchor: string, context: string): number {
  const index = lines.findIndex((line) => line.trim() === anchor);

  assert(index >= 0, `${context} boundary not found: ${anchor}`);

  return index;
}

function trimMarkdownBlock(lines: readonly string[]): string {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === '') {
    start += 1;
  }

  while (end > start && lines[end - 1].trim() === '') {
    end -= 1;
  }

  return lines.slice(start, end).join('\n');
}

function splitLines(content: string): string[] {
  return content.replace(/\r\n?/g, '\n').split('\n');
}

function buildRecord<TKey extends string, TValue>(
  keys: readonly TKey[],
  buildValue: (key: TKey) => TValue,
): Record<TKey, TValue> {
  return Object.fromEntries(keys.map((key) => [key, buildValue(key)])) as Record<TKey, TValue>;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[Guide compilation] ${message}`);
  }
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isDirectRun) {
  writeGuideCompiledBundle({
    guideRootDir: process.argv[2] ?? defaultGuideEditorialRoot,
    outputPath: process.argv[3] ?? defaultGuideCompiledBundleOutputPath,
  });
}
