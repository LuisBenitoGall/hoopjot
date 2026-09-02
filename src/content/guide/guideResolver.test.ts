import { getBridgeKey } from './bridge';
import { guideCompiledBundle, resolveGuide } from './guideResolver';
import { guidePointIds, type GuidePointId } from './sourceTypes';
import { guideBridgeKeys, guideLocales, guidePositions, type GuidePosition } from './types';
import type { ResolvedGuide } from './compiledTypes';

const selectionCases = guideLocales.flatMap((locale) =>
  guidePositions.flatMap((primaryPosition) => [
    { locale, primaryPosition, secondaryPosition: null },
    ...guidePositions
      .filter((secondaryPosition) => secondaryPosition !== primaryPosition)
      .map((secondaryPosition) => ({ locale, primaryPosition, secondaryPosition })),
  ]),
);

const metadataNeedles = [
  'Estado editorial',
  'Editorial status',
  'PROPÓSITO DEL ROL',
  'ROLE PURPOSE',
  'PROPÓSITO DEL BRIDGE',
  'BRIDGE PURPOSE',
  '**Tipo:**',
  '**Type:**',
  'INSERT',
  'OVERRIDE',
  'BRIDGE',
  'GUIDE_CORE_ES.md',
  'GUIDE_CORE_EN.md',
  'GUIDE_ROLE_MATRIX_ES.md',
  'GUIDE_ROLE_MATRIX_EN.md',
];

function point(guide: ResolvedGuide, pointId: GuidePointId) {
  const resolvedPoint = guide.points.find((candidate) => candidate.id === pointId);

  if (!resolvedPoint) {
    throw new Error(`Missing resolved Guide point ${pointId}`);
  }

  return resolvedPoint;
}

