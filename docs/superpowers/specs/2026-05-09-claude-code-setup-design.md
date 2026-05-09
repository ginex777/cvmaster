---
title: Claude Code Workflow Setup
date: 2026-05-09
status: approved
---

# Claude Code Workflow Setup

## Goal

Configure Claude Code for the Lebenslauf-Agent project so that:
- Every feature is delivered end-to-end (backend + frontend + unit tests) before being declared done
- Verification (lint, tests, build) runs automatically without permission prompts
- Claude never jumps between partial features — one task is completed fully before the next begins
- Code style, component architecture, error handling, and testing patterns are consistent across the whole codebase

---

## What changes

### 1. CLAUDE.md — Definition of Done

Added after the existing Git/PR rules section.

```markdown
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
4. `cd frontend && npm test -- --watch=false`
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
```

---

### 2. CLAUDE.md — Smart / Dumb Component Pattern

```markdown
## Angular component architecture — smart / dumb split

### Smart (container) components
- Live in `features/` — one per route/page
- Own signals: `signal()`, `computed()`, `effect()`
- Call services via `inject()`
- Handle routing, HTTP, error state
- Pass data DOWN to dumb components via `@Input()` (or signal inputs)
- Listen to events UP from dumb components via `@Output()` / `output()`
- Do NOT contain presentational logic or inline styles

### Dumb (presentational) components
- Live in `shared/components/` — reusable across features
- Receive all data via `@Input()` (required inputs preferred: `input.required<T>()`)
- Emit user actions via `output<T>()` — never call services directly
- No signal state of their own (only `input()` signals derived from parent)
- Must work with any data passed in — no feature-specific assumptions
- Have their own `.spec.ts` testing inputs → rendered output

### Rule of thumb
If a component needs to call `ApiService`, `AuthService`, or `Router` — it is smart and belongs in `features/`.
If a component only renders data and emits events — it is dumb and belongs in `shared/components/`.

### Naming
- Smart: `lba-dashboard`, `lba-application-editor`, `lba-cv-upload`
- Dumb: `lba-button`, `lba-card`, `lba-score-ring`, `lba-keyword-bar`, `lba-pill`

### Forms
- Always use **Reactive Forms** (`FormGroup`, `FormControl`, `Validators`) — never `NgModel`
- Form validation errors are exposed via `FormControl.errors` and displayed with `aria-describedby`
- Zod schema for the same shape must exist on the backend — frontend and backend validation must match
```

---

### 3. CLAUDE.md — Error handling patterns

```markdown
## Error handling

### Backend (NestJS)
- Throw NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`, `InternalServerErrorException`
- Never throw generic `Error` from controllers or services — always use typed NestJS exceptions
- Zod parse failures → catch and re-throw as `BadRequestException` with the Zod error message
- AI pipeline failures → catch and re-throw as `InternalServerErrorException` with a user-safe message (never expose raw LLM error to client)
- All exceptions are caught by NestJS global exception filter — response shape is always:
  ```json
  { "statusCode": 400, "message": "...", "error": "Bad Request" }
  ```

### Frontend (Angular)
- `ApiService` wraps all HTTP calls with `firstValueFrom` — errors surface as thrown exceptions in `async` methods
- Every smart component that calls a service must handle errors explicitly:
  ```typescript
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  async loadData() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.data.set(await this.api.getSomething());
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Unbekannter Fehler');
    } finally {
      this.loading.set(false);
    }
  }
  ```
- Error messages are displayed via `aria-live="polite"` region — never silently swallowed
- Loading states use skeleton loaders (not spinners), `aria-busy="true"` on the container
- 4xx errors → show user-facing message in the component
- 5xx errors → show generic "Etwas ist schiefgelaufen, bitte versuche es erneut" message + log to Sentry
```

---

### 4. CLAUDE.md — Testing conventions

```markdown
## Testing conventions

Both frontend and backend use **Jest** as the test runner.

### Backend (NestJS — Jest)
Test every service method and controller route. Use `@nestjs/testing` `Test.createTestingModule`.

**What to test in services:**
- Happy path: correct return value for valid input
- Error path: correct exception thrown for invalid input / not found / forbidden
- Zod validation: invalid input throws `BadRequestException`
- AI calls: mock `AiService` — test that correct schema and prompt args are passed

**What to test in controllers:**
- Guard presence (snapshot or decorator check) — not business logic (that lives in the service)
- Response shape matches the DTO

**Mock pattern:**
```typescript
const mockService = { findOne: jest.fn(), create: jest.fn() };
providers: [{ provide: CvsService, useValue: mockService }]
```

