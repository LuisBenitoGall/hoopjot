# Hoopjot Remodel Baseline R00

Date: 2026-08-23
Viewport: 390 x 844
Capture mode: local Playwright run against Vite preview with E2E auth enabled.
Data state: fresh E2E account, onboarding completed, one practice session reflected.
Scope: evidence only. No product behavior or source code was changed in R00.

## Command Results

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | PASS | Completed without lint errors. |
| `pnpm typecheck` | PASS | Completed without TypeScript errors. |
| `pnpm test` | PASS | 29 test files passed, 1 skipped; 88 tests passed, 1 skipped. |
| `pnpm test:e2e` | FAIL | 17 passed, 2 failed. See failure notes below. |
| `pnpm build` | PASS | Production build completed. No Vite large chunk warning was observed. |

## E2E Failure Notes

| Test | Failure |
| --- | --- |
| `tests/e2e/journal.spec.ts` | Offline navigation to Journal hit `Unexpected Application Error!` because dynamic import `assets/JournalRoutes-CK4iC9zn.js` failed while offline, so `Reflection saved` was not visible. |
| `tests/e2e/release.spec.ts` | Mobile tap target audit found legal footer controls under the minimum target size: `Legal notice`, `Privacy policy`, `Cookie policy`, `Terms of use`, `Manage cookies`. |

## Counting Method

The inventory below counts visible controls inside `main` only, excluding authenticated header, legal footer, cookie footer and bottom navigation.

Visible form control count includes visible `button`, `a[href]`, non-hidden `input`, `select`, `textarea`, and explicit interactive roles found in `main`.

Primary actions are visible action-like controls in `main`: buttons, links, tabs and button-like roles.

## Route Inventory

| Baseline view | Route | Visible primary actions | Visible form control count | Screenshot |
| --- | --- | --- | ---: | --- |
| Today | `/app` | Mark viewed; Complete; Skip; Practice; Game; Learning; Recovery; Clear; Start session | 27 | `01-today.png` |
| Today current session / check-in | `/app` | Mark viewed; Complete; Skip; Complete + save reflection | 13 | `02-today-current-session-check-in.png` |
| Reflection saved | `/app` | Mark viewed; Complete; Skip; Practice; Game; Learning; Recovery; Clear; Start session | 27 | `03-reflection.png` |
| Game | `/game` | All; Attack; Defense; Transition; Communication; Decision making; Habits; Open guideline: Protect the outside hip; Open guideline: Show a target window; Open guideline: Finish with two-foot balance; Open guideline: Contain the first step; Open guideline: See player and ball; Open guideline: Find your player first; Open guideline: Run first; Open guideline: Stop the ball early; Open guideline: Call the screen early; Open guideline: Find the extra-pass window; Open guideline: Carry one court focus; Open guideline: Reset for the next play | 20 | `04-game.png` |
| Journal | `/journal` | All; Practice; Game; Learning; Recovery; Open session detail: Practice, Aug 23, 2026, 7:13 PM | 6 | `05-journal.png` |
| Progress | `/progress` | Generate weekly review | 1 | `06-progress.png` |
| Profile | `/profile` | Save profile; Reset changes | 15 | `07-profile.png` |

## Screenshot Files

- `artifacts/remodel-baseline/01-today.png`
- `artifacts/remodel-baseline/02-today-current-session-check-in.png`
- `artifacts/remodel-baseline/03-reflection.png`
- `artifacts/remodel-baseline/04-game.png`
- `artifacts/remodel-baseline/05-journal.png`
- `artifacts/remodel-baseline/06-progress.png`
- `artifacts/remodel-baseline/07-profile.png`
