# CV Template System — Design Spec

**Date:** 2026-05-10
**Status:** Approved

---

## Goal

Users can assign one of three visual PDF templates to each MasterCv. The template determines the layout when a CV PDF is generated for download. The choice persists on the MasterCv and is selectable inline in the CV library — no modal required.

---

## Decisions Made

| Question | Decision |
|---|---|
| Where is template stored? | On `MasterCv` — one template per source CV |
| How many templates? | 3: Classic, Modern, Editorial |
| Default template | `modern` |
| Where does the user pick? | Inline on the CV card in the library (no modal) |
| Save mechanism | Optimistic update — PATCH fires immediately on click, rolls back on error |
| Renderer architecture | Separate renderer files per template, shared utility module |

---

## Data Model

### Prisma — `MasterCv`

Add one field:

```prisma
model MasterCv {
  id             String   @id @default(cuid())
  userId         String
  name           String
  language       String
  parsedJson     Json
  sourceFilename String
  sourceHash     String
  containsArt9   Boolean  @default(false)
  template       String   @default("modern")   // 'classic' | 'modern' | 'editorial'
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  // relations unchanged
}
```

Migration name: `add-masterCv-template`

### TypeScript type

```typescript
// backend/src/pdf/renderers/renderer.interface.ts
export type CvLayout = 'classic' | 'modern' | 'editorial';

export interface CvRenderer {
  render(data: CvPdfData): Promise<Uint8Array>;
}
```

`CvLayout` replaces the existing definition in `pdf.service.ts` (`'modern' | 'clean' | 'editorial'`). All existing references to `'clean'` become `'classic'`.

---

## Backend

### File Structure

```
backend/src/pdf/
  renderers/
    renderer.interface.ts      ← CvLayout type + CvRenderer interface
    pdf-utils.ts               ← shared: wordWrap, pageBreak, sanitize (extracted from pdf.service.ts)
    classic.renderer.ts        ← single-column serif layout
    modern.renderer.ts         ← two-column sidebar layout
    editorial.renderer.ts      ← dark header, pill tags
  pdf.service.ts               ← updated: dispatcher only, delegates to renderers
```

### Renderer Interface

```typescript
export interface CvRenderer {
  render(data: CvPdfData): Promise<Uint8Array>;
}
```

### `pdf-utils.ts` — Shared Utilities

Extracted from current `pdf.service.ts`:
- `sanitizeText(text: string): string`
- `wrapText(text: string, maxChars: number): string[]`
- `addPageIfNeeded(page, y, lineHeight, doc): { page, y }` — returns a new page if `y` would overflow

### Classic Renderer (`classic.renderer.ts`)

- A4 single column, margins 50pt left/right/top, 40pt bottom
- Fonts: `Helvetica` (body 10pt), `Helvetica-Bold` (headings 12pt, name 20pt)
- Name at top in 20pt bold, contact line in 9pt gray below
- Section headings in 12pt bold with a 0.5pt horizontal rule below
- Bullet points with `·` prefix, 12pt indent
- Skills rendered as bordered inline chips
- Color palette: near-black ink `rgb(0.08, 0.07, 0.16)`, gray `rgb(0.4, 0.4, 0.4)`

### Modern Renderer (`modern.renderer.ts`)

- A4 two-column layout: sidebar 38% width (225pt), main 62% (370pt)
- Sidebar background: filled rectangle in accent color `rgb(0.22, 0.35, 0.90)` (matches `oklch(58% 0.20 255)`)
- Sidebar content: name 14pt bold white, role 8pt white 70% opacity, contact items 7.5pt white, skill bars (filled rectangles), language list
- Main column: section labels in 9pt bold accent-colored, job title 9pt bold, job meta 7.5pt gray, bullets with `▸` prefix
- Page break: if sidebar overflows, extend sidebar fill rectangle onto new page
- Default template — used for new MasterCvs unless changed

### Editorial Renderer (`editorial.renderer.ts`)

- A4 single column, margins 50pt
- Header block: full-width filled dark rectangle `rgb(0.06, 0.09, 0.18)` at top (80pt tall), name in 18pt heavy white, role in 8pt accent-colored uppercase, contact right-aligned in 7.5pt white
- Skills rendered as inline pill outlines (rounded rectangles stroked in accent color, 7.5pt accent text)
- Section titles: 8pt bold uppercase gray, followed by a hairline rule extending full width
- Job title + date on same line (title left, date right)
- Company name in accent color 8pt
- Bullets with `—` prefix in light gray

### `pdf.service.ts` — Updated Dispatcher

```typescript
async generateCvPdf(data: CvPdfData, template: CvLayout = 'modern'): Promise<Uint8Array> {
  const renderer = this.getRenderer(template);
  return renderer.render(data);
}

private getRenderer(template: CvLayout): CvRenderer {
  switch (template) {
    case 'classic':   return new ClassicRenderer();
    case 'editorial': return new EditorialRenderer();
    default:          return new ModernRenderer();
  }
}
```

### API Changes

#### `PATCH /cvs/:id` — Add `template` to Zod schema

```typescript
const UpdateCvSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  template: z.enum(['classic', 'modern', 'editorial']).optional(),
});
```

Both fields remain optional — a request can update name only, template only, or both.

#### `GET /applications/:id/pdf` — Read template from MasterCv

```typescript
// In applications.controller.ts / applications.service.ts
const masterCv = await this.prisma.masterCv.findUniqueOrThrow({ where: { id: app.masterCvId } });
const template = (masterCv.template ?? 'modern') as CvLayout;
const pdfBytes = await this.pdfService.generateCvPdf(pdfData, template);
```

