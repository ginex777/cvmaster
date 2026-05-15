# Template Library + Cover Letter Tone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new CV templates (Minimal, Executive), real HTML mini-previews on template picker cards, and a cover letter tone selector that highlights one of the three already-generated letter variants.

**Architecture:** The letter generator already produces three variants (`concise`, `warm`, `formal`). The tone picker is a preference field (`coverLetterTone`) that maps `formal→formal`, `modern→warm`, `creative→concise` — no re-generation needed. New PDF renderers follow the existing `CvRenderer` interface in `backend/src/pdf/renderers/`. Template picker cards are upgraded from text buttons to visual cards with scaled-down HTML previews rendered by per-template Angular components.

**Tech Stack:** NestJS 11, Prisma 7, pdf-lib (existing), Angular 21 signals, standalone components, Jest

---

## File Map

**Backend — new files:**
- `backend/src/pdf/renderers/minimal.renderer.ts`
- `backend/src/pdf/renderers/executive.renderer.ts`
- New Prisma migration: `add_cover_letter_tone`

**Backend — modified files:**
- `backend/prisma/schema.prisma` — add `coverLetterTone`
- `backend/src/pdf/pdf.service.ts` — add `minimal`/`executive` cases
- `backend/src/pdf/renderers/renderer.interface.ts` — extend `CvLayout` union
- `backend/src/applications/applications.controller.ts` — add `PATCH :id/tone`
- `backend/src/applications/applications.service.ts` — add `updateTone()`
- `backend/src/applications/applications.service.spec.ts` — add tone tests

**Frontend — new files:**
- `frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-classic.ts` + `.html` + `.scss` + `.spec.ts`
- `frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-modern.ts` + `.html` + `.scss` + `.spec.ts`
- `frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-editorial.ts` + `.html` + `.scss` + `.spec.ts`
- `frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-minimal.ts` + `.html` + `.scss` + `.spec.ts`
- `frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-executive.ts` + `.html` + `.scss` + `.spec.ts`
- `frontend/src/app/shared/components/cover-letter-tone-picker/cover-letter-tone-picker.ts` + `.html` + `.scss` + `.spec.ts`

**Frontend — modified files:**
- `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.ts` — add `minimal`/`executive`, swap buttons for visual cards
- `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.html` — card layout with mini-preview
- `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.scss` — card styles
- `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.spec.ts` — update for 5 templates
- `frontend/src/app/features/wizard/wizard.component.ts` — add tone signal, PATCH call
- `frontend/src/app/features/wizard/wizard.component.html` — add tone picker below template picker

---

## Task 1: Extend CvLayout type and update PdfService

**Files:**
- Modify: `backend/src/pdf/renderers/renderer.interface.ts`
- Modify: `backend/src/pdf/pdf.service.ts`

- [ ] **Step 1.1: Read the renderer interface**

```bash
cat backend/src/pdf/renderers/renderer.interface.ts
```

- [ ] **Step 1.2: Add `minimal` and `executive` to the CvLayout union**

In `backend/src/pdf/renderers/renderer.interface.ts`, find the `CvLayout` type and change it from:
```typescript
export type CvLayout = 'classic' | 'modern' | 'editorial';
```
to:
```typescript
export type CvLayout = 'classic' | 'modern' | 'editorial' | 'minimal' | 'executive';
```

- [ ] **Step 1.3: Add stub cases to PdfService.getRenderer()**

In `backend/src/pdf/pdf.service.ts`, in the `getRenderer()` private method, add the new cases before `default`:
```typescript
import { MinimalRenderer } from './renderers/minimal.renderer';
import { ExecutiveRenderer } from './renderers/executive.renderer';
// ... (add to existing imports at top of file)

// In getRenderer():
case 'minimal':
  return new MinimalRenderer();
case 'executive':
  return new ExecutiveRenderer();
```

Do the same in `getLetterRenderer()` — for now point both new templates to `ModernLetterRenderer` (letter layout is independent of CV template):
```typescript
case 'minimal':
case 'executive':
  return new ModernLetterRenderer();
```

- [ ] **Step 1.4: Verify build still compiles**

