# Claude Code Workflow Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure CLAUDE.md, project settings.json, and the Angular test runner so that every feature is developed end-to-end with consistent style, error handling, accessibility, and automated verification.

**Architecture:** Three independent changes — (1) project-level Claude Code permissions, (2) CLAUDE.md workflow rules, (3) Angular test runner migrated from Karma/Jasmine to Jest. No feature code is touched.

**Tech Stack:** Angular 21, NestJS 10, Jest 29, jest-preset-angular, ESLint, TypeScript

---

## File Map

| File | Action | What changes |
|---|---|---|
| `.claude/settings.json` | Modify | Add pre-allowed Bash commands for lint/test/build |
| `CLAUDE.md` | Modify | Append 5 new sections after Git/PR rules |
| `frontend/package.json` | Modify | Remove karma deps, add jest deps, update test script |
| `frontend/jest.config.ts` | Create | jest-preset-angular configuration |
| `frontend/setup-jest.ts` | Create | Angular Jest bootstrap |
| `frontend/tsconfig.spec.json` | Modify | Switch types from jasmine → jest |
| `frontend/angular.json` | Modify | Remove karma test architect entry |

---

## Task 1: Update project settings.json with pre-allowed commands

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 1: Open the file and replace its contents**

Replace `c:\Users\Schuh\Desktop\repo-skeleton\.claude\settings.json` with:

```json
{
  "permissions": {
    "allow": [
      "Bash(cd backend && npm run lint)",
      "Bash(cd backend && npm test)",
      "Bash(cd backend && npm run build)",
      "Bash(cd frontend && npm run lint)",
      "Bash(cd frontend && npm test -- --watchAll=false)",
      "Bash(cd frontend && npm run build)",
      "Bash(ng generate *)",
      "Bash(npm install *)"
    ]
  }
}
```

- [ ] **Step 2: Verify the file is valid JSON**

Run: `cat .claude/settings.json`
Expected: file prints cleanly with no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add .claude/settings.json
git commit -m "chore: pre-allow lint/test/build commands in Claude settings"
```

---

## Task 2: Add workflow rules to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Append the Definition of Done section**

Open `CLAUDE.md` and add the following after the existing `## Git / PR rules` section:

