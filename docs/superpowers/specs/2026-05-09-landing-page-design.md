---
title: Landing Page — Angular Implementation
date: 2026-05-09
status: approved
---

# Landing Page — Angular Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate `Landing-Page-Standalone.html` 1:1 in Angular — identical styles, layout, content, and interactions — and wire up all CTAs to the correct routes.

**Architecture:** Static marketing page with no API calls. One smart component (`lba-landing`) composes 7 colocated section sub-components plus 2 shared components (navbar, footer). All content is hardcoded in templates; no `@Input()` data needed except for the `[lbaReveal]` directive delay values.

**Tech Stack:** Angular 21 standalone, OnPush, signals, `[lbaReveal]` directive (IntersectionObserver), Tailwind CSS utilities, CSS custom properties (design tokens), Geist font (already bundled in standalone HTML, loaded via `@font-face` in styles.css).

---

## Reference: Standalone HTML

File: `Landing-Page-Standalone.html` (repo root) — rendered via `http://localhost:8099/Landing-Page-Standalone.html`.  
This is the source of truth for every pixel. When in doubt, open it in a browser and inspect.

---

## Phase 0 — Design Token Sync (`styles.css`)

The current `styles.css` tokens do not match the standalone HTML. **This must be the first task** — nothing will look correct until tokens are aligned.

### Token diff (standalone HTML → replace current styles.css `:root`)

```css
:root {
  /* Backgrounds */
  --bg:         oklch(98.6% 0.005 80);       /* was oklch(98.6% 0.003 247) — warm beige, not cool blue */
  --surface:    oklch(99.6% 0.003 80);       /* new — very light warm white (cards in hero mockup) */
  --surface-2:  oklch(96.5% 0.005 80);       /* replaces --bg-2 — slightly deeper warm */

  /* Text */
  --ink:        oklch(20%  0.015 270);       /* was oklch(20% 0.010 247) */
  --ink-2:      oklch(36%  0.012 270);       /* was oklch(40% 0.008 247) */
  --ink-3:      oklch(52%  0.010 270);       /* was oklch(60% 0.006 247) */

  /* Borders */
  --line:       oklch(90%  0.005 270);       /* new — standard border */
  --line-2:     oklch(94%  0.004 270);       /* new — subtle border */

  /* Accent */
  --accent:     oklch(58%  0.20  255);       /* was oklch(55% 0.22 265) */
  --accent-2:   oklch(70%  0.18  255);       /* was oklch(70% 0.18 265) */
  --accent-ink: oklch(98%  0.01  255);       /* new — white text on accent bg */

  /* Semantic */
  --good:       oklch(64%  0.14  155);       /* replaces --success */
  --warn:       oklch(72%  0.16   60);       /* replaces --warning */
  --bad:        oklch(60%  0.18   25);       /* replaces --danger */

  /* Typography */
  --font-sans:    'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: 'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono:    'Geist Mono', 'Fira Code', ui-monospace, monospace;

  /* Spacing scale — unchanged */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  /* Radii */
  --radius-sm:   8px;    /* was 4px */
  --radius-md:   14px;   /* was 8px — mid token used by cards */
  --radius-lg:   22px;   /* was 16px */
  --radius-xl:   28px;   /* was 24px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm:   0 1px 2px rgba(15,18,32,0.04), 0 1px 1px rgba(15,18,32,0.03);
  --shadow-md:   0 1px 2px rgba(15,18,32,0.04), 0 8px 24px -8px rgba(15,18,32,0.10);
  --shadow-lg:   0 1px 2px rgba(15,18,32,0.04), 0 24px 60px -20px rgba(15,18,32,0.18);
  --shadow-glow: 0 0 0 1px color-mix(in oklch, var(--accent) 30%, transparent),
                 0 30px 80px -30px color-mix(in oklch, var(--accent) 60%, transparent);

  /* Layout */
  --max: 1200px;
  --pad: clamp(20px, 4vw, 40px);

  /* Grain texture (subtle noise overlay used in hero) */
  --grain: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");

  /* Focus ring — WCAG 2.2 AAA */
  --focus-ring: 0 0 0 3px var(--accent);
}
```

