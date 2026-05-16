# Per-Page Restyle (Phase 2) — Design Spec

**Status:** Approved  
**Date:** 2026-05-16  
**Author:** Dennis (via brainstorming session)  
**Depends on:** Design System Phase 1 spec (`2026-05-16-design-system-phase1-design.md`)

---

## Problem

Three app pages — Dashboard, Lebensläufe, LinkedIn — each have custom header markup, inconsistent button tiers, and list structures that don't match the Phase 1 card system. The Dashboard uses a `<table>` for the application list. LinkedIn has no pro gate for free users.

---

## Scope

Apply the Phase 1 design tokens and components (`.page-header`, `.card-elevated`, `.card-list`, `.card-row`, `.card-meta`, `.card-sub`, `.card-actions`, `.status--*`, `.empty-state`, `btn--cta/primary/outline/ghost`) to three pages. No new backend changes. No new shared components. No changes to `PipelineBoardComponent`, `CvTemplatePicker`, `ConfirmDeleteModal`, or `EditorModal`.

---

## Agreed Design

### 1. Dashboard (`features/dashboard/`)

#### Page header
Replace the custom `.dashboard__header` with the standard `.page-header` pattern:

```html
<div class="page-header">
  <div class="page-header__text">
    <h1 class="page-title">Bewerbungen</h1>
    <p class="page-sub">Deine optimierten Bewerbungen im Überblick</p>
  </div>
  <div class="page-header__actions">
    <a routerLink="/app/wizard" class="btn btn--cta btn--md">Neue Bewerbung</a>
  </div>
</div>
```

Remove `.dashboard__eyebrow` and the `<p>Übersicht</p>` line entirely.

#### Stat cards
Three `.card-elevated` tiles in a 3-column grid:

```html
<div class="stat-grid">
  <article class="card-elevated stat-card" aria-label="Lebensläufe">
    <span class="stat-card__value">{{ data()!.cvCount }}</span>
    <span class="stat-card__label">Lebensläufe</span>
  </article>
  <!-- repeat for Bewerbungen and Ø Match-Score -->
</div>
```

```css
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}
.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  display: block;
}
.stat-card__label {
  font-size: 13px;
  color: var(--ink-3);
  margin-top: var(--space-2);
  display: block;
}
```

Skeleton stat cards: replace custom `.stat-card--skeleton` with `card-elevated` + skeleton shimmer class.

#### Application list (list view)
Replace `<table class="app-table">` with `.card-list`:

```html
<div class="card-list">
  @for (app of data()!.recentApplications; track app.id) {
    <div class="card-elevated">
      <div class="card-row">
        <div class="card-meta">
          <p class="card-title">{{ jobTitle(app) }} @ {{ companyName(app) }}</p>
          <p class="card-sub">
            {{ app.createdAt | date:'dd. MMM' }} ·
            @if (app.matchScore !== null) {
              <strong>{{ app.matchScore }}%</strong> ·
            }
            <span [class]="'status--' + statusKey(app.status)">{{ statusLabel(app.status) }}</span>
          </p>
        </div>
        <div class="card-actions">
          <button type="button" class="btn btn--outline btn--sm"
            (click)="selectedAppId.set(app.id)"
            [attr.aria-label]="'Öffnen: ' + jobTitle(app)">Öffnen</button>
          <button type="button" class="btn btn--ghost btn--sm app-delete-btn"
            (click)="requestDelete(app.id)"
            [attr.aria-label]="'Löschen: ' + jobTitle(app)">Löschen</button>
        </div>
      </div>
    </div>
  }
</div>
```

Add `statusKey()` helper in `dashboard.component.ts`:
```typescript
protected statusKey(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'open', DONE: 'done', IN_PROGRESS: 'active', REJECTED: 'rejected',
  };
  return map[status] ?? 'open';
}
```

The `.app-delete-btn` adds danger color:
```css
.app-delete-btn { color: var(--danger); }
.app-delete-btn:hover { background: color-mix(in oklch, var(--danger) 10%, transparent); }
```

Remove `.app-table`, `.app-table-wrap`, `.app-table__actions`, `.score` CSS classes.

#### View toggle
Button stays `btn--ghost btn--sm`. No change to logic.

#### Onboarding steps
Change step CTA buttons from `btn--secondary` → `btn--outline`:
```html
<a routerLink="/app/cvs" class="btn btn--outline btn--sm">Lebenslauf hinzufügen</a>
<a routerLink="/app/wizard" class="btn btn--outline btn--sm">Bewerbung erstellen</a>
```

