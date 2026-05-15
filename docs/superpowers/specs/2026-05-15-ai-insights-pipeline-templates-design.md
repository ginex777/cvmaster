# Design Spec: AI Insights, Pipeline Filter & Template Library

**Date:** 2026-05-15
**Status:** Approved
**Areas:** B (AI Quality), D (UX/Dashboard), E (Documents & Templates)

---

## Overview

Three independent features to be implemented sequentially, each with its own implementation plan:

1. **B — AI Insights Tab** — ATS scoring + AI change transparency in the application editor
2. **D — Pipeline Filter & Search** — Global search and filter chips on the dashboard pipeline board
3. **E — Template Library + Cover Letter Tone** — Two new CV templates and a tone selector for cover letter generation

---

## Feature B: AI Insights Tab

### What it does

Adds a new **„Analyse"** tab to the application editor (alongside Lebenslauf / Anschreiben / Export / E-Mail). The tab shows two panels:

1. **ATS Score** — a 0–100 score with a quality label (Sehr gut / Gut / Verbesserungswürdig), a score ring, and a quick-stats sidebar (keyword count, format check, CV length assessment, employment gap check)
2. **AI Change Diff** — a per-change breakdown of what the AI optimizer modified and why, shown as before/after diffs with a one-line reasoning label per change

### Where the data comes from

- **ATS Score** is computed at generation time by a new backend service (`AtsService`) that compares the optimized CV against the parsed job's `mustHaves`, `niceToHaves`, `skills`, and `responsibilities`. The score is persisted to `Application.atsScore` (new field) and `Application.atsReport` (JSON, new field).
- **Keyword coverage** derives from `atsReport.foundKeywords[]` and `atsReport.missingKeywords[]`, split into must-have (red) and optional (orange).
- **Change diff** is computed at generation time by comparing `masterCv.parsedJson` (before) to `application.optimizedCv` (after). Diff is persisted to `Application.optimizationDiff` (JSON array, new field). Each diff entry has: `section`, `field`, `before`, `after`, `reason` (extracted from the optimizer LLM output via a new Zod schema field).

### ATS Score algorithm

```
score = 0
for each mustHave keyword:
  +8 pts if found in skills or any bullet text (case-insensitive)
for each niceToHave keyword:
  +3 pts if found
format bonus: +5 if CV has no section longer than 600 words
length bonus: +5 if total bullets count is between 6 and 20
max: 100 (clamped)
```

This runs in `AtsService.computeScore(parsedCv, parsedJob): AtsReport` — pure function, no LLM call, deterministic.

### Data model changes

```prisma
model Application {
  // ... existing fields ...
  atsScore       Int?
  atsReport      Json?   // { foundKeywords: string[], missingKeywords: { keyword: string, required: boolean }[], formatOk: boolean, lengthOk: boolean, gapCount: number }
  optimizationDiff Json? // Array<{ section: string, field: string, before: string, after: string, reason: string }>
}
```

### Backend changes

- New `AtsService` in `backend/src/applications/ats.service.ts` — `computeScore()` pure function
- `ai-pipeline.processor.ts` — after `optimizeCv` stage, call `AtsService.computeScore()` and persist `atsScore`, `atsReport`, `optimizationDiff`
- `ApplicationsService.findOne()` — include `atsScore`, `atsReport`, `optimizationDiff` in the returned fields
- The optimizer prompt (`prompts/optimizer.txt`) gets one additional instruction: for each changed bullet, append a `reason` field in the output JSON explaining the change in one sentence. Zod schema for optimizer output updated accordingly.

### Frontend changes

- New **„Analyse"** tab in `application-editor.component` tab bar
- New dumb component `shared/components/ats-panel/ats-panel` — inputs: `atsScore`, `atsReport`, `optimizationDiff`. Outputs: none.
- `ats-panel` template has two sections:
  - **Score section**: score ring (reuses `score-ring` component), quick-stats list, keyword chips (green = found, red = must-have missing, orange = optional missing)
  - **Diff section**: list of diff entries rendered as before/after blocks with reason label
- If `atsScore` is `null` (old applications before this feature): show a neutral state — „Analyse nicht verfügbar für ältere Bewerbungen. Erstelle eine neue Bewerbung, um den ATS-Score zu sehen."
- The existing `matchScore` (0–100, currently AI-generated) is **replaced** by `atsScore` everywhere in the UI. The `matchScore` field on `Application` is kept in the DB for backwards compatibility but no longer written to for new applications.