### Scroll reveal CSS (add to styles.css)

```css
/* Reveal animation — driven by [lbaReveal] directive */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.reveal--visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

### Geist font (add to styles.css)

Install `geist` npm package (`npm install geist`) and import the CSS in `styles.css`:

```css
@import 'geist/dist/geist.css';
@import 'geist/dist/geist-mono.css';
```

This provides all weights (300–700) via self-hosted woff2 files bundled with the package — no CDN dependency, no manual base64 extraction from the standalone HTML.

---

## Component Map

| File | Status | Notes |
|---|---|---|
| `frontend/src/styles.css` | UPDATE | Phase 0 — tokens, reveal CSS, font-face |
| `shared/components/navbar.component` | CREATE | sticky frosted-glass nav |
| `shared/components/footer.component` | CREATE | 3-column link footer |
| `shared/components/button.component` | UPDATE | add `outline` + `accent` variants |
| `features/landing/landing.component` | UPDATE | replace placeholder, compose sections |
| `features/landing/sections/hero.component` | CREATE | |
| `features/landing/sections/logo-bar.component` | CREATE | |
| `features/landing/sections/features-grid.component` | CREATE | |
| `features/landing/sections/workflow-steps.component` | CREATE | |
| `features/landing/sections/before-after.component` | CREATE | |
| `features/landing/sections/testimonials.component` | CREATE | |
| `features/landing/sections/cta-band.component` | CREATE | |
| `features/landing/sections/pricing-inline.component` | CREATE | static 2-card pricing block, no route |

All new components: standalone, OnPush, no `NgModel`, no `CommonModule`, `[lbaReveal]` for scroll animations.

---

## Shared Component: `lba-navbar`

**File:** `frontend/src/app/shared/components/navbar.component.{ts,html,scss,spec.ts}`

**Visual:** Sticky top bar, 65px height, frosted-glass background on scroll.

### Styles (navbar.component.scss)
```scss
:host {
  display: block;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 65px;
  display: flex;
  align-items: center;
  background: oklch(98.6% 0.005 80 / 0.72);
  backdrop-filter: saturate(1.8) blur(18px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;

  &.scrolled {
    border-bottom-color: var(--line-2);
  }
}

.nav__inner {
  max-width: var(--max);
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--pad);
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;

  svg { width: 28px; height: 28px; }
}

.nav__links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;

  a {
    padding: 6px 12px;
    font-size: 14px;
    color: var(--ink-2);
    text-decoration: none;
    border-radius: var(--radius-sm);
    transition: color 0.15s, background 0.15s;

    &:hover { color: var(--ink); background: var(--surface-2); }
  }
}

.nav__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### Template (navbar.component.html)
```html
<nav class="nav" [class.scrolled]="scrolled()" aria-label="Hauptnavigation">
  <div class="nav__inner">
    <a routerLink="/" class="nav__logo" aria-label="Lebenslauf-Agent Startseite">
      <!-- Blue document icon SVG — same as standalone HTML -->
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="oklch(58% 0.20 255)"/>
        <rect x="7" y="7" width="9" height="2" rx="1" fill="white"/>
        <rect x="7" y="11" width="14" height="2" rx="1" fill="white" opacity=".7"/>
        <rect x="7" y="15" width="11" height="2" rx="1" fill="white" opacity=".5"/>
        <rect x="7" y="19" width="8" height="2" rx="1" fill="white" opacity=".3"/>
      </svg>
      Lebenslauf-Agent
    </a>

    <nav class="nav__links" aria-label="Seitennavigation">
      <a routerLink="/" fragment="features">Features</a>
      <a routerLink="/" fragment="workflow">So funktioniert's</a>
      <a routerLink="/" fragment="beispiel">Beispiel</a>
      <a routerLink="/preise">Preise</a>
    </nav>

    <div class="nav__actions">
      <a routerLink="/login" class="btn btn-ghost">Anmelden</a>
      <a routerLink="/register" class="btn btn-primary">Kostenlos starten →</a>
    </div>
  </div>
</nav>
```