#### Empty state
Replace custom `.empty-state` section with global pattern:
```html
<div class="empty-state">
  <p class="empty-state__text">Noch keine Bewerbungen vorhanden.</p>
  <a routerLink="/app/wizard" class="btn btn--cta btn--md">Erste Bewerbung erstellen</a>
</div>
```

---

### 2. CVs page (`features/master-cvs/`)

#### Page header
Replace `.master-cvs__header` with `.page-header`:

```html
<div class="page-header">
  <div class="page-header__text">
    <h1 class="page-title">Lebensläufe</h1>
    <p class="page-sub">Deine gespeicherten Lebensläufe</p>
  </div>
  <div class="page-header__actions">
    <label class="btn btn--cta btn--md" for="cv-upload"
      tabindex="0"
      [class.btn--loading]="uploading()"
      [attr.aria-disabled]="uploading()">
      @if (uploading()) { Wird hochgeladen… } @else { Lebenslauf hochladen }
      <input id="cv-upload" type="file" accept=".pdf,.docx" class="sr-only"
        [disabled]="uploading()" (change)="upload($event)"
        aria-label="Lebenslauf-Datei auswählen (PDF oder DOCX)" />
    </label>
    <button type="button" class="btn btn--outline btn--md"
      aria-controls="text-cv-panel"
      [attr.aria-expanded]="textFormOpen()"
      (click)="toggleTextForm()">
      @if (textFormOpen()) { Schließen } @else { Lebenslauf einfügen }
    </button>
  </div>
</div>
```

#### Text-insert panel
Wrap in `.card-elevated` with `margin-bottom: var(--space-6)`. Update buttons:
- Cancel: stays `btn--ghost btn--md`
- Submit: `btn--primary btn--md` → `btn--outline btn--md`

#### CV list
Replace `<ul class="cv-list">` with `.card-list`. Each `<li class="cv-card">` becomes `.card-elevated`:

```html
<div class="card-list">
  @for (cv of cvs(); track cv.id) {
    <div class="card-elevated">
      <div class="card-row">
        <div class="card-meta">
          @if (renamingId() === cv.id) {
            <input #renameInput class="cv-rename-input" type="text"
              [value]="renameValue()"
              (input)="renameValue.set(renameInput.value)"
              (blur)="saveRename(cv)"
              (keydown.enter)="saveRename(cv)"
              (keydown.escape)="renamingId.set(null)"
              [attr.aria-label]="'Neuer Name für ' + cv.name"
              autofocus />
          } @else {
            <p class="card-title">{{ cv.name }}</p>
          }
          <p class="card-sub">{{ sourceLabel(cv) }} · {{ cv.language.toUpperCase() }} · Aktualisiert {{ cv.updatedAt | date:'dd.MM.yyyy' }}</p>
          <lba-cv-template-picker
            [template]="cv.template"
            (templateChange)="updateTemplate(cv.id, $event)"
          />
        </div>
        <div class="card-actions">
          <button type="button" class="btn btn--outline btn--sm"
            [attr.aria-label]="'In Bewerbung verwenden: ' + cv.name"
            (click)="useInWizard(cv.id)">In Bewerbung verwenden</button>
          <button type="button" class="btn btn--ghost btn--sm"
            [attr.aria-label]="'Umbenennen: ' + cv.name"
            (click)="startRename(cv)">Umbenennen</button>
          <button type="button" class="btn btn--ghost btn--sm cv-delete-btn"
            [attr.aria-label]="'Löschen: ' + cv.name"
            (click)="requestDelete(cv.id)">Löschen</button>
        </div>
      </div>
    </div>
  }
</div>
```

```css
.cv-rename-input {
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  width: 100%;
  max-width: 280px;
  outline: none;
}
.cv-delete-btn { color: var(--danger); }
.cv-delete-btn:hover { background: color-mix(in oklch, var(--danger) 10%, transparent); }
```

#### Empty state
Replace custom empty section:
```html
<div class="empty-state">
  <p class="empty-state__text">Noch kein Lebenslauf hinzugefügt.</p>
  <label class="btn btn--cta btn--md" for="cv-upload-empty" tabindex="0">
    Lebenslauf hochladen
    <input id="cv-upload-empty" type="file" accept=".pdf,.docx" class="sr-only"
      (change)="upload($event)" aria-label="Lebenslauf-Datei auswählen" />
  </label>
</div>
```

Remove old `.cv-list`, `.cv-card`, `.cv-card__info`, `.cv-card__actions`, `.cv-card__name`, `.cv-card__meta`, `.cv-card__date` CSS.

