/// <reference types="node" />

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { getBridgeKey, guidePositionRank } from './bridge';
import {
  type GuideBridgeInterventionType,
  type GuideBridgeSource,
  type GuideCoreChapterSource,
  type GuideCorePointSource,
  type GuideCoreRuleSource,
  type GuideCoreSource,
  type GuideInterventionSource,
  type GuideInterventionSlotSource,
  type GuidePointId,
  type GuideRoleInterventionType,
  type GuideRoleSource,
  type GuideSourceBundle,
  guidePointIds,
} from './sourceTypes';
import {
  guideBridgeKeys,
  guideLocales,
  guidePositions,
  type GuideBridgeKey,
  type GuideLocale,
  type GuidePosition,
} from './types';

interface GuideRegistryChapter {
  id: string;
  points: GuidePointId[];
}

interface GuideRegistrySelectionCase {
  primaryPosition: GuidePosition;
  secondaryPosition: GuidePosition | null;
  bridgeKey: GuideBridgeKey | null;
}

interface GuideRegistryFiles {
  core: Record<GuideLocale, string>;
  matrix: Record<GuideLocale, string>;
  roles: Record<GuideLocale, Record<GuidePosition, string>>;
  bridges: Record<GuideLocale, Record<GuideBridgeKey, string>>;
}

interface GuideContentRegistry {
  schemaVersion: number;
  editorialVersion: string;
  implementationContractVersion: string;
  locales: GuideLocale[];
  defaultLocale: GuideLocale;
  positions: GuidePosition[];
  positionRank: Record<GuidePosition, number>;
  bridgeKeys: GuideBridgeKey[];
  files: GuideRegistryFiles;
  pointOrder: GuidePointId[];
  chapters: GuideRegistryChapter[];
  coreOnlyPoints: GuidePointId[];
  roleInsertPoints: GuidePointId[];
  roleOverridePoints: GuidePointId[];
  bridgeAllowedPoints: GuidePointId[];
  interventionSlots: Partial<Record<GuidePointId, GuideInterventionSlotSource>>;
  selectionCases: GuideRegistrySelectionCase[];
}

interface Heading {
  lineIndex: number;
  level: number;
  text: string;
}

const moduleDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(moduleDir, '../../..');

export const defaultGuideEditorialRoot = join(projectRoot, 'docs/editorial/guide');
export const defaultGuideSourceBundleOutputPath = join(
  moduleDir,
  'generated/sourceBundle.json',
);

const pointIdSet = new Set<string>(guidePointIds);
const coreOnlyPointSet = new Set<GuidePointId>();
const roleInsertPointSet = new Set<GuidePointId>();
const roleOverridePointSet = new Set<GuidePointId>();
const bridgeAllowedPointSet = new Set<GuidePointId>();

export function loadAndValidateGuideSources(
  guideRootDir = defaultGuideEditorialRoot,
): GuideSourceBundle {
  const registry = loadGuideContentRegistry(guideRootDir);
  seedRegistrySets(registry);

  const locales = buildRecord(guideLocales, (locale) => ({
    core: parseCoreSource(
      locale,
      readMarkdownSource(guideRootDir, registry.files.core[locale]),
      registry,
    ),
    roles: buildRecord(guidePositions, (position) =>
      parseRoleSource(
        position,
        readMarkdownSource(guideRootDir, registry.files.roles[locale][position]),
        registry,
      ),
    ),
    bridges: buildRecord(guideBridgeKeys, (bridgeKey) =>
      parseBridgeSource(
        bridgeKey,
        readMarkdownSource(guideRootDir, registry.files.bridges[locale][bridgeKey]),
      ),
    ),
  }));

  const bundle: GuideSourceBundle = {
    schemaVersion: 1,
    editorialVersion: registry.editorialVersion,
    implementationContractVersion: registry.implementationContractVersion,
    coreOnlyPointIds: registry.coreOnlyPoints,
    interventionSlots: sortPointRecord(registry.interventionSlots),
    locales,
  };

  validateStructuralEquivalence(bundle);

  return bundle;
}

export function writeGuideSourceBundle({
  guideRootDir = defaultGuideEditorialRoot,
  outputPath = defaultGuideSourceBundleOutputPath,
}: {
  guideRootDir?: string;
  outputPath?: string;
} = {}): GuideSourceBundle {
  const bundle = loadAndValidateGuideSources(guideRootDir);
  const serialized = serializeGuideSourceBundle(bundle);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, 'utf8');

  return bundle;
}