### TypeScript (navbar.component.ts)
```typescript
@Component({
  selector: 'lba-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  protected readonly scrolled = signal(false);
  private listener = () => this.scrolled.set(window.scrollY > 10);

  ngOnInit() { window.addEventListener('scroll', this.listener, { passive: true }); }
  ngOnDestroy() { window.removeEventListener('scroll', this.listener); }
}
```

**Test:** renders logo link, 4 nav links, 2 action buttons; `scrolled` signal becomes true when scrollY > 10.

---

## Shared Component: `lba-footer`

**File:** `frontend/src/app/shared/components/footer.component.{ts,html,scss,spec.ts}`

**Visual:** Light warm background, logo + tagline left, 3 link columns right, copyright bar bottom.

### Template structure
```html
<footer class="footer" aria-label="Seitenfuß">
  <div class="footer__inner">
    <div class="footer__brand">
      <!-- same logo SVG as navbar -->
      <span class="footer__name">Lebenslauf-Agent</span>
      <p class="footer__tagline">KI-gestützte Bewerbungen für Studenten, Junior-Devs und Berufseinsteiger. Made in Berlin.</p>
    </div>

    <nav class="footer__cols" aria-label="Footer-Navigation">
      <div class="footer__col">
        <h3 class="footer__col-heading">PRODUKT</h3>
        <a routerLink="/" fragment="features">Features</a>
        <a routerLink="/" fragment="workflow">So funktioniert's</a>
        <a routerLink="/preise">Preise</a>
        <a href="#">Changelog</a>
      </div>
      <div class="footer__col">
        <h3 class="footer__col-heading">RESSOURCEN</h3>
        <a href="#">Bewerbungs-Guide</a>
        <a href="#">Vorlagen</a>
        <a href="#">Hilfe-Center</a>
      </div>
      <div class="footer__col">
        <h3 class="footer__col-heading">RECHTLICHES</h3>
        <a routerLink="/datenschutz">Datenschutz</a>
        <a routerLink="/agb">AGB</a>
        <a routerLink="/impressum">Impressum</a>
      </div>
    </nav>
  </div>

  <div class="footer__bar">
    <span>© 2026 Lebenslauf-Agent GmbH</span>
    <span>v 0.4.2 · Beta</span>
  </div>
</footer>
```

**Test:** renders all 3 column headings, 10 links, copyright text.

---

## Button Component Update

**File:** `frontend/src/app/shared/components/button.component.ts`

Update `ButtonVariant` to match standalone HTML button classes:

```typescript
export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'accent';
export type ButtonSize    = 'sm' | 'md' | 'lg';
```

### Button SCSS (button.component.scss)

```scss
:host { display: inline-block; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;

  /* Sizes */
  &--sm  { padding: 7px 12px;  font-size: 13px; border-radius: var(--radius-sm); }
  &--md  { padding: 10px 16px; font-size: 14px; border-radius: 10px; }
  &--lg  { padding: 13px 20px; font-size: 15px; border-radius: 12px; }

  /* Variants */
  &--primary {
    background: var(--ink);
    color: var(--bg);
    &:hover { background: oklch(28% 0.015 270); }
  }
  &--ghost {
    background: transparent;
    color: var(--ink-2);
    &:hover { background: var(--surface-2); color: var(--ink); }
  }
  &--outline {
    background: var(--surface);
    color: var(--ink);
    border-color: var(--line);
    &:hover { background: var(--surface-2); }
  }
  &--accent {
    background: var(--accent);
    color: var(--accent-ink);
    &:hover { background: var(--accent-2); }
  }

  &:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}
```

