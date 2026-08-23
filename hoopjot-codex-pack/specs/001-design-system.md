# 001 — Design system

## Goal

Implement Hoopjot's visual foundation and reusable mobile-first components.

## Read first

- `docs/DESIGN_SYSTEM.md`
- `docs/PRODUCT.md`
- `assets/hoopjot-brand-board.png`

## Deliverables

- Design tokens implemented.
- App background/surface/type hierarchy defined.
- Responsive mobile shell.
- Bottom navigation visual component.
- Button, Card, Chip, RatingControl, EmptyState, OfflineBadge primitives.
- DailyFocusCard presentation component using fixture data.
- Brand/logo asset available in appropriate app locations.
- Components support translated strings and accessibility.

## Acceptance criteria

- No critical UI relies only on color.
- Tap targets meet target size.
- Focus states visible.
- Reduced motion respected.
- Components render at 360px and 430px widths without overflow.

## Tests / verification

Component tests for interactive primitives. Run lint/typecheck/test/build.

## Out of scope

- No routing behavior beyond demonstration.
- No real daily focus logic.
- No dark mode requirement.

## Completion rule

Do not begin another spec. Report implementation, tests, validation commands and deviations.