---

### 3. LinkedIn page (`features/linkedin/`)

#### Pro gate
`LinkedInComponent` injects `AuthService`. A new `readonly isPro = computed(() => { const p = this.auth.user()?.plan; return p === 'PRO' || p === 'pro'; })` computed signal controls visibility.

When `isPro()` is false, the form is hidden and replaced with:

```html
@if (!isPro()) {
  <div class="empty-state">
    <p class="empty-state__text">LinkedIn-Optimierung ist ein Pro-Feature.</p>
    <button type="button" class="btn btn--cta btn--md" (click)="openUpgrade()">
      Jetzt upgraden
    </button>
  </div>
} @else {
  <!-- form and results -->
}
```

`openUpgrade()` emits an `upgradeRequested` output — the `AppShellComponent` listens and opens `EinstellungenModal` on the Abrechnung tab.

**AppShell wiring:** add `(upgradeRequested)="einstellungenOpen.set(true)"` to the `<router-outlet>` parent. Because `RouterOutlet` doesn't support direct output binding, use a shared `UpgradeService` with a simple signal instead:

```typescript
// shared/services/upgrade.service.ts
@Injectable({ providedIn: 'root' })
export class UpgradeService {
  readonly requested = signal(false);
  request(): void { this.requested.set(true); }
  clear(): void { this.requested.set(false); }
}
```

`LinkedInComponent` calls `upgradeService.request()`. `AppShellComponent` uses `effect(() => { if (this.upgradeService.requested()) { this.einstellungenOpen.set(true); this.upgradeService.clear(); } }, { allowSignalWrites: true })`.

#### Page header
```html
<div class="page-header">
  <div class="page-header__text">
    <h1 class="page-title">LinkedIn-Optimierung</h1>
    <p class="page-sub">Optimiere dein Profil mit KI</p>
  </div>
</div>
```

#### Form (Pro users)
- Submit button: `btn--cta btn--md` (replaces bare `btn--primary`)
- All field markup unchanged

#### Result cards
Replace `.result-card` divs with `.card-elevated`:

```html
<div class="card-list linkedin-results">
  <div class="card-elevated">
    <div class="card-row" style="align-items: flex-start;">
      <p class="card-title">Headline</p>
      <button type="button" class="btn btn--ghost btn--sm"
        (click)="copyField(result()!.headline, 'headline')"
        aria-label="Headline kopieren">
        @if (copiedField() === 'headline') { Kopiert! } @else { Kopieren }
      </button>
    </div>
    <p class="linkedin-result-text">{{ result()!.headline }}</p>
  </div>
  <!-- About and Berufserfahrung follow same pattern -->
</div>
```

```css
.linkedin-result-text {
  font-size: 14px;
  color: var(--ink);
  line-height: 1.6;
  margin-top: var(--space-3);
  white-space: pre-wrap;
}
```

Remove old `.linkedin-page__title`, `.linkedin-page__desc`, `.linkedin-page__error`, `.linkedin-results`, `.linkedin-results__title`, `.result-card`, `.result-card__header`, `.result-card__label`, `.result-card__text`, `.experience-list`, `.experience-item` CSS — replace with global utilities.

---

## New shared service

| File | Purpose |
|---|---|
| `shared/services/upgrade.service.ts` | Signal-based bridge for LinkedIn → AppShell upgrade modal trigger |

## Modified components

| Component | Changes |
|---|---|
| `DashboardComponent` | `.page-header`, stat grid, card list, `statusKey()` helper, onboarding btn variants, empty state |
| `MasterCvsComponent` | `.page-header`, card list, text panel wrapped in card, btn variants, empty state |
| `LinkedInComponent` | Inject `AuthService` + `UpgradeService`, `isPro` computed, pro gate, `.page-header`, result cards |
| `AppShellComponent` | Inject `UpgradeService`, `effect()` to open modal on upgrade request |

## Unchanged

`PipelineBoardComponent`, `PipelineToolbarComponent`, `CvTemplatePicker`, `ConfirmDeleteModal`, `EditorModal`, all backend files.

---

## Verification

1. `cd frontend && npm run lint` — exit 0
2. `cd frontend && npm test -- --watchAll=false` — exit 0
3. `cd frontend && npm run build` — exit 0
4. Manual: free user navigating to `/app/linkedin` sees gate + upgrade button opens modal; Pro user sees form

---

## Out of scope

- Pipeline board restyle
- Wizard restyle
- Any backend changes
- Feedback/rating modal (Session 3)
- Landing page (Session 3)