### Error handling

- If `AtsService.computeScore()` throws (malformed CV/job data): log error, set `atsScore = null`, continue generation — never block the pipeline
- Frontend: if `atsScore === null`, show neutral state (not an error state)

### Testing

**Backend:**
- `AtsService` unit tests: keyword found, keyword missing, score clamped at 100, score with zero mustHaves returns only format/length bonus points (0–10)
- `ai-pipeline.processor` integration test: mock `AtsService`, verify `atsScore` persisted after `optimizeCv`

**Frontend:**
- `AtsPanel` unit tests: renders score ring with correct value, green/red/orange chips correctly categorized, diff entries rendered, null-score neutral state shown

---

## Feature D: Pipeline Filter & Search

### What it does

Adds a **toolbar above the pipeline board** with:
- A **global search input** that filters cards by job title or company name (client-side, real-time)
- **Filter chips** for: minimum match score threshold, reminder active/inactive, date range (this week / this month / all)
- A **result count** showing how many applications match the current filter
- **Filtered-out columns** are dimmed (opacity 0.4) but not hidden — user can always see the full pipeline shape
- **Matched search terms** are highlighted inline on card titles with a `<mark>` element styled in accent color

No drag & drop. Move buttons stay exactly as they are.

### Architecture

All filtering is **client-side** — no new API calls. The `PipelineBoard` dumb component already receives `applications[]` as input. We add a new sibling smart component `PipelineBoardToolbar` (or extend the dashboard component) that:

1. Holds `searchQuery = signal('')`, `minScore = signal<number | null>(null)`, `hasReminder = signal<boolean | null>(null)`, `dateRange = signal<'week' | 'month' | null>(null)`
2. Exposes a `filteredApplications = computed(...)` that applies all active filters
3. Passes `filteredApplications()` to `<lba-pipeline-board>` instead of raw `data().recentApplications`

The toolbar is extracted as a new dumb component `shared/components/pipeline-toolbar/pipeline-toolbar` with:
- `input`: `totalCount: number`
- `output`: `filterChange: PipelineFilter` (object with all filter state)

The dashboard smart component owns the signal state and wires `filterChange` output to update its signals.

### PipelineFilter interface

```typescript
interface PipelineFilter {
  query: string;
  minScore: number | null;
  hasReminder: boolean | null;
  dateRange: 'week' | 'month' | null;
}
```

### Search highlighting

`PipelineBoard` receives `highlightQuery = input<string>('')`. Cards use a pipe `HighlightPipe` (new, in `shared/pipes/`) that wraps matched substrings in `<mark class="pipeline__highlight">`. The pipe is pure and memoizes on `(text, query)`.

### Data model changes

None — all client-side.

### Backend changes

None.

### Frontend changes

- New dumb component: `shared/components/pipeline-toolbar/pipeline-toolbar` (.ts / .html / .scss / .spec.ts)
- New pipe: `shared/pipes/highlight.pipe.ts` + `highlight.pipe.spec.ts`
- `DashboardComponent` — add `filterState = signal<PipelineFilter>(defaultFilter)`, `filteredApplications = computed(...)`, wire toolbar output
- `PipelineBoard` — add `highlightQuery = input<string>('')`, pass to cards, use `HighlightPipe`
- `PipelineBoard` — add `dimmedColumns = computed(() => new Set(columns where appsForColumn(col).length === 0 after filter))` inside the component; columns in this set render at opacity 0.4

### Testing

**Frontend:**
- `PipelineToolbar`: emits `filterChange` on search input, emits on chip toggle, shows result count
- `HighlightPipe`: wraps match in `<mark>`, case-insensitive, no match returns original string
- `DashboardComponent`: `filteredApplications` returns correct subset for each filter combination

---

## Feature E: Template Library + Cover Letter Tone

### What it does

**Template Library:**
- Adds 2 new CV templates: **Minimal** and **Executive** (total: 5)
- Each template card in `CvTemplatePicker` shows a **static HTML mini-preview** of the actual CV layout (scaled with `transform: scale(0.18)` inside a fixed-height container), not abstract gray blocks
- Mini-previews are Angular components: `MiniPreviewClassic`, `MiniPreviewModern`, `MiniPreviewEditorial`, `MiniPreviewMinimal`, `MiniPreviewExecutive` — each in `shared/components/cv-mini-preview/`

