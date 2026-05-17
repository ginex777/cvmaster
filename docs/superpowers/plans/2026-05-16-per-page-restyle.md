# Per-Page Restyle (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Phase 1 design system to Dashboard, Lebensläufe, and LinkedIn pages — replacing custom headers with `.page-header`, tables with `.card-list`, and adding a LinkedIn pro gate via a shared `UpgradeService`.

**Architecture:** A new `UpgradeService` (signal-based singleton) bridges the LinkedIn pro gate to the `AppShellComponent` without crossing the router-outlet boundary. Each page gets its custom header/list markup replaced with Phase 1 utility classes. No backend changes. `PipelineBoardComponent`, `CvTemplatePicker`, `ConfirmDeleteModal`, and `EditorModal` are untouched.

**Tech Stack:** Angular 21 (signals, standalone, OnPush, computed, effect), Phase 1 CSS utilities in `styles.css`, Jest via jest-preset-angular.

> **Prerequisite:** Phase 1 plan (`2026-05-16-design-system-phase1.md`) must be fully implemented before starting this plan. This plan assumes `AppShellComponent` already has the sidebar layout and `einstellungenOpen` signal.

---

## Files to create / modify

| Action | File | What changes |
|---|---|---|
| Create | `frontend/src/app/shared/services/upgrade.service.ts` | Signal bridge for LinkedIn → AppShell upgrade modal |
| Modify | `frontend/src/app/shared/components/app-shell/app-shell.component.ts` | Inject `UpgradeService`, add `effect()` to open modal |
| Modify | `frontend/src/app/shared/components/app-shell/app-shell.component.spec.ts` | Test that effect opens modal when service is triggered |
| Modify | `frontend/src/app/features/dashboard/dashboard.component.ts` | Add `statusKey()` method |
| Modify | `frontend/src/app/features/dashboard/dashboard.component.html` | Replace header + table with `.page-header` + `.card-list` |
| Modify | `frontend/src/app/features/dashboard/dashboard.component.scss` | Remove old classes, add stat-grid + delete danger style |
| Modify | `frontend/src/app/features/dashboard/dashboard.component.spec.ts` | Update selector from `.app-table__actions button` to aria-label |
| Modify | `frontend/src/app/features/master-cvs/master-cvs.component.html` | Replace header + cv-list with `.page-header` + `.card-list` |
| Modify | `frontend/src/app/features/master-cvs/master-cvs.component.scss` | Remove old classes, add card-row overrides |
| Modify | `frontend/src/app/features/master-cvs/master-cvs.component.spec.ts` | Update selector for action buttons |
| Modify | `frontend/src/app/features/linkedin/linkedin.component.ts` | Inject `AuthService` + `UpgradeService`, add `isPro` computed |
| Modify | `frontend/src/app/features/linkedin/linkedin.component.html` | Add pro gate, `.page-header`, result `.card-list` |
| Modify | `frontend/src/app/features/linkedin/linkedin.component.scss` | Remove old classes, add `linkedin-result-text` |
| Modify | `frontend/src/app/features/linkedin/linkedin.component.spec.ts` | Add `AuthService` + `UpgradeService` to providers, add gate tests |

---

## Task 0 — UpgradeService

**Files:**
- Create: `frontend/src/app/shared/services/upgrade.service.ts`

- [ ] **Step 1: Create the service**

```typescript
// frontend/src/app/shared/services/upgrade.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UpgradeService {
  readonly requested = signal(false);

  request(): void {
    this.requested.set(true);
  }

  clear(): void {
    this.requested.set(false);
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/shared/services/upgrade.service.ts
git commit -m "feat: add UpgradeService signal bridge for pro upgrade modal"
```

---

## Task 1 — AppShellComponent: wire UpgradeService

**Files:**
- Modify: `frontend/src/app/shared/components/app-shell/app-shell.component.ts`
- Modify: `frontend/src/app/shared/components/app-shell/app-shell.component.spec.ts`

- [ ] **Step 1: Write the failing test first**

Add this test to the `describe('AppShellComponent')` block in `frontend/src/app/shared/components/app-shell/app-shell.component.spec.ts`. Add `UpgradeService` to the import:

```typescript
import { UpgradeService } from '../../../shared/services/upgrade.service';
```

Add this test inside the describe block:

```typescript
it('opens Einstellungen modal when UpgradeService.request() is called', async () => {
  const { fixture } = await setup();
  const upgradeService = TestBed.inject(UpgradeService);
  expect(fixture.componentInstance['einstellungenOpen']()).toBe(false);
  upgradeService.request();
  fixture.detectChanges();
  await fixture.whenStable();
  expect(fixture.componentInstance['einstellungenOpen']()).toBe(true);
  expect(upgradeService.requested()).toBe(false); // cleared after handling
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd frontend && npm test -- --testPathPattern="app-shell.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `FAIL` — "opens Einstellungen modal when UpgradeService.request() is called" fails because `AppShellComponent` doesn't yet react to the service.

- [ ] **Step 3: Update `app-shell.component.ts`**

Add `effect` to the existing imports from `@angular/core`. Add `UpgradeService` import. Add the effect in the class body:

```typescript
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { EinstellungenModalComponent } from '../einstellungen-modal/einstellungen-modal.component';
import { UpgradeService } from '../../services/upgrade.service';

