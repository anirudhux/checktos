# CheckTOS style reference

Brand tokens, fonts, and the card system. Read this before adding a newsmaker card or a new surface, so everything stays on-brand. This is an internal doc; it is not served (the deploy ignores `*.md`).

## Palette

The whole site is light only. These are defined as CSS variables on `:root` in `index.html` and `breakdown.css`.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#f6f9f3` | Page background. Near-white with a sage tint. |
| `--panel` | `#e9efe4` | Light sage surface: feeder boxes, journey pills, the sage card. |
| `--card` | `#ffffff` | White surface for callout cards and quote blocks (detail pages). |
| `--border` | `#d5ddcc` | Hairlines, chip and card outlines. |
| `--ink` | `#26332b` | Dark green. Primary text, dark node boxes, the ink card. |
| `--muted` | `#61705f` | Secondary text, structural arrowheads. |
| `--accent` | `#d2694a` | Terracotta. The one signal colour: CTAs, links, the pipeline flow, the terracotta card. |
| `--accent-soft` | `#ecb7a6` | Soft terracotta. Sparingly, e.g. pill-flash on the flowchart. |
| `--on-accent` | `#fbf6f1` | Cream. Text on terracotta or ink surfaces. |
| `--ok` | `#3f7d5a` | Green. Only for completion or verified marks (the journey checks, the token turning green). Never as a general accent. |

Rule of thumb: terracotta is the document's path and the call to action, grey/sage is structure, ink is dark surfaces and text, green means done. Do not introduce new hues.

## Fonts

- `--serif`: **Fraunces** (`ital,opsz,wght`). Display only: the hero headline, product names, section headings (H2/H3), card titles, CTA card headings. Weight 600, `letter-spacing: -0.01em`. The hero uses the italic for the emphasised word.
- `--sans`: **Inter**. Everything else: body copy, the lede, labels, chips, nav, buttons, the parent-company line.

Load both from Google Fonts with the same `<link>` used across the pages.

## Newsmaker cards (the deck)

Each card is one of three brand variants, cycled in order as the deck grows: **terracotta → sage → ink**. Never invent a fourth colour; loop back to terracotta.

| Variant | Background | Title colour | Parent-company (`.card-by`) | Pattern (`.card-art`) |
|---|---|---|---|---|
| `instinct` (terracotta) | `#d2694a` (`--accent`) | `#fbf6f1` (`--on-accent`) | `rgba(251,246,241,0.82)` | cream vertical lines |
| `lovable` (sage) | `#e9efe4` (`--panel`) | `#26332b` (`--ink`) | `#5c6b57` | ink grid |
| `jev` (ink) | `#26332b` (`--ink`) | `#eef3ea` | `#9aa898` | light horizontal lines |

The class names (`instinct` / `lovable` / `jev`) are the variant names; reuse the class for the matching colour on a new card, or add a new variant class that mirrors one of these three rows.

### Structure

```html
<a class="fan-card [variant]" href="[product].html">
  <div class="card-art art-[variant]"></div>
  <div class="card-foot">
    <span class="card-title">[Product]</span>
    <span class="card-by">[Parent company, short form]</span>
  </div>
</a>
```

- Title is the product name in Fraunces (`.card-title`).
- The bottom line is the parent company in Inter, short form (`.card-by`): "Spear Street Technology", "Lovable Labs", "TypeSafe AI".
- No clarity chip on the card. Clarity and scope live on the breakdown page, not the deck.

### Deck behaviour (already in `index.html`)

- Stacks fan out on hover, capped at 4 per stack; more than that starts a second stack. Layout is computed from the card count by the inline script.
- Every card and its name stays visible in both the resting fan and the fanned-out state.

## Detail (breakdown) pages

Shared styling lives in `breakdown.css`. Conventions there:

- No eyebrow label above the product name.
- Headings are semantic: H1 product name, H2 sections ("The four journeys", "Structure summary", "Caveats"), H3 journeys (Product, Usage, Feedback & improvement, Legal ramifications), all in Fraunces.
- Clarity is a plain-text pill inside a callout card, not a colour-coded chip.
- Quote callouts are white cards with a grey rule; no terracotta borders on sage.
- Copy is in Anirudh's voice: active, plain verbs, no em-dashes, no "X, not Y" pivots, no bolded fragment labels. Quotes stay verbatim.
