# Pipeline Filter & Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a search input and filter chips above the pipeline board on the dashboard, filtering applications client-side in real time with matched text highlighted on cards.

**Architecture:** All filtering is client-side — no new API calls. `DashboardComponent` (smart) holds filter signals and a `filteredApplications` computed. A new dumb `PipelineToolbar` component emits filter changes. `PipelineBoard` gains a `highlightQuery` input and uses a new `HighlightPipe` to mark matched text. Columns with no matching cards are dimmed.

**Tech Stack:** Angular 21 signals, standalone components, Angular pipes, Jest

---

## File Map

**Frontend — new files:**
- `frontend/src/app/shared/pipes/highlight.pipe.ts`
- `frontend/src/app/shared/pipes/highlight.pipe.spec.ts`
- `frontend/src/app/shared/components/pipeline-toolbar/pipeline-toolbar.ts` + `.html` + `.scss` + `.spec.ts`

**Frontend — modified files:**
- `frontend/src/app/features/dashboard/dashboard.component.ts` — add filter signals + `filteredApplications` computed
- `frontend/src/app/features/dashboard/dashboard.component.html` — add `<lba-pipeline-toolbar>` above pipeline board
- `frontend/src/app/features/dashboard/dashboard.component.spec.ts` — filter tests
- `frontend/src/app/shared/components/pipeline-board/pipeline-board.ts` — add `highlightQuery` input, `dimmedColumns` computed
- `frontend/src/app/shared/components/pipeline-board/pipeline-board.html` — apply `HighlightPipe`, dimming
- `frontend/src/app/shared/components/pipeline-board/pipeline-board.spec.ts` — dimming + highlight tests

---

## Task 1: Create HighlightPipe