@Component({
  selector: 'lba-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, EinstellungenModalComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly upgradeService = inject(UpgradeService);

  protected readonly einstellungenOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.upgradeService.requested()) {
        this.einstellungenOpen.set(true);
        this.upgradeService.clear();
      }
    }, { allowSignalWrites: true });
  }

  protected isPro(): boolean {
    const plan = this.auth.user()?.plan;
    return plan === 'PRO' || plan === 'pro';
  }

  protected planLabel(): string {
    const plan = this.auth.user()?.plan;
    if (plan === 'PRO' || plan === 'pro') return 'Pro';
    if (plan === 'PAY_PER_APP' || plan === 'pay') return 'Pay-per-App';
    return 'Free';
  }

  protected planClass(): string {
    const plan = this.auth.user()?.plan;
    if (plan === 'PRO' || plan === 'pro') return 'pro';
    if (plan === 'PAY_PER_APP' || plan === 'pay') return 'pay';
    return 'free';
  }

  protected openEinstellungen(): void {
    this.einstellungenOpen.set(true);
  }

  protected linkedInClick(): void {
    if (this.isPro()) {
      void this.router.navigate(['/app/linkedin']);
    } else {
      this.einstellungenOpen.set(true);
    }
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd frontend && npm test -- --testPathPattern="app-shell.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `PASS` — all tests green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/app-shell/app-shell.component.ts \
        frontend/src/app/shared/components/app-shell/app-shell.component.spec.ts
git commit -m "feat: wire UpgradeService effect into AppShell to open Einstellungen modal"
```

---

## Task 2 — Dashboard restyle

**Files:**
- Modify: `frontend/src/app/features/dashboard/dashboard.component.ts`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.html`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.scss`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.spec.ts`

- [ ] **Step 1: Update the spec — fix the broken selector**

In `frontend/src/app/features/dashboard/dashboard.component.spec.ts`, find the test `'sets selectedAppId when the list open action is clicked'` (around line 152) and replace the selector:

```typescript
// BEFORE:
const openButton = fixture.nativeElement.querySelector('.app-table__actions button') as HTMLButtonElement;

// AFTER:
const openButton = fixture.nativeElement.querySelector('button[aria-label="Öffnen: Dev @ Acme"]') as HTMLButtonElement;
```

Also add a new test for `statusKey()` inside the main `describe` block:

```typescript
it('statusKey maps backend statuses to CSS class suffixes', () => {
  api.get.mockResolvedValue(emptyDashboard);
  const fixture = TestBed.createComponent(DashboardComponent);
  expect(fixture.componentInstance.statusKey('OPEN')).toBe('open');
  expect(fixture.componentInstance.statusKey('DONE')).toBe('done');
  expect(fixture.componentInstance.statusKey('IN_PROGRESS')).toBe('active');
  expect(fixture.componentInstance.statusKey('REJECTED')).toBe('rejected');
  expect(fixture.componentInstance.statusKey('UNKNOWN')).toBe('open');
});
```

- [ ] **Step 2: Run spec — expect one failure**

```bash
cd frontend && npm test -- --testPathPattern="dashboard.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `FAIL` — `statusKey` test fails (method doesn't exist yet).

- [ ] **Step 3: Add `statusKey()` to `dashboard.component.ts`**

Add this method to `DashboardComponent`, right after `statusLabel()`:

```typescript
statusKey(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'open',
    DONE: 'done',
    IN_PROGRESS: 'active',
    REJECTED: 'rejected',
  };
  return map[status] ?? 'open';
}
```

- [ ] **Step 4: Run spec — expect pass**

```bash
cd frontend && npm test -- --testPathPattern="dashboard.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `PASS` — all tests green (the open-button test still passes because the aria-label selector works once the template is updated, but if the template isn't updated yet this may still fail — that's fine, continue to Step 5).

- [ ] **Step 5: Rewrite `dashboard.component.html`**

Replace the entire file:

```html
<main
  id="main"
  class="dashboard"
  [class.dashboard--onboarding-focus]="data() && !data()!.onboardingDismissed && data()!.recentApplications.length === 0"
  tabindex="-1"
  [attr.aria-busy]="loading()">

  <div class="page-header">
    <div class="page-header__text">
      <h1 class="page-title">Bewerbungen</h1>
      <p class="page-sub">Deine optimierten Bewerbungen im Überblick</p>
    </div>
    <div class="page-header__actions">
      <a routerLink="/app/wizard" class="btn btn--cta btn--md">Neue Bewerbung</a>
    </div>
  </div>

  @if (error()) {
    <div role="alert" aria-live="polite" class="dashboard__error form-error">
      <span>{{ error() }}</span>
      <button type="button" class="btn btn--ghost btn--sm" (click)="loadData()">Erneut versuchen</button>
    </div>
  }

  @if (loading()) {
    <div class="stat-grid" aria-label="Statistiken werden geladen" aria-busy="true">
      <div class="card-elevated stat-card stat-card--skeleton" aria-hidden="true"></div>
      <div class="card-elevated stat-card stat-card--skeleton" aria-hidden="true"></div>
      <div class="card-elevated stat-card stat-card--skeleton" aria-hidden="true"></div>
    </div>
  } @else if (data()) {
    <div class="stat-grid" aria-label="Statistiken">
      <article class="card-elevated stat-card" aria-label="Lebensläufe">
        <span class="stat-card__value">{{ data()!.cvCount }}</span>
        <span class="stat-card__label">Lebensläufe</span>
      </article>
      <article class="card-elevated stat-card" aria-label="Bewerbungen">
        <span class="stat-card__value">{{ data()!.applicationCount }}</span>
        <span class="stat-card__label">Bewerbungen</span>
      </article>
      <article class="card-elevated stat-card" aria-label="Durchschnittlicher Match-Score">
        <span class="stat-card__value">{{ data()!.avgMatchScore ?? '—' }}</span>
        <span class="stat-card__label">Ø Match-Score</span>
      </article>
    </div>

    @if (!data()!.onboardingDismissed) {
      <section class="onboarding" aria-labelledby="onboarding-heading">
        <div class="onboarding__header">
          <h2 id="onboarding-heading">Erste Schritte</h2>
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            [disabled]="dismissingOnboarding()"
            (click)="dismissOnboarding()"
            aria-label="Erste-Schritte-Hinweis ausblenden">
            Nicht mehr anzeigen
          </button>
        </div>
        <ol class="onboarding__steps" aria-label="Erste Schritte im Überblick">
          <li class="onboarding__step" [class.onboarding__step--done]="onboardingSteps()!.cvUploaded">
            <span class="onboarding__step-num" aria-hidden="true">
              @if (onboardingSteps()!.cvUploaded) { ✓ } @else { 1 }
            </span>
            <div class="onboarding__step-body">
              <strong>Lebenslauf hinzufügen</strong>
              <p>Lade deinen Lebenslauf als PDF/DOCX hoch, füge ihn als Text ein oder erstelle direkt im Assistenten ein Kurzprofil.</p>
              @if (!onboardingSteps()!.cvUploaded) {
                <a routerLink="/app/cvs" class="btn btn--outline btn--sm">Lebenslauf hinzufügen</a>
              }
            </div>
          </li>
          <li class="onboarding__step" [class.onboarding__step--done]="onboardingSteps()!.applicationCreated">
            <span class="onboarding__step-num" aria-hidden="true">
              @if (onboardingSteps()!.applicationCreated) { ✓ } @else { 2 }
            </span>
            <div class="onboarding__step-body">
              <strong>Erste Bewerbung erstellen</strong>
              <p>Füge eine Stellenanzeige ein und lass die KI deinen Lebenslauf optimieren und ein Anschreiben verfassen.</p>
              @if (!onboardingSteps()!.applicationCreated) {
                <a routerLink="/app/wizard" class="btn btn--outline btn--sm">Bewerbung erstellen</a>
              }
            </div>
          </li>
          <li class="onboarding__step" [class.onboarding__step--done]="onboardingSteps()!.exported">
            <span class="onboarding__step-num" aria-hidden="true">
              @if (onboardingSteps()!.exported) { ✓ } @else { 3 }
            </span>
            <div class="onboarding__step-body">
              <strong>Bewerbung exportieren und versenden</strong>
              <p>Lade Lebenslauf und Anschreiben als PDF herunter oder sende sie direkt per E-Mail an dich selbst.</p>
            </div>
          </li>
        </ol>
      </section>
    }

    @if (data()!.recentApplications.length > 0) {
      <section class="applications" aria-label="Letzte Bewerbungen">
        <div class="applications__heading">
          <h2>Letzte Bewerbungen</h2>
          <div class="applications__heading-actions">
            <button
              type="button"
              class="btn btn--ghost btn--sm"
              (click)="toggleView()"
              [attr.aria-pressed]="showPipeline()"
              aria-label="Ansicht wechseln">
              @if (showPipeline()) { Listenansicht } @else { Pipeline-Ansicht }
            </button>
            <a routerLink="/app/wizard" class="btn btn--ghost btn--sm">Weitere erstellen</a>
          </div>
        </div>

        @if (showPipeline()) {
          <lba-pipeline-toolbar
            [totalCount]="filteredApplications().length"
            (filterChange)="onFilterChange($event)"
          />
          <lba-pipeline-board
            [applications]="filteredApplications()"
            [highlightQuery]="pipelineFilter().query"
            (statusChange)="onStatusChange($event)"
            (reminderChange)="onReminderChange($event)"
            (applicationOpen)="selectedAppId.set($event)"
          />
        } @else {
          <div class="card-list">
            @for (app of data()!.recentApplications; track app.id) {
              <div class="card-elevated">
                <div class="card-row">
                  <div class="card-meta">
                    <p class="card-title">{{ jobTitle(app) }} @ {{ companyName(app) }}</p>
                    <p class="card-sub">
                      {{ app.createdAt | date:'dd. MMM' }}
                      @if (app.matchScore !== null) {
                        · <strong>{{ app.matchScore }}%</strong>
                      }
                      · <span [class]="'status--' + statusKey(app.status)">{{ statusLabel(app.status) }}</span>
                    </p>
                  </div>
                  <div class="card-actions">
                    <button
                      type="button"
                      class="btn btn--outline btn--sm"
                      [attr.aria-label]="'Öffnen: ' + jobTitle(app) + ' @ ' + companyName(app)"
                      (click)="selectedAppId.set(app.id)">
                      Öffnen
                    </button>
                    <button
                      type="button"
                      class="btn btn--ghost btn--sm app-delete-btn"
                      [attr.aria-label]="'Löschen: ' + jobTitle(app) + ' @ ' + companyName(app)"
                      (click)="requestDelete(app.id)">
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </section>
    } @else {
      <div class="empty-state">
        <p class="empty-state__text">Noch keine Bewerbungen vorhanden.</p>
        <a routerLink="/app/wizard" class="btn btn--cta btn--md">Erste Bewerbung erstellen</a>
      </div>
    }
  }
</main>

<lba-confirm-delete-modal
  [open]="deletingId() !== null"
  title="Wirklich löschen?"
  body="Diese Aktion kann nicht rückgängig gemacht werden."
  (confirmed)="confirmDelete()"
  (cancelled)="deletingId.set(null)"
/>

<lba-editor-modal
  [appId]="selectedAppId()"
  (closed)="selectedAppId.set(null)"
/>
```

