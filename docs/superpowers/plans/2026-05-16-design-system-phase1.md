# Design System Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a consistent design system foundation: 4-tier button hierarchy, elevated card + status utilities, left sidebar app shell, and `EinstellungenModal` replacing the `/app/billing` and `/app/security` routes.

**Architecture:** All new visual primitives land in `styles.css` as global utility classes. The `ButtonComponent` type is narrowed to the 4 approved variants. `AppShellComponent` is rewritten from a top-bar to a 2-column sidebar layout and hosts a new `EinstellungenModalComponent`. The billing/security routes become redirects; their page components are untouched — their templates are embedded inside the modal.

**Tech Stack:** Angular 21 (signals, standalone, OnPush), SCSS with existing design tokens, Jest via jest-preset-angular.

---

## Files to create / modify

| Action | File | What changes |
|---|---|---|
| Modify | `frontend/src/styles.css` | Add `.btn--cta`, rename `.btn--secondary`→`.btn--outline` comment, add card/status/empty-state/page-header utilities |
| Modify | `frontend/src/app/shared/components/button.component.ts` | Narrow `ButtonVariant` type, remove `secondary` and `accent` |
| Modify | `frontend/src/app/shared/components/button.component.spec.ts` | Test all 5 final variants render correct class |
| Modify | `frontend/src/app/shared/components/app-shell/app-shell.component.ts` | Add `einstellungenOpen` signal, `openEinstellungen()`, `linkedInClick()` |
| Modify | `frontend/src/app/shared/components/app-shell/app-shell.component.html` | Full rewrite to sidebar layout |
| Modify | `frontend/src/app/shared/components/app-shell/app-shell.component.scss` | Full rewrite to sidebar CSS |
| Modify | `frontend/src/app/shared/components/app-shell/app-shell.component.spec.ts` | Update for new sidebar structure |
| Create | `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.ts` | Dialog wrapper, tab signal, open/close |
| Create | `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.html` | Backdrop + dialog, two tabs |
| Create | `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.scss` | Fixed overlay styles |
| Create | `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.spec.ts` | Open/close, tab switching, a11y |
| Modify | `frontend/src/app/app.routes.ts` | Add redirects for `/app/billing` → `/app` and `/app/security` → `/app` |

---

## Task 0 — Global CSS utilities

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Add `.btn--cta` and deprecation comment for `.btn--secondary` / `.btn--accent`**

In `frontend/src/styles.css`, replace the existing `.btn--secondary, .btn--outline` and `.btn--accent` blocks (lines 156–185) with:

```css
/* DEPRECATED: .btn--secondary → use .btn--outline */
.btn--secondary,
.btn--outline {
  background: transparent;
  color: var(--ink);
  border-color: var(--line);
}

.btn--secondary:hover,
.btn--outline:hover {
  background: var(--surface-2);
}

/* DEPRECATED: .btn--accent → use .btn--cta */
.btn--accent,
.btn--cta {
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: 0 4px 16px oklch(58% 0.20 255 / 0.35);
}

.btn--accent:hover,
.btn--cta:hover {
  background: var(--accent-2);
  box-shadow: 0 6px 20px oklch(58% 0.20 255 / 0.45);
}
```

- [ ] **Step 2: Add card, status, empty-state, and page-header utilities**

Append the following before the `@tailwind` lines at the end of `frontend/src/styles.css`:

```css
/* ── Card system ── */
.card-elevated {
  background: var(--surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--space-5, 1.25rem) var(--space-6);
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.card-meta {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-sub {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 2px;
}

.card-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* ── Inline status (used inside .card-sub) ── */
.status--open     { color: var(--good);    font-weight: 600; }
.status--active   { color: var(--warn);    font-weight: 600; }
.status--done     { color: var(--ink-2);   font-weight: 600; }
.status--rejected { color: var(--danger);  font-weight: 600; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-8);
  text-align: center;
}

.empty-state__text {
  color: var(--ink-3);
  font-size: 15px;
}

/* ── Page header ── */
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

.page-sub {
  font-size: 14px;
  color: var(--ink-3);
  margin-top: var(--space-1);
}

.page-header__text { flex: 1; }
.page-header__actions { flex-shrink: 0; }
```