export function serializeGuideSourceBundle(bundle: GuideSourceBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

function loadGuideContentRegistry(guideRootDir: string): GuideContentRegistry {
  const registryPath = join(guideRootDir, 'E0_12_GUIDE_CONTENT_REGISTRY.json');
  assert(existsSync(registryPath), `Missing Guide content registry: ${registryPath}`);

  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as GuideContentRegistry;
  validateRegistry(registry, guideRootDir);

  return registry;
}

function validateRegistry(registry: GuideContentRegistry, guideRootDir: string): void {
  assertArrayExact(registry.locales, guideLocales, 'registry locales');
  assert(registry.defaultLocale === 'es', 'Guide registry defaultLocale must be es');
  assertArrayExact(registry.positions, guidePositions, 'registry positions');
  assertArrayExact(registry.bridgeKeys, guideBridgeKeys, 'registry bridgeKeys');
  assertArrayExact(registry.pointOrder, guidePointIds, 'registry pointOrder');

  for (const position of guidePositions) {
    assert(
      registry.positionRank[position] === guidePositionRank[position],
      `Registry positionRank mismatch for ${position}`,
    );
  }

  assert(registry.chapters.length === 6, 'Registry must declare exactly 6 chapters');
  assert(
    registry.selectionCases.length === 25,
    'Registry must declare exactly 25 selection cases',
  );
  validateSelectionCases(registry.selectionCases);
  validateInterventionSlots(registry);

  const renderableFiles = [
    ...guideLocales.map((locale) => registry.files.core[locale]),
    ...guideLocales.flatMap((locale) =>
      guidePositions.map((position) => registry.files.roles[locale][position]),
    ),
    ...guideLocales.flatMap((locale) =>
      guideBridgeKeys.map((bridgeKey) => registry.files.bridges[locale][bridgeKey]),
    ),
  ];
  assert(renderableFiles.length === 32, 'Guide renderable source file count must be 32');

  const registeredFiles = [
    ...renderableFiles,
    ...guideLocales.map((locale) => registry.files.matrix[locale]),
  ];

  for (const relativePath of registeredFiles) {
    assert(!usesDisallowedSourcePath(relativePath), `Disallowed Guide source path: ${relativePath}`);
    assert(
      existsSync(join(guideRootDir, relativePath)),
      `Registered Guide source does not exist: ${relativePath}`,
    );
  }
}

function validateSelectionCases(selectionCases: GuideRegistrySelectionCase[]): void {
  const expectedCases = new Map<string, GuideBridgeKey | null>();

  for (const primaryPosition of guidePositions) {
    expectedCases.set(`${primaryPosition}:null`, null);

    for (const secondaryPosition of guidePositions) {
      if (secondaryPosition === primaryPosition) {
        continue;
      }

      expectedCases.set(
        `${primaryPosition}:${secondaryPosition}`,
        getBridgeKey(primaryPosition, secondaryPosition),
      );
    }
  }

  const actualCases = new Map<string, GuideBridgeKey | null>();

  for (const selectionCase of selectionCases) {
    const key = `${selectionCase.primaryPosition}:${selectionCase.secondaryPosition ?? 'null'}`;
    actualCases.set(key, selectionCase.bridgeKey);
  }

  assert(actualCases.size === expectedCases.size, 'Registry selection cases are duplicated');

  for (const [key, bridgeKey] of expectedCases) {
    assert(actualCases.has(key), `Registry selection case is missing: ${key}`);
    assert(actualCases.get(key) === bridgeKey, `Registry selection case bridge mismatch: ${key}`);
  }
}

function validateInterventionSlots(registry: GuideContentRegistry): void {
  const slotPointIds = Object.keys(registry.interventionSlots).sort();
  const expectedPointIds = [...registry.roleInsertPoints, ...registry.roleOverridePoints].sort();

  assertArrayExact(slotPointIds, expectedPointIds, 'registry interventionSlots');

  for (const pointId of expectedPointIds) {
    const slot = registry.interventionSlots[pointId];
    assert(slot, `Registry intervention slot missing for ${pointId}`);

    if (registry.roleInsertPoints.includes(pointId)) {
      assert(slot.roleMode === 'insert', `Registry slot ${pointId} must be insert`);
    }

    if (registry.roleOverridePoints.includes(pointId)) {
      assert(slot.roleMode === 'override', `Registry slot ${pointId} must be override`);
    }

    assert(
      slot.bridgeAllowed === registry.bridgeAllowedPoints.includes(pointId),
      `Registry slot ${pointId} bridgeAllowed mismatch`,
    );
  }
}

function parseCoreSource(
  locale: GuideLocale,
  markdown: string,
  registry: GuideContentRegistry,
): GuideCoreSource {
  const lines = splitMarkdownLines(markdown);
  const headings = collectHeadings(lines);
  const documentTitle = getRequiredHeadingText(headings, 0, 1, 'Guide Core title');
  const subtitle = getRequiredHeadingText(headings, 1, 2, 'Guide Core subtitle');
  const introductionIndex = findRequiredHeadingIndex(headings, (heading) =>
    matchesLocalizedHeading(locale, heading, 'SOBRE ESTA GUÍA', 'ABOUT THIS GUIDE'),
  );
  const chapterHeadings = headings.filter((heading) => isChapterHeading(heading));
  const rulesIndex = findRequiredHeadingIndex(headings, (heading) =>
    matchesLocalizedHeading(locale, heading, 'LAS 12 REGLAS', 'THE 12 RULES'),
  );
  const closingIndex = findRequiredHeadingIndex(headings, (heading) =>
    matchesLocalizedHeading(locale, heading, 'UNA ÚLTIMA IDEA', 'ONE LAST IDEA'),
  );

  assert(chapterHeadings.length === 6, `${locale} Core must contain exactly 6 chapters`);
  assert(rulesIndex < closingIndex, `${locale} Core rules must appear before closing`);

  const introductionHeading = headings[introductionIndex];
  const firstChapterLine = chapterHeadings[0].lineIndex;
  const introduction = {
    title: introductionHeading.text,
    content: trimMarkdownBlock(lines.slice(introductionHeading.lineIndex + 1, firstChapterLine)),
  };

  const chapters: GuideCoreChapterSource[] = [];
  const points: GuideCorePointSource[] = [];

  for (let index = 0; index < chapterHeadings.length; index += 1) {
    const chapterHeading = chapterHeadings[index];
    const chapterMatch = chapterHeading.text.match(/^(?:CAP[IÍ]TULO|CHAPTER)\s+(\d+)\s+·\s+(.+)$/);
    assert(chapterMatch, `Invalid ${locale} chapter heading: ${chapterHeading.text}`);

    const chapterNumber = Number(chapterMatch[1]);
    const registryChapter = registry.chapters[index];
    const nextChapterLine = chapterHeadings[index + 1]?.lineIndex ?? headings[rulesIndex].lineIndex;
    const pointHeadings = headings.filter(
      (heading) =>
        heading.level === 2 &&
        heading.lineIndex > chapterHeading.lineIndex &&
        heading.lineIndex < nextChapterLine &&
        /^([1-9]|[12]\d|30)\.\s+/.test(heading.text),
    );
    const pointIds = pointHeadings.map((heading) => {
      const point = parseCorePointHeading(heading, chapterHeading.text, locale);
      return point.id;
    });

    assert(
      registryChapter.id === `chapter_${chapterNumber}`,
      `${locale} chapter ${chapterNumber} does not match registry id`,
    );
    assertArrayExact(pointIds, registryChapter.points, `${locale} chapter ${chapterNumber} points`);

    chapters.push({
      id: registryChapter.id,
      number: chapterNumber,
      title: chapterMatch[2],
      pointIds,
    });

    for (let pointIndex = 0; pointIndex < pointHeadings.length; pointIndex += 1) {
      const pointHeading = pointHeadings[pointIndex];
      const point = parseCorePointHeading(pointHeading, chapterHeading.text, locale);
      const endLine = pointHeadings[pointIndex + 1]?.lineIndex ?? nextChapterLine;

      points.push({
        ...point,
        chapterId: registryChapter.id,
        content: trimMarkdownBlock(lines.slice(pointHeading.lineIndex + 1, endLine)),
      });
    }
  }

  const rulesHeading = headings[rulesIndex];
  const closingHeading = headings[closingIndex];
  const ruleHeadings = headings.filter(
    (heading) =>
      heading.level === 3 &&
      heading.lineIndex > rulesHeading.lineIndex &&
      heading.lineIndex < closingHeading.lineIndex &&
      /^([1-9]|1[0-2])\.\s+/.test(heading.text),
  );
  const rulesIntroEndLine = ruleHeadings[0]?.lineIndex ?? closingHeading.lineIndex;
  const rules = ruleHeadings.map(parseRuleHeading);

  validateCoreSource(locale, registry, points, chapters, rules);

  return {
    title: documentTitle,
    subtitle,
    introduction,
    chapters,
    points,
    rulesIntro: trimMarkdownBlock(lines.slice(rulesHeading.lineIndex + 1, rulesIntroEndLine)),
    rules,
    closing: {
      title: closingHeading.text,
      content: trimMarkdownBlock(lines.slice(closingHeading.lineIndex + 1)),
    },
  };
}

function parseRoleSource(
  position: GuidePosition,
  markdown: string,
  registry: GuideContentRegistry,
): GuideRoleSource {
  const interventions = parseInterventions(markdown, ['INSERT', 'OVERRIDE']);

  for (const intervention of interventions) {
    assert(
      intervention.type === 'INSERT' || intervention.type === 'OVERRIDE',
      `${position} role contains invalid intervention type ${intervention.type}`,
    );
    validateRoleIntervention(position, intervention, registry);
  }

  return {
    position,
    interventions,
  };
}

function parseBridgeSource(
  bridgeKey: GuideBridgeKey,
  markdown: string,
): GuideBridgeSource {
  const interventions = parseInterventions(markdown, ['BRIDGE']);

  for (const intervention of interventions) {
    assert(
      intervention.type === 'BRIDGE',
      `${bridgeKey} bridge contains invalid intervention type ${intervention.type}`,
    );
    validateBridgeIntervention(bridgeKey, intervention);
  }

  return {
    bridgeKey,
    interventions,
  };
}

function parseInterventions<TType extends GuideRoleInterventionType | GuideBridgeInterventionType>(
  markdown: string,
  allowedTypes: readonly TType[],
): GuideInterventionSource<TType>[] {
  const lines = splitMarkdownLines(markdown);
  const headings = collectHeadings(lines).filter(
    (heading) => heading.level === 1 && /^P\d{2}\s+·\s+/.test(heading.text),
  );
  const interventions: GuideInterventionSource<TType>[] = [];
  const seenPointIds = new Set<GuidePointId>();

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const headingMatch = heading.text.match(/^(P\d{2})\s+·\s+(.+)$/);
    assert(headingMatch, `Invalid intervention heading: ${heading.text}`);

    const pointId = parsePointId(headingMatch[1]);
    assert(!seenPointIds.has(pointId), `Duplicate intervention point: ${pointId}`);
    seenPointIds.add(pointId);

    const endLine = headings[index + 1]?.lineIndex ?? lines.length;
    const blockLines = lines.slice(heading.lineIndex + 1, endLine);
    const typeLineIndex = blockLines.findIndex((line) =>
      /^\*\*(?:Tipo|Type):\*\*\s+[A-Z]+$/.test(line.trim()),
    );

    assert(typeLineIndex >= 0, `Missing intervention type for ${pointId}`);

    const typeMatch = blockLines[typeLineIndex]
      .trim()
      .match(/^\*\*(?:Tipo|Type):\*\*\s+([A-Z]+)$/);
    assert(typeMatch, `Invalid intervention type line for ${pointId}`);
    const type = parseInterventionType(typeMatch[1], allowedTypes, pointId);
    const content = trimMarkdownBlock([
      ...blockLines.slice(0, typeLineIndex),
      ...blockLines.slice(typeLineIndex + 1),
    ]);

    interventions.push({
      pointId,
      type,
      content,
    });
  }

  return interventions;
}

