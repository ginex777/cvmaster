# Bewerbungseditor Redesign — Design Spec

**Status:** Approved  
**Date:** 2026-05-15  
**Author:** Dennis (via brainstorming session)

---

## Problem

The current Bewerbungseditor at `/app/applications/:id` has two critical UX issues:

1. **Cover letters unreadable** — all 3 variants (Formal / Freundlich / Knapp) are rendered side-by-side in a `repeat(3, 1fr)` grid inside an already-narrow third column. Each card is ~160px wide — too narrow to read prose.
2. **Not a modal** — opening an application causes a full page navigation, breaking flow from the dashboard/pipeline. There is no quick way to flip between applications.

Additionally the left sidebar is cramped with 6 unrelated sections stacked without visual breathing room, and the "Neu generieren" progress bar shows 100% immediately because `generationProgress` is never reset to 0 before the queue job starts.

---

## Agreed Design

### 1. Opening behaviour — Fullscreen Dialog

Clicking any application in the Dashboard or Pipeline Board opens a **fullscreen modal dialog** instead of navigating to a separate page.

- Size: `90vw × 90vh`, centered, with a dimmed backdrop (`rgba(0,0,0,0.6)`)
- Closed by: the ✕ button in the top-bar, pressing `Escape`, or clicking the backdrop
- The route `/app/applications/:id` remains as a direct-link fallback — it renders the modal within the shell so bookmarked links still work
- URL is updated to `/app/applications/:id` when the modal opens (via `pushState`) so the link stays shareable

### 2. Internal layout — Top bar + 2 columns

```
┌─────────────────────────────────────────────────────────────────┐
│  [Job Titel · Firma]   [◯88 ATS][12✓ 4 fehlen]  [Offen][Erledigt]  [CV][Brief][Beide]  [✕]  │
├─────────────────────────────────┬───────────────────────────────┤
│                                 │                               │
│   Optimierter Lebenslauf        │   Anschreiben                 │
│   (CvSectionEditor)             │   [Formal][Freundlich][Knapp] │
│                                 │   ┌─────────────────────────┐ │
│                                 │   │                         │ │
│                                 │   │   Textarea (tall)       │ │
│                                 │   │                         │ │
│                                 │   └─────────────────────────┘ │
│                                 │   Empfänger: [___] [Senden]   │
│                                 │             [In E-Mail öffnen]│
│   [Analyse anzeigen]            │                               │
│   [Nachfassen]                  │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

#### Top bar (always visible, compact height ~52px)
- **Left:** Job-Titel + Firma (from `jobPosting.parsedJson`) · eyebrow text "Bewerbungseditor"
- **Center:** ATS Score ring (small, 36px) + "12 Keywords gefunden · 4 fehlen"
- **Right group 1:** Status toggle — `[Offen]` `[Erledigt]` pill buttons, no icons
- **Right group 2:** Download buttons — `[CV]` `[Anschreiben]` `[Beide herunterladen]`, no icons
- **Far right:** `[✕]` close button

#### Left column — Lebenslauf (50% width)
- Header: "Optimierter Lebenslauf" + "Speichert…/Gespeichert" status
- Full-height `CvSectionEditor` (existing shared component, no changes)
- Bottom action strip (pinned):
  - `[Analyse anzeigen]` — toggles left panel between CV and Analyse view (uses existing `AtsPanel`)
  - `[Nachfassen]` — lazy-loads follow-up templates (existing behaviour, button text only)

#### Right column — Anschreiben (50% width)
- Header: "Anschreiben" + `[Neu generieren]` button (no icon)
- **Tab row:** `[Formal]` `[Freundlich]` `[Knapp]` — active tab underlined with accent colour, uses existing `selectedLetter` signal
- Single `<textarea>` at full width, `min-height: 28rem`, saves on blur
- Bottom strip:
  - Label "Empfänger" + email input + `[An mich senden]` + `[In E-Mail-Programm öffnen]`
  - All buttons text-only, no icons

### 3. Analyse view (left panel toggle)

Clicking `[Analyse anzeigen]` in the left panel's bottom strip replaces the CV section editor with the existing `AtsPanel` component. The button label switches to `[Lebenslauf anzeigen]`. No separate tab bar needed — simple signal toggle.

### 4. Loading / Generating states

Inside the modal:
- **Loading:** 3-column skeleton (existing `.skeleton--panel` animation), same as now
- **Generating:** Progress bar with real progress (see bug fix below), skeleton panels below
- **Failed:** Error card with `[Erneut versuchen]` button (text only)

### 5. Bug fix — "Neu generieren" progress bar starts at 100%

**Root cause:** `ApplicationsService.regenerateLetter()` enqueues the BullMQ job without resetting `generationProgress` to `0` in the DB first. The frontend also doesn't reset the signal.

**Fix (both sides):**
- Backend: `applications.service.ts` — add `prisma.application.update({ data: { generationProgress: 0, generationError: null } })` before `queue.enqueueRegenerateLetter(id)`
- Frontend: `editor.component.ts` `confirmRegen()` — add `this.application.update(app => app ? { ...app, generationProgress: 0, generationError: null } : app)` before starting the poll

---

## Component Architecture

### New components

| Component | Location | Purpose |
|---|---|---|
| `ApplicationEditorModalComponent` | `features/application-editor/editor-modal/` | Dialog wrapper — handles open/close, backdrop, Escape key, URL sync |

### Modified components

| Component | Change |
|---|---|
| `EditorComponent` | Remove alias computed signals, restructure template to top-bar + 2-column layout |
| `DashboardComponent` | Replace `routerLink` with `(click)` that opens the modal |
| `PipelineBoardComponent` | Same — emit application ID, parent opens modal |
| `ApplicationsService` (backend) | Reset `generationProgress: 0` in `regenerateLetter()` |

### Unchanged (reused as-is)

- `CvSectionEditorComponent` — receives sections input, emits changes
- `AtsPanel` — receives score + matchReport + optimizationDiff
- `ConfirmDeleteModal` — regen confirmation
- `ApiService` — no changes

---

## Data flow

```
DashboardComponent
  └─ (click application row)
       └─ selectedApplicationId.set(id)
            └─ ApplicationEditorModalComponent [open]="true" [appId]="id"
                 └─ EditorComponent (unchanged API, new template)
```

The modal component manages:
- `open` input signal
- `close` output — parent resets `selectedApplicationId`
- History `pushState` on open, `replaceState` on close

---

## Styling

All styles use existing design tokens from `styles.css`. No new tokens needed.

- Modal backdrop: `background: rgba(0,0,0,0.6)`, `position: fixed; inset: 0; z-index: 1000`
- Modal panel: `width: 90vw; max-width: 1400px; height: 90vh; border-radius: var(--radius-lg); background: var(--bg); overflow: hidden; display: flex; flex-direction: column`
- Top bar: `height: 52px; border-bottom: 1px solid var(--line); background: var(--bg-2)`
- Body: `display: grid; grid-template-columns: 1fr 1fr; flex: 1; overflow: hidden`
- Each column scrollable independently: `overflow-y: auto`
- No button icons anywhere in the editor

---

## Accessibility

- Dialog uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to job title
- Focus trapped inside modal when open (FocusTrap or manual `tabindex` management)
- `Escape` closes the modal
- Backdrop click closes the modal
- All existing `aria-live`, `aria-busy`, `aria-selected` attributes preserved

---

## Out of scope (V1)

- Swipe gestures on mobile
- Keyboard shortcut to jump between applications
- Animation/transition on modal open (can add later)
- Drag-to-resize columns