```bash
cd backend && npx tsc --noEmit
```
Expected: errors about missing `MinimalRenderer`/`ExecutiveRenderer` (classes don't exist yet) — that's fine for now, we'll create them next.

---

## Task 2: Create MinimalRenderer

**Files:**
- Create: `backend/src/pdf/renderers/minimal.renderer.ts`
- Read first: `backend/src/pdf/renderers/classic.renderer.ts` (use as pattern reference)

- [ ] **Step 2.1: Read the ClassicRenderer to understand the pdf-lib pattern**

```bash
cat backend/src/pdf/renderers/classic.renderer.ts
```

- [ ] **Step 2.2: Create `minimal.renderer.ts`**

Create `backend/src/pdf/renderers/minimal.renderer.ts` implementing the same `CvRenderer` interface as the classic renderer, with these visual specs:
- Background: white (`#ffffff`)
- Margins: 60pt top/bottom, 70pt left/right (generous whitespace)
- Name: 18pt, weight 400 (not bold), color `#111111`, font: Helvetica
- Role/tagline (if present): 10pt, color `#777777`, 4pt below name
- Thin horizontal rule after header: 0.5pt, color `#e5e5e5`, full width
- Section headings: 7pt, all-caps, letter-spacing, color `#999999`, Helvetica
- Thin horizontal rule before each section: 0.5pt, color `#e5e5e5`
- Body text: 9pt, color `#333333`, line-height 14pt
- Bullet text: same body style, no bullet symbol — use an em dash (`—`) prefix with 8pt indent
- Skills: comma-separated inline on one line, 9pt, color `#555555`
- No colored accents anywhere

- [ ] **Step 2.3: Build backend to verify no compile errors**

```bash
cd backend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 2.4: Commit**

```bash
git add backend/src/pdf/renderers/minimal.renderer.ts backend/src/pdf/renderers/renderer.interface.ts backend/src/pdf/pdf.service.ts
git commit -m "feat(pdf): add Minimal CV renderer and extend CvLayout type"
```

---

## Task 3: Create ExecutiveRenderer

**Files:**
- Create: `backend/src/pdf/renderers/executive.renderer.ts`

- [ ] **Step 3.1: Create `executive.renderer.ts`**

Create `backend/src/pdf/renderers/executive.renderer.ts` implementing the same `CvRenderer` interface, with these visual specs:
- Full-width dark header band at top: background `#0f1729`, height 80pt
- Name in header: 20pt, weight 700, color `#ffffff`, Helvetica, positioned 60pt left, 24pt from top of band
- Role/tagline in header: 9pt, color `#94a3b8`, 4pt below name
- Contact info in header (right-aligned): 8pt, color `#64748b`
- Body background: white `#ffffff`
- Body margins: 50pt left/right, 24pt top gap after header, 50pt bottom
- Section headings: 7pt, all-caps, letter-spacing 0.1em, color `#0f1729`, Helvetica bold
- Thin horizontal rule below each section heading: 0.5pt, color `#e2e8f0`
- Body text: 9pt, color `#475569`, line-height 14pt
- Bullet marker: small filled circle `•`, color `#94a3b8`, 8pt indent
- Skills: inline, 9pt, color `#475569`, slightly bolder (Helvetica-Bold)
- No purple accents — authority through restraint

- [ ] **Step 3.2: Build backend**

```bash
cd backend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3.3: Commit**

```bash
git add backend/src/pdf/renderers/executive.renderer.ts
git commit -m "feat(pdf): add Executive CV renderer"
```

---

## Task 4: Add coverLetterTone to Prisma schema

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: migration via `prisma migrate dev`

- [ ] **Step 4.1: Add field to schema**

In `backend/prisma/schema.prisma`, in the `Application` model, add after `reminderSentAt`:
```prisma
coverLetterTone String @default("formal")
```

- [ ] **Step 4.2: Create and apply migration**

```bash
cd backend && npx prisma migrate dev --name add_cover_letter_tone
```
Expected: migration file created at `backend/prisma/migrations/TIMESTAMP_add_cover_letter_tone/migration.sql`, schema in sync.

- [ ] **Step 4.3: Verify generated client types compile**

```bash
cd backend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4.4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add coverLetterTone field to Application"
```

---

## Task 5: Add updateTone() service method and PATCH endpoint

**Files:**
- Modify: `backend/src/applications/applications.service.ts`
- Modify: `backend/src/applications/applications.service.spec.ts`
- Modify: `backend/src/applications/applications.controller.ts`

- [ ] **Step 5.1: Write the failing test**

In `backend/src/applications/applications.service.spec.ts`, add a new `describe('updateTone')` block after the existing `updateReminder` block:

```typescript
describe('updateTone', () => {
  const mockApp = { id: 'a1', userId: 'u1', masterCv: null, jobPosting: null };

  it('updates coverLetterTone for own application', async () => {
    mockPrisma.application.findUnique.mockResolvedValue(mockApp as never);
    mockPrisma.application.update.mockResolvedValue({ ...mockApp, coverLetterTone: 'modern' } as never);

    const result = await service.updateTone('a1', 'u1', 'modern');

    expect(mockPrisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' }, data: { coverLetterTone: 'modern' } }),
    );
    expect(result).toBeTruthy();
  });

  it('throws ForbiddenException for wrong user', async () => {
    mockPrisma.application.findUnique.mockResolvedValue({ ...mockApp, userId: 'other' } as never);
    await expect(service.updateTone('a1', 'u1', 'formal')).rejects.toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 5.2: Run test to verify it fails**

```bash
cd backend && npx jest --testPathPattern="applications.service.spec" --no-coverage
```
Expected: FAIL — `service.updateTone is not a function`

- [ ] **Step 5.3: Add updateTone() to ApplicationsService**

In `backend/src/applications/applications.service.ts`, add after `updateReminder()`:

```typescript
async updateTone(id: string, userId: string, tone: string): Promise<unknown> {
  await this.findOne(id, userId);
  return this.prisma.application.update({ where: { id }, data: { coverLetterTone: tone } });
}
```

- [ ] **Step 5.4: Run tests to verify they pass**

```bash
cd backend && npx jest --testPathPattern="applications.service.spec" --no-coverage
```
Expected: all tests PASS

- [ ] **Step 5.5: Add PATCH :id/tone controller endpoint**

In `backend/src/applications/applications.controller.ts`, add after the `updateReminder` endpoint:

```typescript
@Patch(':id/tone')
@UseGuards(OwnsApplicationGuard)
updateTone(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
  const schema = z.object({ tone: z.enum(['formal', 'modern', 'creative']) });
  const { tone } = schema.parse(body);
  return this.apps.updateTone(id, req.user.sub, tone);
}
```

- [ ] **Step 5.6: Build and lint**

```bash
cd backend && npm run lint && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5.7: Run all backend tests**

```bash
cd backend && npm test -- --no-coverage
```
Expected: all existing tests PASS plus 2 new tone tests

- [ ] **Step 5.8: Commit**

```bash
git add backend/src/applications/applications.service.ts backend/src/applications/applications.service.spec.ts backend/src/applications/applications.controller.ts
git commit -m "feat(applications): add coverLetterTone update endpoint and service method"
```

---

## Task 6: Create CvMiniPreview components (5 templates)

Create one component per template. Each renders a scaled-down version of the actual CV layout. All five follow the same structure; only the inner HTML/SCSS differ.

**Files:**
- Create: `frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-classic.ts` + `.html` + `.scss` + `.spec.ts`
- Create: (same for `modern`, `editorial`, `minimal`, `executive`)

- [ ] **Step 6.1: Create ClassicMiniPreview component**

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-classic.ts`:
```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lba-cv-mini-preview-classic',
  standalone: true,
  templateUrl: './cv-mini-preview-classic.html',
  styleUrl: './cv-mini-preview-classic.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewClassic {}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-classic.html`:
```html
<div class="mini-classic" aria-hidden="true">
  <div class="mini-classic__name">Anna Schmidt</div>
  <div class="mini-classic__role">Frontend Developer · Berlin</div>
  <div class="mini-classic__rule"></div>
  <div class="mini-classic__heading">Erfahrung</div>
  <div class="mini-classic__job">Frontend Developer — Acme GmbH</div>
  <div class="mini-classic__date">2021 – heute</div>
  <div class="mini-classic__bullet">• Angular-Komponenten entwickelt</div>
  <div class="mini-classic__bullet">• Performance um 40 % verbessert</div>
  <div class="mini-classic__rule"></div>
  <div class="mini-classic__heading">Kenntnisse</div>
  <div class="mini-classic__skills">TypeScript · Angular · NestJS</div>
</div>
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-classic.scss`:
```scss
:host { display: block; }

.mini-classic {
  background: #fff;
  padding: 10px;
  font-family: var(--font-sans);
  transform: scale(0.18);
  transform-origin: top left;
  width: 560px;
  height: 780px;

  &__name { font-size: 22px; font-weight: 700; color: #111; }
  &__role { font-size: 11px; color: #666; margin-top: 3px; }
  &__rule { border-top: 1.5px solid #111; margin: 8px 0; }
  &__heading { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #111; margin-bottom: 4px; }
  &__job { font-size: 11px; font-weight: 600; color: #222; }
  &__date { font-size: 9px; color: #888; margin-bottom: 3px; }
  &__bullet { font-size: 10px; color: #444; line-height: 1.5; }
  &__skills { font-size: 10px; color: #444; }
}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-classic.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { CvMiniPreviewClassic } from './cv-mini-preview-classic';

describe('CvMiniPreviewClassic', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvMiniPreviewClassic] }).compileComponents();
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(CvMiniPreviewClassic);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mini-classic')).toBeTruthy();
  });

  it('has aria-hidden on the preview container', () => {
    const fixture = TestBed.createComponent(CvMiniPreviewClassic);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
```

- [ ] **Step 6.2: Create ModernMiniPreview**

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-modern.ts`:
```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lba-cv-mini-preview-modern',
  standalone: true,
  templateUrl: './cv-mini-preview-modern.html',
  styleUrl: './cv-mini-preview-modern.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewModern {}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-modern.html`:
```html
<div class="mini-modern" aria-hidden="true">
  <div class="mini-modern__sidebar">
    <div class="mini-modern__avatar"></div>
    <div class="mini-modern__name">Anna Schmidt</div>
    <div class="mini-modern__role">Frontend Dev</div>
    <div class="mini-modern__rule"></div>
    <div class="mini-modern__label">Kontakt</div>
    <div class="mini-modern__info">anna&#64;example.de</div>
    <div class="mini-modern__info">Berlin</div>
    <div class="mini-modern__rule"></div>
    <div class="mini-modern__label">Skills</div>
    <div class="mini-modern__info">Angular</div>
    <div class="mini-modern__info">TypeScript</div>
  </div>
  <div class="mini-modern__main">
    <div class="mini-modern__heading">Erfahrung</div>
    <div class="mini-modern__job">Frontend Developer</div>
    <div class="mini-modern__company">Acme GmbH · 2021–heute</div>
    <div class="mini-modern__bullet">• Angular-Komponenten</div>
    <div class="mini-modern__bullet">• Performance +40%</div>
    <div class="mini-modern__heading" style="margin-top:12px">Ausbildung</div>
    <div class="mini-modern__job">B.Sc. Informatik</div>
    <div class="mini-modern__company">TU Berlin · 2021</div>
  </div>
</div>
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-modern.scss`:
```scss
:host { display: block; }

.mini-modern {
  display: flex;
  background: #fff;
  transform: scale(0.18);
  transform-origin: top left;
  width: 560px;
  height: 780px;
  font-family: var(--font-sans);

  &__sidebar {
    background: #1e1e2e;
    width: 190px;
    padding: 14px 10px;
    flex-shrink: 0;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #a78bfa;
    margin: 0 auto 8px;
  }

  &__name { font-size: 9px; font-weight: 700; color: #fff; text-align: center; }
  &__role { font-size: 7px; color: #aaa; text-align: center; margin-top: 2px; }
  &__rule { border-top: 1px solid #333; margin: 6px 0; }
  &__label { font-size: 7px; font-weight: 600; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
  &__info { font-size: 7px; color: #ccc; line-height: 1.6; }

  &__main { flex: 1; padding: 14px 12px; }
  &__heading { font-size: 9px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #eee; padding-bottom: 3px; margin-bottom: 5px; }
  &__job { font-size: 10px; font-weight: 600; color: #222; }
  &__company { font-size: 8px; color: #888; margin-bottom: 3px; }
  &__bullet { font-size: 8px; color: #444; line-height: 1.5; }
}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-modern.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { CvMiniPreviewModern } from './cv-mini-preview-modern';

describe('CvMiniPreviewModern', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvMiniPreviewModern] }).compileComponents();
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(CvMiniPreviewModern);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mini-modern')).toBeTruthy();
  });
});
```

- [ ] **Step 6.3: Create EditorialMiniPreview**

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-editorial.ts`:
```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lba-cv-mini-preview-editorial',
  standalone: true,
  templateUrl: './cv-mini-preview-editorial.html',
  styleUrl: './cv-mini-preview-editorial.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewEditorial {}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-editorial.html`:
```html
<div class="mini-editorial" aria-hidden="true">
  <div class="mini-editorial__header">
    <div class="mini-editorial__name">ANNA SCHMIDT</div>
    <div class="mini-editorial__role">Frontend Developer · Berlin</div>
  </div>
  <div class="mini-editorial__accent-line"></div>
  <div class="mini-editorial__body">
    <div class="mini-editorial__col">
      <div class="mini-editorial__heading">Erfahrung</div>
      <div class="mini-editorial__job">Frontend Developer</div>
      <div class="mini-editorial__company">Acme GmbH · 2021</div>
      <div class="mini-editorial__bullet">• Angular-Komponenten</div>
      <div class="mini-editorial__bullet">• Performance +40%</div>
    </div>
    <div class="mini-editorial__col">
      <div class="mini-editorial__heading">Skills</div>
      <div class="mini-editorial__skill">TypeScript</div>
      <div class="mini-editorial__skill">Angular</div>
      <div class="mini-editorial__skill">NestJS</div>
      <div class="mini-editorial__skill">CSS</div>
    </div>
  </div>
</div>
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-editorial.scss`:
```scss
:host { display: block; }

.mini-editorial {
  background: #fff;
  padding: 12px;
  font-family: var(--font-sans);
  transform: scale(0.18);
  transform-origin: top left;
  width: 560px;
  height: 780px;

  &__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px; }
  &__name { font-size: 20px; font-weight: 900; color: #111; letter-spacing: -0.02em; line-height: 1; }
  &__role { font-size: 9px; color: #888; }
  &__accent-line { height: 3px; background: #a78bfa; margin-bottom: 10px; }
  &__body { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  &__heading { font-size: 9px; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
  &__job { font-size: 10px; font-weight: 600; color: #222; }
  &__company { font-size: 8px; color: #888; margin-bottom: 3px; }
  &__bullet { font-size: 8px; color: #444; line-height: 1.5; }
  &__skill { font-size: 9px; color: #444; line-height: 1.7; }
}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-editorial.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { CvMiniPreviewEditorial } from './cv-mini-preview-editorial';

describe('CvMiniPreviewEditorial', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvMiniPreviewEditorial] }).compileComponents();
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(CvMiniPreviewEditorial);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mini-editorial')).toBeTruthy();
  });
});
```

- [ ] **Step 6.4: Create MinimalMiniPreview**

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-minimal.ts`:
```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lba-cv-mini-preview-minimal',
  standalone: true,
  templateUrl: './cv-mini-preview-minimal.html',
  styleUrl: './cv-mini-preview-minimal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewMinimal {}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-minimal.html`:
```html
<div class="mini-minimal" aria-hidden="true">
  <div class="mini-minimal__name">Anna Schmidt</div>
  <div class="mini-minimal__role">Frontend Developer</div>
  <div class="mini-minimal__rule"></div>
  <div class="mini-minimal__heading">Erfahrung</div>
  <div class="mini-minimal__job">Frontend Developer, Acme GmbH</div>
  <div class="mini-minimal__date">2021 – heute</div>
  <div class="mini-minimal__bullet">— Angular-Komponenten entwickelt</div>
  <div class="mini-minimal__bullet">— Performance um 40 % verbessert</div>
  <div class="mini-minimal__rule"></div>
  <div class="mini-minimal__heading">Kenntnisse</div>
  <div class="mini-minimal__skills">TypeScript · Angular · NestJS · CSS</div>
</div>
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-minimal.scss`:
```scss
:host { display: block; }

.mini-minimal {
  background: #fafafa;
  padding: 16px;
  font-family: var(--font-sans);
  transform: scale(0.18);
  transform-origin: top left;
  width: 560px;
  height: 780px;

  &__name { font-size: 16px; font-weight: 400; color: #111; }
  &__role { font-size: 9px; color: #888; margin-top: 2px; }
  &__rule { border-top: 1px solid #e5e5e5; margin: 10px 0 8px; }
  &__heading { font-size: 7px; text-transform: uppercase; letter-spacing: 0.12em; color: #999; margin-bottom: 5px; }
  &__job { font-size: 10px; font-weight: 500; color: #333; }
  &__date { font-size: 8px; color: #aaa; margin-bottom: 3px; }
  &__bullet { font-size: 9px; color: #555; line-height: 1.6; padding-left: 8px; }
  &__skills { font-size: 9px; color: #555; }
}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-minimal.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { CvMiniPreviewMinimal } from './cv-mini-preview-minimal';

describe('CvMiniPreviewMinimal', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvMiniPreviewMinimal] }).compileComponents();
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(CvMiniPreviewMinimal);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mini-minimal')).toBeTruthy();
  });
});
```

- [ ] **Step 6.5: Create ExecutiveMiniPreview**

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-executive.ts`:
```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lba-cv-mini-preview-executive',
  standalone: true,
  templateUrl: './cv-mini-preview-executive.html',
  styleUrl: './cv-mini-preview-executive.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewExecutive {}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-executive.html`:
```html
<div class="mini-executive" aria-hidden="true">
  <div class="mini-executive__header">
    <div class="mini-executive__name">ANNA SCHMIDT</div>
    <div class="mini-executive__role">FRONTEND DEVELOPER</div>
    <div class="mini-executive__contact">Berlin · anna&#64;example.de</div>
  </div>
  <div class="mini-executive__body">
    <div class="mini-executive__heading">Berufserfahrung</div>
    <div class="mini-executive__job">Frontend Developer · Acme GmbH</div>
    <div class="mini-executive__date">2021 – heute</div>
    <div class="mini-executive__bullet">• Angular-Komponenten entwickelt</div>
    <div class="mini-executive__bullet">• Performance-Optimierungen um 40%</div>
    <div class="mini-executive__rule"></div>
    <div class="mini-executive__heading">Kenntnisse</div>
    <div class="mini-executive__skills">TypeScript · Angular · NestJS · CSS · Git</div>
  </div>
</div>
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-executive.scss`:
```scss
:host { display: block; }

.mini-executive {
  background: #fff;
  font-family: var(--font-sans);
  transform: scale(0.18);
  transform-origin: top left;
  width: 560px;
  height: 780px;

  &__header {
    background: #0f1729;
    padding: 14px 16px 12px;
  }

  &__name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 0.04em; }
  &__role { font-size: 8px; color: #94a3b8; letter-spacing: 0.06em; margin-top: 2px; }
  &__contact { font-size: 7px; color: #64748b; margin-top: 5px; }

  &__body { padding: 12px 16px; }
  &__heading { font-size: 8px; font-weight: 700; color: #0f1729; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  &__job { font-size: 10px; font-weight: 600; color: #1e293b; }
  &__date { font-size: 8px; color: #94a3b8; margin-bottom: 3px; }
  &__bullet { font-size: 8px; color: #475569; line-height: 1.5; }
  &__rule { border-top: 1px solid #e2e8f0; margin: 8px 0; }
  &__skills { font-size: 9px; color: #475569; font-weight: 600; }
}
```

`frontend/src/app/shared/components/cv-mini-preview/cv-mini-preview-executive.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { CvMiniPreviewExecutive } from './cv-mini-preview-executive';

describe('CvMiniPreviewExecutive', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvMiniPreviewExecutive] }).compileComponents();
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(CvMiniPreviewExecutive);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mini-executive')).toBeTruthy();
  });
});
```

- [ ] **Step 6.6: Run all mini-preview tests**

```bash
cd frontend && npx jest --testPathPattern="cv-mini-preview" --no-coverage
```
Expected: 10 tests PASS (2 per component × 5 components)

- [ ] **Step 6.7: Commit**

```bash
git add frontend/src/app/shared/components/cv-mini-preview/
git commit -m "feat(ui): add five CV mini-preview components for template picker"
```

---

## Task 7: Upgrade CvTemplatePicker to visual cards with 5 templates

**Files:**
- Modify: `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.ts`
- Modify: `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.html`
- Modify: `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.scss`
- Modify: `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.spec.ts`

- [ ] **Step 7.1: Write the failing tests first**

Replace the content of `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { CvTemplatePicker } from './cv-template-picker';

describe('CvTemplatePicker', () => {
  let component: CvTemplatePicker;
  let fixture: ComponentFixture<CvTemplatePicker>;

  function create(template: 'classic' | 'modern' | 'editorial' | 'minimal' | 'executive') {
    fixture = TestBed.createComponent(CvTemplatePicker);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('template', template);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvTemplatePicker] }).compileComponents();
  });

  it('renders five template cards', () => {
    create('modern');
    expect(fixture.nativeElement.querySelectorAll('.picker__card')).toHaveLength(5);
  });

  it('marks active template card with aria-pressed="true"', () => {
    create('minimal');
    const activeCard = Array.from(fixture.nativeElement.querySelectorAll('[aria-pressed="true"]')) as HTMLElement[];
    expect(activeCard).toHaveLength(1);
    expect(activeCard[0].getAttribute('aria-label')).toContain('Minimal');
  });

  it('emits templateChange when a different card is clicked', () => {
    create('modern');
    const emitted: string[] = [];
    component.templateChange.subscribe((v: string) => emitted.push(v));

    const cards = fixture.nativeElement.querySelectorAll('.picker__card') as NodeListOf<HTMLButtonElement>;
    const execCard = Array.from(cards).find(c => c.getAttribute('aria-label')?.includes('Executive'));
    execCard?.click();

    expect(emitted).toEqual(['executive']);
  });

  it('each card contains a mini-preview element', () => {
    create('classic');
    const previews = fixture.nativeElement.querySelectorAll('.picker__preview');
    expect(previews.length).toBe(5);
  });
});
```

- [ ] **Step 7.2: Run tests to verify they fail**

```bash
cd frontend && npx jest --testPathPattern="cv-template-picker.spec" --no-coverage
```
Expected: FAIL — tests looking for `.picker__card` and 5 templates

- [ ] **Step 7.3: Update cv-template-picker.ts**

Replace `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CvMiniPreviewClassic } from '../cv-mini-preview/cv-mini-preview-classic';
import { CvMiniPreviewModern } from '../cv-mini-preview/cv-mini-preview-modern';
import { CvMiniPreviewEditorial } from '../cv-mini-preview/cv-mini-preview-editorial';
import { CvMiniPreviewMinimal } from '../cv-mini-preview/cv-mini-preview-minimal';
import { CvMiniPreviewExecutive } from '../cv-mini-preview/cv-mini-preview-executive';

export type CvTemplate = 'classic' | 'modern' | 'editorial' | 'minimal' | 'executive';

@Component({
  selector: 'lba-cv-template-picker',
  standalone: true,
  imports: [CvMiniPreviewClassic, CvMiniPreviewModern, CvMiniPreviewEditorial, CvMiniPreviewMinimal, CvMiniPreviewExecutive],
  templateUrl: './cv-template-picker.html',
  styleUrl: './cv-template-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvTemplatePicker {
  readonly template = input.required<CvTemplate>();
  readonly templateChange = output<CvTemplate>();

  readonly options: Array<{ value: CvTemplate; label: string; description: string }> = [
    { value: 'classic',   label: 'Klassisch', description: 'Einspaltig, seriös'    },
    { value: 'modern',    label: 'Modern',    description: 'Sidebar, zweispaltig'  },
    { value: 'editorial', label: 'Editorial', description: 'Akzentlinie, kreativ'  },
    { value: 'minimal',   label: 'Minimal',   description: 'Viel Weißraum, klar'   },
    { value: 'executive', label: 'Executive', description: 'Dunkler Header, senior'},
  ];
}
```

- [ ] **Step 7.4: Update cv-template-picker.html**

Replace `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.html`:

```html
<div class="picker" role="group" aria-label="CV-Template auswählen">
  @for (option of options; track option.value) {
    <button
      type="button"
      class="picker__card"
      [class.picker__card--active]="template() === option.value"
      [attr.aria-pressed]="template() === option.value"
      [attr.aria-label]="'Template: ' + option.label + ' — ' + option.description"
      (click)="templateChange.emit(option.value)">
      <div class="picker__preview">
        @switch (option.value) {
          @case ('classic')   { <lba-cv-mini-preview-classic />   }
          @case ('modern')    { <lba-cv-mini-preview-modern />    }
          @case ('editorial') { <lba-cv-mini-preview-editorial /> }
          @case ('minimal')   { <lba-cv-mini-preview-minimal />   }
          @case ('executive') { <lba-cv-mini-preview-executive /> }
        }
      </div>
      <div class="picker__label">{{ option.label }}</div>
      <div class="picker__desc">{{ option.description }}</div>
    </button>
  }
</div>
```

- [ ] **Step 7.5: Update cv-template-picker.scss**

Replace `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.scss`:

```scss
:host { display: block; }

.picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-3);

  @media (max-width: 700px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.picker__card {
  background: var(--bg-2);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  padding: 0;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: border-color 0.15s;

  &:hover {
    border-color: color-mix(in oklch, var(--accent) 50%, transparent);
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  &--active {
    border-color: var(--accent);
  }
}

.picker__preview {
  width: 100%;
  height: 100px;
  overflow: hidden;
  position: relative;
  background: #fff;
}

.picker__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ink);
  padding: var(--space-1) var(--space-2) 0;
}

.picker__desc {
  font-size: 0.625rem;
  color: var(--ink-3);
  padding: 2px var(--space-2) var(--space-2);
}
```

- [ ] **Step 7.6: Run tests**

```bash
cd frontend && npx jest --testPathPattern="cv-template-picker.spec" --no-coverage
```
Expected: all 4 tests PASS

- [ ] **Step 7.7: Commit**

```bash
git add frontend/src/app/shared/components/cv-template-picker/
git commit -m "feat(ui): upgrade CvTemplatePicker to visual cards with mini-previews and 5 templates"
```

---

## Task 8: Create CoverLetterTonePicker component

The tone picker maps to existing letter variants: `formal→formal`, `modern→warm`, `creative→concise`.

**Files:**
- Create: `frontend/src/app/shared/components/cover-letter-tone-picker/cover-letter-tone-picker.ts` + `.html` + `.scss` + `.spec.ts`

- [ ] **Step 8.1: Write the failing tests**

Create `frontend/src/app/shared/components/cover-letter-tone-picker/cover-letter-tone-picker.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { CoverLetterTonePicker, type CoverLetterTone } from './cover-letter-tone-picker';

describe('CoverLetterTonePicker', () => {
  let fixture: ComponentFixture<CoverLetterTonePicker>;
  let component: CoverLetterTonePicker;

  function create(tone: CoverLetterTone) {
    fixture = TestBed.createComponent(CoverLetterTonePicker);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tone', tone);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CoverLetterTonePicker] }).compileComponents();
  });

  it('renders three tone options', () => {
    create('formal');
    expect(fixture.nativeElement.querySelectorAll('.tone__card')).toHaveLength(3);
  });

  it('marks active tone with aria-pressed="true"', () => {
    create('modern');
    const active = Array.from(fixture.nativeElement.querySelectorAll('[aria-pressed="true"]')) as HTMLElement[];
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('aria-label')).toContain('Modern');
  });

  it('emits toneChange when a different option is clicked', () => {
    create('formal');
    const emitted: CoverLetterTone[] = [];
    component.toneChange.subscribe((v: CoverLetterTone) => emitted.push(v));

    const cards = fixture.nativeElement.querySelectorAll('.tone__card') as NodeListOf<HTMLButtonElement>;
    const creativeCard = Array.from(cards).find(c => c.getAttribute('aria-label')?.includes('Kreativ'));
    creativeCard?.click();

    expect(emitted).toEqual(['creative']);
  });

  it('shows example sentence for each tone', () => {
    create('formal');
    const examples = fixture.nativeElement.querySelectorAll('.tone__example');
    expect(examples.length).toBe(3);
  });
});
```

- [ ] **Step 8.2: Run to verify fail**

```bash
cd frontend && npx jest --testPathPattern="cover-letter-tone-picker.spec" --no-coverage
```
Expected: FAIL — component not found

- [ ] **Step 8.3: Create cover-letter-tone-picker.ts**

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type CoverLetterTone = 'formal' | 'modern' | 'creative';

@Component({
  selector: 'lba-cover-letter-tone-picker',
  standalone: true,
  imports: [],
  templateUrl: './cover-letter-tone-picker.html',
  styleUrl: './cover-letter-tone-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverLetterTonePicker {
  readonly tone = input.required<CoverLetterTone>();
  readonly toneChange = output<CoverLetterTone>();

  readonly options: Array<{ value: CoverLetterTone; label: string; emoji: string; description: string; example: string }> = [
    {
      value: 'formal',
      label: 'Formell',
      emoji: '🎩',
      description: 'Klassisch-professionell. Für Konzerne, Behörden, traditionelle Branchen.',
      example: '„Hiermit bewerbe ich mich auf die ausgeschriebene Stelle als…"',
    },
    {
      value: 'modern',
      label: 'Modern',
      emoji: '✦',
      description: 'Klar und direkt. Für Tech, Scale-ups, moderne Unternehmen.',
      example: '„Ich bin Frontend-Entwickler mit 4 Jahren Erfahrung in Angular — und ich bin überzeugt, dass…"',
    },
    {
      value: 'creative',
      label: 'Kreativ',
      emoji: '🎨',
      description: 'Persönlich und mutig. Für Agenturen, Startups, kreative Rollen.',
      example: '„Gute Interfaces entstehen nicht durch Zufall — sie entstehen durch Neugier und Sorgfalt."',
    },
  ];
}
```

- [ ] **Step 8.4: Create cover-letter-tone-picker.html**

```html
<div class="tone" role="group" aria-label="Anschreiben-Ton wählen">
  @for (option of options; track option.value) {
    <button
      type="button"
      class="tone__card"
      [class.tone__card--active]="tone() === option.value"
      [attr.aria-pressed]="tone() === option.value"
      [attr.aria-label]="'Ton: ' + option.label + ' — ' + option.description"
      (click)="toneChange.emit(option.value)">
      <span class="tone__emoji" aria-hidden="true">{{ option.emoji }}</span>
      <span class="tone__label">{{ option.label }}</span>
      <span class="tone__desc">{{ option.description }}</span>
      <span class="tone__example" aria-hidden="true">{{ option.example }}</span>
    </button>
  }
</div>
```

- [ ] **Step 8.5: Create cover-letter-tone-picker.scss**

```scss
:host { display: block; }

.tone {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.tone__card {
  background: var(--bg-2);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  padding: var(--space-4);
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-height: 44px;
  transition: border-color 0.15s;

  &:hover {
    border-color: color-mix(in oklch, var(--accent) 50%, transparent);
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  &--active {
    border-color: var(--accent);
    background: color-mix(in oklch, var(--accent) 8%, var(--bg-2));
  }
}

.tone__emoji { font-size: 1.25rem; }
.tone__label { font-size: 0.875rem; font-weight: 600; color: var(--ink); }
.tone__desc  { font-size: 0.75rem; color: var(--ink-2); line-height: 1.4; }
.tone__example {
  font-size: 0.6875rem;
  color: var(--ink-3);
  font-style: italic;
  line-height: 1.4;
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  margin-top: var(--space-1);
}
```

- [ ] **Step 8.6: Run tests**

```bash
cd frontend && npx jest --testPathPattern="cover-letter-tone-picker.spec" --no-coverage
```
Expected: all 4 tests PASS

- [ ] **Step 8.7: Commit**

```bash
git add frontend/src/app/shared/components/cover-letter-tone-picker/
git commit -m "feat(ui): add CoverLetterTonePicker component (formal/modern/creative)"
```

---

## Task 9: Wire tone picker into Wizard

**Files:**
- Modify: `frontend/src/app/features/wizard/wizard.component.ts`
- Modify: `frontend/src/app/features/wizard/wizard.component.html`

- [ ] **Step 9.1: Read the wizard template to find where template picker is rendered**

```bash
cat frontend/src/app/features/wizard/wizard.component.html
```
Find the `<lba-cv-template-picker>` tag — the tone picker goes directly below it in the same step.

- [ ] **Step 9.2: Add tone signal and PATCH call to wizard**

In `frontend/src/app/features/wizard/wizard.component.ts`, add:
- Import: `CoverLetterTonePicker, type CoverLetterTone` from `'../../shared/components/cover-letter-tone-picker/cover-letter-tone-picker'`
- Add to `imports` array: `CoverLetterTonePicker`
- Add signal: `readonly selectedTone = signal<CoverLetterTone>('formal');`
- Add method after existing step handlers:

```typescript
async onToneChange(tone: CoverLetterTone, applicationId: string | null): Promise<void> {
  this.selectedTone.set(tone);
  if (!applicationId) return;
  try {
    await this.api.patch(`/applications/${applicationId}/tone`, { tone });
  } catch {
    // tone is a preference — don't surface error, the default remains usable
  }
}
```

- [ ] **Step 9.3: Add tone picker to wizard template**

In `frontend/src/app/features/wizard/wizard.component.html`, directly below `<lba-cv-template-picker ...>`, add:

```html
<div class="wizard-section">
  <label class="wizard-section__label">Anschreiben-Ton</label>
  <p class="wizard-section__hint">Wie soll dein Anschreiben klingen?</p>
  <lba-cover-letter-tone-picker
    [tone]="selectedTone()"
    (toneChange)="onToneChange($event, selectedApplicationId())"
  />
</div>
```

Note: `selectedApplicationId()` should reference whatever signal/property holds the current application ID in the wizard — read the wizard component to find the correct name.

- [ ] **Step 9.4: Run frontend tests**

```bash
cd frontend && npm test -- --watchAll=false --no-coverage
```
Expected: all existing tests PASS plus the new tone picker tests

- [ ] **Step 9.5: Build frontend**

```bash
cd frontend && npm run build
```
Expected: build succeeds with no errors

- [ ] **Step 9.6: Commit**

```bash
git add frontend/src/app/features/wizard/
git commit -m "feat(wizard): add cover letter tone picker below template selector"
```

---

## Task 10: Final verification

- [ ] **Step 10.1: Full backend test and lint**

```bash
cd backend && npm run lint && npm test -- --no-coverage
```
Expected: 0 lint errors, all tests PASS

- [ ] **Step 10.2: Full frontend test, lint, and build**

```bash
cd frontend && npm run lint && npm test -- --watchAll=false --no-coverage && npm run build
```
Expected: 0 lint errors, all tests PASS, build succeeds

- [ ] **Step 10.3: Final commit if any files unstaged**

```bash
cd "$(git rev-parse --show-toplevel)" && git status
```
If any files remain unstaged, stage and commit them:
```bash
git add -p
git commit -m "feat: complete Template Library and Cover Letter Tone feature (E)"
```