function guideText(guide: ResolvedGuide): string {
  return [
    guide.title,
    guide.subtitle,
    guide.introduction.title,
    guide.introduction.content,
    ...guide.points.map((resolvedPoint) => resolvedPoint.content),
    guide.rulesIntro,
    ...guide.rules.map((rule) => rule.title),
    guide.closing.title,
    guide.closing.content,
  ].join('\n\n');
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function countHeadingOccurrences(content: string, pattern: RegExp): number {
  return content.split('\n').filter((line) => pattern.test(line)).length;
}

function assertOrdered(content: string, orderedNeedles: readonly string[]) {
  let cursor = -1;

  for (const needle of orderedNeedles) {
    const index = content.indexOf(needle);
    expect(index).toBeGreaterThan(cursor);
    cursor = index;
  }
}

describe('Guide resolver', () => {
  it.each(selectionCases)(
    'resolves the 50-case matrix for $locale $primaryPosition + $secondaryPosition',
    ({ locale, primaryPosition, secondaryPosition }) => {
      const guide = resolveGuide({ locale, primaryPosition, secondaryPosition });
      const text = guideText(guide);

      expect(guide.locale).toBe(locale);
      expect(guide.title).toBe(guideCompiledBundle.locales[locale].core.title);
      expect(guide.primaryPosition).toBe(primaryPosition);
      expect(guide.secondaryPosition).toBe(secondaryPosition);
      expect(guide.bridgeKey).toBe(getBridgeKey(primaryPosition, secondaryPosition));
      expect(guide.chapters).toHaveLength(6);
      expect(guide.points).toHaveLength(30);
      expect(guide.points.map((resolvedPoint) => resolvedPoint.id)).toEqual(guidePointIds);
      expect(new Set(guide.points.map((resolvedPoint) => resolvedPoint.id)).size).toBe(30);
      expect(guide.rules).toHaveLength(12);
      expect(new Set(guide.rules.map((rule) => rule.id)).size).toBe(12);

      for (const metadataNeedle of metadataNeedles) {
        expect(text).not.toContain(metadataNeedle);
      }
    },
  );

  it('keeps the 17 Core-only points identical across all selections within each locale', () => {
    for (const locale of guideLocales) {
      const baseline = resolveGuide({ locale, primaryPosition: 'PG', secondaryPosition: null });

      for (const selection of selectionCases.filter((candidate) => candidate.locale === locale)) {
        const guide = resolveGuide(selection);

        for (const pointId of guideCompiledBundle.coreOnlyPointIds) {
          expect(point(guide, pointId).content).toBe(point(baseline, pointId).content);
        }
      }
    }
  });

  it('keeps P09 universal screen principle exactly once in every resolved Guide', () => {
    for (const selection of selectionCases) {
      const guide = resolveGuide(selection);
      const p09 = point(guide, 'P09').content;
      const needle = selection.locale === 'es' ? 'hombro con hombro' : 'shoulder to shoulder';

      expect(countOccurrences(p09, needle)).toBe(1);
    }
  });

  it('keeps P04 at exactly three levels in every resolved Guide', () => {
    for (const selection of selectionCases) {
      const p04 = point(resolveGuide(selection), 'P04').content;
      const headingPattern =
        selection.locale === 'es'
          ? /^### NIVEL [123] · /
          : /^### LEVEL [123] · /;

      expect(countHeadingOccurrences(p04, headingPattern)).toBe(3);
    }
  });

  it('keeps P26 at exactly three phases in every resolved Guide', () => {
    for (const selection of selectionCases) {
      const p26 = point(resolveGuide(selection), 'P26').content;
      const headingPattern =
        selection.locale === 'es'
          ? /^### FASE [123] · /
          : /^### PHASE [123] · /;

      expect(countHeadingOccurrences(p26, headingPattern)).toBe(3);
    }
  });

  it.each(guideLocales)('does not include bridge content when %s selections have no secondary', (locale) => {
    const bridgeContents = guideBridgeKeys.flatMap((bridgeKey) =>
      Object.values(guideCompiledBundle.locales[locale].bridges[bridgeKey].interventions).map(
        (intervention) => intervention.content,
      ),
    );

    for (const primaryPosition of guidePositions) {
      const text = guideText(resolveGuide({ locale, primaryPosition, secondaryPosition: null }));

      for (const bridgeContent of bridgeContents) {
        expect(text).not.toContain(bridgeContent);
      }
    }
  });

  it.each(
    guideLocales.flatMap((locale) =>
      guidePositions.map((primaryPosition) => ({ locale, primaryPosition })),
    ),
  )(
    'treats same-position secondary as no bridge for $locale $primaryPosition',
    ({ locale, primaryPosition }) => {
      expect(resolveGuide({ locale, primaryPosition, secondaryPosition: primaryPosition })).toEqual(
        resolveGuide({ locale, primaryPosition, secondaryPosition: null }),
      );
    },
  );

  it.each(
    guideLocales.flatMap((locale) =>
      guideBridgeKeys.map((bridgeKey) => ({ locale, bridgeKey })),
    ),
  )(
    'keeps bridge neutral and primary role dominant for $locale $bridgeKey',
    ({ locale, bridgeKey }) => {
      const [leftPosition, rightPosition] = bridgeKey.split('_') as [GuidePosition, GuidePosition];
      const leftPrimaryGuide = resolveGuide({
        locale,
        primaryPosition: leftPosition,
        secondaryPosition: rightPosition,
      });
      const rightPrimaryGuide = resolveGuide({
        locale,
        primaryPosition: rightPosition,
        secondaryPosition: leftPosition,
      });
      const bridge = guideCompiledBundle.locales[locale].bridges[bridgeKey];
      const leftRoleP03 = guideCompiledBundle.locales[locale].roles[leftPosition].interventions.P03;
      const rightRoleP03 =
        guideCompiledBundle.locales[locale].roles[rightPosition].interventions.P03;

      expect(leftPrimaryGuide.bridgeKey).toBe(bridgeKey);
      expect(rightPrimaryGuide.bridgeKey).toBe(bridgeKey);
      expect(leftRoleP03?.content).toBeTruthy();
      expect(rightRoleP03?.content).toBeTruthy();
      expect(point(leftPrimaryGuide, 'P03').content).toContain(leftRoleP03?.content);
      expect(point(rightPrimaryGuide, 'P03').content).toContain(rightRoleP03?.content);
      expect(point(leftPrimaryGuide, 'P03').content).not.toBe(
        point(rightPrimaryGuide, 'P03').content,
      );

      for (const bridgeIntervention of Object.values(bridge.interventions)) {
        expect(guideText(leftPrimaryGuide)).toContain(bridgeIntervention.content);
        expect(guideText(rightPrimaryGuide)).toContain(bridgeIntervention.content);
      }
    },
  );

  it('is deterministic and ignores unsupported profile-like fields', () => {
    const selection = {
      locale: 'es',
      primaryPosition: 'SF',
      secondaryPosition: 'PF',
      alias: 'Sample',
      heightCm: 180,
      dominantHand: 'left',
      birthYear: 2008,
      experienceYears: 4,
      weeklyPractices: 3,
      physicalContext: 'ignored',
    };

    expect(resolveGuide(selection as unknown as Parameters<typeof resolveGuide>[0])).toEqual(
      resolveGuide(selection as unknown as Parameters<typeof resolveGuide>[0]),
    );
    expect(resolveGuide(selection as unknown as Parameters<typeof resolveGuide>[0])).toEqual(
      resolveGuide({ locale: 'es', primaryPosition: 'SF', secondaryPosition: 'PF' }),
    );
  });
});

describe('Guide resolver override boundaries', () => {
  it.each([
    {
      locale: 'es',
      universal: 'Pasa **hombro con hombro**.',
      removed:
        'Según tu función tendrás que aprender a poner bloqueos, utilizarlos, rechazarlos, cambiar ángulos, continuar, abrirte, volver a bloquear o leer la reacción defensiva.',
      primary: 'Como base, debes aprender especialmente a utilizar el bloqueo directo',
      bridge: 'Esta combinación debe reconocer dos formas frecuentes de crear ventaja con pantallas',
      closing: 'No ejecutes la acción como si terminara en el bloqueo.',
    },
    {
      locale: 'en',
      universal: 'Go **shoulder to shoulder**.',
      removed:
        'Depending on your role, you will need to learn how to set screens, use them, reject them, change angles, roll, pop, re-screen or read the defensive reaction.',
      primary: 'As a point guard, you should learn especially how to use the pick-and-roll',
      bridge: 'This combination should recognize two common ways of creating advantage with screens',
      closing: 'Do not execute the action as if it ends at the screen.',
    },
  ] as const)('preserves the P09 universal block and replaces only positional responsibility in $locale', ({
    locale,
    universal,
    removed,
    primary,
    bridge,
    closing,
  }) => {
    const hybrid = point(
      resolveGuide({ locale, primaryPosition: 'PG', secondaryPosition: 'SG' }),
      'P09',
    ).content;
    const simple = point(resolveGuide({ locale, primaryPosition: 'PG', secondaryPosition: null }), 'P09')
      .content;

    expect(hybrid).toContain(universal);
    expect(hybrid).not.toContain(removed);
    expect(hybrid).toContain(primary);
    expect(hybrid).toContain(bridge);
    expect(hybrid).toContain(closing);
    expect(simple).not.toContain(bridge);
    assertOrdered(hybrid, [universal, primary, bridge, closing]);
  });

  it.each([
    {
      locale: 'es',
      removed: '- trabajo de pies;',
      removedSummary: 'Necesitas saber cuáles sostienen ahora mismo tu juego.',
      primary: 'Tus fundamentos prioritarios deben permitirte jugar bajo presión',
      closing: 'La repetición consciente tiene otra estructura:',
    },
    {
      locale: 'en',
      removed: '- footwork;',
      removedSummary: 'You need to know which ones currently support your game.',
      primary: 'Your priority fundamentals should allow you to play under pressure',
      closing: 'Deliberate repetition has a different structure:',
    },
  ] as const)('replaces the generic P10 fundamentals block in $locale', ({
    locale,
    removed,
    removedSummary,
    primary,
    closing,
  }) => {
    const p10 = point(resolveGuide({ locale, primaryPosition: 'PG', secondaryPosition: 'SG' }), 'P10')
      .content;

    expect(p10).not.toContain(removed);
    expect(p10).not.toContain(removedSummary);
    expect(p10).toContain(primary);
    expect(p10).toContain(closing);
  });

  it.each([
    {
      locale: 'es',
      removed: '- ¿Dónde se colocan?',
      primary: 'Cuando observes a un base, no mires únicamente sus asistencias',
      ownVideo: 'Cuando revises vídeo de tus propios partidos',
    },
    {
      locale: 'en',
      removed: '- Where do they position themselves?',
      primary: 'When you watch a point guard, do not look only at assists',
      ownVideo: 'When you review video of your own games',
    },
  ] as const)('replaces P11 generic observation questions while preserving own-video review in $locale', ({
    locale,
    removed,
    primary,
    ownVideo,
  }) => {
    const p11 = point(resolveGuide({ locale, primaryPosition: 'PG', secondaryPosition: 'SG' }), 'P11')
      .content;

    expect(p11).not.toContain(removed);
    expect(p11).toContain(primary);
    expect(p11).toContain(ownVideo);
  });

  it.each([
    {
      locale: 'es',
      phase: '### FASE 1 · FIABILIDAD',
      objective: '**Que el cuerpo técnico confíe en ponerte en pista.**',
      primary: '- subir el balón con seguridad;',
    },
    {
      locale: 'en',
      phase: '### PHASE 1 · RELIABILITY',
      objective: '**Your coaching staff trusts putting you on the court.**',
      primary: '- bring the ball up safely;',
    },
  ] as const)('preserves P26 phase headings and goals while integrating role content in $locale', ({
    locale,
    phase,
    objective,
    primary,
  }) => {
    const p26 = point(resolveGuide({ locale, primaryPosition: 'PG', secondaryPosition: 'SG' }), 'P26')
      .content;

    expect(p26).toContain(phase);
    expect(p26).toContain(objective);
    expect(p26).toContain(primary);
    expect(countHeadingOccurrences(p26, /^### (?:FASE|PHASE) [123] · /)).toBe(3);
  });

  it.each([
    {
      locale: 'es',
      removed: 'Un buen bloqueo.',
      primary: 'Para valorar tu partido como base, observa también acciones como:',
      closing: 'Puedes jugar bien anotando poco.',
    },
    {
      locale: 'en',
      removed: 'A good screen.',
      primary: 'To evaluate your game as a point guard, also notice actions such as:',
      closing: 'You can play well while scoring little.',
    },
  ] as const)('replaces P27 generic invisible-action examples and keeps the closing in $locale', ({
    locale,
    removed,
    primary,
    closing,
  }) => {
    const p27 = point(resolveGuide({ locale, primaryPosition: 'PG', secondaryPosition: 'SG' }), 'P27')
      .content;

    expect(p27).not.toContain(removed);
    expect(p27).toContain(primary);
    expect(p27).toContain(closing);
  });
});

describe('Guide resolver insert ordering', () => {
  it('orders P01 as Core before, primary insert, and Core after without bridge', () => {
    const p01 = point(resolveGuide({ locale: 'es', primaryPosition: 'PG', secondaryPosition: 'SG' }), 'P01')
      .content;

    expect(p01).not.toContain('En funciones que alternan organización y amenaza exterior');
    assertOrdered(p01, [
      'Tu función en pista influirá en las primeras responsabilidades que debas dominar.',
      'Para un base, las primeras responsabilidades suelen aparecer muy pronto.',
      'El principio es común:',
    ]);
  });

  it.each([
    {
      pointId: 'P03',
      coreBefore: 'Todas necesitan resultar fiables en aquello que les corresponde.',
      primary: 'Un base fiable no es simplemente quien acumula asistencias.',
      bridge: 'En funciones que alternan organización y amenaza exterior',
      coreAfter: 'Primero conviértete en alguien útil.',
    },
    {
      pointId: 'P06',
      coreBefore: 'Sea cual sea tu mano preferida, desarrollar la otra amplía tus soluciones.',
      primary: 'Para un base, utilizar bien el cuerpo tiene mucho que ver',
      bridge: 'Esta combinación exige controlar el cuerpo tanto con balón como antes de recibirlo.',
      coreAfter: 'Tu físico es una herramienta.',
    },
    {
      pointId: 'P21',
      coreBefore: 'Si alguien cae al suelo, ayuda a levantarse.',
      primary: 'Como base puedes facilitar mucho el juego de los demás.',
      bridge: 'Poder organizar no significa que debas pedir el balón',
      coreAfter: 'El baloncesto contiene mucho trabajo que no aparece en el resumen estadístico.',
    },
  ] as const)('orders $pointId as Core before, primary, bridge, and Core after', ({
    pointId,
    coreBefore,
    primary,
    bridge,
    coreAfter,
  }) => {
    const resolvedPoint = point(
      resolveGuide({ locale: 'es', primaryPosition: 'PG', secondaryPosition: 'SG' }),
      pointId,
    ).content;

    assertOrdered(resolvedPoint, [coreBefore, primary, bridge, coreAfter]);
  });
});
