# Lebenslauf-Agent — Coding Rules

## Project layout

```
frontend/   Angular 21 SPA (standalone, zoneless, signals)
backend/    NestJS API (Node 20, TypeScript)
infra/      Docker-Compose, Caddy, deploy scripts
docs/       DSGVO templates (DSFA, VVT, TOM)
prompts/    LLM system prompts (cv-parser, job-parser, optimizer, letter-generator)
```

---

## Angular frontend rules

### Component scaffolding

Always generate components with the CLI — never write inline templates:

```bash
ng generate component features/my-feature/my-feature --standalone
ng generate component shared/components/my-widget --standalone
```

Every component MUST have exactly four files:

```
my-feature.component.ts        # @Component decorator, class logic
my-feature.component.html      # template — Angular block control flow
my-feature.component.scss      # component-scoped styles (BEM or utility)
my-feature.component.spec.ts   # Jest unit test
```

### @Component decorator

```typescript
@Component({
  selector: 'lba-my-feature',
  standalone: true,
  imports: [RouterLink],   // only what the template actually uses; for forms use ReactiveFormsModule
  templateUrl: './my-feature.component.html',
  styleUrl:    './my-feature.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

- `styleUrl` (singular) — Angular 17+ supports a single string.
- `changeDetection: OnPush` always — it's the angular.json schematics default.
- Do NOT import `CommonModule` — it's unnecessary with block control flow.

### Template syntax

Use the **Angular 17+ block control flow** syntax everywhere:

```html
@if (condition) { ... } @else { ... }
@for (item of items(); track item.id) { ... } @empty { <p>No items</p> }
@switch (value()) { @case ('a') { ... } @default { ... } }
@defer (on viewport) { <lba-heavy /> } @placeholder { <p>Loading…</p> }
```

**Never** use `*ngIf`, `*ngFor`, `*ngSwitch` structural directives.

### State management

- Signals only — `signal()`, `computed()`, `effect()`. No NgRx, no BehaviorSubject.
- `inject()` instead of constructor injection in components/directives.
- HTTP calls via `ApiService` (returns `Promise<T>` via `firstValueFrom`).

### Accessibility (WCAG 2.2 AAA — non-negotiable)

- Every interactive element needs a visible focus ring (`outline: 3px solid var(--accent)`).
- All images: `alt` attribute. Decorative images: `alt=""` + `aria-hidden="true"`.
- Form fields: `<label>` linked via `for`/`id` + `aria-describedby` for errors.
- Dynamic content: `aria-live="polite"` or `role="alert"`.
- Loading states: `aria-busy="true"` on the container, skeleton loaders not spinners.
- Animations: always check `prefers-reduced-motion`.

### Styling

- TailwindCSS utility classes + CSS custom properties from `styles.css` tokens.
- Component-specific overrides in `.scss` using `:host {}` and BEM modifiers.
- No inline `style=""` attributes in templates.

---

## NestJS backend rules

### Module structure

Every feature has: `module.ts`, `controller.ts`, `service.ts` — one concern per file.

### Validation

- All incoming request bodies validated with **Zod** (`body.parse()`), not class-validator.
- All LLM outputs validated with Zod schemas defined in `ai/provider.ts`.

### Auth

- `@UseGuards(JwtAuthGuard)` on every protected controller or route.
- `@RequirePlan(Plan.PRO)` + `PlanGuard` for plan-gated endpoints.
- `OwnsApplicationGuard` on any route that returns a user's resource by ID.

### Data

- Prisma for all DB access — never raw SQL.
- Files are **never** persisted to disk. Buffer lives in RAM max 60s.
- Validate magic bytes before processing uploads (`%PDF-` or `PK\x03\x04`).

### AI calls

- All calls go through `AiService` — never call providers directly from controllers.
- Every LLM output validated with its Zod schema before persisting.
- 3 auto-retries with stricter prompt on schema failure (see `ai.service.ts`).
- Prompt-injection defence: wrap user input in `<<<DELIMITER>>>...<<<END>>>`.

---

## Git / PR rules

- One feature per branch, named `feat/<slug>` or `fix/<slug>`.
- Commit messages: imperative, present tense ("Add wizard component").
- Never commit `.env` files — use `infra/.env.example` as reference.
- Run `ng lint` + `nest build` before pushing.

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
Use `--space-{n}` tokens or equivalent Tailwind utilities. No arbitrary pixel values.

| Token | Value | Tailwind equivalent |
|---|---|---|
| `--space-1` | 0.25rem | `p-1`, `gap-1` |
| `--space-2` | 0.5rem | `p-2`, `gap-2` |
| `--space-3` | 0.75rem | `p-3`, `gap-3` |
| `--space-4` | 1rem | `p-4`, `gap-4` |
| `--space-6` | 1.5rem | `p-6`, `gap-6` |
| `--space-8` | 2rem | `p-8`, `gap-8` |
| `--space-12` | 3rem | `p-12`, `gap-12` |
| `--space-16` | 4rem | `p-16`, `gap-16` |
| `--space-24` | 6rem | `p-24`, `gap-24` |

### Border radius
| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 4px | inputs, small chips |
| `--radius-md` | 8px | cards, buttons |
| `--radius-lg` | 16px | modals, large cards |
| `--radius-xl` | 24px | hero sections, large containers |
| `--radius-full` | 9999px | pills, avatars, badges |

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

---

## What is never implemented (V1 scope lock)

- File storage (no S3, no disk writes for user files)
- LinkedIn / Indeed / Xing API
- Browser extension
- SMTP relay (mail via Resend only)
- NgRx or other state libraries
- Cookie-based analytics (Plausible is cookieless)
