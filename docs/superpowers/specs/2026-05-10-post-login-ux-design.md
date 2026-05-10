---
title: Post-Login App Shell — UX & Feature Design
date: 2026-05-10
status: approved
---

# Post-Login App Shell — UX & Feature Design

## Overview

This document is the source of truth for every screen, interaction, and edge case in the post-login application experience. It covers the dashboard, new-application wizard, optimizer results/editor, CV library, and billing page. Implementation must satisfy all DOD requirements from CLAUDE.md.

---

## Design Principles

- **Visual language matches the landing page:** same CSS custom properties (`--accent`, `--bg`, `--surface`, `--ink`, etc.), same Geist font, same border-radius tokens. The app is light-themed (matching landing page).
- **No emoji in button text.** Decorative icons (e.g. in drop zones, stat cards) are acceptable.
- **Full viewport width.** No `max-width` constraints on page content — content fills the full screen width with consistent horizontal padding (`40px`).
- **Loading states are always skeleton loaders** — never spinners. `aria-busy="true"` on the containing region.
- **Errors always shown in `aria-live="polite"` region** — never silently swallowed.
- **Every smart component has `loading` and `error` signals.**

---

## Routes

| Path | Component | Guard |
|---|---|---|
| `/dashboard` | `DashboardComponent` | `JwtAuthGuard` |
| `/applications/new` | `NewApplicationComponent` | `JwtAuthGuard` |
| `/applications/:id` | `ApplicationEditorComponent` | `JwtAuthGuard` + `OwnsApplicationGuard` |
| `/cvs` | `CvLibraryComponent` | `JwtAuthGuard` |
| `/billing` | `BillingComponent` | `JwtAuthGuard` |

All routes redirect unauthenticated users to `/login`.

---

## Shared Shell

### Navbar (`lba-app-navbar` — shared/components)

Always visible at the top (sticky, `z-index: 100`). Height: 56px.

**Left:** Logo "LBA" — links to `/dashboard`.

**Center links:**
- Dashboard → `/dashboard`
- Meine Lebensläufe → `/cvs`
- Abrechnung → `/billing`

Active link: `color: var(--accent)`, `border-bottom: 2px solid var(--accent)`.

**Right:**
- Plan badge: `FREE` or `PRO` pill — color `var(--accent)`, background `var(--accent-tint)`
- Username: first name + last initial (e.g. "Dennis S.")
- Abmelden button: logs out, clears JWT, navigates to `/`

**Edge cases:**
- If JWT expires mid-session, any API call's 401 response triggers logout + redirect to `/login` with query param `?expired=1` so the login page can show "Deine Sitzung ist abgelaufen."
- Navbar is not shown on auth pages (`/login`, `/register`, `/reset-password`).

---

## 1. Dashboard (`/dashboard`)

### Hero Banner

Full-width gradient banner: `background: linear-gradient(135deg, var(--accent) 0%, oklch(52% 0.22 265) 100%)`.

- Heading: "Willkommen zurück, {firstName}" — no emoji.
- Subline: "Dein nächster Job wartet — erstelle jetzt eine optimierte Bewerbung."
- CTA button: "Neue Bewerbung" — white background, accent text — navigates to `/applications/new`.

**Edge case — free plan limit reached:** If the user already has 1 application (free tier limit), the CTA button still navigates to `/applications/new`. The limit is enforced server-side on POST; the wizard shows the upgrade modal after the user clicks the final optimize button (not before — let the user fill in inputs, then block at submission).

### Stats Strip

Three stat cards in a 3-column grid:

| Stat | Value source | Empty state |
|---|---|---|
| Lebensläufe | Count of user's saved CVs | 0 |
| Bewerbungen | Count of user's applications | 0 |
| Ø Match-Score | Average `matchScore` across all applications | "—" (em-dash) when no applications exist |

Cards are purely presentational — no click action.

**Loading state:** Replace each card content with skeleton rows during data fetch. `aria-busy="true"` on the stats section.

**Error state:** Show a single `aria-live="polite"` error message below the stats: "Statistiken konnten nicht geladen werden." with a "Erneut versuchen" retry button that re-triggers the fetch.

### Application Table

#### Columns