**Cover Letter Tone:**
- A new `tone` field on `Application` model: `'formal' | 'modern' | 'creative'`, default `'formal'`
- A **tone selector** is added below the template picker in the wizard and application editor. It shows 3 cards (Formell / Modern / Kreativ) with an example sentence and an emoji indicator
- The selected tone is passed to the letter-generator prompt: a new `{{tone}}` variable is injected into `prompts/letter-generator.txt` with per-tone style instructions
- Tone can be changed after generation — changing it triggers a re-generation of only the cover letter (new `PATCH /applications/:id/tone` endpoint that updates the field and re-queues letter generation)

### New CV template designs

**Minimal:**
- White/light gray background, no sidebar
- Name in medium-weight sans-serif (not bold)
- Section headings in small-caps, letter-spaced gray
- Thin horizontal rules as dividers
- Skills as comma-separated inline text (no chips)
- Maximum whitespace

**Executive:**
- Dark navy header band (background `#0f1729`) with white name + role
- Body on white with slate color palette
- Section headings in small caps, navy color
- No decorative elements — authority through restraint
- Skills inline, slightly larger than body text

### Data model changes

```prisma
model Application {
  // ... existing fields ...
  coverLetterTone String @default("formal") // "formal" | "modern" | "creative"
}
```

### Backend changes

- `backend/prisma/schema.prisma` — add `coverLetterTone String @default("formal")`
- New migration: `add_cover_letter_tone`
- New endpoint: `PATCH /applications/:id/tone` — validates `{ tone: z.enum(['formal','modern','creative']) }`, updates field, re-queues letter generation job only
- `ApplicationsController` — add `@Patch(':id/tone')` guarded with `JwtAuthGuard` + `OwnsApplicationGuard`
- `ApplicationsService` — add `updateTone(id, userId, tone)` that calls `findOne()`, updates field, enqueues `generateCoverLetter` job
- `prompts/letter-generator.txt` — add tone instruction block: formal = traditional German business letter style, modern = direct first-person confident, creative = personal storytelling opening
- PDF generation — Minimal and Executive templates added as new cases in `pdf/cv-templates/`: `minimal.template.ts`, `executive.template.ts`, following the same `CvTemplate` interface as existing templates

### Frontend changes

- `CvTemplatePicker` — extend to render 5 cards; each card uses a `lba-cv-mini-preview` component with `[template]="'minimal'"` etc. input
- New components in `shared/components/cv-mini-preview/`: one component per template (5 total), each renders scaled-down HTML that matches the PDF layout
- New dumb component: `shared/components/cover-letter-tone-picker/cover-letter-tone-picker` — inputs: `selectedTone`, outputs: `toneChange`. Shows 3 cards with example text.
- `ApplicationEditorComponent` — add tone picker below template picker, wire `toneChange` output to `PATCH /applications/:id/tone`
- `WizardComponent` — tone picker appears alongside the template picker in the same wizard step, below the template grid, before the user proceeds to generation

### Testing

**Backend:**
- `ApplicationsService.updateTone()`: updates field, re-queues letter job, throws `ForbiddenException` for wrong user
- `PATCH /applications/:id/tone` controller test: correct guard presence, correct service call
- Letter-generator prompt: manual eval fixture test for each tone (formal/modern/creative) verifying style markers in output

**Frontend:**
- `CoverLetterTonePicker`: renders 3 options, emits `toneChange` on selection, selected option has active style
- `CvTemplatePicker`: renders 5 cards, mini-preview component present per card
- `CvMiniPreview*` components: renders without errors for each template type

---

## Implementation Order

These three features are independent and can be implemented in any order. Recommended sequence based on complexity and user impact:

1. **E (Templates + Tone)** — purely additive, no AI pipeline changes, highest visibility to users
2. **D (Pipeline Filter)** — entirely client-side, low risk, improves daily workflow
3. **B (AI Insights)** — requires prompt changes + new DB fields + pipeline stage, most complex

Each feature gets its own implementation plan via the writing-plans skill.

---

## Definition of Done (per feature)

Each feature is complete when:
- Backend: controller, service, module wired — no stubs
- Backend unit tests pass for all new services and controllers
- Frontend: all four component files exist (.ts / .html / .scss / .spec.ts)
- Frontend unit tests pass (signal state, outputs, ARIA)
- `cd backend && npm run lint && npm test` — exit 0
- `cd frontend && npm run lint && npm test -- --watchAll=false && npm run build` — exit 0
- No TypeScript errors (`tsc --noEmit`)