```markdown
---

## Definition of Done — mandatory for every feature

A task is ONLY complete when ALL of the following are true.

### Scope: full-stack end-to-end
- Backend (NestJS): controller, service, module wired up — no stubs, no TODOs
- Backend unit tests: spec file for every new service and controller (Jest)
- Frontend (Angular): component (.ts + .html + .scss + .spec.ts) — all four files, generated via CLI
- Frontend unit tests: spec file covers key signal state changes, outputs, and template bindings (Jest)
- Frontend error handling: every smart component must have `loading` and `error` signals, all errors shown to the user via `aria-live` region — no silent failures
- Frontend a11y: every new component must meet WCAG 2.2 AAA — labels, focus rings, contrast, keyboard navigation, `aria-*` attributes, `prefers-reduced-motion` — non-negotiable
- Both sides talk to each other (API contract matches)

### Verification — run in order, fix all errors before declaring done
1. `cd backend && npm run lint`
2. `cd backend && npm test`
3. `cd frontend && npm run lint`
4. `cd frontend && npm test -- --watchAll=false`
5. `cd frontend && npm run build`

All commands must exit with code 0. No skipping, no "it probably works."

### Style check (self-review before running lint)
- Angular: OnPush, signals, inject(), templateUrl/styleUrl, @if/@for control flow
- Angular forms: always Reactive Forms (`FormGroup`, `FormControl`) — never `NgModel` or template-driven forms
- Angular error handling: `loading` signal + `error` signal on every smart component, error displayed in `aria-live="polite"` region
- Angular a11y (WCAG 2.2 AAA — mandatory on every component):
  - All inputs have `<label>` linked via `for`/`id` + `aria-describedby` for errors
  - All images have `alt`; decorative images have `alt=""` + `aria-hidden="true"`
  - All interactive elements have visible focus ring (`outline: 3px solid var(--accent)`)
  - Dynamic content uses `aria-live="polite"` or `role="alert"`
  - Loading states use `aria-busy="true"` + skeleton loaders, never spinners
  - All animations respect `prefers-reduced-motion`
  - Minimum touch target 44×44px
- NestJS: Zod validation, JwtAuthGuard on protected routes, no raw SQL
- No CommonModule imports, no *ngIf/*ngFor, no inline styles, no hardcoded colours

### One feature at a time
Work backend → frontend → tests → lint → build in sequence.
Never leave a half-implemented feature to start another.
Never declare a feature done if any verification step has not been run and passed.

---

## Angular component architecture — smart / dumb split

### Smart (container) components
- Live in `features/` — one per route/page
- Own signals: `signal()`, `computed()`, `effect()`
- Call services via `inject()`
- Handle routing, HTTP, error state
- Always have `readonly loading = signal(false)` and `readonly error = signal<string | null>(null)`
- Pass data DOWN to dumb components via `@Input()` / `input()`
- Listen to events UP from dumb components via `output()`
- Do NOT contain presentational logic or inline styles

### Dumb (presentational) components
- Live in `shared/components/` — reusable across features
- Receive all data via `input.required<T>()` (signal inputs preferred)
- Emit user actions via `output<T>()` — never call services directly
- No internal signal state beyond what is derived from inputs
- No feature-specific assumptions — must work with any data passed in
- Have their own `.spec.ts` testing input → rendered output

### Rule of thumb
If a component needs to call `ApiService`, `AuthService`, or `Router` — it is **smart** and belongs in `features/`.
If a component only renders data and emits events — it is **dumb** and belongs in `shared/components/`.

### Forms
- Always use **Reactive Forms** (`FormGroup`, `FormControl`, `Validators`) — never `NgModel`
- Form validation errors are exposed via `FormControl.errors` and displayed with `aria-describedby`
- Zod schema for the same shape must exist on the backend — frontend and backend validation must match

---

## Error handling

### Backend (NestJS)
- Throw NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`, `InternalServerErrorException`
- Never throw generic `Error` from controllers or services — always use typed NestJS exceptions
- Zod parse failures → catch and re-throw as `BadRequestException` with the Zod error message
- AI pipeline failures → catch and re-throw as `InternalServerErrorException` with a user-safe message (never expose raw LLM errors to the client)
- NestJS global exception filter produces this shape for all errors:
  ```json
  { "statusCode": 400, "message": "...", "error": "Bad Request" }
  ```

### Frontend (Angular)
- `ApiService` wraps HTTP calls with `firstValueFrom` — errors surface as thrown exceptions in `async` methods
- Every smart component that calls a service handles errors explicitly:
  ```typescript
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.data.set(await this.api.getSomething());
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Unbekannter Fehler'
      );
    } finally {
      this.loading.set(false);
    }
  }
  ```
- Error messages are displayed via `aria-live="polite"` — never silently swallowed
- Loading states use skeleton loaders (not spinners), `aria-busy="true"` on the container
- 4xx errors → show user-facing message in the component
- 5xx errors → show generic "Etwas ist schiefgelaufen, bitte versuche es erneut" + log to Sentry

---

## Testing conventions

Both frontend and backend use **Jest** as the test runner.

### Backend (NestJS — Jest)

**What to test in services:**
- Happy path: correct return value for valid input
- Error path: correct NestJS exception thrown for invalid/not-found/forbidden input
- Zod validation: invalid input throws `BadRequestException`
- AI calls: mock `AiService` — verify correct schema and prompt args are passed

**What to test in controllers:**
- Presence of guards (verify via `Reflect.getMetadata` or snapshot)
- Response shape matches the expected DTO — business logic stays in the service

**Mock pattern:**
```typescript
const mockCvsService = { findAll: jest.fn(), create: jest.fn() };

beforeEach(async () => {
  const module = await Test.createTestingModule({
    controllers: [CvsController],
    providers: [{ provide: CvsService, useValue: mockCvsService }],
  }).compile();
  controller = module.get(CvsController);
});
```