function validateCoreSource(
  locale: GuideLocale,
  registry: GuideContentRegistry,
  points: GuideCorePointSource[],
  chapters: GuideCoreChapterSource[],
  rules: GuideCoreRuleSource[],
): void {
  assert(points.length === 30, `${locale} Core must contain exactly 30 points`);
  assertArrayExact(
    points.map((point) => point.id),
    registry.pointOrder,
    `${locale} Core point order`,
  );
  assert(new Set(points.map((point) => point.id)).size === 30, `${locale} Core has duplicate points`);
  assert(chapters.length === 6, `${locale} Core must contain exactly 6 chapters`);
  assert(rules.length === 12, `${locale} Core must contain exactly 12 Rules`);

  for (const [index, rule] of rules.entries()) {
    assert(rule.number === index + 1, `${locale} Core rule order is invalid`);
  }
}

function validateRoleIntervention(
  position: GuidePosition,
  intervention: GuideInterventionSource<GuideRoleInterventionType>,
  registry: GuideContentRegistry,
): void {
  assertPointKnown(intervention.pointId, `${position} role`);
  assert(
    !coreOnlyPointSet.has(intervention.pointId),
    `${position} role includes Core-only point ${intervention.pointId}`,
  );

  if (intervention.type === 'INSERT') {
    assert(
      registry.roleInsertPoints.includes(intervention.pointId),
      `${position} role INSERT is not authorized for ${intervention.pointId}`,
    );
    return;
  }

  assert(
    registry.roleOverridePoints.includes(intervention.pointId),
    `${position} role OVERRIDE is not authorized for ${intervention.pointId}`,
  );
}

