# Design system

## Personality

Warm, cozy, calm, tactile, editorial. Playful but mature. Japanese in feel
without leaning on stereotypical Japanese imagery.

Explicitly **not**: anime-heavy, Duolingo-like, corporate SaaS.

A useful test for any screen: _does this feel like a well-made paper workbook,
or like a game trying to keep me engaged?_ Aim for the first.

## Tokens

Defined once in `src/app/globals.css` under Tailwind v4's `@theme`. Every token
becomes both a CSS custom property and a utility class.

**Components use tokens. Components never hardcode hex values, pixel radii or
arbitrary spacing.** Needing a value that does not exist means adding a token
first.

### Colour

| Token           | Value     | Role                                   |
| --------------- | --------- | -------------------------------------- |
| `canvas`        | `#F7F3EA` | Page background — warm paper           |
| `surface`       | `#FFFDF8` | Cards, sheets, raised areas            |
| `border`        | `#E5DED3` | Hairlines, dividers, card edges        |
| `ink`           | `#292725` | Primary text                           |
| `ink-secondary` | `#77716A` | Supporting text, labels                |
| `ink-muted`     | `#A49E95` | Metadata, placeholders, disabled       |
| `coral`         | `#E98278` | Primary action, active state, emphasis |
| `blue`          | `#8EA9C1` | Information, reading, calm secondary   |
| `sage`          | `#A9B89F` | Success, mastery, growth               |
| `yellow`        | `#E7C878` | Attention, streaks, highlights         |

Usage: `bg-canvas`, `text-ink-secondary`, `border-border`, `bg-coral`.

Each accent carries meaning. Reaching for one outside its role is how a palette
turns to mush. Coral is the only accent that should read as "act on this" —
using it decoratively spends the one signal the interface has.

### Typography

| Token       | Stack                                            |
| ----------- | ------------------------------------------------ |
| `font-sans` | Geist, then system UI fonts                      |
| `font-jp`   | Noto Sans JP, then Hiragino / Yu Gothic / Meiryo |
| `font-mono` | System monospace                                 |

Both webfonts are loaded through `next/font` in `src/app/layout.tsx`:
self-hosted, preloaded, no runtime request to Google, no layout shift.

**Japanese text must use `font-jp`.** `:lang(ja)` applies it automatically, so
mark Japanese content with `lang="ja"` and it is handled. This matters: a
generic fallback resolves to a Chinese font on many systems and draws
characters in the wrong regional form — on an app for learning to read them.

### Spacing

An 8px system: layout rhythm lands on 8, 16, 24, 32, 40, 48. Tailwind's 4px
step remains available (`p-1` = 4px) for optical adjustments — nudging an icon,
not laying out a page.

### Shape

| Token                | Radius | Use                           |
| -------------------- | ------ | ----------------------------- |
| `rounded-control`    | 10px   | Inputs, chips, small controls |
| `rounded-control-lg` | 12px   |                               |
| `rounded-button`     | 14px   | Buttons                       |
| `rounded-button-lg`  | 16px   | Large buttons                 |
| `rounded-card`       | 20px   | Cards                         |
| `rounded-card-lg`    | 24px   | Large cards                   |
| `rounded-feature`    | 28px   | Hero panels, feature surfaces |

Pills (`rounded-full`) are for things that genuinely are pills: tags, counts,
avatars. Not for buttons by default.

### Elevation

`shadow-hairline`, `shadow-raised`, `shadow-lifted` — all tinted with the ink
colour rather than neutral grey, because a grey shadow reads cold against warm
paper. Prefer a border to a shadow; use both only when something truly floats.

### Motion

`ease-out-soft` with durations of 120ms / 200ms / 320ms. Calm, not bouncy.
Nothing here should feel like a slot machine. `prefers-reduced-motion` is
honoured globally in `globals.css`.

## Rules

1. Tokens, not literals.
2. Not everything is coral. The palette has four accents and three text weights
   for a reason.
3. Not everything is a pill.
4. Gradients are rare and quiet. Flat warm surfaces with a hairline border are
   the default.
5. Borders before shadows.
6. Focus is always visible: a 2px coral ring with 2px offset, set globally.
7. Japanese text gets `lang="ja"`.

## Components

`src/components/ui/` is the home for design-system primitives. **It is empty.**
No primitives are built yet — building them before a real screen needs them
produces an API fitted to nothing. They arrive with the first vertical slice.

## Open questions

- **TODO — DECISION REQUIRED:** Dark mode. The palette is light-only and
  `color-scheme: light` is set explicitly. A dark counterpart for a warm paper
  palette is a real design exercise, not an inversion.
- **TODO — DECISION REQUIRED:** Illustration and iconography direction. "Japanese
  without stereotypical Japanese imagery" rules things out without saying what
  is in.
- **TODO — DECISION REQUIRED:** Accessibility target. WCAG AA is assumed below.

## Measured contrast

Computed from the specified palette, not estimated.

Against `canvas` (#F7F3EA):

| Foreground              | Ratio   | Verdict                                 |
| ----------------------- | ------- | --------------------------------------- |
| `ink` #292725           | 13.44:1 | Passes AA for all text                  |
| `ink-secondary` #77716A | 4.35:1  | **Just under** AA's 4.5:1 for body text |
| `ink-muted` #A49E95     | 2.40:1  | Fails — decorative only                 |
| `coral` #E98278         | 2.39:1  | Fails as text                           |
| `blue` #8EA9C1          | 2.21:1  | Fails as text                           |
| `sage` #A9B89F          | 1.89:1  | Fails as text                           |
| `yellow` #E7C878        | 1.47:1  | Fails as text                           |

On a coral fill:

| Combination          | Ratio  | Verdict   |
| -------------------- | ------ | --------- |
| `surface` on `coral` | 2.61:1 | Fails     |
| `ink` on `coral`     | 5.62:1 | Passes AA |

What this means in practice:

1. **The four accents are fill colours, not text colours.** Coral is for
   buttons, indicators and emphasis surfaces. Coral _text_ on paper is
   unreadable at 2.4:1.
2. **Text on a coral button is `ink`, not `surface`.** The instinct is white on
   coral; at 2.6:1 it fails. Ink on coral passes at 5.6:1. The placeholder
   pages follow this.
3. **`ink-muted` must never carry information a learner needs** — timestamps
   and placeholders, nothing more.
4. **`ink-secondary` misses AA by a hair at 4.35:1** and needs a decision:
   darken it slightly, restrict it to large or bold text, or accept the gap
   knowingly.

None of this is a flaw in the palette — it is a warm, low-contrast paper
palette behaving exactly as such a palette does. It means the accents earn
their keep as surfaces rather than as type.

- **TODO — DECISION REQUIRED:** whether to add darkened text variants of
  coral / blue / sage for cases that genuinely need coloured text. That would
  extend the specified palette, so it has not been done unilaterally.