**Naming:** `describe('CvsService', () => { describe('create', () => { it('throws NotFoundException when user not found', ...) }) })`

### Frontend (Angular — Jest via jest-preset-angular)
Test every smart component's signal logic and every dumb component's input→output contract.

**What to test in smart components:**
- Signal state after async operations (loading → data / error)
- Error signal set correctly when API throws
- Correct service method called with correct args

**What to test in dumb components:**
- Renders correctly for each `@Input()` variant
- Emits correct `output()` event when user interacts
- ARIA attributes present (role, aria-label, aria-live) for a11y

**Avoid testing:**
- Implementation details of Angular internals
- Exact DOM structure that may change with styling
- Anything already covered by the backend tests

**Setup pattern:**
```typescript
await TestBed.configureTestingModule({
  imports: [MyComponent],
}).compileComponents();
const fixture = TestBed.createComponent(MyComponent);
```
```

---

### 5. CLAUDE.md — Style guide

```markdown
## Style guide

All visual decisions use the design tokens defined in `frontend/src/styles.css`. Never hardcode colours, spacing, or radii — always use tokens.

### Colour tokens
| Token | Use |
|---|---|
| `--bg` | page background |
| `--bg-2` | card / elevated surface background |
| `--ink` | primary text |
| `--ink-2` | secondary text |
| `--ink-3` | placeholder / disabled text |
| `--accent` | primary interactive (buttons, links, focus ring) |
| `--accent-2` | hover state of accent |
| `--success` | positive states, match score high |
| `--warning` | caution states, match score medium |
| `--danger` | errors, destructive actions, match score low |

### Typography
- Body text: `var(--font-sans)` (Geist / Inter)
- Headings: `var(--font-display)` (Geist)
- Code / mono: `var(--font-mono)` (Geist Mono)
- Never set `font-family` inline — use the CSS custom property

### Spacing
Use `--space-{n}` tokens for margin/padding. Do not use arbitrary pixel values.
Tailwind spacing utilities (`p-4`, `gap-6`) map to the same scale and are preferred in templates.

### Border radius
| Token | Use |
|---|---|
| `--radius-sm` | inputs, small chips |
| `--radius-md` | cards, buttons |
| `--radius-lg` | modals, large cards |
| `--radius-full` | pills, avatars, badges |

### Shadows
Use `--shadow-sm / md / lg` — never `box-shadow` with raw values.

### Component styling rules
- Component-specific styles go in `.scss` using `:host {}` as root
- Use BEM modifiers for variants: `.lba-button--primary`, `.lba-button--ghost`
- Tailwind utilities in templates for layout (flex, grid, gap, padding)
- Never use `style=""` attribute in templates
- Never use `!important`
- Dark mode: not in V1 — do not add dark mode tokens or classes

### Focus & accessibility
- All interactive elements: `outline: 3px solid var(--accent)` on `:focus-visible` (already in global reset)
- Do not suppress the focus ring with `outline: none`
- Minimum touch target: 44×44px (WCAG 2.2 AAA)
```

---

### 6. .claude/settings.json — pre-allowed commands

```json
{
  "permissions": {
    "allow": [
      "Bash(cd backend && npm run lint)",
      "Bash(cd backend && npm test)",
      "Bash(cd backend && npm run build)",
      "Bash(cd frontend && npm run lint)",
      "Bash(cd frontend && npm test -- --watch=false)",
      "Bash(cd frontend && npm run build)",
      "Bash(ng generate *)",
      "Bash(npm install *)"
    ]
  }
}
```

---

## What does NOT change

- No stop hooks — verification runs at feature completion, not after every Claude turn
- No global settings changes — all changes are project-scoped
- Existing CLAUDE.md coding rules remain unchanged — this only adds new sections

---

## Summary of all new CLAUDE.md sections

| Section | Purpose |
|---|---|
| Definition of Done | enforces full-stack + tests + lint + build before done |
| Smart/Dumb component pattern | prevents fat components, encourages reuse |
| Error handling patterns | consistent try/catch, signal state, ARIA live regions |
| Testing conventions | what to test, what to mock, naming, patterns (Jest everywhere) |
| Style guide | tokens, BEM, no hardcoded values, focus rings |

---

## Migration note: Angular → Jest

The frontend is currently scaffolded with Jasmine/Karma (Angular default).
Switch to Jest via `jest-preset-angular` as part of the first feature implementation.
Commands after migration:
- `cd frontend && npm test -- --watch=false` (Jest, replaces `ng test --watch=false`)
- No change to the definition of done commands