function validateBridgeIntervention(
  bridgeKey: GuideBridgeKey,
  intervention: GuideInterventionSource<GuideBridgeInterventionType>,
): void {
  assertPointKnown(intervention.pointId, `${bridgeKey} bridge`);
  assert(intervention.pointId !== 'P01', `${bridgeKey} bridge includes forbidden P01`);
  assert(
    !coreOnlyPointSet.has(intervention.pointId),
    `${bridgeKey} bridge includes Core-only point ${intervention.pointId}`,
  );
  assert(
    bridgeAllowedPointSet.has(intervention.pointId),
    `${bridgeKey} bridge point is not authorized: ${intervention.pointId}`,
  );
}

function validateStructuralEquivalence(bundle: GuideSourceBundle): void {
  assertArrayExact(
    bundle.locales.es.core.points.map((point) => point.id),
    bundle.locales.en.core.points.map((point) => point.id),
    'Core ES/EN point order',
  );
  assertArrayExact(
    bundle.locales.es.core.chapters.map((chapter) => chapter.id),
    bundle.locales.en.core.chapters.map((chapter) => chapter.id),
    'Core ES/EN chapter order',
  );

  for (const position of guidePositions) {
    assertInterventionShapeEquivalent(
      bundle.locales.es.roles[position].interventions,
      bundle.locales.en.roles[position].interventions,
      `${position} role ES/EN`,
    );
  }

  for (const bridgeKey of guideBridgeKeys) {
    assertInterventionShapeEquivalent(
      bundle.locales.es.bridges[bridgeKey].interventions,
      bundle.locales.en.bridges[bridgeKey].interventions,
      `${bridgeKey} bridge ES/EN`,
    );
  }
}

