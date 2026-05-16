# Landing Page Cleanup — Design Spec

**Status:** Approved  
**Date:** 2026-05-16  
**Author:** Dennis (via brainstorming session)  
**Depends on:** Design System Phase 1 spec (`2026-05-16-design-system-phase1-design.md`)

---

## Problem

Four issues on the public-facing pages:

1. **FAQ** is a standalone page (`/faq`) that duplicates a nav stop. Users expect to find it inline on the landing page.
2. **Footer dead links** — `Bewerbungs-Guide` and `Hilfe-Center` are `href="#"` placeholders that do nothing. `Changelog` was never built.
3. **AGB / legal pages** look visually flat — sections use `background: var(--bg-2)` + border, which blends into the page background. After Phase 1's `.card-elevated` system lands, the legal pages are visually out of step.
4. **FAQ accordion** on the current `/faq` page uses inline `onclick` (non-Angular pattern). Needs to be replaced with Angular signals.

---

## Scope

- Add FAQ accordion section to landing page; remove `/faq` route and `FaqComponent`
- Footer: replace two dead links with working modals, remove Changelog link
- Legal pages: update SCSS so sections match Phase 1 `.card-elevated` styling
- No backend changes
- No changes to `AppShellComponent`, `EinstellungenModal`, or any authenticated app pages
- Feedback/rating modal is **out of scope** — separate spec

---

## Agreed Design

### 1. FAQ — Landing page section

**New component:** `FaqSectionComponent` at `features/landing/sections/faq-section.component.ts` (four files: `.ts`, `.html`, `.scss`, `.spec.ts`).

Placed in `landing.component.html` between `<lba-pricing-inline>` and `<lba-cta-band>`:

```html
<section id="faq" aria-labelledby="faq-heading">
  <lba-faq-section />
</section>
```

**Accordion state** — single signal for the open item:

```typescript
protected readonly expandedId = signal<string | null>(null);

protected toggle(id: string): void {
  this.expandedId.update(current => current === id ? null : id);
}
```

**Template pattern** (one item shown, repeat for all 8 questions):

```html
<dl class="faq-list">
  <div class="faq-item">
    <dt>
      <button type="button"
        class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q1'"
        aria-controls="faq-q1"
        (click)="toggle('q1')">
        Was ist Hireflow AI?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q1' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q1" class="faq-item__answer" [hidden]="expandedId() !== 'q1'">
      Hireflow AI ist ein KI-gestütztes Tool…
    </dd>
  </div>
  <!-- repeat for q2–q8 -->
</dl>
```

All 8 questions migrated verbatim from `faq.component.html`.

Section header:

```html
<div class="page-header" style="margin-bottom: var(--space-6);">
  <div class="page-header__text">
    <h2 class="page-title" id="faq-heading">Häufige Fragen</h2>
    <p class="page-sub">Antworten auf die häufigsten Fragen zu Hireflow AI</p>
  </div>
</div>
```

**SCSS:**

```scss
:host { display: block; padding: var(--space-16) var(--space-8); max-width: 800px; margin-inline: auto; }

.faq-list { display: flex; flex-direction: column; gap: var(--space-3); }

.faq-item {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  overflow: hidden;
}

.faq-item__question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.faq-item__question:hover { background: var(--surface-2); }

.faq-item__icon { font-size: 18px; color: var(--ink-3); flex-shrink: 0; }

.faq-item__answer {
  padding: 0 var(--space-5) var(--space-4);
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.7;
}
```

**FAQPage LD+JSON** migrates from `FaqComponent` to `LandingComponent`:

```typescript
// In LandingComponent constructor — add after SeoService call:
const ldScript = document.createElement('script');
ldScript.type = 'application/ld+json';
ldScript.textContent = FAQ_LD_JSON; // same constant, move from faq.component.ts
document.head.appendChild(ldScript);
```

Use `DestroyRef` to remove on destroy:
```typescript
inject(DestroyRef).onDestroy(() => ldScript.remove());
```

**Footer FAQ link:** `<a routerLink="/faq">FAQ</a>` → `<a href="/#faq">FAQ</a>`

**Route cleanup:**
- Remove `/faq` route from `app.routes.ts`
- Delete `frontend/src/app/features/faq/` directory (all 4 files)

---

### 2. Footer modals

`FooterComponent` gains two new signals:

```typescript
protected readonly hilfeOffen = signal(false);
protected readonly guideOffen = signal(false);
```

Both modals use the same structure as `landing.component.scss`'s `.modal-backdrop` / `.modal` — scoped in `footer.component.scss`.

**Footer link changes in `footer.component.html`:**

```html
<!-- Ressourcen column — before -->
<a routerLink="/faq">FAQ</a>
<a href="#">Bewerbungs-Guide</a>
<a href="#">Hilfe-Center</a>

<!-- After -->
<a href="/#faq">FAQ</a>
<button type="button" class="footer__text-btn" (click)="guideOffen.set(true)">Bewerbungs-Guide</button>
<button type="button" class="footer__text-btn" (click)="hilfeOffen.set(true)">Hilfe-Center</button>
```

```css
.footer__text-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 13px;
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.footer__text-btn:hover { opacity: 0.8; }
```

**Bewerbungs-Guide modal** (added at bottom of `footer.component.html`):

