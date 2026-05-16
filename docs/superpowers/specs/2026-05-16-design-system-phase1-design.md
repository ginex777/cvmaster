# Design System Phase 1 — Spec

**Status:** Approved  
**Date:** 2026-05-16  
**Author:** Dennis (via brainstorming session)

---

## Problem

Visual inconsistency across the app:
- Buttons: 6 variants used inconsistently — no clear hierarchy, some invisible against background
- Cards: items separated only by hairlines, no breathing room, no clear item boundaries
- Status labels: "In Bearbeitung" pill wraps and breaks in constrained layouts
- Nav: top-bar with 5 links including pages that will become modals (Abrechnung, Sicherheit, LinkedIn)
- No consistent page header pattern — each page rolls its own title markup

---

## Scope

This spec covers **Phase 1: the design system foundation**. It defines the token extensions, component rules, and shell restructure that all subsequent page restyling sessions build on.

Pages restyled in later sessions (each gets its own spec):
- Phase 2: Dashboard + CVs page
- Phase 3: Billing modal + Security modal (consolidated into Einstellungen)
- Phase 4: LinkedIn page (pro gating)
- Phase 5: Landing page (AGB, FAQ modal, Hilfecenter, Bewerbungsguide)

---

## Agreed Design

### 1. Button System — 4-tier hierarchy

| Tier | Class | Use | Constraint |
|---|---|---|---|
| CTA | `.btn--cta` | Single highest-priority action per screen | Max 1 per page |
| Primary | `.btn--primary` | Main action within a section | Dark ink background |
| Outline | `.btn--outline` | Secondary/alternative action | Border, transparent bg |
| Ghost | `.btn--ghost` | Tertiary, nav, cancel | Transparent, no border |
| Danger | `.btn--danger` | Destructive actions | Red, unchanged |

**CTA style** (new, replaces `.btn--accent`):
```css
.btn--cta {
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: 0 4px 16px oklch(58% 0.20 255 / 0.35);
}
.btn--cta:hover {
  background: var(--accent-2);
  box-shadow: 0 6px 20px oklch(58% 0.20 255 / 0.45);
  transform: translateY(-1px);
}
```

**Outline style** (replaces `.btn--secondary`):
```css
.btn--outline {
  background: transparent;
  color: var(--ink);
  border-color: var(--line);
}
.btn--outline:hover {
  background: var(--surface-2);
}
```

`.btn--secondary` and `.btn--accent` are **deprecated** — renamed to `outline` and `cta` respectively. No new code may use them; existing usages are migrated in subsequent page sessions.

`ButtonVariant` type in `button.component.ts` updated to: `'cta' | 'primary' | 'outline' | 'ghost' | 'danger'`

---

### 2. Card & List System

One elevated card pattern used everywhere. New global CSS class:

```css
.card-elevated {
  background: var(--surface);
  border-radius: var(--radius-md);   /* 14px */
  box-shadow: var(--shadow-md);
  padding: var(--space-5) var(--space-6);   /* 20px 24px */
}
```

**Standard card row markup:**
```html
<div class="card-elevated">
  <div class="card-row">
    <div class="card-meta">
      <p class="card-title">Job Titel @ Firma</p>
      <p class="card-sub">Erstellt 12. Mai · ATS 91% · <span class="status--open">Offen</span></p>
    </div>
    <div class="card-actions">
      <button class="btn btn--outline btn--sm">Öffnen</button>
    </div>
  </div>
</div>
```

**CSS for card internals:**
```css
.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.card-meta { flex: 1; min-width: 0; }
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-sub { font-size: 12px; color: var(--ink-3); margin-top: 2px; }
.card-actions { flex-shrink: 0; display: flex; align-items: center; gap: var(--space-2); }
```

**Status inline in subtitle** — colored + bold, no pill badge:
```css
.status--open    { color: var(--good);    font-weight: 600; }
.status--active  { color: var(--warn);    font-weight: 600; }
.status--done    { color: var(--ink-2);   font-weight: 600; }
.status--rejected{ color: var(--danger);  font-weight: 600; }
```

**List container:**
```css
.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);   /* 16px */
}
```

**Empty state** (used when list is empty):
```html
<div class="empty-state">
  <p class="empty-state__text">Noch keine Einträge.</p>
  <button class="btn btn--cta btn--md">Jetzt erstellen</button>
</div>
```
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-8);
  text-align: center;
}
.empty-state__text { color: var(--ink-3); font-size: 15px; }
```

---

### 3. App Shell — Left Sidebar

`AppShellComponent` is rewritten from a top-bar layout to a 2-column grid with a persistent sidebar.

**Layout:**
```css
.shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}
.shell__sidebar {
  background: var(--surface);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-3);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.shell__content {
  background: var(--bg);
  overflow-y: auto;
  min-height: 100vh;
}
```

**Sidebar anatomy:**
```
Logo "Hireflow AI"          ← top, 700 weight, --space-4 bottom margin