function assertInterventionShapeEquivalent(
  left: readonly GuideInterventionSource[],
  right: readonly GuideInterventionSource[],
  context: string,
): void {
  const leftShape = left.map((intervention) => `${intervention.pointId}:${intervention.type}`);
  const rightShape = right.map((intervention) => `${intervention.pointId}:${intervention.type}`);

  assertArrayExact(leftShape, rightShape, context);
}

function seedRegistrySets(registry: GuideContentRegistry): void {
  coreOnlyPointSet.clear();
  roleInsertPointSet.clear();
  roleOverridePointSet.clear();
  bridgeAllowedPointSet.clear();

  for (const pointId of registry.coreOnlyPoints) {
    coreOnlyPointSet.add(pointId);
  }

  for (const pointId of registry.roleInsertPoints) {
    roleInsertPointSet.add(pointId);
  }

  for (const pointId of registry.roleOverridePoints) {
    roleOverridePointSet.add(pointId);
  }

  for (const pointId of registry.bridgeAllowedPoints) {
    bridgeAllowedPointSet.add(pointId);
  }
}

function readMarkdownSource(guideRootDir: string, relativePath: string): string {
  assert(!usesDisallowedSourcePath(relativePath), `Disallowed Guide source path: ${relativePath}`);
  const absolutePath = join(guideRootDir, relativePath);
  assert(existsSync(absolutePath), `Guide source file does not exist: ${relativePath}`);

  return readFileSync(absolutePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function collectHeadings(lines: readonly string[]): Heading[] {
  const headings: Heading[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const match = lines[lineIndex].match(/^(#{1,6})\s+(.+)$/);

    if (!match) {
      continue;
    }

    headings.push({
      lineIndex,
      level: match[1].length,
      text: match[2].trim(),
    });
  }

  return headings;
}

function getRequiredHeadingText(
  headings: readonly Heading[],
  index: number,
  level: number,
  context: string,
): string {
  const heading = headings[index];

  assert(heading?.level === level, `${context} heading is missing or has wrong level`);

  return heading.text;
}

function findRequiredHeadingIndex(
  headings: readonly Heading[],
  predicate: (heading: Heading) => boolean,
): number {
  const index = headings.findIndex(predicate);
  assert(index >= 0, 'Required Guide heading is missing');

  return index;
}

function isChapterHeading(heading: Heading): boolean {
  return heading.level === 1 && /^(?:CAP[IÍ]TULO|CHAPTER)\s+\d+\s+·\s+/.test(heading.text);
}

function matchesLocalizedHeading(
  locale: GuideLocale,
  heading: Heading,
  esHeading: string,
  enHeading: string,
): boolean {
  return heading.level === 1 && heading.text === (locale === 'es' ? esHeading : enHeading);
}

function parseCorePointHeading(
  heading: Heading,
  chapterTitle: string,
  locale: GuideLocale,
): Omit<GuideCorePointSource, 'chapterId' | 'content'> {
  const match = heading.text.match(/^([1-9]|[12]\d|30)\.\s+(.+)$/);
  assert(match, `Invalid ${locale} Core point heading under ${chapterTitle}: ${heading.text}`);

  const pointNumber = Number(match[1]);

  return {
    id: numberToPointId(pointNumber),
    number: pointNumber,
    title: match[2],
  };
}

function parseRuleHeading(heading: Heading): GuideCoreRuleSource {
  const match = heading.text.match(/^([1-9]|1[0-2])\.\s+(.+)$/);
  assert(match, `Invalid Guide rule heading: ${heading.text}`);
  const ruleNumber = Number(match[1]);

  return {
    id: `R${String(ruleNumber).padStart(2, '0')}`,
    number: ruleNumber,
    title: match[2],
  };
}

function numberToPointId(pointNumber: number): GuidePointId {
  assert(pointNumber >= 1 && pointNumber <= 30, `Invalid Guide point number: ${pointNumber}`);

  return parsePointId(`P${String(pointNumber).padStart(2, '0')}`);
}

function parsePointId(value: string): GuidePointId {
  assert(pointIdSet.has(value), `Invalid Guide point id: ${value}`);

  return value as GuidePointId;
}

function parseInterventionType<TType extends GuideRoleInterventionType | GuideBridgeInterventionType>(
  value: string,
  allowedTypes: readonly TType[],
  pointId: GuidePointId,
): TType {
  assert(
    (allowedTypes as readonly string[]).includes(value),
    `Invalid Guide intervention type ${value} for ${pointId}`,
  );

  return value as TType;
}

function assertPointKnown(pointId: GuidePointId, context: string): void {
  assert(pointIdSet.has(pointId), `${context} references unknown point ${pointId}`);
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

  if (end > start && lines[end - 1].trim() === '---') {
    end -= 1;
  }

  while (end > start && lines[end - 1].trim() === '') {
    end -= 1;
  }

  return lines.slice(start, end).join('\n');
}

function splitMarkdownLines(markdown: string): string[] {
  return markdown.replace(/\r\n?/g, '\n').split('\n');
}

function usesDisallowedSourcePath(relativePath: string): boolean {
  return relativePath.split(/[\\/]/).some((part) => part === 'archive' || part === 'audit');
}

function buildRecord<TKey extends string, TValue>(
  keys: readonly TKey[],
  buildValue: (key: TKey) => TValue,
): Record<TKey, TValue> {
  return Object.fromEntries(keys.map((key) => [key, buildValue(key)])) as Record<TKey, TValue>;
}

function sortPointRecord<TValue>(
  record: Partial<Record<GuidePointId, TValue>>,
): Partial<Record<GuidePointId, TValue>> {
  return Object.fromEntries(
    guidePointIds
      .filter((pointId) => record[pointId] !== undefined)
      .map((pointId) => [pointId, record[pointId]]),
  ) as Partial<Record<GuidePointId, TValue>>;
}

function assertArrayExact<TValue>(
  actual: readonly TValue[],
  expected: readonly TValue[],
  context: string,
): void {
  assert(
    actual.length === expected.length,
    `${context} length mismatch: expected ${expected.length}, received ${actual.length}`,
  );

  for (let index = 0; index < expected.length; index += 1) {
    assert(
      actual[index] === expected[index],
      `${context} mismatch at ${index}: expected ${String(expected[index])}, received ${String(
        actual[index],
      )}`,
    );
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[Guide ingestion] ${message}`);
  }
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isDirectRun) {
  writeGuideSourceBundle({
    guideRootDir: process.argv[2] ?? defaultGuideEditorialRoot,
    outputPath: process.argv[3] ?? defaultGuideSourceBundleOutputPath,
  });
}