- [ ] **Step 6: Rewrite `dashboard.component.scss`**

Replace the entire file:

```scss
.dashboard__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.stat-card {
  display: flex;
  flex-direction: column;

  &--skeleton {
    min-height: 88px;
    background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface) 50%, var(--surface-2) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.4s infinite;
  }
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

.dashboard--onboarding-focus {
  .stat-grid,
  .onboarding,
  .empty-state {
    width: min(100%, 780px);
    margin-inline: auto;
  }
}

.onboarding {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
}

.onboarding__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);

  h2 { font-size: 1rem; font-weight: 700; }
}

.onboarding__steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.onboarding__step {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;

  &--done .onboarding__step-num {
    background: var(--good);
    color: #fff;
  }
}

.onboarding__step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.onboarding__step-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  strong { font-size: 14px; color: var(--ink); }
  p { font-size: 13px; color: var(--ink-2); }
}

.applications__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);

  h2 { font-size: 1rem; font-weight: 700; }
}

.applications__heading-actions {
  display: flex;
  gap: var(--space-2);
}

.app-delete-btn {
  color: var(--danger);

  &:hover {
    background: color-mix(in oklch, var(--danger) 10%, transparent);
  }
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .stat-card--skeleton { animation: none; }
}
```

- [ ] **Step 7: Run all dashboard tests**

```bash
cd frontend && npm test -- --testPathPattern="dashboard.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `PASS` — all tests green including the updated open-button selector.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/features/dashboard/
git commit -m "feat: restyle Dashboard with page-header, stat-grid, card-list"
```

---

## Task 3 — CVs page restyle