Same for the bundle ZIP endpoint — reads `masterCv.template` before generating the CV PDF inside the archive.

### Error Handling

- Unknown `template` value from DB → `default` branch in switch → falls back to `ModernRenderer`, never throws
- `render()` failure → caught in `ApplicationsService`, re-thrown as `InternalServerErrorException('PDF-Generierung fehlgeschlagen')`

---

## Frontend

### New Component: `CvTemplatePickerComponent`

**Location:** `frontend/src/app/shared/components/cv-template-picker/`  
**Files:** `.ts`, `.html`, `.scss`, `.spec.ts` (generated via CLI)

```typescript
@Component({
  selector: 'lba-cv-template-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvTemplatePickerComponent {
  readonly template = input.required<'classic' | 'modern' | 'editorial'>();
  readonly templateChange = output<'classic' | 'modern' | 'editorial'>();
}
```

**Template options rendered as 3 buttons:**

```html
@for (opt of options; track opt.value) {
  <button
    type="button"
    class="picker-btn"
    [class.picker-btn--active]="template() === opt.value"
    (click)="templateChange.emit(opt.value)"
    [attr.aria-pressed]="template() === opt.value"
    [attr.aria-label]="'Template: ' + opt.label"
  >
    {{ opt.label }}
  </button>
}
```

Options array (static):
```typescript
readonly options = [
  { value: 'classic',   label: 'Classic'   },
  { value: 'modern',    label: 'Modern'    },
  { value: 'editorial', label: 'Creative'  },
] as const;
```

**Styles (`.scss`):**
- Buttons: `border: 1px solid var(--line)`, `border-radius: var(--radius-sm)`, `padding: 4px 10px`, `font-size: 12px`
- Active: `border-color: var(--accent)`, `background: color-mix(in oklch, var(--accent), transparent 90%)`, `color: var(--accent)`
- Hover: `border-color: var(--accent-border)`, `background: var(--accent-tint)`
- Min touch target: 44px height on each button
- Focus ring: `outline: 3px solid var(--accent)` on `:focus-visible`

### Updated: `MasterCvsComponent`

**New signal per CV for optimistic update — inline tracking via the existing `cvs` signal array.**

**New method:**

```typescript
async updateTemplate(id: string, template: 'classic' | 'modern' | 'editorial'): Promise<void> {
  const prev = this.cvs().find(c => c.id === id)?.template ?? 'modern';
  this.cvs.update(list =>
    list.map(c => c.id === id ? { ...c, template } : c)
  );
  try {
    await this.api.patch(`/cvs/${id}`, { template });
  } catch {
    this.cvs.update(list =>
      list.map(c => c.id === id ? { ...c, template: prev } : c)
    );
    this.error.set('Template konnte nicht gespeichert werden.');
  }
}
```

**Template — add picker below each CV card's name row:**

```html
<lba-cv-template-picker
  [template]="cv.template ?? 'modern'"
  (templateChange)="updateTemplate(cv.id, $event)"
/>
```

### Component Architecture Summary

| Component | Type | Change |
|---|---|---|
| `MasterCvsComponent` | Smart | Add `updateTemplate()` method + render picker |
| `CvTemplatePickerComponent` | Dumb | New — 3-option inline picker |

---

## API Contract

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `PATCH` | `/cvs/:id` | JWT | `{ name?, template? }` | `200 { id, name, template, ... }` |
| `GET` | `/applications/:id/pdf` | JWT + Owns | — | `200 application/pdf` (uses `masterCv.template`) |

---

## Testing

### Backend

**`classic.renderer.spec.ts`, `modern.renderer.spec.ts`, `editorial.renderer.spec.ts`:**
- Renders a PDF (non-zero `Uint8Array`) for minimal valid `CvPdfData`
- Renders without throwing when optional fields (`summary`, `skills`, `education`) are empty arrays
- Renders without throwing when experience list has 20+ entries (overflow / page-break path)

**`pdf.service.spec.ts`:**
- `getRenderer('classic')` returns `ClassicRenderer`
- `getRenderer('modern')` returns `ModernRenderer`
- `getRenderer('editorial')` returns `EditorialRenderer`
- Unknown template string falls back to `ModernRenderer`

**`cvs.service.spec.ts`:**
- `update()` with `{ template: 'editorial' }` persists the value
- `update()` with unknown template string throws `BadRequestException`

### Frontend

**`cv-template-picker.component.spec.ts`:**
- Renders 3 buttons
- Active button has `aria-pressed="true"` for the current template value
- Clicking a non-active button emits `templateChange` with the correct value

**`master-cvs.component.spec.ts`:**
- `updateTemplate()` updates the `cvs` signal optimistically before API call
- `updateTemplate()` rolls back and sets `error` signal when API throws

---

## Definition of Done

- [ ] `prisma migrate dev --name add-masterCv-template` runs clean
- [ ] `pdf-utils.ts` extracted — `pdf.service.ts` no longer contains wrap/sanitize logic
- [ ] All 3 renderers return a non-empty `Uint8Array` for valid input
- [ ] `PATCH /cvs/:id` accepts and persists `template`
- [ ] PDF download for an application uses the MasterCv's template
- [ ] `CvTemplatePickerComponent` generated via CLI, all 4 files present
- [ ] Inline picker visible on CV cards, optimistic update works, error shown on failure
- [ ] `cd backend && npm run lint && npm test` — exit 0
- [ ] `cd frontend && npm run lint && npm test -- --watchAll=false && npm run build` — exit 0