- [ ] **Step 3: Run lint and build to confirm no CSS syntax errors**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

Expected: `Build at:` line with exit 0. No CSS parse errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/styles.css
git commit -m "style: add card, status, empty-state, page-header utilities; alias btn--cta"
```

---

## Task 1 — ButtonComponent type update

**Files:**
- Modify: `frontend/src/app/shared/components/button.component.ts`
- Modify: `frontend/src/app/shared/components/button.component.spec.ts`

- [ ] **Step 1: Update the failing test first**

Replace the entire contents of `frontend/src/app/shared/components/button.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonComponent] }).compileComponents();
  });

  it('creates', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('applies disabled attribute when disabled input is true', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it.each([
    ['cta',     'btn--cta'],
    ['primary', 'btn--primary'],
    ['outline', 'btn--outline'],
    ['ghost',   'btn--ghost'],
    ['danger',  'btn--danger'],
  ])('applies correct class for variant "%s"', (variant, expectedClass) => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.componentRef.setInput('variant', variant);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain(expectedClass);
  });
});
```

- [ ] **Step 2: Run test — expect failure on variant classes (variant type not updated yet)**

```bash
cd frontend && npm test -- --testPathPattern="button.component.spec" --watchAll=false 2>&1 | tail -20
```

Expected: `FAIL` — "applies correct class for variant cta" fails because `ButtonVariant` doesn't include `'cta'` yet.

- [ ] **Step 3: Update `button.component.ts`**

Replace the entire file:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'cta' | 'primary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lba-button',
  standalone: true,
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  variant  = input<ButtonVariant>('primary');
  size     = input<ButtonSize>('md');
  disabled = input(false);
  type     = input<'button' | 'submit' | 'reset'>('button');
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd frontend && npm test -- --testPathPattern="button.component.spec" --watchAll=false 2>&1 | tail -10
```

Expected: `PASS` — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/button.component.ts \
        frontend/src/app/shared/components/button.component.spec.ts
git commit -m "feat: narrow ButtonVariant to 4-tier system (cta/primary/outline/ghost/danger)"
```

---

## Task 2 — AppShellComponent rewrite

**Files:**
- Modify: `frontend/src/app/shared/components/app-shell/app-shell.component.ts`
- Modify: `frontend/src/app/shared/components/app-shell/app-shell.component.html`
- Modify: `frontend/src/app/shared/components/app-shell/app-shell.component.scss`
- Modify: `frontend/src/app/shared/components/app-shell/app-shell.component.spec.ts`

- [ ] **Step 1: Write updated spec first**

Replace entire `frontend/src/app/shared/components/app-shell/app-shell.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { AuthService } from '../../../core/auth/auth.service';

interface MockUser {
  id: string; email: string; name: string;
  plan: 'FREE' | 'PAY_PER_APP' | 'PRO' | 'free' | 'pay' | 'pro';
  emailVerified: boolean; twoFactorEnabled: boolean;
}

const mockUser: MockUser = {
  id: '1', email: 'test@test.de', name: 'Hans', plan: 'FREE',
  emailVerified: true, twoFactorEnabled: false,
};

function makeAuthMock(user: MockUser | null = mockUser) {
  return { user: () => user, logout: jest.fn().mockResolvedValue(undefined) };
}