| Column | Content | Width |
|---|---|---|
| Unternehmen | Company name (bold) | 1fr |
| Stelle | Job title | 1fr |
| Match-Score | Colored pill | 110px |
| Status | Toggle (Offen / Erledigt) | 110px |
| Erstellt | Date `dd.MM.yyyy` | 90px |
| Aktionen | Öffnen + Löschen buttons | 80px |

#### Match-Score Pill Colors

- ≥ 80%: green (`var(--good-tint)` bg, dark green text)
- 60–79%: amber (`var(--warn-tint)` bg, dark amber text)
- < 60%: red (`var(--bad-tint)` bg, dark red text)

#### Status Toggle (in table row)

Inline toggle — colored dot + label. Click cycles between Offen and Erledigt. Triggers `PATCH /api/applications/:id { status }` immediately on click. Optimistic UI update — revert on API error with `aria-live` message "Status konnte nicht geändert werden."

#### Row Click

Clicking anywhere on the row (except the action buttons) navigates to `/applications/:id`.

#### "Öffnen" button

Same as row click — navigates to `/applications/:id`.

#### "Löschen" button

Opens delete confirmation modal (see below). Does not navigate.

#### Empty State

When `applications.length === 0`:
- Title: "Noch keine Bewerbungen"
- Subline: "Erstelle deine erste optimierte Bewerbung in weniger als 2 Minuten."
- CTA button: "Erste Bewerbung erstellen" → navigates to `/applications/new`

#### Loading State

Skeleton rows: 3 placeholder rows with animated shimmer. `aria-busy="true"` on table container.

#### Error State

"Bewerbungen konnten nicht geladen werden." with "Erneut versuchen" button. Displayed in `aria-live="polite"` region.

### Delete Confirmation Modal (Dashboard + CV Library)

Triggered by "Löschen" button on any row.

- Title: "Wirklich löschen?"
- Body text: "Diese Aktion kann nicht rückgängig gemacht werden."
- Buttons: "Abbrechen" (ghost) | "Ja, löschen" (red/danger)
- Escape key closes modal. Click on backdrop closes modal.
- On confirm: `DELETE /api/applications/:id` (or `/api/cvs/:id`). On success: remove from list. On error: close modal + show `aria-live` error "Löschen fehlgeschlagen. Bitte erneut versuchen."

---

## 2. New Application Wizard (`/applications/new`)

Single-page form — no multi-step stepper. All inputs visible at once.

### CV Panel (left column)

**Tabs:** "PDF hochladen" | "Text einfügen" — tab state persists for the session.

**PDF Tab:**
- Drag-and-drop zone. Click also opens file picker.
- Accepted types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max size: 10 MB — validated client-side before upload. Error: "Datei ist zu groß (max. 10 MB)."
- On valid drop/select: parse text server-side — show skeleton while parsing, then populate the text tab with the parsed text and switch to text tab so user can verify.
- On invalid file type: "Nur PDF oder DOCX-Dateien werden unterstützt."
- On server parse error: "Lebenslauf konnte nicht gelesen werden. Bitte wechsle zu 'Text einfügen'."

**Text Tab:**
- Textarea, placeholder: "Deinen Lebenslauf-Text hier einfügen…"
- No character limit shown; backend validates minimum 100 chars — if shorter: "Lebenslauf ist zu kurz. Bitte füge mehr Inhalt ein."

**Saved CVs row (below both tabs):**
- Shows chips for all saved CVs. Click on a chip: loads that CV's text into the text tab and switches to text tab.
- If no saved CVs: row hidden entirely.

**Edge case — no CV provided:** Optimize button disabled + tooltip "Bitte lade einen Lebenslauf hoch oder füge Text ein." if neither PDF uploaded nor text entered.

### Job Posting Panel (right column)

- Textarea, placeholder: "Stellentext hier einfügen…"
- No character limit shown; backend validates minimum 50 chars — if shorter: "Stellenanzeige ist zu kurz."
- **Edge case — no job text:** Optimize button disabled.

### Keyword Tag Cloud

Appears **after** job text is entered (not empty). Keywords are extracted client-side via a debounced heuristic (split on whitespace, filter stopwords, deduplicate) AND server-side once optimizer runs.

**Before first optimization** (wizard state): Keywords are pre-extracted from the job text on the fly (simple client-side heuristic — no API call yet). This gives the user something to interact with immediately.

