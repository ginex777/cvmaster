# Dashboard Style Update

> Brings the post-login app shell in line with the landing page's design language.
> All changes use existing tokens from `frontend/src/styles.css` — no new values.

---

## Landing Page Style Audit

### What the landing page does well

| Pattern | Where used | Token / technique |
|---|---|---|
| Glassmorphism navbar | Sticky nav | `backdrop-filter: saturate(1.8) blur(18px)` + `--bg` at 72% opacity |
| Grain texture overlay | Modal surfaces, result panel | `var(--grain)` SVG turbulence |
| Diagonal gradient surfaces | Modal, result panel | `linear-gradient(135deg, ...)` between two surface tints |
| Color-mixed tints | Active states, keyword chips, result panel | `color-mix(in oklch, var(--accent), ...)` |
| Large display numbers | Score result (`5.75rem`) | `font-weight: 800`, tight `line-height: 1` |
| Glow shadow on primary CTA | Hero button | `var(--shadow-glow)` |
| Monospace eyebrow labels | Section labels | `font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase` |
| Reveal animations | Sections | `@keyframes reveal` translateY + opacity |

### What the current dashboard is missing

1. **No grain texture** on stat cards — they look flat
2. **No diagonal gradient** on stat cards — plain `--bg-2` background
3. **Stat numbers are undersized** — `2.25rem` vs landing's `5.75rem` display style; value labels should be larger
4. **Table borders are raw oklch literals** — `oklch(90% 0 0)` instead of `var(--line)`
5. **Score pill mid-state uses raw oklch** — `oklch(50% 0.18 80)` instead of `var(--warn)`
6. **Shimmer skeleton doesn't use design tokens** — raw rgba values instead of color-mixed tokens
7. **No welcome / eyebrow typography** — section heading style doesn't match landing's monospace eyebrow
8. **Empty state is plain** — no visual depth or animation cue
9. **Missing `--shadow-glow`** on the primary "Neue Bewerbung" CTA button
10. **App shell background** uses raw `#f8fafc` in some components instead of `var(--bg)`

---

## Recommended Changes

### 1. Stat Cards — add grain + gradient

**Current:**
```scss
.stat-card {
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
```

**Updated:**
```scss
.stat-card {
  position: relative;
  background:
    var(--grain),
    linear-gradient(135deg,
      color-mix(in oklch, var(--accent), var(--surface) 94%) 0%,
      var(--surface) 100%
    );
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
```

### 2. Stat Value — bigger, tighter

**Current:**
```scss
.stat-card__value {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1;
}
```

**Updated:**
```scss
.stat-card__value {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1;
  color: var(--ink);
  letter-spacing: -0.02em;
}
```

### 3. Stat Label — monospace eyebrow style

**Current:**
```scss
.stat-card__label {
  font-size: 0.875rem;
  color: var(--ink-2);
  font-weight: 500;
}
```

**Updated:**
```scss
.stat-card__label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}
```

### 4. Table — use design tokens

**Current:**
```scss
td, th { border-bottom: 1px solid oklch(90% 0 0); }
```

**Updated:**
```scss
td, th { border-bottom: 1px solid var(--line); }
```

### 5. Score pill — fix mid-state token

**Current:**
```scss
.score--mid { color: oklch(50% 0.18 80); }
```

**Updated:**
```scss
.score--mid {
  background: color-mix(in oklch, var(--warn), transparent 85%);
  color: oklch(from var(--warn) calc(l - 0.15) c h); /* darker for contrast */
}
```

### 6. Primary CTA button — glow shadow

In `dashboard.component.html`, the "Neue Bewerbung" button should use:
```html
<button class="btn btn--accent btn--md" style="box-shadow: var(--shadow-glow)">
  Neue Bewerbung
</button>
```
Or better — add `.btn--accent-glow` to `styles.css`:
```scss
.btn--accent-glow {
  box-shadow: var(--shadow-glow);
}
```

### 7. Skeleton shimmer — use tokens

**Current:**
```scss
background: linear-gradient(90deg,
  rgba(226,232,240,0) 0%,
  rgba(226,232,240,0.8) 50%,
  rgba(226,232,240,0) 100%
);
```

**Updated:**
```scss
background: linear-gradient(90deg,
  color-mix(in oklch, var(--line), transparent 60%) 0%,
  color-mix(in oklch, var(--line), transparent 10%) 50%,
  color-mix(in oklch, var(--line), transparent 60%) 100%
);
```

### 8. Section heading — add eyebrow label

Above "Letzte Bewerbungen" and "Meine Lebensläufe" headings, add an eyebrow:
```html
<p class="eyebrow">Übersicht</p>
<h1>Willkommen zurück, {{ user().name }}</h1>
```

Add to `styles.css` (global utility — landing page already uses `.eyebrow` locally in the modal):
```scss
/* In styles.css, global utilities section */
.eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}
```

### 9. App shell background — replace raw values

Search for any `#f8fafc`, `#ffffff`, `white` in component scss files and replace with `var(--bg)` or `var(--surface)`.

---

## Implementation Notes

- All changes stay within the existing token system — no new colors
- Changes target `dashboard.component.scss` + minor additions to `styles.css`
- Grain texture (`var(--grain)`) is already defined in `styles.css` — just reference it
- `color-mix(in oklch, ...)` is already used throughout the landing page and navbar — safe to use
- No dark mode changes (out of V1 scope per CLAUDE.md)

---

## Files to Change

| File | Change |
|---|---|
| `frontend/src/app/features/dashboard/dashboard.component.scss` | Items 1–7 above |
| `frontend/src/styles.css` | Add `.eyebrow` global utility, add `.btn--accent-glow` |
| `frontend/src/app/features/dashboard/dashboard.component.html` | Add eyebrow labels, add `btn--accent-glow` class |
| Other feature `.scss` files | Replace raw color values with tokens |