**Naming:**
```typescript
describe('CvsService', () => {
  describe('create', () => {
    it('throws NotFoundException when user does not exist', async () => { ... });
    it('returns ParsedCV on valid PDF upload', async () => { ... });
  });
});
```

### Frontend (Angular — Jest via jest-preset-angular)

**What to test in smart components:**
- `loading` signal is `true` during async call, `false` after
- `error` signal set to message string when API throws `HttpErrorResponse`
- Correct service method called with correct arguments

**What to test in dumb components:**
- Renders correctly for each `input()` variant
- Emits correct `output()` event when user interacts
- Required ARIA attributes present (role, aria-label, aria-live)

**Setup pattern:**
```typescript
import { TestBed } from '@angular/core/testing';
import { ScoreRingComponent } from './score-ring.component';

describe('ScoreRingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreRingComponent],
    }).compileComponents();
  });

  it('renders the score value', () => {
    const fixture = TestBed.createComponent(ScoreRingComponent);
    fixture.componentRef.setInput('value', 85);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('85');
  });
});
```

**Do not test:**
- Implementation details of Angular internals (`ChangeDetectorRef`, zone ticks)
- Exact pixel layout or CSS values
- Logic already covered by backend tests

---

## Style guide

All visual decisions use the design tokens from `frontend/src/styles.css`. Never hardcode colours, spacing, or radii.

### Colour tokens
| Token | Use |
|---|---|
| `--bg` | page background |
| `--bg-2` | card / elevated surface |
| `--ink` | primary text |
| `--ink-2` | secondary text |
| `--ink-3` | placeholder / disabled text |
| `--accent` | primary interactive (buttons, links, focus ring) |
| `--accent-2` | hover state of accent |
| `--success` | positive states, high match score |
| `--warning` | caution states, medium match score |
| `--danger` | errors, destructive actions, low match score |

### Typography
- Body: `var(--font-sans)` — Geist / Inter
- Headings: `var(--font-display)` — Geist
- Code: `var(--font-mono)` — Geist Mono
- Never set `font-family` inline — always use the CSS custom property

### Spacing
Use `--space-{n}` tokens or equivalent Tailwind utilities (`p-4`, `gap-6`). No arbitrary pixel values.

### Border radius
| Token | Use |
|---|---|
| `--radius-sm` | inputs, small chips |
| `--radius-md` | cards, buttons |
| `--radius-lg` | modals, large cards |
| `--radius-full` | pills, avatars, badges |

### Shadows
`--shadow-sm / md / lg` only — never raw `box-shadow` values.

### Component styling rules
- Component styles in `.scss` using `:host {}` as root
- BEM modifiers for variants: `.lba-button--primary`, `.lba-button--ghost`
- Tailwind utilities in templates for layout (flex, grid, gap, padding)
- Never `style=""` attribute in templates
- Never `!important`
- Dark mode: not in V1 — do not add dark-mode tokens or classes

### Focus & accessibility
- Focus ring already applied globally in `styles.css`: `outline: 3px solid var(--accent)` on `:focus-visible`
- Never suppress focus ring with `outline: none`
- Minimum touch target: 44×44px
```

- [ ] **Step 2: Verify the sections were added correctly**

Run: `grep -n "Definition of Done\|smart / dumb\|Error handling\|Testing conventions\|Style guide" CLAUDE.md`
Expected: all five section headings are found.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add definition of done, component patterns, error handling, testing, and style guide to CLAUDE.md"
```

---

