# Design system

## Brand

**Hoopjot** combines a personal basketball journal with the visual energy of the court.

Reference asset:
`assets/hoopjot-brand-board.png`

The asset is visual direction, not a pixel-perfect implementation contract.

## Personality

- colorful;
- energetic;
- playful;
- confident;
- clean;
- gender-neutral;
- basketball-native without becoming cartoonish.

## Visual principle

Use court geometry, rhythm, lines, blocks and movement more often than literal basketball illustrations.

Avoid covering every screen in basketball icons. Humanity has survived enough decorative clip-art.

## Core palette

Exact production values may be tuned for contrast, but start from:

```css
--color-orange: #ff7a00;
--color-purple: #5634d6;
--color-blue: #1769e0;
--color-ink: #17144f;
--color-bg: #fffaf5;
--color-surface: #ffffff;
--color-muted: #6f7180;
--color-success: #25a66a;
--color-warning: #e0a11b;
--color-danger: #d84b4b;
```

All text/background combinations must meet accessible contrast targets.

## Category accents

- Attack: orange
- Defense: purple
- Transition / tactical: blue
- Progress: green
- Reflection / journal: use ink + soft accent

Color is supplemental and never the only semantic signal.

## Typography

Use a modern rounded sans-serif with excellent mobile readability.
Use a distinct display treatment for large daily-focus headings, but do not require a proprietary font.

Prefer system/web-safe fallback strategy to avoid fragile loading.

## Shape language

- generous rounded cards;
- court-line dividers;
- pill/chip controls;
- bold focus card;
- large tap targets;
- subtle asymmetry/motion.

## Spacing

Use a 4px base grid.
Primary mobile horizontal padding: 16–20px.
Touch targets: at least 44px.

## Primary mobile viewport

Design first for ~360–430px wide screens.
Tablet/desktop should remain usable but are secondary.

## Navigation

Bottom navigation:
- Today
- Game
- Journal
- Progress
- Profile

Use icon + label.

## Core components

### DailyFocusCard
Must display:
- category;
- title;
- short explanation;
- memorable cue;
- optional "why this focus";
- acknowledge/start action.

### RatingControl
1–5, tap-friendly, with accessible labels.

### SkillChip
Compact skill/category identity.

### SessionCard
Type, time/date, focus and completion state.

### ProgressTrend
Avoid fake precision. Prefer Up / Stable / Needs attention.

### OfflineBadge
Subtle persistent indicator when offline.
No alarming error styling.

## Motion

Use short functional transitions:
- card confirmation;
- navigation transition;
- completed reflection;
- progress state changes.

Respect `prefers-reduced-motion`.

Do not use constant confetti or punishment animations.

## Dark mode

Not required for initial MVP unless inexpensive after tokens/components are stable.
Architecture should not prevent it.

## Accessibility

- semantic HTML;
- keyboard support;
- focus states;
- ARIA only when semantic elements are insufficient;
- color contrast;
- reduced motion;
- no text embedded in decorative images for critical UI.