**Files:**
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.html`
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.scss`
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.spec.ts`

- [ ] **Step 1: Update spec selector**

In `frontend/src/app/features/master-cvs/master-cvs.component.spec.ts`, find any test that queries `.cv-card__actions button` or `.btn--primary` inside the card and update to use `aria-label` selectors. Check what tests exist — add this test to the describe block to verify the new card structure:

```typescript
it('renders CV name in card-title after load', async () => {
  const data = [{ id: 'cv1', name: 'Mein Lebenslauf', language: 'de', sourceFilename: 'cv.pdf', template: 'modern' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
  api.get.mockResolvedValue(data);
  const fixture = TestBed.createComponent(MasterCvsComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const title = fixture.nativeElement.querySelector('.card-title') as HTMLElement;
  expect(title?.textContent?.trim()).toBe('Mein Lebenslauf');
});

it('use-in-wizard button has correct aria-label', async () => {
  const data = [{ id: 'cv1', name: 'Mein CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
  api.get.mockResolvedValue(data);
  const fixture = TestBed.createComponent(MasterCvsComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const btn = fixture.nativeElement.querySelector('button[aria-label="In Bewerbung verwenden: Mein CV"]') as HTMLButtonElement;
  expect(btn).not.toBeNull();
});
```

- [ ] **Step 2: Run spec — expect failures**

```bash
cd frontend && npm test -- --testPathPattern="master-cvs.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `FAIL` — new tests fail (`.card-title` doesn't exist yet in template).

- [ ] **Step 3: Rewrite `master-cvs.component.html`**

Replace the entire file:

```html
<main id="main" class="master-cvs" tabindex="-1" [attr.aria-busy]="loading() || uploading() || savingTextCv()">

  <div class="page-header">
    <div class="page-header__text">
      <h1 class="page-title">Lebensläufe</h1>
      <p class="page-sub">Deine gespeicherten Lebensläufe</p>
    </div>
    <div class="page-header__actions">
      <label
        class="btn btn--cta btn--md"
        for="cv-upload"
        tabindex="0"
        [class.btn--loading]="uploading()"
        [attr.aria-disabled]="uploading()">
        @if (uploading()) { Wird hochgeladen… } @else { Lebenslauf hochladen }
        <input
          id="cv-upload"
          type="file"
          accept=".pdf,.docx"
          class="sr-only"
          [disabled]="uploading()"
          (change)="upload($event)"
          aria-label="Lebenslauf-Datei auswählen (PDF oder DOCX)" />
      </label>
      <button
        type="button"
        class="btn btn--outline btn--md"
        aria-controls="text-cv-panel"
        [attr.aria-expanded]="textFormOpen()"
        (click)="toggleTextForm()">
        @if (textFormOpen()) { Schließen } @else { Lebenslauf einfügen }
      </button>
    </div>
  </div>

  @if (error()) {
    <div role="alert" aria-live="polite" class="form-error master-cvs__error">{{ error() }}</div>
  }

  @if (textFormOpen()) {
    <section id="text-cv-panel" class="card-elevated text-cv-panel" aria-labelledby="text-cv-heading">
      <div class="text-cv-panel__intro">
        <h2 id="text-cv-heading">Lebenslauf per Text einfügen</h2>
        <p>Kopiere den Inhalt deines CVs hier hinein. Wir speichern nur die strukturierte CV-Version, nicht den Originaltext als Datei.</p>
      </div>
      <form class="text-cv-form" [formGroup]="textCvForm" (ngSubmit)="createFromText()" novalidate aria-label="Lebenslauf per Text speichern">
        <div class="field">
          <label for="text-cv-name">Name</label>
          <input
            id="text-cv-name"
            type="text"
            formControlName="name"
            autocomplete="name"
            aria-required="true"
            [attr.aria-invalid]="textCvForm.controls.name.invalid && textCvForm.controls.name.touched"
            [attr.aria-describedby]="textCvForm.controls.name.invalid && textCvForm.controls.name.touched ? 'text-cv-name-error' : null" />
          @if (textCvForm.controls.name.invalid && textCvForm.controls.name.touched) {
            <span id="text-cv-name-error" class="field__error" role="alert">Bitte gib mindestens 2 Zeichen ein.</span>
          }
        </div>
        <div class="field">
          <label for="text-cv-language">Sprache</label>
          <select id="text-cv-language" formControlName="language" aria-required="true">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="field field--wide">
          <label for="text-cv-text">Lebenslauftext</label>
          <textarea
            id="text-cv-text"
            rows="12"
            formControlName="text"
            aria-required="true"
            aria-describedby="text-cv-text-note text-cv-text-error"
            [attr.aria-invalid]="textCvForm.controls.text.invalid && textCvForm.controls.text.touched"></textarea>
          <span id="text-cv-text-note" class="field__note">Mindestens 40 Zeichen.</span>
          @if (textCvForm.controls.text.invalid && textCvForm.controls.text.touched) {
            <span id="text-cv-text-error" class="field__error" role="alert">Bitte füge mindestens 40 Zeichen Lebenslauf-Text ein.</span>
          }
        </div>
        <div class="text-cv-form__actions">
          <button type="button" class="btn btn--ghost btn--md" [disabled]="savingTextCv()" (click)="closeTextForm()">Abbrechen</button>
          <button type="submit" class="btn btn--outline btn--md" [disabled]="savingTextCv()">
            @if (savingTextCv()) { Wird gespeichert… } @else { Text-Lebenslauf speichern }
          </button>
        </div>
      </form>
    </section>
  }

  @if (loading()) {
    <div class="card-list" aria-label="Lebensläufe werden geladen" aria-busy="true">
      <div class="card-elevated cv-card--skeleton" aria-hidden="true"></div>
      <div class="card-elevated cv-card--skeleton" aria-hidden="true"></div>
    </div>
  } @else if (cvs().length === 0) {
    <div class="empty-state">
      <p class="empty-state__text">Noch kein Lebenslauf hinzugefügt.</p>
      <label class="btn btn--cta btn--md" for="cv-upload-empty" tabindex="0">
        Lebenslauf hochladen
        <input
          id="cv-upload-empty"
          type="file"
          accept=".pdf,.docx"
          class="sr-only"
          (change)="upload($event)"
          aria-label="Lebenslauf-Datei auswählen" />
      </label>
    </div>
  } @else {
    <div class="card-list" role="list" aria-label="Lebenslauf-Liste">
      @for (cv of cvs(); track cv.id) {
        <div class="card-elevated" role="listitem">
          <div class="card-row cv-card-row">
            <div class="card-meta">
              @if (renamingId() === cv.id) {
                <input
                  #renameInput
                  class="cv-rename-input"
                  type="text"
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
              <button
                type="button"
                class="btn btn--outline btn--sm"
                [attr.aria-label]="'In Bewerbung verwenden: ' + cv.name"
                (click)="useInWizard(cv.id)">
                In Bewerbung verwenden
              </button>
              <button
                type="button"
                class="btn btn--ghost btn--sm"
                [attr.aria-label]="'Umbenennen: ' + cv.name"
                (click)="startRename(cv)">
                Umbenennen
              </button>
              <button
                type="button"
                class="btn btn--ghost btn--sm cv-delete-btn"
                [attr.aria-label]="'Löschen: ' + cv.name"
                (click)="requestDelete(cv.id)">
                Löschen
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  }
</main>

<lba-confirm-delete-modal
  [open]="deletingId() !== null"
  title="Lebenslauf löschen?"
  body="Dieser Lebenslauf wird dauerhaft gelöscht. Bestehende Bewerbungen sind nicht betroffen."
  (confirmed)="confirmDelete()"
  (cancelled)="deletingId.set(null)"
/>
```

- [ ] **Step 4: Rewrite `master-cvs.component.scss`**

Replace the entire file:

```scss
.master-cvs__error {
  margin-bottom: var(--space-4);
}

.text-cv-panel {
  margin-bottom: var(--space-6);
}

.text-cv-panel__intro {
  margin-bottom: var(--space-4);

  h2 { font-size: 1rem; font-weight: 700; margin-bottom: var(--space-1); }
  p  { font-size: 13px; color: var(--ink-2); }
}

.text-cv-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.text-cv-form__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.cv-card-row {
  align-items: flex-start;
}

.cv-rename-input {
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  width: 100%;
  max-width: 280px;
  outline: none;
  color: var(--ink);
  background: var(--surface);
}

.cv-delete-btn {
  color: var(--danger);

  &:hover {
    background: color-mix(in oklch, var(--danger) 10%, transparent);
  }
}

.cv-card--skeleton {
  min-height: 100px;
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s infinite;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .cv-card--skeleton { animation: none; }
}
```

- [ ] **Step 5: Run spec — expect pass**

```bash
cd frontend && npm test -- --testPathPattern="master-cvs.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `PASS` — all tests green.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/master-cvs/
git commit -m "feat: restyle CVs page with page-header and card-list"
```

---

## Task 4 — LinkedIn restyle + pro gate

**Files:**
- Modify: `frontend/src/app/features/linkedin/linkedin.component.ts`
- Modify: `frontend/src/app/features/linkedin/linkedin.component.html`
- Modify: `frontend/src/app/features/linkedin/linkedin.component.scss`
- Modify: `frontend/src/app/features/linkedin/linkedin.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Replace the entire `frontend/src/app/features/linkedin/linkedin.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LinkedInComponent } from './linkedin.component';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { UpgradeService } from '../../shared/services/upgrade.service';

const mockResult = {
  headline: 'Senior Frontend Developer | Angular',
  about: 'Experienced developer with a passion for clean code.',
  experience: [
    { role: 'Frontend Dev', company: 'Acme', improvedBullets: ['Led migration', 'Improved performance'] },
  ],
};

function makeAuthMock(plan = 'PRO') {
  return { user: () => ({ id: '1', email: 'a@b.de', name: 'Hans', plan, emailVerified: true, twoFactorEnabled: false }) };
}

describe('LinkedInComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'post'>>;

  function setupWithPlan(plan = 'PRO') {
    return TestBed.configureTestingModule({
      imports: [LinkedInComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: makeAuthMock(plan) },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    api = { post: jest.fn() };
  });

  it('result is null initially', async () => {
    await setupWithPlan();
    const f = TestBed.createComponent(LinkedInComponent);
    expect(f.componentInstance.result()).toBeNull();
  });

  it('isPro is true for PRO plan', async () => {
    await setupWithPlan('PRO');
    const f = TestBed.createComponent(LinkedInComponent);
    expect(f.componentInstance.isPro()).toBe(true);
  });

  it('isPro is false for FREE plan', async () => {
    await setupWithPlan('FREE');
    const f = TestBed.createComponent(LinkedInComponent);
    expect(f.componentInstance.isPro()).toBe(false);
  });

  it('shows pro gate and hides form for free user', async () => {
    await setupWithPlan('FREE');
    const f = TestBed.createComponent(LinkedInComponent);
    f.detectChanges();
    const gate = f.nativeElement.querySelector('.empty-state');
    const form = f.nativeElement.querySelector('form');
    expect(gate).not.toBeNull();
    expect(form).toBeNull();
  });

  it('shows form and hides gate for Pro user', async () => {
    await setupWithPlan('PRO');
    const f = TestBed.createComponent(LinkedInComponent);
    f.detectChanges();
    const gate = f.nativeElement.querySelector('.empty-state');
    const form = f.nativeElement.querySelector('form');
    expect(gate).toBeNull();
    expect(form).not.toBeNull();
  });

  it('calls UpgradeService.request() when upgrade button is clicked', async () => {
    await setupWithPlan('FREE');
    const upgradeService = TestBed.inject(UpgradeService);
    const spy = jest.spyOn(upgradeService, 'request');
    const f = TestBed.createComponent(LinkedInComponent);
    f.detectChanges();
    const upgradeBtn = f.nativeElement.querySelector('button[aria-label="Jetzt upgraden"]') as HTMLButtonElement;
    upgradeBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loading is true during optimization, false after', async () => {
    await setupWithPlan('PRO');
    let resolve!: (v: unknown) => void;
    api.post.mockReturnValue(new Promise(r => { resolve = r; }));
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Dev' });
    const p = f.componentInstance.optimize();
    expect(f.componentInstance.loading()).toBe(true);
    resolve(mockResult);
    await p;
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('sets result on success', async () => {
    await setupWithPlan('PRO');
    api.post.mockResolvedValue(mockResult);
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Frontend Developer' });
    await f.componentInstance.optimize();
    expect(f.componentInstance.result()).toEqual(mockResult);
    expect(f.componentInstance.error()).toBeNull();
  });

  it('sets error on API failure', async () => {
    await setupWithPlan('PRO');
    api.post.mockRejectedValue(new HttpErrorResponse({ error: { message: 'AI timeout' } }));
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Dev' });
    await f.componentInstance.optimize();
    expect(f.componentInstance.error()).toBe('AI timeout');
  });

  it('calls POST /linkedin/optimize with profileText and targetRole', async () => {
    await setupWithPlan('PRO');
    api.post.mockResolvedValue(mockResult);
    const f = TestBed.createComponent(LinkedInComponent);
    const profileText = 'x'.repeat(60);
    f.componentInstance.form.setValue({ profileText, targetRole: 'Senior Dev' });
    await f.componentInstance.optimize();
    expect(api.post).toHaveBeenCalledWith('/linkedin/optimize', { profileText, targetRole: 'Senior Dev' });
  });

  it('copiedField set after copyField and cleared after 2s', async () => {
    await setupWithPlan('PRO');
    jest.useFakeTimers();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
    const f = TestBed.createComponent(LinkedInComponent);
    await f.componentInstance.copyField('some text', 'headline');
    expect(f.componentInstance.copiedField()).toBe('headline');
    jest.advanceTimersByTime(2000);
    expect(f.componentInstance.copiedField()).toBeNull();
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: Run spec — expect failures**

```bash
cd frontend && npm test -- --testPathPattern="linkedin.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `FAIL` — `isPro`, pro gate, and `UpgradeService` tests fail.

- [ ] **Step 3: Rewrite `linkedin.component.ts`**

Replace the entire file:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SeoService } from '../../core/seo/seo.service';
import { UpgradeService } from '../../shared/services/upgrade.service';

interface ExperienceOptimization {
  role: string;
  company: string;
  improvedBullets: string[];
}

interface LinkedInOptimization {
  headline: string;
  about: string;
  experience: ExperienceOptimization[];
}

@Component({
  selector: 'lba-linkedin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './linkedin.component.html',
  styleUrl: './linkedin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkedInComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly upgradeService = inject(UpgradeService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<LinkedInOptimization | null>(null);
  readonly copiedField = signal<string | null>(null);

  readonly isPro = computed(() => {
    const plan = this.auth.user()?.plan;
    return plan === 'PRO' || plan === 'pro';
  });

  readonly form = new FormGroup({
    profileText: new FormControl('', [Validators.required, Validators.minLength(50)]),
    targetRole:  new FormControl('', [Validators.required, Validators.minLength(2)]),
  });

  constructor() {
    inject(SeoService).setPage('LinkedIn-Profil optimieren', 'LinkedIn-Profil mit KI optimieren — Headline, About und Erfahrungen verbessern.', '/app/linkedin');
  }

  openUpgrade(): void {
    this.upgradeService.request();
  }

  async optimize(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    try {
      const data = await this.api.post<LinkedInOptimization>('/linkedin/optimize', {
        profileText: this.form.value.profileText,
        targetRole:  this.form.value.targetRole,
      });
      this.result.set(data);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Optimierung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      this.loading.set(false);
    }
  }

  async copyField(text: string, field: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedField.set(field);
      setTimeout(() => this.copiedField.set(null), 2000);
    } catch {
      this.error.set('Text konnte nicht kopiert werden.');
    }
  }
}
```

- [ ] **Step 4: Rewrite `linkedin.component.html`**

Replace the entire file:

```html
<main id="main" class="linkedin-page" tabindex="-1">

  <div class="page-header">
    <div class="page-header__text">
      <h1 class="page-title">LinkedIn-Optimierung</h1>
      <p class="page-sub">Optimiere dein Profil mit KI</p>
    </div>
  </div>

  @if (!isPro()) {
    <div class="empty-state">
      <p class="empty-state__text">LinkedIn-Optimierung ist ein Pro-Feature.</p>
      <button
        type="button"
        class="btn btn--cta btn--md"
        (click)="openUpgrade()"
        aria-label="Jetzt upgraden">
        Jetzt upgraden
      </button>
    </div>
  } @else {

    @if (error()) {
      <div role="alert" aria-live="polite" class="form-error linkedin-error">{{ error() }}</div>
    }

    <form
      class="linkedin-form"
      [formGroup]="form"
      (ngSubmit)="optimize()"
      novalidate
      aria-label="LinkedIn-Profil optimieren">

      <div class="field">
        <label for="profile-text">LinkedIn-Profiltext</label>
        <textarea
          id="profile-text"
          formControlName="profileText"
          rows="10"
          placeholder="Füge hier deinen LinkedIn-Profiltext ein (Headline, About, Berufserfahrung)…"
          aria-required="true"
          [attr.aria-describedby]="form.controls.profileText.invalid && form.controls.profileText.touched ? 'profile-text-error' : null">
        </textarea>
        @if (form.controls.profileText.invalid && form.controls.profileText.touched) {
          <span id="profile-text-error" role="alert" class="field__error">Mindestens 50 Zeichen erforderlich.</span>
        }
      </div>

      <div class="field">
        <label for="target-role">Zielposition</label>
        <input
          id="target-role"
          type="text"
          formControlName="targetRole"
          placeholder="z. B. Senior Frontend Developer"
          aria-required="true"
          [attr.aria-describedby]="form.controls.targetRole.invalid && form.controls.targetRole.touched ? 'target-role-error' : null" />
        @if (form.controls.targetRole.invalid && form.controls.targetRole.touched) {
          <span id="target-role-error" role="alert" class="field__error">Bitte gib eine Zielposition ein.</span>
        }
      </div>

      <button type="submit" class="btn btn--cta btn--md" [disabled]="loading()">
        @if (loading()) { KI optimiert… } @else { Profil optimieren }
      </button>
    </form>

    @if (result()) {
      <section class="card-list linkedin-results" aria-label="Optimierungsergebnisse" aria-live="polite">

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

        <div class="card-elevated">
          <div class="card-row" style="align-items: flex-start;">
            <p class="card-title">About</p>
            <button type="button" class="btn btn--ghost btn--sm"
              (click)="copyField(result()!.about, 'about')"
              aria-label="About kopieren">
              @if (copiedField() === 'about') { Kopiert! } @else { Kopieren }
            </button>
          </div>
          <p class="linkedin-result-text">{{ result()!.about }}</p>
        </div>

        @if (result()!.experience.length > 0) {
          <div class="card-elevated">
            <p class="card-title" style="margin-bottom: var(--space-4);">Berufserfahrung</p>
            <ul class="linkedin-experience" role="list">
              @for (exp of result()!.experience; track exp.company + exp.role) {
                <li class="linkedin-exp-item">
                  <div class="linkedin-exp-header">
                    <strong>{{ exp.role }}</strong> bei <strong>{{ exp.company }}</strong>
                    <button type="button" class="btn btn--ghost btn--sm"
                      (click)="copyField(exp.improvedBullets.join('\n'), exp.company + exp.role)"
                      [attr.aria-label]="'Bullets für ' + exp.role + ' kopieren'">
                      @if (copiedField() === exp.company + exp.role) { Kopiert! } @else { Kopieren }
                    </button>
                  </div>
                  <ul class="linkedin-exp-bullets" role="list">
                    @for (bullet of exp.improvedBullets; track bullet) {
                      <li>{{ bullet }}</li>
                    }
                  </ul>
                </li>
              }
            </ul>
          </div>
        }

      </section>
    }
  }
</main>
```

- [ ] **Step 5: Rewrite `linkedin.component.scss`**

Replace the entire file:

```scss
.linkedin-error {
  margin-bottom: var(--space-4);
}

.linkedin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 680px;
  margin-bottom: var(--space-8);
}

.linkedin-results {
  margin-top: var(--space-6);
  max-width: 680px;
}

.linkedin-result-text {
  font-size: 14px;
  color: var(--ink);
  line-height: 1.6;
  margin-top: var(--space-3);
  white-space: pre-wrap;
}

.linkedin-experience {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.linkedin-exp-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.linkedin-exp-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;

  strong { color: var(--ink); }
}

.linkedin-exp-bullets {
  list-style: disc;
  padding-left: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  li { font-size: 13px; color: var(--ink-2); }
}
```

- [ ] **Step 6: Run spec — expect pass**

```bash
cd frontend && npm test -- --testPathPattern="linkedin.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `PASS` — all tests green.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/features/linkedin/
git commit -m "feat: restyle LinkedIn page with pro gate, page-header, card results"
```

---

## Task 5 — Full verification

- [ ] **Step 1: Run full test suite**

```bash
cd frontend && npm test -- --watchAll=false 2>&1 | tail -20
```

Expected: all suites pass, exit 0.

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint 2>&1 | tail -10
```

Expected: no errors, exit 0.

- [ ] **Step 3: Run build**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

Expected: `Build at:` line, exit 0.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve lint/build issues from per-page restyle"
```

Only run Step 4 if earlier steps required small fixes. Skip if all passed cleanly.
