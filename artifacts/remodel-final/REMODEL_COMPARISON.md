# Hoopjot Remodel Final Comparison

Date: 2026-08-26
Baseline source: `artifacts/remodel-baseline/BASELINE.md`
Final source: R07 Playwright run with deterministic E2E data.

Counting method: counts refer to visible controls inside `main` for screen content, matching the R00 baseline method. Navigation is counted separately as bottom-navigation links.

## Today

| Measure | Baseline | Final |
| --- | ---: | ---: |
| Visible primary action count | 9 | 1 |
| Visible form/control count | 27 | 1 |

Major removed UI elements:
- Focus status buttons: Mark viewed, Complete, Skip.
- Focus status chip.
- Date chip inside DailyFocusCard.
- Pre-session check-in controls: Energy, Confidence, Physical feeling.
- Start session action.
- Learning and Recovery choices in the daily UX.
- SessionReflectionPanel from Today.

Preserved functionality:
- Today still shows one current daily focus.
- Daily focus still uses the curated basketball catalog.
- Saving daily feedback still creates or reuses a local session and reflection.
- Local-first persistence and sync queue behavior remain covered.

## Journal

| Measure | Baseline | Final |
| --- | ---: | ---: |
| Visible primary action count | 6 | 1 |
| Visible form/control count | 6 | 1 |

Major removed UI elements:
- Session type filters.
- Progress/trend presentation.
- Check-in values and physical context values.
- Per-entry sync state or technical metadata.

Preserved functionality:
- Saved sessions/reflections remain readable.
- Journal detail remains reachable from the list.
- Historical session types remain supported.
- Offline/local reading remains covered.

## Navigation

| Measure | Baseline | Final |
| --- | ---: | ---: |
| Bottom-navigation primary action count | 5 | 3 |
| Bottom-navigation control count | 5 | 3 |

Major removed UI elements:
- Game bottom-navigation item.
- Progress bottom-navigation item.
- Profile bottom-navigation item.

Preserved functionality:
- Today remains reachable at `/app`.
- Plan remains reachable at `/plan`.
- Journal remains reachable at `/journal`.
- Profile remains reachable through the authenticated header icon.
- Legacy `/game*` and `/progress` routes redirect to the remodeled destinations.

## Profile

| Measure | Baseline | Final |
| --- | ---: | ---: |
| Visible primary action count | 2 | 3 |
| Visible form/control count | 15 | 16 |

Major moved or removed UI elements:
- Profile is removed from bottom navigation.
- Logout is removed from the header and kept in Profile.
- Progress dashboard, trends and metrics are not embedded in Profile.

Preserved functionality:
- Existing editable profile/onboarding fields remain available.
- Language selection remains available in Profile.
- Logout remains available in Profile.
- Profile data remains the existing source used by Plan.

## Plan

Plan replaces and reframes the previous Game/knowledge navigation role.

Implemented factual structural differences:
- `/plan` is the always-accessible manual route.
- `/plan/:guidelineId` is the detail route for existing catalog guidelines.
- The manual has the fixed top-level flow: PlanHero, ProfileSnapshot, HowHoopjotWorks, DevelopmentMap, PlanClosingNote.
- The DevelopmentMap has the fixed five-section structure: Attack, Defense, Transition, Communication & decisions, Habits & attention.
- Linked guideline controls use existing bundled guideline IDs.
- Missing guideline links are omitted without hiding the parent editorial subsection.
- The profile area displays only factual profile/goals data and does not generate coaching conclusions.