**Files:**
- Create: `frontend/src/app/shared/pipes/highlight.pipe.ts`
- Create: `frontend/src/app/shared/pipes/highlight.pipe.spec.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `frontend/src/app/shared/pipes/highlight.pipe.spec.ts`:

```typescript
import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
  let pipe: HighlightPipe;

  beforeEach(() => { pipe = new HighlightPipe(); });

  it('returns original text when query is empty', () => {
    expect(pipe.transform('Frontend Developer', '')).toBe('Frontend Developer');
  });

  it('wraps matched substring in <mark>', () => {
    const result = pipe.transform('Frontend Developer', 'front');
    expect(result).toBe('<mark class="highlight">Front</mark>end Developer');
  });

  it('is case-insensitive', () => {
    const result = pipe.transform('Angular Expert', 'ANGULAR');
    expect(result).toContain('<mark class="highlight">Angular</mark>');
  });

  it('returns original text when query has no match', () => {
    expect(pipe.transform('Angular Expert', 'React')).toBe('Angular Expert');
  });

  it('handles multiple matches', () => {
    const result = pipe.transform('Frontend dev and Frontend designer', 'frontend');
    expect(result.match(/<mark/g)?.length).toBe(2);
  });

  it('escapes special regex characters in query', () => {
    expect(() => pipe.transform('some text', 'a.b*c')).not.toThrow();
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
cd frontend && npx jest --testPathPattern="highlight.pipe.spec" --no-coverage
```
Expected: FAIL — `HighlightPipe` not found

- [ ] **Step 1.3: Create highlight.pipe.ts**

Create `frontend/src/app/shared/pipes/highlight.pipe.ts`:

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'highlight', standalone: true, pure: true })
export class HighlightPipe implements PipeTransform {
  transform(text: string, query: string): string {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
  }
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
cd frontend && npx jest --testPathPattern="highlight.pipe.spec" --no-coverage
```
Expected: 6 tests PASS

- [ ] **Step 1.5: Commit**

```bash
git add frontend/src/app/shared/pipes/highlight.pipe.ts frontend/src/app/shared/pipes/highlight.pipe.spec.ts
git commit -m "feat(ui): add HighlightPipe for search term highlighting"
```

---

## Task 2: Create PipelineToolbar component

**Files:**
- Create: `frontend/src/app/shared/components/pipeline-toolbar/pipeline-toolbar.ts` + `.html` + `.scss` + `.spec.ts`

- [ ] **Step 2.1: Write the failing tests**

Create `frontend/src/app/shared/components/pipeline-toolbar/pipeline-toolbar.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { PipelineToolbar, type PipelineFilter } from './pipeline-toolbar';

describe('PipelineToolbar', () => {
  let fixture: ComponentFixture<PipelineToolbar>;
  let component: PipelineToolbar;

  function create(totalCount = 5) {
    fixture = TestBed.createComponent(PipelineToolbar);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalCount', totalCount);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PipelineToolbar] }).compileComponents();
  });

  it('renders search input', () => {
    create();
    expect(fixture.nativeElement.querySelector('.toolbar__search')).toBeTruthy();
  });

  it('emits filterChange with updated query when search input changes', () => {
    create();
    const emitted: PipelineFilter[] = [];
    component.filterChange.subscribe((v: PipelineFilter) => emitted.push(v));

    const input = fixture.nativeElement.querySelector('.toolbar__search') as HTMLInputElement;
    input.value = 'Acme';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toHaveLength(1);
    expect(emitted[0].query).toBe('Acme');
  });

  it('emits filterChange when minScore chip is toggled', () => {
    create();
    const emitted: PipelineFilter[] = [];
    component.filterChange.subscribe((v: PipelineFilter) => emitted.push(v));

    const chip = fixture.nativeElement.querySelector('[data-filter="minScore"]') as HTMLButtonElement;
    chip?.click();

    expect(emitted.length).toBeGreaterThan(0);
  });

  it('shows total count of applications', () => {
    create(7);
    expect(fixture.nativeElement.textContent).toContain('7');
  });

  it('shows active filter count when filters are applied', () => {
    create();
    component.toggleMinScore();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.toolbar__active-chip')).toBeTruthy();
  });
});
```

- [ ] **Step 2.2: Run tests to verify they fail**

```bash
cd frontend && npx jest --testPathPattern="pipeline-toolbar.spec" --no-coverage
```
Expected: FAIL — component not found

- [ ] **Step 2.3: Create pipeline-toolbar.ts**

Create `frontend/src/app/shared/components/pipeline-toolbar/pipeline-toolbar.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

export interface PipelineFilter {
  query: string;
  minScore: number | null;
  hasReminder: boolean | null;
  dateRange: 'week' | 'month' | null;
}

const DEFAULT_FILTER: PipelineFilter = { query: '', minScore: null, hasReminder: null, dateRange: null };

@Component({
  selector: 'lba-pipeline-toolbar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pipeline-toolbar.html',
  styleUrl: './pipeline-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineToolbar {
  readonly totalCount = input.required<number>();
  readonly filterChange = output<PipelineFilter>();

  readonly queryControl = new FormControl('');
  readonly minScoreActive = signal(false);
  readonly hasReminderActive = signal(false);
  readonly dateRange = signal<'week' | 'month' | null>(null);

  readonly activeFilterCount = computed(() =>
    (this.minScoreActive() ? 1 : 0) +
    (this.hasReminderActive() ? 1 : 0) +
    (this.dateRange() !== null ? 1 : 0)
  );

  onQueryInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.emit(query);
  }

  toggleMinScore(): void {
    this.minScoreActive.update(v => !v);
    this.emit(this.queryControl.value ?? '');
  }

  toggleReminder(): void {
    this.hasReminderActive.update(v => !v);
    this.emit(this.queryControl.value ?? '');
  }

  setDateRange(range: 'week' | 'month' | null): void {
    this.dateRange.set(range);
    this.emit(this.queryControl.value ?? '');
  }

  private emit(query: string): void {
    this.filterChange.emit({
      query,
      minScore: this.minScoreActive() ? 70 : null,
      hasReminder: this.hasReminderActive() ? true : null,
      dateRange: this.dateRange(),
    });
  }
}
```

- [ ] **Step 2.4: Create pipeline-toolbar.html**

Create `frontend/src/app/shared/components/pipeline-toolbar/pipeline-toolbar.html`:

```html
<div class="toolbar" role="search" aria-label="Bewerbungen filtern">
  <div class="toolbar__search-wrap">
    <span class="toolbar__search-icon" aria-hidden="true">⌕</span>
    <input
      type="search"
      class="toolbar__search"
      placeholder="Bewerbungen durchsuchen…"
      [formControl]="queryControl"
      (input)="onQueryInput($event)"
      aria-label="Bewerbungen durchsuchen"
    />
  </div>

  <div class="toolbar__filters" role="group" aria-label="Filter">
    <span class="toolbar__filter-label">Filter:</span>

    @if (minScoreActive()) {
      <button
        type="button"
        class="toolbar__active-chip"
        data-filter="minScore"
        (click)="toggleMinScore()"
        [attr.aria-pressed]="true"
        aria-label="Filter 'Score ≥ 70' entfernen">
        Score ≥ 70 ✕
      </button>
    } @else {
      <button
        type="button"
        class="toolbar__chip"
        data-filter="minScore"
        (click)="toggleMinScore()"
        [attr.aria-pressed]="false"
        aria-label="Nur Bewerbungen mit Score 70 oder höher anzeigen">
        + Score ≥ 70
      </button>
    }

    <button
      type="button"
      class="toolbar__chip"
      [class.toolbar__active-chip]="hasReminderActive()"
      (click)="toggleReminder()"
      [attr.aria-pressed]="hasReminderActive()"
      aria-label="Nur Bewerbungen mit gesetzter Erinnerung anzeigen">
      @if (hasReminderActive()) { Erinnerung ✕ } @else { + Erinnerung }
    </button>

    <button
      type="button"
      class="toolbar__chip"
      [class.toolbar__active-chip]="dateRange() === 'week'"
      (click)="setDateRange(dateRange() === 'week' ? null : 'week')"
      [attr.aria-pressed]="dateRange() === 'week'"
      aria-label="Nur Bewerbungen aus dieser Woche anzeigen">
      @if (dateRange() === 'week') { Diese Woche ✕ } @else { + Diese Woche }
    </button>

    <span class="toolbar__count" aria-live="polite" aria-atomic="true">
      {{ totalCount() }} Bewerbungen
    </span>
  </div>
</div>
```

- [ ] **Step 2.5: Create pipeline-toolbar.scss**

Create `frontend/src/app/shared/components/pipeline-toolbar/pipeline-toolbar.scss`:

```scss
:host { display: block; }

.toolbar {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--bg-2);
}

.toolbar__search-wrap {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.toolbar__search-icon {
  position: absolute;
  left: var(--space-2);
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
  pointer-events: none;
}

.toolbar__search {
  width: 100%;
  background: var(--bg-2);
  border: 1px solid var(--bg-2);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-6);
  font: inherit;
  font-size: 0.8125rem;
  color: var(--ink);
  min-height: 44px;

  &::placeholder { color: var(--ink-3); }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
    border-color: var(--accent);
  }
}

.toolbar__filters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.toolbar__filter-label {
  font-size: 0.6875rem;
  color: var(--ink-3);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.toolbar__chip {
  background: var(--bg-2);
  border: 1px solid var(--bg-2);
  border-radius: var(--radius-full);
  padding: 3px var(--space-3);
  font-size: 0.75rem;
  color: var(--ink-2);
  cursor: pointer;
  min-height: 44px;

  &:hover {
    border-color: var(--accent);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
}

.toolbar__active-chip {
  background: color-mix(in oklch, var(--accent) 15%, transparent);
  border: 1px solid color-mix(in oklch, var(--accent) 40%, transparent);
  border-radius: var(--radius-full);
  padding: 3px var(--space-3);
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
}

.toolbar__count {
  font-size: 0.6875rem;
  color: var(--ink-3);
  margin-left: var(--space-1);
}
```

- [ ] **Step 2.6: Run tests**

```bash
cd frontend && npx jest --testPathPattern="pipeline-toolbar.spec" --no-coverage
```
Expected: all 5 tests PASS

- [ ] **Step 2.7: Commit**

```bash
git add frontend/src/app/shared/components/pipeline-toolbar/
git commit -m "feat(ui): add PipelineToolbar component with search and filter chips"
```

---

## Task 3: Wire filter signals into DashboardComponent

**Files:**
- Modify: `frontend/src/app/features/dashboard/dashboard.component.ts`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.html`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.spec.ts`

- [ ] **Step 3.1: Read current dashboard component**

```bash
cat frontend/src/app/features/dashboard/dashboard.component.ts
```

Note the `RecentApplication` interface and how `data()` is used. The filter computed will use `data()?.recentApplications`.

- [ ] **Step 3.2: Write failing tests for filter logic**

In `frontend/src/app/features/dashboard/dashboard.component.spec.ts`, add a new `describe('pipeline filtering')` block:

```typescript
describe('pipeline filtering', () => {
  const apps = [
    { id: '1', status: 'OPEN',   matchScore: 85, createdAt: new Date().toISOString(), reminderAt: '2026-06-01', jobPosting: { parsedJson: { title: 'Frontend Dev', company: 'Acme' } } },
    { id: '2', status: 'SENT',   matchScore: 55, createdAt: new Date().toISOString(), reminderAt: null,         jobPosting: { parsedJson: { title: 'Backend Dev',  company: 'BigCo' } } },
    { id: '3', status: 'OPEN',   matchScore: 90, createdAt: new Date().toISOString(), reminderAt: null,         jobPosting: { parsedJson: { title: 'UX Designer',   company: 'Acme' } } },
  ];

  it('filteredApplications returns all apps when no filter active', async () => {
    api.get.mockResolvedValue({ onboardingDismissed: true, cvCount: 1, applicationCount: 3, avgMatchScore: 77, recentApplications: apps });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.filteredApplications().length).toBe(3);
  });

  it('filteredApplications filters by minScore', async () => {
    api.get.mockResolvedValue({ onboardingDismissed: true, cvCount: 1, applicationCount: 3, avgMatchScore: 77, recentApplications: apps });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFilterChange({ query: '', minScore: 70, hasReminder: null, dateRange: null });

    expect(fixture.componentInstance.filteredApplications().length).toBe(2);
    expect(fixture.componentInstance.filteredApplications().every(a => (a.matchScore ?? 0) >= 70)).toBe(true);
  });

  it('filteredApplications filters by query (title)', async () => {
    api.get.mockResolvedValue({ onboardingDismissed: true, cvCount: 1, applicationCount: 3, avgMatchScore: 77, recentApplications: apps });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFilterChange({ query: 'frontend', minScore: null, hasReminder: null, dateRange: null });

    expect(fixture.componentInstance.filteredApplications().length).toBe(1);
    expect(fixture.componentInstance.filteredApplications()[0].id).toBe('1');
  });

  it('filteredApplications filters by hasReminder', async () => {
    api.get.mockResolvedValue({ onboardingDismissed: true, cvCount: 1, applicationCount: 3, avgMatchScore: 77, recentApplications: apps });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFilterChange({ query: '', minScore: null, hasReminder: true, dateRange: null });

    expect(fixture.componentInstance.filteredApplications().length).toBe(1);
    expect(fixture.componentInstance.filteredApplications()[0].id).toBe('1');
  });
});
```

- [ ] **Step 3.3: Run tests to verify they fail**

```bash
cd frontend && npx jest --testPathPattern="dashboard.component.spec" --no-coverage
```
Expected: FAIL — `filteredApplications` and `onFilterChange` do not exist

- [ ] **Step 3.4: Add filter state to DashboardComponent**

In `frontend/src/app/features/dashboard/dashboard.component.ts`:

1. Add imports:
```typescript
import { PipelineToolbar, type PipelineFilter } from '../../shared/components/pipeline-toolbar/pipeline-toolbar';
```

2. Add `PipelineToolbar` to the `imports` array in `@Component`.

3. Add signals and computed after the `showPipeline` signal:
```typescript
readonly pipelineFilter = signal<PipelineFilter>({ query: '', minScore: null, hasReminder: null, dateRange: null });

readonly filteredApplications = computed(() => {
  const apps = this.data()?.recentApplications ?? [];
  const { query, minScore, hasReminder } = this.pipelineFilter();
  const q = query.trim().toLowerCase();

  return apps.filter(app => {
    if (minScore !== null && (app.matchScore ?? 0) < minScore) return false;
    if (hasReminder === true && !app.reminderAt) return false;
    if (q) {
      const title   = (app.jobPosting.parsedJson.title   ?? '').toLowerCase();
      const company = (app.jobPosting.parsedJson.company ?? '').toLowerCase();
      if (!title.includes(q) && !company.includes(q)) return false;
    }
    return true;
  });
});

onFilterChange(filter: PipelineFilter): void {
  this.pipelineFilter.set(filter);
}
```

- [ ] **Step 3.5: Run tests to verify they pass**

```bash
cd frontend && npx jest --testPathPattern="dashboard.component.spec" --no-coverage
```
Expected: all existing tests + 4 new filter tests PASS

- [ ] **Step 3.6: Update dashboard template**

In `frontend/src/app/features/dashboard/dashboard.component.html`, add `<lba-pipeline-toolbar>` directly above `<lba-pipeline-board>`:

```html
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
  />
}
```

- [ ] **Step 3.7: Commit**

```bash
git add frontend/src/app/features/dashboard/
git commit -m "feat(dashboard): add filter signals and filteredApplications computed for pipeline"
```

---

## Task 4: Add highlighting and column dimming to PipelineBoard

**Files:**
- Modify: `frontend/src/app/shared/components/pipeline-board/pipeline-board.ts`
- Modify: `frontend/src/app/shared/components/pipeline-board/pipeline-board.html`
- Modify: `frontend/src/app/shared/components/pipeline-board/pipeline-board.spec.ts`

- [ ] **Step 4.1: Write failing tests**

In `frontend/src/app/shared/components/pipeline-board/pipeline-board.spec.ts`, add:

```typescript
describe('highlighting and dimming', () => {
  it('dims columns with no apps after filtering', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    fixture.componentRef.setInput('highlightQuery', '');
    fixture.detectChanges();

    // Gesendet column has no apps — should be dimmed
    const cols = fixture.nativeElement.querySelectorAll('.pipeline__col') as NodeList;
    const sentCol = Array.from(cols).find(col => (col as HTMLElement).getAttribute('aria-label') === 'Gesendet') as HTMLElement;
    expect(sentCol?.classList.contains('pipeline__col--dimmed')).toBe(true);
  });

  it('highlights query text in card title using innerHTML', async () => {
    await setup([makeApp({ status: 'OPEN' })]);
    fixture.componentRef.setInput('highlightQuery', 'Frontend');
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.pipeline__card-title');
    expect(title?.innerHTML).toContain('<mark');
  });
});
```

- [ ] **Step 4.2: Run tests to verify they fail**

```bash
cd frontend && npx jest --testPathPattern="pipeline-board.spec" --no-coverage
```
Expected: FAIL — `highlightQuery` input does not exist

- [ ] **Step 4.3: Update pipeline-board.ts**

In `frontend/src/app/shared/components/pipeline-board/pipeline-board.ts`:

1. Add imports:
```typescript
import { computed } from '@angular/core';
import { HighlightPipe } from '../../pipes/highlight.pipe';
```

2. Add `HighlightPipe` to the `imports` array.

3. Add inputs and computed:
```typescript
readonly highlightQuery = input<string>('');

readonly dimmedColumnKeys = computed(() => {
  const apps = this.applications();
  return new Set(
    this.columns
      .filter(col => apps.filter(a => col.statuses.includes(a.status)).length === 0)
      .map(col => col.key)
  );
});
```

- [ ] **Step 4.4: Update pipeline-board.html**

In `frontend/src/app/shared/components/pipeline-board/pipeline-board.html`:

1. Add `pipeline__col--dimmed` class binding to each column div:
```html
<div class="pipeline__col" [class.pipeline__col--dimmed]="dimmedColumnKeys().has(col.key)" [attr.aria-label]="col.label">
```

2. Replace the card title link to use `HighlightPipe` via `innerHTML`:
```html
<a class="pipeline__card-title"
   [routerLink]="['/app/applications', app.id]"
   [innerHTML]="jobTitle(app) | highlight:highlightQuery()">
</a>
```

- [ ] **Step 4.5: Add dimmed style to pipeline-board.scss**

In `frontend/src/app/shared/components/pipeline-board/pipeline-board.scss`, add:
```scss
.pipeline__col--dimmed {
  opacity: 0.4;
}

.pipeline__card-title {
  ::ng-deep mark.highlight {
    background: color-mix(in oklch, var(--accent) 25%, transparent);
    color: var(--accent);
    border-radius: 2px;
    padding: 0 1px;
  }
}
```

- [ ] **Step 4.6: Run all pipeline board tests**

```bash
cd frontend && npx jest --testPathPattern="pipeline-board.spec" --no-coverage
```
Expected: all tests PASS including 2 new ones

- [ ] **Step 4.7: Commit**

```bash
git add frontend/src/app/shared/components/pipeline-board/
git commit -m "feat(pipeline): add highlightQuery input and column dimming to PipelineBoard"
```

---

## Task 5: Final verification

- [ ] **Step 5.1: Full frontend test, lint, and build**

```bash
cd frontend && npm run lint && npm test -- --watchAll=false --no-coverage && npm run build
```
Expected: 0 lint errors, all tests PASS, build succeeds

- [ ] **Step 5.2: Verify no backend changes needed**

```bash
cd backend && npm run lint && npm test -- --no-coverage
```
Expected: all backend tests still PASS (this feature has no backend changes)

- [ ] **Step 5.3: Final commit if any files unstaged**

```bash
git status
```
If clean: done. Otherwise stage and commit remaining files:
```bash
git add -p
git commit -m "feat: complete Pipeline Filter & Search feature (D)"
```
