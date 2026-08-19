# 006 — Knowledge base

## Goal

Implement the versioned curated basketball catalog and Game browsing experience.

## Read first

- `docs/CONTENT_MODEL.md`
- `docs/I18N.md`
- `docs/PRODUCT.md`

## Deliverables

- Skill/guideline catalog structure.
- Build/test-time Zod validation.
- Initial seed of at least 12 guidelines across attack, defense, rebounding, transition and habits using clearly marked editorial starter content.
- English and Spanish translations.
- Game screen with taxonomy browsing.
- Guideline detail screen.
- Filtering by category/subcategory.

## Acceptance criteria

- Catalog IDs are stable and locale-independent.
- Missing translations fail a validation test or controlled development warning.
- App can browse content offline.
- Content is not stored as duplicated domain entities per language.

## Tests / verification

Catalog validation tests and Game browsing E2E smoke test.

## Out of scope

- Do not invent 100 guidelines.
- No CMS.
- No AI-generated content.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
