import enContent from '../../i18n/en/content.json';
import esContent from '../../i18n/es/content.json';
import {
  basketballCatalog,
  basketballContentRepository,
  MVP_STARTER_GUIDELINE_COUNT,
  validateBasketballCatalogIntegrity,
  validateBasketballContentTranslations
} from './index';

describe('basketball content catalog', () => {
  it('keeps the MVP starter catalog small, versioned and internally valid', () => {
    expect(basketballCatalog.version).toBe('0.1.0');
    expect(basketballCatalog.guidelines).toHaveLength(MVP_STARTER_GUIDELINE_COUNT);
    expect(validateBasketballCatalogIntegrity()).toEqual([]);
  });

  it('validates English and Spanish guideline content resources', () => {
    expect(
      validateBasketballContentTranslations({
        en: enContent,
        es: esContent
      }),
    ).toEqual([]);

    expect(enContent.guidelines.def_rebound_find_player_first.title).toBe('Find your player first');
    expect(esContent.guidelines.def_rebound_find_player_first.title).toBe(
      'Localiza primero a tu rival',
    );
  });

  it('does not use recovery as a guideline recommendation context', () => {
    expect(
      basketballCatalog.guidelines.flatMap((guideline) => guideline.contexts),
    ).not.toContain('recovery');
  });

  it('serves cloned content through the bundled repository', async () => {
    const guidelines = await basketballContentRepository.listGuidelines();

    guidelines[0]?.skillIds.push('mutated');

    await expect(basketballContentRepository.getGuidelineById(guidelines[0]?.id ?? '')).resolves
      .not.toMatchObject({ skillIds: expect.arrayContaining(['mutated']) });
  });
});