Nav links (flex-col, gap 2px):
  ⊞  Dashboard              ← /app (exact)
  📄  Lebensläufe           ← /app/cvs
  🔗  LinkedIn              ← /app/linkedin + Pro badge for free users

Bottom (margin-top: auto):
  Plan badge + user name
  ⚙  Einstellungen          ← opens EinstellungenModal
  →  Abmelden               ← ghost button
```

**Sidebar link active style:**
```css
.shell__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
}
.shell__link:hover { background: var(--surface-2); color: var(--ink); }
.shell__link.is-active {
  background: oklch(93% 0.010 255);
  color: var(--accent);
}
```

**Pro badge on LinkedIn link** (visible to free users — clicking the link opens `EinstellungenModal` on the Abrechnung tab instead of navigating to `/app/linkedin`):
```html
<span class="plan-lock">Pro</span>
```
```css
.plan-lock {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: oklch(94% 0.012 60);
  color: oklch(48% 0.14 60);
}
```

**Removed from shell:** The old `.shell__nav` top bar, `shell__plan`, `shell__name` span, and all 5 top-bar `routerLink` anchors. Routes `/app/billing` and `/app/security` are kept as valid routes (direct-link fallback) but are no longer in the nav.

---

### 4. Einstellungen Modal (new)

Replaces the standalone `/app/billing` and `/app/security` pages. Opens from the sidebar "Einstellungen" button.

- Component: `EinstellungenModalComponent` at `shared/components/einstellungen-modal/`
- Two tabs: **Abrechnung** | **Sicherheit**
- Standard modal wrapper: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `Escape` closes, backdrop click closes
- Size: `600px × auto`, centered, `var(--shadow-lg)`, `var(--radius-lg)`
- Content of each tab: migrated from the existing `BillingComponent` and `SecurityComponent` (logic unchanged, just rendered inside the modal)

The existing `/app/billing` and `/app/security` routes remain but render a redirect to `/app` (the full pages are no longer maintained after migration).

---

### 5. Page Header Pattern

Every page component in `features/` uses this markup at the top of its template:

```html
<div class="page-header">
  <div class="page-header__text">
    <h1 class="page-title">Bewerbungen</h1>
    <p class="page-sub">Alle deine Bewerbungen im Überblick</p>  <!-- optional -->
  </div>
  <div class="page-header__actions">
    <button class="btn btn--cta btn--md">Neue Bewerbung</button>
  </div>
</div>
```

```css
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.3px;
  line-height: 1.2;
}
.page-sub { font-size: 14px; color: var(--ink-3); margin-top: var(--space-1); }
```

Applied per page:
| Page | Title | Subtitle | CTA |
|---|---|---|---|
| Dashboard | Bewerbungen | Alle deine Bewerbungen im Überblick | Neue Bewerbung |
| Lebensläufe | Lebensläufe | Deine gespeicherten Lebensläufe | Neuer Lebenslauf |
| LinkedIn | LinkedIn-Optimierung | Optimiere dein Profil mit KI | — (Pro gate) |

---

## Component Architecture

### New components

| Component | Location | Purpose |
|---|---|---|
| `EinstellungenModalComponent` | `shared/components/einstellungen-modal/` | Tabbed modal with Abrechnung + Sicherheit tabs |

### Modified components

| Component | Change |
|---|---|
| `AppShellComponent` | Rewrite from top-bar to sidebar layout |
| `ButtonComponent` | Update `ButtonVariant` type, deprecate `secondary`/`accent` |
| `styles.css` | Add `.btn--cta`, `.btn--outline`, `.card-elevated`, `.card-list`, `.card-row`, `.card-meta`, `.card-title`, `.card-sub`, `.card-actions`, `.status--*`, `.empty-state`, `.page-header`, `.page-title`, `.page-sub` |

### Unchanged

All existing page components (`DashboardComponent`, `MasterCvsComponent`, `BillingComponent`, `SecurityComponent`, `LinkedInComponent`) — their internals are not touched in this phase. Each gets its own restyle session.

---

## Verification

Run after implementing:
1. `cd frontend && npm run lint` — exit 0
2. `cd frontend && npm test -- --watchAll=false` — exit 0
3. `cd frontend && npm run build` — exit 0
4. Manual: sidebar renders, active link highlights, Einstellungen modal opens and both tabs work, LinkedIn Pro badge visible for free users

---

## Out of Scope (later sessions)

- Per-page content restyle (Dashboard, CVs, Billing, Security, LinkedIn)
- Landing page changes (AGB, FAQ modal, Hilfecenter, Bewerbungsguide, Changelog)
- Feedback/rating modal after completing Bewerbungen
- Dark mode
- Mobile/responsive layout