**Tag states (cycle on click: include → maybe → exclude → include):**
- Include (default for most): solid accent background — "wird ins CV eingebaut"
- Maybe: amber background — "nur wenn vorhanden"
- Exclude: strikethrough, muted — "ignorieren"

**Edge case — no keywords detected:** Section hidden. The optimizer still runs without keyword hints.

### "CV optimieren und Anschreiben erstellen" Button

- Full width, accent style.
- Disabled if: no CV text AND no PDF uploaded, OR no job text.
- On click → free plan check:
  - If user has ≥ 1 existing application AND plan is FREE → show upgrade modal (do not submit).
  - If within limit → navigate to loading state (same route, step=loading) and POST to `/api/applications` with `{ cvText, jobText, keywords: { include: [], maybe: [], exclude: [] } }`.
- **Network error during submission:** "Optimierung konnte nicht gestartet werden. Bitte prüfe die Eingaben und versuche es erneut." in `aria-live="polite"`.

### Upgrade Modal (Free Plan Limit)

Triggered when free user tries to create second application.

- Title: "Dein Free-Limit ist erreicht"
- Body: "Du hast deine kostenlose Bewerbung bereits erstellt. Wähle einen Plan um unbegrenzt Bewerbungen zu optimieren."
- Plan cards: "Pay-per-App" (€2,49 / Bewerbung) | "Pro" (€9,99 / Monat, marked as popular)
- CTA: "Plan wählen und upgraden" → links to `/billing`
- Secondary: "Vielleicht später" → closes modal
- Escape / backdrop click → closes modal

---

## 3. Loading State

Displayed while `POST /api/applications` is processing (estimated 15–30 seconds).

The page transitions to a loading view (same URL, loading flag in component state):

- Section heading: "Optimierung läuft…" — skeleton header
- Animated progress text cycles: "CV wird analysiert…" → "Keywords werden abgeglichen…" → "Anschreiben wird erstellt…" → "Wird fertiggestellt…" (every 4s)
- Two skeleton cards below (representing CV preview and Anschreiben preview)
- No cancel button — the operation cannot be cancelled (fire-and-forget on backend)

**Timeout:** If no response after 90 seconds, show error: "Die Optimierung dauert länger als erwartet. Bitte prüfe dein Dashboard — deine Bewerbung könnte trotzdem erstellt worden sein." + "Zum Dashboard" button.