**CSS class naming:** The button component SCSS uses BEM double-dash modifiers internally (`.btn--primary`, `.btn--ghost`, etc.) on the host element. In landing page section templates, static links are rendered as plain `<a>` elements with a `btn` utility class applied directly via the component's host class — import `ButtonComponent` and use `<a lba-button variant="primary" size="lg" routerLink="/try">…</a>` pattern, OR apply a lightweight global `.btn` utility class from styles.css for static links. **Decision: use the `lba-button` component for all CTAs, even static links, by passing `[routerLink]` as a host attribute or wrapping in a `<a>` with matching styles.** This avoids a parallel global `.btn` CSS class that diverges from the component. The `lba-button` selector should be updated to also match `a[lba-button]` so anchor elements can use it directly.

---

## Section: Hero (`lba-hero`)

**File:** `features/landing/sections/hero.component.{ts,html,scss,spec.ts}`

**Visual reference:** Screenshot `landing-hero.png` — full-bleed warm background, large headline, 2 CTAs, social proof row, 3-panel app dashboard mockup.

### Key measurements (from computed styles)
- `h1`: 72px, weight 500, letter-spacing -2.52px, line-height 1.02 (very tight)
- Hero padding: 96px top, 120px bottom
- Eyebrow pill: 11px, padding 5px/10px, radius 999px, near-white bg

### Content (hardcoded, taken verbatim from standalone HTML)

**Eyebrow:** `KI-Bewerbungsagent · Beta` (with blue dot)

**Headline:** `Bewerbungen, die zur ` + `<em>Stelle</em>` + ` passen`
- `<em>` is styled italic + `color: var(--accent)` + `font-style: italic`

**Subline:** `Lade deinen Lebenslauf hoch, füge eine Stellenanzeige an — bekomme in Sekunden eine maßgeschneiderte Bewerbung mit passenden Keywords, poliertem Anschreiben und ATS-tauglichem Layout.`

**CTAs:**
- Primary: `Bewerbung optimieren →` → `routerLink="/try"`
- Ghost: `So funktioniert's` → `routerLink="/" fragment="workflow"`

**Social proof row:**
- 5 avatar circles (coloured dots: orange, green, blue, purple, teal)
- Text: `4.900 Bewerbungen eingereicht`
- Stars: `★★★★☆ 4.7 / 5`

**App preview mockup** (pure HTML/CSS, no live data):
3-panel layout inside a rounded card with `--shadow-lg`:
- Left panel: sidebar navigation with items: Master-CV (checked), Anschreiben (unchecked)
- Centre panel: CV document skeleton (grey placeholder lines + "ERFAHRUNG" + "SKILLS" labels) + highlighted text `Stripe Checkout Integrationen`
- Right panel: skill bars (TypeScript 95%, Stripe API 88%, Design Systems 72%, Accessibility 64%) + a suggestion card "Vorschlag: Erwähne deine Erfahrung mit WCAG 2.2. Stripe nennt Accessibility explizit in der Anzeige." + buttons "Übernehmen" / "Verwerfen"

### Scroll reveal
Apply `[lbaReveal]` to: eyebrow (delay 0), h1 (delay 100), subline (delay 150), CTA row (delay 200), social proof row (delay 250), app mockup (delay 300).

---

## Section: Logo Bar (`lba-logo-bar`)

**File:** `features/landing/sections/logo-bar.component.{ts,html,scss,spec.ts}`

**Visual:** Centered row, muted label left, 6 company name+icon combinations.

### Content
Label: `Erfolgreich beworben bei`

Companies (name + geometric icon, all rendered as inline SVG or CSS shape + text):
1. ◆ Northwind
2. ● Helix
3. ▲ Atrium
4. ◇ Lumen
5. • Forge & Co
6. ● Kestrel

**Styling:** `color: var(--ink-3)`, font-size 14px, letter-spacing slight, no actual logos — just symbol + text in muted colour.

**Layout:** `display: flex; align-items: center; gap: 40px; padding: 32px var(--pad); border-top: 1px solid var(--line-2); border-bottom: 1px solid var(--line-2);`

---

## Section: Features Grid (`lba-features-grid`)

**File:** `features/landing/sections/features-grid.component.{ts,html,scss,spec.ts}`

**Visual:** "FEATURES" eyebrow pill + large heading + 2×2 grid of large feature cards.

### Section heading
- Eyebrow pill: `● FEATURES`
- Heading: `Alles, was eine moderne Bewerbung heute braucht.`