```html
@if (guideOffen()) {
  <div class="modal-backdrop" role="presentation"
    (click)="guideOffen.set(false)"
    (keydown.escape)="guideOffen.set(false)"
    tabindex="-1">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="guide-title"
      (click)="$event.stopPropagation()">
      <button type="button" class="modal__close" aria-label="Schließen" (click)="guideOffen.set(false)">×</button>
      <div class="modal__header">
        <h2 id="guide-title">Bewerbungs-Guide</h2>
        <p>Deine Bewerbung in 5 Schritten</p>
      </div>
      <ol class="guide-steps">
        <li>Lebenslauf hochladen oder als Text einfügen</li>
        <li>Stellenanzeige per Text oder URL angeben</li>
        <li>KI-Optimierung starten und Match-Score prüfen</li>
        <li>Anschreiben generieren und anpassen</li>
        <li>Unterlagen als PDF exportieren und einreichen</li>
      </ol>
    </section>
  </div>
}
```

**Hilfe-Center modal**:

```html
@if (hilfeOffen()) {
  <div class="modal-backdrop" role="presentation"
    (click)="hilfeOffen.set(false)"
    (keydown.escape)="hilfeOffen.set(false)"
    tabindex="-1">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="hilfe-title"
      (click)="$event.stopPropagation()">
      <button type="button" class="modal__close" aria-label="Schließen" (click)="hilfeOffen.set(false)">×</button>
      <div class="modal__header">
        <h2 id="hilfe-title">Hilfe-Center</h2>
        <p>Wie können wir helfen?</p>
      </div>
      <ul class="hilfe-list">
        <li><a href="mailto:hi@hireflow.ai">Schreib uns: hi@hireflow.ai</a></li>
        <li><a href="/#faq" (click)="hilfeOffen.set(false)">Häufige Fragen ansehen</a></li>
        <li><a href="mailto:security@hireflow.ai">Sicherheitslücke melden</a></li>
      </ul>
    </section>
  </div>
}
```

**`footer.component.scss` additions:**

```scss
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: rgba(15, 18, 32, 0.5);
  backdrop-filter: blur(8px);
}

.modal {
  position: relative;
  width: min(100%, 480px);
  padding: var(--space-8);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--ink-2);
  font: inherit;
  font-size: 20px;
  cursor: pointer;
}

.modal__header { margin-bottom: var(--space-5); padding-right: var(--space-8); }
.modal__header h2 { font-size: 20px; font-weight: 700; color: var(--ink); margin-bottom: var(--space-1); }
.modal__header p { font-size: 13px; color: var(--ink-3); }

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-left: var(--space-5);
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.6;
}

.hilfe-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-left: var(--space-5);
  font-size: 14px;
}
.hilfe-list a { color: var(--accent); font-weight: 600; }
```

---

### 3. Changelog removal

Remove the Changelog link from `footer.component.html` — the entire line:

```html
<!-- Delete this line -->
<a href="#">Changelog</a>
```

---

### 4. AGB / legal pages style fix

`legal.component.scss` — update section card style to match Phase 1 `.card-elevated`:

```scss
/* Before */
.legal-page__content section {
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-2);
}

/* After */
.legal-page__content section {
  padding: var(--space-6);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}
```

No HTML changes. Applies to AGB, Datenschutz, and Impressum pages (all share `legal.component.scss`).

---

## Modified files

| File | Change |
|---|---|
| `features/landing/landing.component.ts` | Add `FaqSectionComponent` import, FAQPage LD+JSON constant + script injection via `DestroyRef` |
| `features/landing/landing.component.html` | Add `<section id="faq">` between pricing and CTA |
| `features/landing/sections/faq-section.component.ts` | New component (create) |
| `features/landing/sections/faq-section.component.html` | New template (create) |
| `features/landing/sections/faq-section.component.scss` | New styles (create) |
| `features/landing/sections/faq-section.component.spec.ts` | New tests (create) |
| `shared/components/footer.component.ts` | Add `hilfeOffen` + `guideOffen` signals |
| `shared/components/footer.component.html` | Replace dead links, add two modals, remove Changelog |
| `shared/components/footer.component.scss` | Add modal styles |
| `legal/legal.component.scss` | Swap border+bg-2 to surface+shadow-md |
| `app.routes.ts` | Remove `/faq` route |

## Deleted files

| File | Reason |
|---|---|
| `features/faq/faq.component.ts` | Route removed, content migrated |
| `features/faq/faq.component.html` | Content migrated to FaqSectionComponent |
| `features/faq/faq.component.scss` | No longer needed |
| `features/faq/faq.component.spec.ts` | No longer needed |

---

## Unchanged

`AppShellComponent`, all authenticated app pages, `NavbarComponent`, all backend files, `PricingComponent`.

---

## Verification

1. `cd frontend && npm run lint` — exit 0
2. `cd frontend && npm test -- --watchAll=false` — exit 0
3. `cd frontend && npm run build` — exit 0
4. Manual: landing page has FAQ section visible; clicking FAQ items toggles answer; footer "FAQ" link scrolls to `#faq`; footer "Bewerbungs-Guide" and "Hilfe-Center" open correct modals; Escape closes modals; legal pages (AGB, Datenschutz, Impressum) show elevated section cards

---

## Out of scope

- Feedback/rating modal (separate spec + plan)
- Any backend changes
- Any authenticated app pages
- Dark mode
- Mobile/responsive layout