## Task 3: Migrate Angular from Karma/Jasmine to Jest

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/jest.config.ts`
- Create: `frontend/setup-jest.ts`
- Modify: `frontend/tsconfig.spec.json`
- Modify: `frontend/angular.json`

### Step 3a — Update package.json

- [ ] **Step 1: Remove Karma/Jasmine dev dependencies and add Jest**

In `frontend/package.json`, replace the `devDependencies` block and `scripts.test` as follows.

Remove these devDependencies:
```
"@types/jasmine"
"jasmine-core"
"karma"
"karma-chrome-launcher"
"karma-coverage"
"karma-jasmine"
"karma-jasmine-html-reporter"
```

Add these devDependencies:
```json
"@types/jest": "^29.5.0",
"jest": "^29.7.0",
"jest-preset-angular": "^14.0.0",
"ts-jest": "^29.2.0"
```

Update the `test` script:
```json
"test": "jest --watchAll=false"
```

Final `scripts` block:
```json
"scripts": {
  "start": "ng serve",
  "build": "ng build",
  "test": "jest --watchAll=false",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "playwright test",
  "lint": "ng lint",
  "lint:fix": "ng lint --fix",
  "format": "prettier --write \"src/**/*.{ts,html,scss,css}\"",
  "format:check": "prettier --check \"src/**/*.{ts,html,scss,css}\"",
  "a11y": "axe http://localhost:4200"
}
```

- [ ] **Step 2: Install updated dependencies**

Run: `cd frontend && npm install`
Expected: installs without errors. `node_modules/jest` and `node_modules/jest-preset-angular` directories exist.

### Step 3b — Create Jest config files

- [ ] **Step 3: Create `frontend/jest.config.ts`**

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterFramework: ['<rootDir>/setup-jest.ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  coverageDirectory: '../coverage/frontend',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/main.server.ts',
    '!src/app/app.config.ts',
  ],
};

export default config;
```

- [ ] **Step 4: Create `frontend/setup-jest.ts`**

```typescript
import 'jest-preset-angular/setup-jest';
```

### Step 3c — Update TypeScript and Angular config

- [ ] **Step 5: Update `frontend/tsconfig.spec.json`**

Replace the entire file with:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "types": ["jest"]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts",
    "setup-jest.ts"
  ]
}
```

- [ ] **Step 6: Remove karma test builder from `frontend/angular.json`**

In `frontend/angular.json`, delete the entire `"test"` architect entry (lines 64–74) so `ng test` no longer points to karma:

```json
"architect": {
  "build": { ... },
  "serve": { ... },
  "extract-i18n": { ... },
  "lint": {
    "builder": "@angular-eslint/builder:lint",
    "options": {
      "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"]
    }
  }
}
```

The `test` entry is removed entirely. Tests are now run via `npm test` (jest), not `ng test`.

### Step 3d — Verify migration

- [ ] **Step 7: Run existing component tests to verify jest works**

Run: `cd frontend && npm test -- --watchAll=false`

Expected output:
```
PASS src/app/shared/components/card.component.spec.ts
PASS src/app/shared/components/pill.component.spec.ts
PASS src/app/shared/components/score-ring.component.spec.ts
PASS src/app/shared/components/keyword-bar.component.spec.ts

Test Suites: 4 passed, 4 total
Tests:       X passed, X total
```

If any test fails due to jasmine-specific APIs (`jasmine.createSpy` etc.), replace with jest equivalents:
- `jasmine.createSpy('name')` → `jest.fn()`
- `jasmine.createSpyObj('name', ['method'])` → `{ method: jest.fn() }`
- `spyOn(obj, 'method')` → `jest.spyOn(obj, 'method')`

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/jest.config.ts frontend/setup-jest.ts frontend/tsconfig.spec.json frontend/angular.json
git commit -m "chore: migrate Angular test runner from Karma/Jasmine to Jest"
```

---

## Final Verification

- [ ] **Run the full Definition of Done verification sequence**

```bash
cd backend && npm run lint
cd backend && npm test
cd frontend && npm run lint
cd frontend && npm test -- --watchAll=false
cd frontend && npm run build
```

All five commands must exit with code 0.

- [ ] **Commit any remaining changes**

```bash
git add -A
git status  # verify nothing unexpected is staged
git commit -m "chore: complete Claude Code workflow setup"
```