async function setup(authMock = makeAuthMock()) {
  await TestBed.configureTestingModule({
    imports: [AppShellComponent],
    providers: [
      { provide: AuthService, useValue: authMock },
      provideRouter([]),
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(AppShellComponent);
  fixture.detectChanges();
  return { fixture, authMock };
}

describe('AppShellComponent', () => {
  it('renders sidebar nav links: Dashboard, Lebensläufe, LinkedIn', async () => {
    const { fixture } = await setup();
    const links = fixture.debugElement.queryAll(By.css('.shell__link'));
    const texts = links.map(l => (l.nativeElement as HTMLElement).textContent?.trim().split('\n')[0].trim());
    expect(texts).toContain('Dashboard');
    expect(texts).toContain('Lebensläufe');
    expect(texts).toContain('LinkedIn');
    expect(texts).not.toContain('Abrechnung');
    expect(texts).not.toContain('Sicherheit');
  });

  it('shows plan-lock badge on LinkedIn link for free user', async () => {
    const { fixture } = await setup();
    const lock = fixture.debugElement.query(By.css('.plan-lock'));
    expect(lock).not.toBeNull();
  });

  it('does not show plan-lock badge for PRO user', async () => {
    const { fixture } = await setup(makeAuthMock({ ...mockUser, plan: 'PRO' }));
    fixture.detectChanges();
    const lock = fixture.debugElement.query(By.css('.plan-lock'));
    expect(lock).toBeNull();
  });

  it('displays the user name', async () => {
    const { fixture } = await setup();
    const el = fixture.debugElement.query(By.css('.shell__username'));
    expect((el.nativeElement as HTMLElement).textContent?.trim()).toBe('Hans');
  });

  it('shows Free plan badge', async () => {
    const { fixture } = await setup();
    const badge = fixture.debugElement.query(By.css('.shell__plan'));
    expect((badge.nativeElement as HTMLElement).textContent?.trim()).toBe('Free');
    expect((badge.nativeElement as HTMLElement).classList).toContain('shell__plan--free');
  });

  it('shows Pro plan badge for PRO user', async () => {
    const { fixture } = await setup(makeAuthMock({ ...mockUser, plan: 'PRO' }));
    const badge = fixture.debugElement.query(By.css('.shell__plan'));
    expect((badge.nativeElement as HTMLElement).textContent?.trim()).toBe('Pro');
    expect((badge.nativeElement as HTMLElement).classList).toContain('shell__plan--pro');
  });

  it('calls auth.logout() when Abmelden is clicked', async () => {
    const authMock = makeAuthMock();
    const { fixture } = await setup(authMock);
    const btn = fixture.debugElement.query(By.css('button[aria-label="Abmelden"]'));
    (btn.nativeElement as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(authMock.logout).toHaveBeenCalledTimes(1);
  });

  it('opens Einstellungen modal when Einstellungen button is clicked', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance['einstellungenOpen']()).toBe(false);
    const btn = fixture.debugElement.query(By.css('button[aria-label="Einstellungen öffnen"]'));
    (btn.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance['einstellungenOpen']()).toBe(true);
  });
});
```

- [ ] **Step 2: Run spec — expect failures (old structure)**

```bash
cd frontend && npm test -- --testPathPattern="app-shell.component.spec" --watchAll=false 2>&1 | tail -20
```

Expected: `FAIL` — multiple tests fail because the shell still has the old top-bar structure.

- [ ] **Step 3: Rewrite `app-shell.component.ts`**

Replace entire file:

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { EinstellungenModalComponent } from '../einstellungen-modal/einstellungen-modal.component';

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

  protected readonly einstellungenOpen = signal(false);

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

- [ ] **Step 4: Rewrite `app-shell.component.html`**

Replace entire file:

```html
<div class="shell">
  <aside class="shell__sidebar" aria-label="Hauptnavigation">
    <a routerLink="/app" class="shell__logo" aria-label="Hireflow AI – Startseite">
      Hireflow AI
    </a>

    <nav class="shell__nav" aria-label="App-Navigation">
      <a
        routerLink="/app"
        routerLinkActive="is-active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="shell__link"
        aria-label="Dashboard"
      >
        <span class="shell__link-icon" aria-hidden="true">⊞</span>
        Dashboard
      </a>
      <a
        routerLink="/app/cvs"
        routerLinkActive="is-active"
        class="shell__link"
        aria-label="Lebensläufe"
      >
        <span class="shell__link-icon" aria-hidden="true">📄</span>
        Lebensläufe
      </a>
      <button
        type="button"
        class="shell__link shell__link--linkedin"
        (click)="linkedInClick()"
        [attr.aria-label]="isPro() ? 'LinkedIn-Optimierung' : 'LinkedIn – nur für Pro-Nutzer'"
      >
        <span class="shell__link-icon" aria-hidden="true">🔗</span>
        LinkedIn
        @if (!isPro()) {
          <span class="plan-lock" aria-label="Pro-Feature">Pro</span>
        }
      </button>
    </nav>

    <div class="shell__bottom">
      <div class="shell__user-row">
        <span
          class="shell__plan shell__plan--{{ planClass() }}"
          aria-label="Aktueller Plan: {{ planLabel() }}"
        >{{ planLabel() }}</span>
        <span class="shell__username">{{ auth.user()?.name }}</span>
      </div>
      <button
        type="button"
        class="shell__link"
        (click)="openEinstellungen()"
        aria-label="Einstellungen öffnen"
      >
        <span class="shell__link-icon" aria-hidden="true">⚙</span>
        Einstellungen
      </button>
      <button
        type="button"
        class="shell__link shell__link--logout"
        (click)="logout()"
        aria-label="Abmelden"
      >
        <span class="shell__link-icon" aria-hidden="true">→</span>
        Abmelden
      </button>
    </div>
  </aside>

  <main class="shell__content">
    <router-outlet />
  </main>
</div>

<lba-einstellungen-modal
  [open]="einstellungenOpen()"
  (closeModal)="einstellungenOpen.set(false)"
/>
```

- [ ] **Step 5: Rewrite `app-shell.component.scss`**

Replace entire file:

```scss
:host {
  display: contents;
}

.shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100dvh;
}

.shell__sidebar {
  background: var(--surface);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-3);
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow-y: auto;
}

