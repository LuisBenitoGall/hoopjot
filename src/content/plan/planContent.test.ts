import { basketballCatalog } from '../basketball/catalog';
import {
  competitiveLevelSchema,
  goalTypeSchema,
  playerPositionSchema,
} from '../../domain';
import enCommon from '../../i18n/en/common.json';
import esCommon from '../../i18n/es/common.json';
import { getPlanContent, linkedPlanGuidelineIds, planContentV1, planContentVersion } from './index';

describe('plan content', () => {
  it('keeps the versioned bilingual manual structure complete', () => {
    expect(planContentVersion).toBe('0.1.0');
    expect(
      planContentV1.locales.en.developmentMap.sections.map((section) => section.title),
    ).toEqual([
      'Attack',
      'Defense',
      'Transition',
      'Communication & decisions',
      'Habits & attention',
    ]);
    expect(
      planContentV1.locales.es.developmentMap.sections.map((section) => section.title),
    ).toEqual([
      'Ataque',
      'Defensa',
      'Transición',
      'Comunicación y decisiones',
      'Hábitos y atención',
    ]);
    expect(
      planContentV1.locales.en.developmentMap.sections[0]?.subBlocks.map((block) => block.title),
    ).toEqual(['On ball', 'Off ball']);
    expect(
      planContentV1.locales.en.developmentMap.sections[1]?.subBlocks.map((block) => block.title),
    ).toEqual(['On ball', 'Off ball', 'Rebounding']);
  });

  it('preserves the exact hero and closing copy for both locales', () => {
    expect(getPlanContent('es').hero).toEqual({
      title: 'Tu plan de juego',
      bodyTemplate:
        'Este es tu plan de trabajo{{aliasSuffix}}. No está pensado para que lo hagas todo a la vez. Reúne decisiones y hábitos que queremos convertir en parte natural de tu juego. Hoopjot irá tomando una idea cada vez y la llevará a tus entrenamientos y partidos. Después, lo que registres servirá para decidir qué conviene mantener, reforzar o volver a mirar.',
    });
    expect(getPlanContent('en').hero).toEqual({
      title: 'Your game plan',
      bodyTemplate:
        'This is your development plan{{aliasSuffix}}. It is not meant to be worked on all at once. It brings together decisions and habits that should become a natural part of your game. Hoopjot will take one idea at a time into practices and games. What you record afterwards will help decide what to keep, reinforce or revisit.',
    });
    expect(getPlanContent('es').closing.body).toBe(
      'No necesitas memorizarlo todo. El plan está aquí para que puedas volver a él cuando quieras entender el conjunto. En el día a día, Hoopjot elegirá una sola idea. Llévala contigo al entrenamiento o al partido. Después registra brevemente qué ocurrió, qué sentiste que funcionó y qué merece volver a aparecer. La mejora no vendrá de marcar casillas, sino de repetir buenas decisiones hasta que dejen de parecer nuevas.',
    );
    expect(getPlanContent('en').closing.body).toBe(
      'You do not need to memorize all of it. The plan is here so you can return whenever you want to understand the whole picture. Day to day, Hoopjot will choose one idea. Take it into practice or a game. Afterwards, record briefly what happened, what felt useful and what deserves to appear again. Improvement will not come from checking boxes. It will come from repeating good decisions until they stop feeling new.',
    );
  });

  it('links only existing bundled guideline ids', () => {
    const catalogIds = new Set(basketballCatalog.guidelines.map((guideline) => guideline.id));

    expect(linkedPlanGuidelineIds).toEqual([
      'att.onball.protect-outside-hip',
      'att.finish.two-foot-balance',
      'att.offball.show-target-window',
      'def.onball.contain-first-step',
      'def.offball.see-player-ball',
      'def.rebound.find-player-first',
      'transition.run-immediately',
      'transition.stop-ball-early',
      'comm.screen.call-early',
      'decision.extra-pass-window',
      'habits.prep.one-cue',
      'habits.confidence.next-play-reset',
    ]);
    expect(linkedPlanGuidelineIds.every((guidelineId) => catalogIds.has(guidelineId))).toBe(true);
  });

  it('keeps ProfileSnapshot enum labels localized for both locales', () => {
    for (const position of playerPositionSchema.options) {
      expect(enCommon.onboarding.positions).toHaveProperty(position);
      expect(esCommon.onboarding.positions).toHaveProperty(position);
    }

    for (const level of competitiveLevelSchema.options) {
      expect(enCommon.onboarding.competitiveLevels).toHaveProperty(level);
      expect(esCommon.onboarding.competitiveLevels).toHaveProperty(level);
    }

    for (const goalType of goalTypeSchema.options) {
      expect(enCommon.onboarding.goals).toHaveProperty(goalType);
      expect(esCommon.onboarding.goals).toHaveProperty(goalType);
    }
  });
});
