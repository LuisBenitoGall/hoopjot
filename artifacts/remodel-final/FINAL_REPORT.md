# Hoopjot Remodel Final Report

Date: 2026-08-26

## 1. Final Route Map

Authenticated main routes:
- `/app` -> Today
- `/plan` -> Plan
- `/plan/:guidelineId` -> Plan guideline detail
- `/journal` -> Journal
- `/journal/:sessionId` -> Journal detail
- `/profile` -> Profile

Legacy redirects:
- `/game` -> `/plan`
- `/game/:guidelineId` -> `/plan/:guidelineId`
- `/progress` -> `/journal`

Public routes:
- `/`, `/sign-in`, `/sign-up`, `/recovery`
- `/legal`, `/legal/notice`, `/legal/privacy`, `/legal/cookies`, `/legal/terms`
- `/privacy`, `/cookies`, `/terms`, `/legal-notice`

Existing auth protection remains in place for the authenticated app routes.

## 2. Final Bottom Navigation

Bottom navigation contains exactly three items:
- Today -> `/app`
- Plan -> `/plan`
- Journal -> `/journal`

Profile, Game and Progress are absent from bottom navigation.

## 3. Final Header Behavior

The authenticated header keeps compact Hoopjot branding on the left. The right side contains a profile icon link to `/profile`.

Connection state is shown only for offline, syncing, reconnecting and needs_attention states. No permanent Online badge is shown. Logout is not shown in the header.

## 4. Today Final Behavior

Today renders:
- `TODAY'S FOCUS` / `FOCO DE HOY`
- local date
- one DailyFocusCard
- one primary CTA before feedback: `Log how it went` / `Registrar cómo ha ido`

DailyFocusCard shows only category, title, instruction, cue and Why today / Por qué hoy.

Removed from Today:
- planned/viewed/completed/skipped user controls
- Mark viewed
- Complete
- Skip
- pre-session Energy, Confidence and Physical feeling
- Start session
- Learning and Recovery selectors
- old SessionReflectionPanel

## 5. Quick Reflection Final Behavior

Quick Reflection opens inline below the daily focus. It defaults to Practice, offers only Practice and Game, requires a 1-5 focus rating, has one optional main note, keeps coach feedback collapsed initially, and has one primary Save button.

Quick Reflection does not expose CheckIn or rememberNextTime.

Persistence behavior verified:
- existing incomplete sessions are reused
- the same session id is preserved on reuse
- selected Practice/Game is applied to Session.type
- no duplicate session is created on reload after saving
- no CheckIn is created
- note maps to Reflection.note
- coach feedback maps to Reflection.coachFeedback
- rememberNextTime remains omitted/undefined
- session is completed
- DailyFocus is completed
- local-first writes and sync queue behavior remain intact

## 6. Plan Final Structure

Plan top-level order:
1. PlanHero
2. ProfileSnapshot
3. HowHoopjotWorks
4. DevelopmentMap
5. PlanClosingNote

DevelopmentMap order:
1. 01 Attack
2. 02 Defense
3. 03 Transition
4. 04 Communication & decisions
5. 05 Habits & attention

Attack contains On ball and Off ball.

Defense contains On ball, Off ball and Rebounding.

Plan editorial content remains bundled. Guideline details use existing curated catalog content. Missing guideline links do not crash the manual and do not generate fallback coaching copy. The current-focus marker remains a small TODAY / HOY chip only.

## 7. Journal Final Behavior

Journal renders:
- title
- exact short intro
- chronological newest-first entries

Each list item shows localized date, localized session type, focus title, focus rating and up to two lines of note when present.

Detail shows date/type, focus title, cue, rating, note when present and coach feedback when present.

Journal does not show CheckIn, Energy, Confidence, Physical feeling, rememberNextTime, trend chips, progress analysis, skill scores, weekly review, sync state or technical ids. Historical Learning and Recovery entries remain readable through existing session type support.

## 8. Profile Final Behavior

Profile remains at `/profile`, reachable from the header icon and absent from bottom navigation.

Profile keeps existing editable profile/onboarding data, language selection and logout. It does not contain Progress dashboard content, metrics or Plan manual content. No new profile fields were introduced by R07.

## 9. Onboarding Preservation Confirmation

Onboarding behavior remains unchanged by R07. No onboarding field was added or removed for R07. Onboarding/profile data remains the source used by Profile and Plan. No duplicate profile storage exists.

## 10. Offline / Local-First Confirmation

Plan content and the basketball catalog remain bundled. Today, Quick Reflection, Journal and Profile continue to use local repositories. Playwright coverage verifies offline Plan rendering and offline local reflection flow after service worker activation.

## 11. Sync Confirmation

Quick Reflection writes through the existing local repositories and sync queue. E2E coverage verifies queued local changes sync after reconnect with the controlled remote adapter.

## 12. Schema / Migration Confirmation

No R07 change modified Supabase schema, Dexie schema, RLS policies, migrations, CheckIn domain, SessionType domain values, legacy reflection fields, auth architecture, sync architecture or recommendation scoring.

No remodel-specific database migration was created.

## 13. i18n ES / EN Confirmation

English and Spanish strings remain present for the remodeled navigation, Today, Quick Reflection, Plan, Journal and Profile flows. ProfileSnapshot enum labels are covered for both locales.

## 14. Automated Checks and Exact Results

- `pnpm typecheck`: passed (`tsc --noEmit`)
- `pnpm lint`: passed (`eslint . --max-warnings=0`)
- `pnpm test`: passed; 33 files passed, 1 skipped; 119 tests passed, 1 skipped
- `pnpm build`: passed; Vite production build completed; PWA generated 37 precache entries, 3638.80 KiB

The skipped Vitest file is `src/sync/supabaseRlsIsolation.integration.test.ts`, gated by `HOOPJOT_RUN_SUPABASE_RLS_TESTS`; no new skip was added for R07.

## 15. E2E Results

- `pnpm test:e2e`: passed; 21 Playwright tests passed

R07 E2E coverage includes:
- exactly three bottom-navigation items
- no Today Mark viewed / Complete / Skip controls
- no old Today check-in
- Quick Reflection opens inline
- rating-only Quick Reflection save
- saved reflection survives reload
- Journal shows the saved entry
- Plan renders all five sections
- Plan works offline
- Profile is reachable from the header
- `/game` redirects to `/plan`
- `/game/:guidelineId` redirects to `/plan/:guidelineId`
- `/progress` redirects to `/journal`

## 16. Screenshot Filenames and Verified Dimensions

- `01-today.png` -> 390x844
- `02-quick-reflection.png` -> 390x844
- `03-plan-top.png` -> 390x844
- `04-plan-map-attack.png` -> 390x844
- `05-plan-map-defense.png` -> 390x844
- `06-journal.png` -> 390x844
- `07-profile.png` -> 390x844
- `08-plan-desktop.png` -> 1440x900

All screenshots are stored under `artifacts/remodel-final/` and were captured with `fullPage: false`.

## 17. Known Non-Blocking Issue

The local automated gate still reports existing non-failing warnings:
- React Router future-flag warnings in tests.
- One React Testing Library `act(...)` warning in a PlanRoute test.
- Node FORCE_COLOR / NO_COLOR warnings from Playwright webServer output.

These warnings did not fail the mandatory gate.

## 18. Unmet Acceptance Criterion

None.