.shell__logo {
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: -0.3px;
  text-decoration: none;
  color: var(--ink);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-4);
  display: block;

  &:hover { color: var(--accent); }
}

.shell__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.shell__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: var(--surface-2);
    color: var(--ink);
  }

  &.is-active {
    background: oklch(93% 0.010 255);
    color: var(--accent);
  }

  &--logout {
    color: var(--ink-3);
  }
}

.shell__link-icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
  flex-shrink: 0;
}

.shell__link--linkedin {
  justify-content: flex-start;
}

.plan-lock {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: oklch(94% 0.012 60);
  color: oklch(48% 0.14 60);
}

.shell__bottom {
  margin-top: auto;
  border-top: 1px solid var(--line);
  padding-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shell__user-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-1);
}

.shell__username {
  font-size: 12px;
  color: var(--ink-2);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shell__plan {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;

  &--free {
    background: color-mix(in oklch, var(--success) 15%, transparent);
    color: oklch(42% 0.14 155);
  }

  &--pay {
    background: color-mix(in oklch, var(--accent) 15%, transparent);
    color: var(--accent);
  }

  &--pro {
    background: color-mix(in oklch, oklch(58% 0.18 290) 15%, transparent);
    color: oklch(46% 0.18 290);
  }
}

.shell__content {
  background: var(--bg);
  overflow-y: auto;
  padding: var(--space-8);
  min-height: 100dvh;
}

@media (prefers-reduced-motion: reduce) {
  .shell__link { transition: none; }
}
```

- [ ] **Step 6: Run spec — expect pass**

```bash
cd frontend && npm test -- --testPathPattern="app-shell.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `PASS` — all 8 tests green. (The `EinstellungenModalComponent` import will compile once Task 3 is done. If the file doesn't exist yet, this step will fail — complete Task 3 first, then return here.)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/shared/components/app-shell/
git commit -m "feat: rewrite AppShell to left sidebar layout with Einstellungen modal trigger"
```

---

## Task 3 — EinstellungenModalComponent

**Files:**
- Create: `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.ts`
- Create: `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.html`
- Create: `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.scss`
- Create: `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.spec.ts`

> **Note:** Complete this task BEFORE running the AppShell spec in Task 2 Step 6, since the shell imports this component.

- [ ] **Step 1: Write the spec first**

Create `frontend/src/app/shared/components/einstellungen-modal/einstellungen-modal.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EinstellungenModalComponent } from './einstellungen-modal.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';

const mockAuth = { user: () => ({ id: '1', email: 'a@b.de', name: 'Hans', plan: 'PRO', emailVerified: true, twoFactorEnabled: false }), logout: jest.fn(), clearSession: jest.fn() };
const mockApi = { get: jest.fn().mockResolvedValue([]), post: jest.fn().mockResolvedValue({}), delete: jest.fn().mockResolvedValue({}), getBlob: jest.fn().mockResolvedValue(new Blob()) };