**Success:** Navigate to `/applications/:id` (new application's ID returned in API response).

**Error (non-timeout):** Show error message with "Erneut versuchen" button that re-submits the same payload.

---

## 4. Application Editor (`/applications/:id`)

Shown after optimization completes (or when opening an existing application from the dashboard).

### Page Header

- Title: "{companyName} — {jobTitle}"
- Right: "Zurück zur Eingabe" button (accent-tint style) — navigates back to `/applications/new` with the current application's data pre-filled (cvText, jobText).

### Match Score Card

- Ring SVG showing percentage (87% = 87% of circumference filled with `var(--accent)`).
- Score text centered in ring.
- Score label: "Sehr guter Match — {score}% ATS-Score" (or "Guter Match" / "Ausbaufähiger Match" based on score band)
- Keyword pills: green pills for matched keywords, red pills for missing keywords (from the optimizer response).
- Right: "Anschreiben neu generieren" button (accent-tint) — triggers new generation (see Regeneration below).

### Optimized CV Editor

- Full-width editable textarea with the optimized CV text (pre-filled from API response).
- Autosave: debounced 1.5s after user stops typing → `PATCH /api/applications/:id/cv { cvText }`. On save success: badge shows "Gespeichert". On save error: badge shows "Speichern fehlgeschlagen" in red.
- No explicit save button — autosave only.

**Edge case — simultaneous edits:** Not in scope (single user, single session).

### Download Buttons (below CV editor)

Three buttons in a row:
- "CV als PDF" → `GET /api/applications/:id/export/cv` → triggers PDF download
- "Anschreiben als PDF" → `GET /api/applications/:id/export/letter` (uses the currently selected letter variant)
- "Beide zusammen herunterladen" → `GET /api/applications/:id/export/bundle` → ZIP with both PDFs

**Edge case — no letter chosen:** "Anschreiben als PDF" and "Beide zusammen" use the first letter (Formal) as default if user hasn't explicitly chosen.

**Edge case — download error:** Show `aria-live` message "Download fehlgeschlagen. Bitte erneut versuchen."

### Cover Letter Cards

Three cards side by side: Formal, Freundlich, Knapp.

Each card:
- Variant label (uppercase, muted)
- Editable textarea (pre-filled with generated letter variant)
- "Auswählen" / "Gewählt" button at bottom

**Selection:** Click "Auswählen" → `PATCH /api/applications/:id { selectedLetterVariant: 'formal' | 'friendly' | 'brief' }`. Optimistic UI — selected card gets accent border + "Gewählt" badge. Only one card selected at a time.

**Editing:** Each textarea autosaves on blur → `PATCH /api/applications/:id/letters/:variant { text }`. Same autosave feedback as CV editor.

**Default:** Formal is selected by default when the application is first created.

**Edge case — letter save error:** "Anschreiben konnte nicht gespeichert werden." in `aria-live` region.

### Regeneration ("Anschreiben neu generieren")

Clicking the regeneration button:
1. Confirm dialog (browser native or custom): "Alle 3 Anschreiben werden neu generiert. Deine manuellen Änderungen gehen verloren. Fortfahren?"
2. On confirm: POST to `/api/applications/:id/regenerate-letters` with the current (possibly edited) cvText.
3. Loading state: letter cards replaced with skeleton loaders. `aria-busy="true"`.
4. On success: new letter texts replace current content in all 3 cards. Selected variant resets to Formal.
5. On error: "Neu-Generierung fehlgeschlagen. Bitte erneut versuchen." in `aria-live`.

### Application Status Toggle

At the bottom of the editor page.

- Label: "Bewerbungsstatus" + subline "Halte deinen Status aktuell"
- Two buttons: "Offen" | "Erledigt"
- Active button highlighted in the relevant color (amber for Offen, green for Erledigt).
- On click: `PATCH /api/applications/:id { status: 'open' | 'done' }`. Optimistic update. On error: revert + `aria-live` message.

**Initial state:** Always "Offen" for newly created applications.

---

## 5. CV Library (`/cvs`)

### Upload Panel

**Tabs:** "PDF hochladen" | "Text einfügen"

**Name input:** Required text field. Placeholder: "Name für diesen Lebenslauf (z.B. Mein CV Deutsch 2024)". Validated client-side: min 3 chars.

**PDF Tab:** Same drag-and-drop zone as wizard (10 MB, PDF/DOCX only). Same error messages.

**Text Tab:** Textarea for raw text.

**"Lebenslauf speichern" button:**
- Disabled if: name empty OR (no file selected AND text tab empty)
- On click: `POST /api/cvs { name, text }` (text extracted server-side from PDF if uploaded).
- On success: new CV appears at top of list, upload panel resets.
- On error: "Lebenslauf konnte nicht gespeichert werden." in `aria-live`.
- Free plan: no CV limit (CVs are free to store).

### CV List

Each CV item shows:
- File icon (decorative)
- CV name (editable via inline rename)
- Meta: upload date, language badge (DE/EN — detected from text), list of applications that used this CV (comma-separated company names, or "Noch nicht verwendet")
- "In Bewerbung verwenden" button → navigates to `/applications/new` with this CV pre-selected
- "Löschen" button → opens delete modal

#### Inline Rename

Click "Umbenennen" → CV name text becomes an input field (inline, no modal). On blur or Enter: `PATCH /api/cvs/:id { name }`. On success: update displayed name. On error: revert to old name + `aria-live` message "Umbenennen fehlgeschlagen."

**Edge case — empty name on save:** Revert to previous name.

#### Delete CV

Delete modal (same as dashboard delete modal). On confirm: `DELETE /api/cvs/:id`. On success: remove from list.

**Edge case — CV used in existing applications:** The CV text is copied into the application at creation time, so deleting a CV does NOT affect existing applications. No warning needed.

#### Empty State (no CVs)

Title: "Noch kein Lebenslauf gespeichert"
Subline: "Füge deinen ersten Lebenslauf hinzu um ihn in zukünftigen Bewerbungen schnell wiederverwenden zu können."

#### Loading State

Skeleton items (3 placeholder rows). `aria-busy="true"`.

#### Error State

"Lebensläufe konnten nicht geladen werden." + "Erneut versuchen".

---

## 6. Billing Page (`/billing`)

### Current Plan Card

Shows current plan (FREE or PRO) as a colored chip, plan name, and description.

- FREE: "1 Bewerbung inklusive · Alle Grundfunktionen"
- PRO: "Unbegrenzte Bewerbungen · Priorität-Support"

"Upgraden" button (accent style) → opens upgrade modal.

**If already PRO:** "Upgraden" replaced with "Kündigen" (ghost button, red text) → links to external customer portal (Stripe portal URL).

### DSGVO Card

- "Daten exportieren" (ghost button) → `GET /api/users/me/export` → downloads ZIP of all user data (CVs, applications, account info).
- "Account löschen" (danger button) → opens delete account modal:
  - Title: "Account wirklich löschen?"
  - Body: "Alle deine Daten, Lebensläufe und Bewerbungen werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
  - Buttons: "Abbrechen" | "Account löschen" (red)
  - On confirm: `DELETE /api/users/me` → logout → redirect to `/` with query `?deleted=1`.

### Loading State

Skeleton for plan card while fetching user info. `aria-busy="true"`.

### Error State

"Kontoinformationen konnten nicht geladen werden." + "Erneut versuchen".

---

## API Contract Summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/applications` | JWT | List user's applications |
| POST | `/api/applications` | JWT | Create + optimize new application |
| GET | `/api/applications/:id` | JWT + Owns | Get single application |
| PATCH | `/api/applications/:id` | JWT + Owns | Update status / selectedLetterVariant |
| PATCH | `/api/applications/:id/cv` | JWT + Owns | Autosave CV text |
| PATCH | `/api/applications/:id/letters/:variant` | JWT + Owns | Autosave letter text |
| POST | `/api/applications/:id/regenerate-letters` | JWT + Owns | Regenerate all 3 letters |
| GET | `/api/applications/:id/export/cv` | JWT + Owns | Download CV PDF |
| GET | `/api/applications/:id/export/letter` | JWT + Owns | Download selected letter PDF |
| GET | `/api/applications/:id/export/bundle` | JWT + Owns | Download ZIP with both |
| DELETE | `/api/applications/:id` | JWT + Owns | Delete application |
| GET | `/api/cvs` | JWT | List user's saved CVs |
| POST | `/api/cvs` | JWT | Save new CV |
| PATCH | `/api/cvs/:id` | JWT + Owns | Rename CV |
| DELETE | `/api/cvs/:id` | JWT + Owns | Delete CV |
| GET | `/api/users/me` | JWT | Get current user (plan, name) |
| GET | `/api/users/me/export` | JWT | Export all user data |
| DELETE | `/api/users/me` | JWT | Delete account |

---

## Data Models

### Application (Prisma)

```prisma
model Application {
  id                   String   @id @default(cuid())
  userId               String
  companyName          String
  jobTitle             String
  cvText               String   @db.Text
  optimizedCvText      String   @db.Text
  jobText              String   @db.Text
  matchScore           Int
  matchedKeywords      String[] // array of matched keyword strings
  missedKeywords       String[] // array of missed keyword strings
  letterFormal         String   @db.Text
  letterFriendly       String   @db.Text
  letterBrief          String   @db.Text
  selectedLetterVariant String  @default("formal") // "formal" | "friendly" | "brief"
  status               String   @default("open")   // "open" | "done"
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### CV (Prisma)

```prisma
model Cv {
  id         String   @id @default(cuid())
  userId     String
  name       String
  text       String   @db.Text
  language   String   @default("de") // detected from text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Frontend Component Architecture

### Smart (Container) Components — `features/`

| Component | Route | Signals |
|---|---|---|
| `DashboardComponent` | `/dashboard` | `applications`, `stats`, `loading`, `error` |
| `NewApplicationComponent` | `/applications/new` | `cvText`, `jobText`, `keywords`, `uploading`, `submitting`, `loading`, `error` |
| `ApplicationEditorComponent` | `/applications/:id` | `application`, `loading`, `error`, `saving`, `regenerating` |
| `CvLibraryComponent` | `/cvs` | `cvs`, `loading`, `error`, `uploading`, `saving` |
| `BillingComponent` | `/billing` | `user`, `loading`, `error` |

### Dumb (Presentational) Components — `shared/components/`

| Component | Inputs | Outputs |
|---|---|---|
| `AppNavbarComponent` | `user: User`, `plan: 'free' \| 'pro'` | `logoutRequested` |
| `StatCardComponent` | `label: string`, `value: string \| number`, `sub?: string` | — |
| `ApplicationTableComponent` | `applications: Application[]` | `openRequested(id)`, `deleteRequested(id)`, `statusChanged(id, status)` |
| `ScoreRingComponent` | `score: number` | — |
| `KeywordTagCloudComponent` | `keywords: Keyword[]` | `keywordsChanged(keywords)` |
| `CoverLetterCardComponent` | `variant: string`, `text: string`, `chosen: boolean` | `chosen(variant)`, `textChanged(text)` |
| `CvListItemComponent` | `cv: Cv` | `useRequested(id)`, `deleteRequested(id)`, `renamed(id, name)` |
| `ConfirmDeleteModalComponent` | `open: boolean`, `title: string`, `body: string` | `confirmed`, `cancelled` |
| `UpgradeModalComponent` | `open: boolean` | `upgradeRequested`, `dismissed` |
| `SkeletonBlockComponent` | `lines?: number`, `height?: string` | — |

---

## Error Handling

### Backend

All service methods throw typed NestJS exceptions:
- `NotFoundException` — resource not found or not owned by user
- `ForbiddenException` — `OwnsApplicationGuard` fails
- `BadRequestException` — Zod validation failure, file too large, unsupported type
- `InternalServerErrorException` — AI pipeline failure (with user-safe message, never raw LLM error)
- `PaymentRequiredException (402)` — free plan limit reached

### Frontend

Every smart component:

```typescript
readonly loading = signal(false);
readonly error = signal<string | null>(null);

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

Error messages are displayed in `<div aria-live="polite" role="status">` — always visible in DOM, conditionally populated.

5xx errors show: "Etwas ist schiefgelaufen — bitte versuche es erneut."
402 (plan limit) shows the upgrade modal — not an error message.
401 (expired JWT) triggers logout redirect — see Navbar section.

---

## Accessibility (WCAG 2.2 AAA — mandatory)

- All interactive elements have visible focus ring (`outline: 3px solid var(--accent)` — already global in `styles.css`)
- All form inputs have `<label>` linked via `for`/`id` + `aria-describedby` for error messages
- Textarea placeholders are supplementary — not the only label
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title. Focus trapped inside modal while open. Escape closes.
- Loading regions: `aria-busy="true"` on container, skeleton loaders (no spinners)
- Dynamic content (errors, autosave badge, status change): `aria-live="polite"`
- Alert-level content (modal confirmation): `role="alert"`
- Score ring SVG: `aria-label="{score}% ATS-Match"`, `role="img"`
- Status toggle: `aria-pressed="true/false"` on each button
- Delete buttons: `aria-label="Bewerbung löschen: {company} {role}"` (not just "Löschen")
- Minimum touch target: 44×44px on all interactive elements
- Animations: all transitions respect `prefers-reduced-motion` — disable transform animations

---

## Definition of Done — Verification Steps

For **every** new component or endpoint, the following must pass before the task is closed:

### Backend
1. `cd backend && npm run lint` → exit 0
2. `cd backend && npm test` → exit 0
   - Service: happy path + error paths + Zod validation + guard presence
   - Controller: response shape, guard metadata via `Reflect.getMetadata`

### Frontend
3. `cd frontend && npm run lint` → exit 0
4. `cd frontend && npm test -- --watchAll=false` → exit 0
   - Smart component: `loading` signal true during async, `error` signal set on HttpErrorResponse, correct service method called
   - Dumb component: renders inputs correctly, emits correct outputs, required ARIA attributes present
5. `cd frontend && npm run build` → exit 0

### Component file checklist (Angular)
Every component must have exactly 4 files generated via CLI:
```bash
ng generate component features/my-feature/my-feature --standalone
```
- `my-feature.component.ts` — OnPush, signals, inject(), `templateUrl`, `styleUrl`
- `my-feature.component.html` — @if/@for control flow, no *ngIf/*ngFor
- `my-feature.component.scss` — `:host {}` root, CSS tokens, no inline styles, no hardcoded colors
- `my-feature.component.spec.ts` — Jest tests

### Never
- CommonModule imported
- `style=""` in templates
- Hardcoded hex colors (use CSS custom properties)
- Spinners (use skeleton loaders)
- Silent error swallowing
- Template-driven forms (use ReactiveFormsModule)
- NgRx or BehaviorSubject (use signals)