### 4 Feature cards (2×2 grid)

Each card: icon box (light bg, icon inside) + title + description + inline UI mockup.

**Card 1 — CV-Analyse in Sekunden**
- Icon: 🔍 (magnifying glass, outlined style in light blue box)
- Description: `Wir lesen deinen Lebenslauf, gleichen ihn mit der Stelle ab und zeigen dir Lücken, irrelevante Abschnitte und ungenutzte Stärken.`
- Mockup: 2-column table "AUS DEINEM CV" vs "STELLE VERLANGT" with coloured keyword pills (React·2 Jahre green, TypeScript orange, Java SE 7 orange, Praktikum '22 grey vs React green, TypeScript green, a11y green, Tests orange)

**Card 2 — Anschreiben-Generator**
- Icon: ✏️ (pen outline in light yellow box)
- Description: `In deinem Tonfall, mit echten Belegen aus deinem CV. Drei Varianten: knapp, herzlich, formal — du wählst.`
- Mockup: placeholder text lines representing generated letter + attribution line `schreibt: "...begeistert mich besonders an Stripe"`

**Card 3 — ATS-Keyword-Optimierung**
- Icon: 🎯 (target/crosshair in light green box)
- Description: `Bestehst du den automatischen Filter? Wir scannen die Anzeige nach Pflichtbegriffen und schlagen vor, welche du sinnvoll einbauen kannst.`
- Mockup: keyword pills row: `+ React` `+ TypeScript` `+ Next.js` (blue/added) · `Tailwind` `Vite` `Tests` (grey/existing) · `a11y` `+ GraphQL` (mixed)

**Card 4 — Sauberer PDF-Export**
- Icon: 📄 (document in light purple box)
- Description: `Pixelgenau, ATS-freundlich, in deinem Layout. Inklusive separatem Anschreiben und mehreren Sprachversionen.`
- Mockup: file row — PDF icon + `Lebenslauf_Stripe.pdf` + `→ 2 Seiten · 184 KB` + `ATS getestet ✓`

### Card styles
```scss
.feature-card {
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-lg);
  padding: 28px;
}
.feature-icon-box {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
```

Apply `[lbaReveal]` to each card with staggered delays (0, 100, 200, 300ms).

---

## Section: Workflow Steps (`lba-workflow-steps`)

**File:** `features/landing/sections/workflow-steps.component.{ts,html,scss,spec.ts}`

**Visual:** "WORKFLOW" eyebrow + centered heading + 3-column step cards.

### Section heading
- Eyebrow: `● WORKFLOW`
- Heading: `Drei Schritte zur passenden Bewerbung.`
- Subline: `Im Schnitt 90 Sekunden. Ohne Account ausprobieren.`

### 3 Step cards

Each card has: dark step badge + timestamp range + title + description + inline UI mockup.

**Step 1 — CV hochladen**
- Badge: `1` (dark rounded square) · Timestamp: `00:00 – 00:10`
- Title: `CV hochladen`
- Description: `PDF, DOCX oder LinkedIn-Export. Wir extrahieren Erfahrung, Skills und Projekte automatisch.`
- Mockup: dashed upload dropzone box with upload arrow icon + filename `lebenslauf_lina.pdf hierhin ziehen`

**Step 2 — Stellenanzeige einfügen**
- Badge: `2` · Timestamp: `00:10 – 00:30`
- Title: `Stellenanzeige einfügen`
- Description: `Link, Screenshot oder Text. Wir erkennen Anforderungen, Tonfall und Pflicht-Keywords.`
- Mockup: rounded text box with monospace job posting text `Frontend Developer (m/w/d) · Stripe Du arbeitest mit React, TypeScript und unserem Design-System. Wir legen Wert auf Accessibility…`

**Step 3 — Optimierte Bewerbung erhalten**
- Badge: `3` · Timestamp: `00:30 – 01:30`
- Title: `Optimierte Bewerbung erhalten`
- Description: `Lebenslauf, Anschreiben und Match-Report — als PDF, editierbar im Browser.`
- Mockup: 3-row file list: `PDF Lebenslauf_Stripe.pdf 184 KB` · `PDF Anschreiben_Stripe.pdf 96 KB` · `MD Match-Report.md 8 KB`

---

## Section: Before / After (`lba-before-after`)

**File:** `features/landing/sections/before-after.component.{ts,html,scss,spec.ts}`

**Visual:** "ECHTES BEISPIEL" eyebrow + heading + 2-column side-by-side comparison + stats row.

### Section heading
- Eyebrow: `● ECHTES BEISPIEL`
- Heading line 1: `Vorher: generisch.`
- Heading line 2: `Nachher: auf den Punkt.`
- Subline: `Gleicher Bewerber, gleiche Stelle — nur einmal mit, einmal ohne uns.`

### Left card — "Vorher"
- Header: `Vorher` (left) · `ORIGINAL-CV` (right, muted mono text)
- Name: `Lina Hartmann`
- Role: `Frontend Developer · Berlin`
- Body text (with `text-decoration: line-through` and muted colour):
  - `Engagiert, motiviert und teamfähig mit Leidenschaft für Web-Technologien aller Art.`
  - `Diverse Projekte mit JavaScript-Frameworks, gute Kenntnisse in Frontend-Entwicklung.`
  - `Abgeschlossenes Praktikum bei einer Werbeagentur, wo ich an Webseiten mitgewirkt habe.`

### Right card — "Nachher"
- Header: `Nachher` (left) · `+ LEBENSLAUF-AGENT` (right, accent colour, mono text)
- Card has `border-color: var(--accent)` accent border + slight warm tint background
- Name: `Lina Hartmann`
- Role: `Frontend Developer · React, TypeScript · Berlin`
- Body text with highlighted keyword spans (blue/accent bg):
  - `Junior Frontend Developer mit [2 Jahren Praxis in React und TypeScript]. Fokus auf [design-systeme] und [Accessibility (WCAG 2.2)].`
  - `Bei Mediahaus GmbH Migration einer Marketing-Site auf [Next.js 14] begleitet — Lighthouse-Score von 62 → 96.`
  - `Open-Source-Beiträge zu [stripe-js], Pull Requests in TypeScript.`

### Stats row (below both cards)

| Vorher | | Nachher |
|---|---|---|
| `41%` ATS-SCORE | → | `92%` ATS-SCORE |
| `3 / 12` KEYWORDS | → | `11 / 12` KEYWORDS |
| `2,1%` ANTWORTRATE | → | `18,4%` ANTWORTRATE |

Colour: Vorher stats in `var(--bad)` (red), Nachher stats in `var(--good)` (green).

---

## Section: Testimonials (`lba-testimonials`)

**File:** `features/landing/sections/testimonials.component.{ts,html,scss,spec.ts}`

**Visual:** "STIMMEN" eyebrow + centered heading + 3-column testimonial cards.

### Section heading
- Eyebrow: `● STIMMEN`
- Heading: `Was Studenten und Junior-Devs sagen.`

### 3 Testimonial cards

Each: opening quote mark (large, accent colour) + quote text + avatar row (coloured circle + name + role + city).

**Card 1:**
- Quote: `Drei Wochen, sieben Bewerbungen, vier Interviews. Vorher: ein Jahr, null.`
- Avatar colour: orange (`oklch(64% 0.14 60)`)
- Name: `Marek S.` · Role: `Junior Backend · Berlin`

**Card 2:**
- Quote: `Endlich bekomme ich Anschreiben hin, die nicht klingen wie aus einem Vorlagen-Generator.`
- Avatar colour: green (`oklch(64% 0.14 155)`)
- Name: `Anita K.` · Role: `Werkstudentin UX · München`

**Card 3:**
- Quote: `Der Match-Score hat mir gezeigt, dass ich mich auf die falschen Stellen bewerbe. Game changer.`
- Avatar colour: blue (`oklch(58% 0.20 255)`)
- Name: `Tobias R.` · Role: `Berufseinsteiger · Köln`

### Card styles
```scss
.testimonial-card {
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-lg);
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.testimonial-quote {
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);
  flex: 1;
}
.testimonial-quote::before { content: '"'; color: var(--accent); font-size: 20px; }
```

---

## Section: CTA Band (`lba-cta-band`)

**File:** `features/landing/sections/cta-band.component.{ts,html,scss,spec.ts}`

**Visual:** Full-width dark near-black section (rounded corners), white text, 2 CTAs, trust badge row.

### Styles
```scss
:host { display: block; padding: 0 var(--pad); margin-bottom: 80px; }

.cta-band {
  background: var(--ink);            /* near-black */
  border-radius: var(--radius-xl);
  padding: 80px var(--pad);
  text-align: center;
  color: var(--bg);
}
.cta-band__title {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 500;
  letter-spacing: -1.5px;
  line-height: 1.1;
  margin-bottom: 16px;
}
.cta-band__sub {
  font-size: 16px;
  opacity: 0.65;
  max-width: 480px;
  margin: 0 auto 40px;
}
.cta-band__trust {
  margin-top: 28px;
  font-size: 12px;
  opacity: 0.5;
  font-family: var(--font-mono);
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}
```

### Content
- Heading: `Deine nächste Bewerbung — in 90 Sekunden.`
- Subline: `Probier es mit einer echten Stelle aus deiner Liste. Wenn der Match-Score unter 80% bleibt, bezahlst du nichts.`
- Button 1 (outline on dark bg, white border): `Bewerbung jetzt optimieren →` → `routerLink="/try"`
- Button 2 (ghost on dark bg): `Demo ansehen` → `routerLink="/try"`
- Trust badges: `• Keine Kreditkarte` · `• DSGVO-konform · Server in EU` · `• Daten nach 30 Tagen gelöscht`

---

## Landing Component (`lba-landing`)

**File:** `features/landing/landing.component.{ts,html,scss,spec.ts}`

Replaces the current 3-line placeholder. Composes all sections in order.

### Template
```html
<lba-navbar />

<main id="main">
  <lba-hero />
  <lba-logo-bar />

  <section id="features" aria-labelledby="features-heading">
    <lba-features-grid />
  </section>

  <section id="workflow" aria-labelledby="workflow-heading">
    <lba-workflow-steps />
  </section>

  <section id="beispiel" aria-labelledby="beispiel-heading">
    <lba-before-after />
  </section>

  <lba-testimonials />
  <lba-pricing-inline />   <!-- see note below -->
  <lba-cta-band />
</main>

<lba-footer />
```

**Pricing inline note:** The standalone HTML has a full pricing section on the landing page (same content as `/preise`). Create a simple `lba-pricing-inline` component inside `features/landing/sections/` that renders the 2-card pricing layout inline. It does NOT reuse the `PricingComponent` route — it's a self-contained static block.

### TypeScript
```typescript
@Component({
  selector: 'lba-landing',
  standalone: true,
  imports: [
    NavbarComponent, FooterComponent,
    HeroComponent, LogoBarComponent, FeaturesGridComponent,
    WorkflowStepsComponent, BeforeAfterComponent,
    TestimonialsComponent, PricingInlineComponent, CtaBandComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {}
```

### Section IDs for anchor navigation
The navbar links `fragment="features"`, `fragment="workflow"`, `fragment="beispiel"` must match the `id` attributes on the `<section>` wrappers in `landing.component.html`.

---

## Section: Pricing Inline (`lba-pricing-inline`)

**File:** `features/landing/sections/pricing-inline.component.{ts,html,scss,spec.ts}`

### Section heading
- Eyebrow: `● PREISE`
- Heading: `Fair. Transparent. Pro Bewerbung.`
- Subline: `Erst zahlen, wenn die Bewerbung fertig ist. Kein Abo-Zwang.`

### 2 Pricing cards

**Card 1 — Einzelbewerbung**
- Price: `4,90 €` / Bewerbung
- Description: `Für die eine wichtige Stelle. Ohne Account, ohne Abo.`
- Features (checkmark list):
  - 1 maßgeschneiderter Lebenslauf
  - 1 Anschreiben in deinem Tonfall
  - ATS-Match-Report inkl. Keywords
  - PDF-Export, druckfertig
- CTA: `Eine Bewerbung optimieren` (outline variant) → `routerLink="/try"`

**Card 2 — Pro** *(EMPFOHLEN badge)*
- Card has `border: 2px solid var(--accent)` + slight warm tint background
- Badge: `EMPFOHLEN` (accent bg, white text, rounded-full, absolute top-right)
- Price: `14 €` / Monat
- Description: `Für aktive Bewerbungsphasen. Monatlich kündbar.`
- Features (checkmark list):
  - Unbegrenzt Bewerbungen pro Monat
  - Anschreiben in 3 Tonfall-Varianten
  - Mehrere Master-CVs & Sprachversionen
  - LinkedIn-Profil-Optimierung
  - Versand-Tracking & Follow-up-Vorlagen
- CTA: `7 Tage gratis testen →` (accent variant) → `routerLink="/register"`

---

## Routing / Navigation

No new routes needed. All CTAs use existing routes:

| CTA | Route |
|---|---|
| Kostenlos starten (nav) | `/register` |
| Anmelden (nav) | `/login` |
| Bewerbung optimieren (hero) | `/try` |
| So funktioniert's (hero ghost) | `/ #workflow` (fragment scroll) |
| Features (nav) | `/ #features` |
| Preise (nav) | `/preise` |
| Eine Bewerbung optimieren (pricing card 1) | `/try` |
| 7 Tage gratis testen (pricing card 2) | `/register` |
| Bewerbung jetzt optimieren (CTA band) | `/try` |
| Datenschutz / AGB / Impressum (footer) | `/datenschutz` `/agb` `/impressum` |

Fragment scrolling (`routerLink="/" [fragment]="'features'"`) relies on `scrollBehavior: smooth` already set in styles.css.

---

## Accessibility Requirements (WCAG 2.2 AAA)

- `<main id="main">` for skip-link target (skip-link already in styles.css)
- All `<section>` elements have `aria-labelledby` pointing to their visible heading
- All icon-only elements have `aria-hidden="true"`
- Keyword highlight spans in Before/After section: `aria-label` on the wrapper describing the improvement
- Nav: `aria-label="Hauptnavigation"`, footer nav: `aria-label="Footer-Navigation"`
- CTA band dark section: ensure text contrast passes AAA (white on near-black — passes trivially)
- All `<a>` used as buttons have `role="button"` if they have no `href` / `routerLink` destination

---

## Testing Scope

**`lba-navbar`:** renders all 4 nav links; `scrolled` signal sets `.scrolled` class; login/register links have correct `routerLink`.

**`lba-footer`:** renders 3 column headings; all 10 links present; legal links have correct routerLinks.

**`lba-hero`:** renders h1 text; both CTA links present with correct routerLink; social proof text present.

**`lba-features-grid`:** all 4 card titles rendered; all 4 descriptions rendered.

**`lba-workflow-steps`:** all 3 step titles rendered; step badges 1/2/3 present.

**`lba-before-after`:** "Vorher" and "Nachher" headers present; stats 41%/92% rendered.

**`lba-testimonials`:** all 3 quote texts rendered; all 3 author names rendered.

**`lba-pricing-inline`:** "4,90 €" and "14 €" prices rendered; EMPFOHLEN badge present; CTA routerLinks correct.

**`lba-cta-band`:** heading text rendered; trust badge text present; CTA routerLink="/try".

**`lba-landing`:** all section sub-components rendered (test by checking their host elements).

---

## What Is NOT in Scope

- Mobile / responsive breakpoints (handled in a follow-up task)
- Dark mode (V1 scope lock)
- Animated typing cursor in hero (the `blink` CSS keyframe in standalone HTML — skip for now)
- Real company logos in logo bar (text + symbol placeholders are sufficient)
- Live match-score data in hero mockup (static HTML/CSS mockup only)
- Any backend API calls (this is a fully static page)