async function setup(open = true) {
  await TestBed.configureTestingModule({
    imports: [EinstellungenModalComponent],
    providers: [
      { provide: AuthService, useValue: mockAuth },
      { provide: ApiService, useValue: mockApi },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(EinstellungenModalComponent);
  fixture.componentRef.setInput('open', open);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture };
}

describe('EinstellungenModalComponent', () => {
  it('is hidden when open is false', async () => {
    const { fixture } = await setup(false);
    const backdrop = fixture.debugElement.query(By.css('.modal-backdrop'));
    expect(backdrop).toBeNull();
  });

  it('renders dialog when open is true', async () => {
    const { fixture } = await setup(true);
    const dialog = fixture.debugElement.query(By.css('[role="dialog"]'));
    expect(dialog).not.toBeNull();
  });

  it('shows Abrechnung tab by default', async () => {
    const { fixture } = await setup(true);
    const activeTab = fixture.debugElement.query(By.css('.modal-tab.is-active'));
    expect((activeTab.nativeElement as HTMLElement).textContent?.trim()).toBe('Abrechnung');
  });

  it('switches to Sicherheit tab on click', async () => {
    const { fixture } = await setup(true);
    const tabs = fixture.debugElement.queryAll(By.css('.modal-tab'));
    const sicherheit = tabs.find(t => (t.nativeElement as HTMLElement).textContent?.trim() === 'Sicherheit');
    (sicherheit!.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance['activeTab']()).toBe('sicherheit');
  });

  it('emits closeModal when ✕ button is clicked', async () => {
    const { fixture } = await setup(true);
    const emitted: void[] = [];
    fixture.componentInstance.closeModal.subscribe(() => emitted.push());
    const closeBtn = fixture.debugElement.query(By.css('button[aria-label="Schließen"]'));
    (closeBtn.nativeElement as HTMLButtonElement).click();
    expect(emitted.length).toBe(1);
  });

  it('emits closeModal when backdrop is clicked', async () => {
    const { fixture } = await setup(true);
    const emitted: void[] = [];
    fixture.componentInstance.closeModal.subscribe(() => emitted.push());
    const backdrop = fixture.debugElement.query(By.css('.modal-backdrop'));
    (backdrop.nativeElement as HTMLElement).click();
    expect(emitted.length).toBe(1);
  });

  it('has role="dialog" and aria-modal="true"', async () => {
    const { fixture } = await setup(true);
    const dialog = fixture.debugElement.query(By.css('[role="dialog"]'));
    expect(dialog.nativeElement.getAttribute('aria-modal')).toBe('true');
  });
});
```

- [ ] **Step 2: Run spec — expect compile error (component doesn't exist yet)**

```bash
cd frontend && npm test -- --testPathPattern="einstellungen-modal" --watchAll=false 2>&1 | tail -10
```

Expected: compile error — `Cannot find module './einstellungen-modal.component'`.

- [ ] **Step 3: Create `einstellungen-modal.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';
import { BillingComponent } from '../../../features/billing/billing.component';
import { SecurityComponent } from '../../../features/security/security.component';

type Tab = 'abrechnung' | 'sicherheit';

@Component({
  selector: 'lba-einstellungen-modal',
  standalone: true,
  imports: [BillingComponent, SecurityComponent],
  templateUrl: './einstellungen-modal.component.html',
  styleUrl: './einstellungen-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EinstellungenModalComponent {
  readonly open = input(false);
  readonly closeModal = output<void>();

  protected readonly activeTab = signal<Tab>('abrechnung');

  protected setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  protected onBackdropClick(): void {
    this.closeModal.emit();
  }

  protected onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.closeModal.emit();
    }
  }
}
```

- [ ] **Step 4: Create `einstellungen-modal.component.html`**

```html
@if (open()) {
  <div
    class="modal-backdrop"
    (click)="onBackdropClick()"
    aria-hidden="true"
  ></div>

  <div
    class="modal-panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="einstellungen-title"
    (click)="onDialogClick($event)"
  >
    <div class="modal-header">
      <h2 id="einstellungen-title" class="modal-title">Einstellungen</h2>
      <button
        type="button"
        class="modal-close btn btn--ghost btn--sm"
        (click)="closeModal.emit()"
        aria-label="Schließen"
      >✕</button>
    </div>

    <div class="modal-tabs" role="tablist" aria-label="Einstellungen-Bereiche">
      <button
        type="button"
        role="tab"
        class="modal-tab"
        [class.is-active]="activeTab() === 'abrechnung'"
        [attr.aria-selected]="activeTab() === 'abrechnung'"
        (click)="setTab('abrechnung')"
      >Abrechnung</button>
      <button
        type="button"
        role="tab"
        class="modal-tab"
        [class.is-active]="activeTab() === 'sicherheit'"
        [attr.aria-selected]="activeTab() === 'sicherheit'"
        (click)="setTab('sicherheit')"
      >Sicherheit</button>
    </div>

    <div class="modal-body" role="tabpanel">
      @if (activeTab() === 'abrechnung') {
        <lba-billing />
      }
      @if (activeTab() === 'sicherheit') {
        <lba-security />
      }
    </div>
  </div>
}
```

- [ ] **Step 5: Create `einstellungen-modal.component.scss`**

```scss
:host {
  display: contents;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1000;
}

.modal-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: min(640px, 95vw);
  max-height: 90vh;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.2px;
}

.modal-close {
  margin-left: auto;
}

.modal-tabs {
  display: flex;
  gap: 0;
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.modal-tab {
  padding: var(--space-3) var(--space-4);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
  margin-bottom: -1px;

  &:hover { color: var(--ink); }

  &.is-active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

@media (prefers-reduced-motion: reduce) {
  .modal-tab { transition: none; }
}
```

- [ ] **Step 6: Run spec — expect pass**

```bash
cd frontend && npm test -- --testPathPattern="einstellungen-modal" --watchAll=false 2>&1 | tail -15
```

Expected: `PASS` — all 7 tests green.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/shared/components/einstellungen-modal/
git commit -m "feat: add EinstellungenModal with Abrechnung and Sicherheit tabs"
```

---

## Task 4 — Route redirects + full verification

**Files:**
- Modify: `frontend/src/app/app.routes.ts`

- [ ] **Step 1: Add redirects for `/app/billing` and `/app/security`**

In `frontend/src/app/app.routes.ts`, replace the `billing` and `security` child routes:

```typescript
// BEFORE:
{ path: 'billing', loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent) },
// ...
{ path: 'security', loadComponent: () => import('./features/security/security.component').then(m => m.SecurityComponent) },

// AFTER:
{ path: 'billing',  redirectTo: '', pathMatch: 'full' },
{ path: 'security', redirectTo: '', pathMatch: 'full' },
```

The full updated children array inside the `AppShellComponent` route:

```typescript
children: [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'cvs', loadComponent: () => import('./features/master-cvs/master-cvs.component').then(m => m.MasterCvsComponent) },
  { path: 'billing',  redirectTo: '', pathMatch: 'full' },
  { path: 'wizard', loadComponent: () => import('./features/wizard/wizard.component').then(m => m.WizardComponent) },
  { path: 'security', redirectTo: '', pathMatch: 'full' },
  { path: 'linkedin', loadComponent: () => import('./features/linkedin/linkedin.component').then(m => m.LinkedInComponent) },
],
```

- [ ] **Step 2: Run full AppShell spec**

```bash
cd frontend && npm test -- --testPathPattern="app-shell.component.spec" --watchAll=false 2>&1 | tail -15
```

Expected: `PASS` — all 8 tests green.

- [ ] **Step 3: Run full test suite**

```bash
cd frontend && npm test -- --watchAll=false 2>&1 | tail -20
```

Expected: all test suites pass, exit 0. If any unrelated test fails due to the `ButtonVariant` type change (`'secondary'` or `'accent'` used in test fixtures), update those test fixtures to use `'outline'` or `'cta'` respectively.

- [ ] **Step 4: Run lint**

```bash
cd frontend && npm run lint 2>&1 | tail -10
```

Expected: no errors, exit 0.

- [ ] **Step 5: Run build**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

Expected: `Build at:` line, exit 0.

- [ ] **Step 6: Final commit**

```bash
git add frontend/src/app/app.routes.ts
git commit -m "feat: redirect /app/billing and /app/security to dashboard (now modals)"
```
