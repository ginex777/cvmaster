# Hireflow AI — „Atlas" Redesign Spec

Handoff-Dokument für Claude Code. Audit der aktuellen Codebasis liegt in `Design Briefing.html`,
visuelle Mockups in `Redesign Examples.html`. Dieses Dokument übersetzt die Mockups in präzise
Implementierungs-Anweisungen.

> **Stack-Kontext:** Angular 21 Standalone-Components mit Signals, SSR, Tailwind als Utility-Layer,
> Geist-Font, OKLCH-Tokens, GSAP für Microanimationen. Tests via Jest + Playwright + Axe-Smoke.

---

## 0. Direktion & Prinzipien

1. **Refinement, kein Kahlschlag.** Geist + OKLCH + warmer Hintergrund bleiben — die Bestandsentscheidungen sind gut. Wir tunen Tokens, harmonisieren Komponenten und entfernen Reibungspunkte.
2. **Borders tragen die Hierarchie, nicht Shadows.** Shadows werden zurückhaltender; klare 1-px-Linien definieren Container.
3. **Tabulare Ziffern für alle Metriken.** Match-Scores, Counts, Daten — überall `font-variant-numeric: tabular-nums`.
4. **Eine Icon-Familie, eine Stroke-Weite.** Lucide-Set, 16/20 px, `strokeWidth=1.6`. Keine Emoji in UI-Chrome.
5. **Status als First-Class.** Fünfstufige Pipeline (Entwurf · Beworben · Interview · Angebot · Abgesagt) ersetzt die binäre Toggle.
6. **Dashboard ≠ Bewerbungsliste.** Dashboard wird zur Übersicht, „Bewerbungen" bekommt eine eigene Route.

---

## 1. Design Tokens

Komplette Ersetzung von `src/styles.css :root`. Werte sind in OKLCH; übernehme sie 1:1.

> **Farbphilosophie:** Die App nutzt **Status- und Bereich-Farben großzügig**, nicht nur den Hauptakzent.
> Stat-Cards, Pipeline-Spalten, Editor-Sektionen und CV-Templates bekommen jeweils eine Farbcodierung
> (siehe Sektion 6 für konkrete Zuordnungen). Der Hauptakzent bleibt für CTAs, Active-States und KI-Highlights.

### 1.1 Farben

```css
:root {
  /* Surfaces — warm-cool off-white, pure white surface */
  --bg:         oklch(98.2% 0.004 80);
  --surface:    #ffffff;
  --surface-2:  oklch(96.8% 0.005 80);
  --surface-3:  oklch(94.5% 0.006 80);   /* hover/pressed */

  /* Ink scale — kühler, etwas dunkler als bisher */
  --ink:        oklch(16% 0.012 270);    /* primary text */
  --ink-2:      oklch(38% 0.010 270);    /* body */
  --ink-3:      oklch(56% 0.008 270);    /* muted / meta */
  --ink-4:      oklch(70% 0.006 270);    /* placeholder */

  /* Borders */
  --line:       oklch(92% 0.004 270);    /* default border */
  --line-2:     oklch(95.5% 0.003 270);  /* inner divider */

  /* Accent — ruhigeres Indigo */
  --accent:     oklch(48% 0.17 268);
  --accent-2:   oklch(58% 0.14 268);
  --accent-soft:oklch(95% 0.035 268);    /* hover/highlight bg */
  --accent-ink: oklch(98% 0.01 268);

  /* Status — pro Stufe eine Hue */
  --status-draft:     oklch(58% 0.02 270);   /* slate */
  --status-applied:   oklch(54% 0.14 240);   /* blue */
  --status-interview: oklch(54% 0.16 295);   /* violet */
  --status-offer:     oklch(54% 0.14 155);   /* emerald */
  --status-rejected:  oklch(58% 0.16 25);    /* rose */

  /* Status backgrounds — pair mit dem oben */
  --status-draft-bg:     oklch(96% 0.005 270);
  --status-applied-bg:   oklch(95% 0.025 240);
  --status-interview-bg: oklch(95% 0.025 295);
  --status-offer-bg:     oklch(95% 0.025 155);
  --status-rejected-bg:  oklch(96% 0.020 25);

  /* Semantic */
  --good:    var(--status-offer);
  --warn:    oklch(60% 0.14 60);
  --bad:     var(--status-rejected);
}
```

### 1.2 Radii — gestrafft

```css
--radius-xs:  4px;
--radius-sm:  6px;     /* ehem. 8 */
--radius-md:  10px;    /* ehem. 14 */
--radius-lg:  14px;    /* ehem. 22 */
--radius-xl:  20px;    /* ehem. 28 */
--radius-full:9999px;
```

### 1.3 Shadows — restrained

```css
--shadow-xs: 0 1px 2px rgba(15,18,32,0.04);
--shadow-sm: 0 1px 2px rgba(15,18,32,0.04), 0 1px 1px rgba(15,18,32,0.03);
--shadow-md: 0 1px 2px rgba(15,18,32,0.04), 0 8px 24px -8px rgba(15,18,32,0.10);
--shadow-lg: 0 1px 2px rgba(15,18,32,0.04), 0 24px 60px -20px rgba(15,18,32,0.16);
--shadow-popover: 0 8px 28px rgba(15,18,32,0.10), 0 0 0 1px rgba(15,18,32,0.04);
```

### 1.4 Type

Geist bleibt. Aktivieren: tabulare Ziffern für alle numerischen Klassen, OpenType-Features `cv11`, `ss01`.

```css
html { font-feature-settings: 'cv11' 1, 'ss01' 1; }
.num, .mono { font-variant-numeric: tabular-nums; }
```

Type-Skala (verwende als CSS-Properties statt direkt in Templates):

| Token | px | weight | usage |
|---|---|---|---|
| `--text-hero` | 60 / 1.04 / -1.6 | 600 | Landing H1 |
| `--text-h1` | 28 / 1.15 / -0.5 | 600 | Page title (Auth, Modal) |
| `--text-h2` | 22 / 1.2 / -0.3 | 600 | Page title (App) |
| `--text-h3` | 18 / 1.3 / -0.2 | 600 | Editor view title |
| `--text-h4` | 13 / 1.3 / 0 | 600 | Panel header |
| `--text-body` | 14 / 1.55 / 0 | 400 | Body |
| `--text-meta` | 12.5 / 1.5 / 0 | 400 | Secondary |
| `--text-micro` | 11 / 1.4 / 0.06em | 500 | Mono eyebrow (uppercase) |

Aktuelle `.page-title { font-size: 22 }` bleibt — Empfehlung: alle Page-Titles über `--text-h2` einziehen, nicht hartkodiert.

### 1.5 Spacing

Aktuelle Skala bleibt. Ergänze:

```css
--space-5:  1.25rem; /* fehlt aktuell, wird aber im Card-System referenziert */
```

---

## 2. Icon-System

### 2.1 Wahl

**Lucide** (https://lucide.dev). Lizenz ISC, Tree-Shaking-fähig.

### 2.2 Integration

```bash
npm install lucide-angular
```

Standalone-Komponente verwenden:

```ts
// src/app/shared/icons/icon.module.ts (oder als provider in app.config.ts)
import { LucideAngularModule, Home, Briefcase, Columns, FileText,
         Linkedin, Settings, LogOut, Plus, Search, Download,
         Sparkles, Bell, Mail, Link, Calendar, Building, User,
         Lock, Target, AlertCircle, Copy, RefreshCw, Filter,
         LayoutGrid, Command, ChevronDown, ChevronRight,
         ChevronLeft, Check, X, MoreHorizontal, TrendingUp,
         Upload, FileEdit, Layers, Eye, Send, Star, Sun,
         ArrowRight, GripVertical, Globe, Pin } from 'lucide-angular';

export const ICONS = LucideAngularModule.pick({
  Home, Briefcase, Columns, FileText, Linkedin, Settings, LogOut,
  Plus, Search, Download, Sparkles, Bell, Mail, Link, Calendar,
  Building, User, Lock, Target, AlertCircle, Copy, RefreshCw,
  Filter, LayoutGrid, Command, ChevronDown, ChevronRight,
  ChevronLeft, Check, X, MoreHorizontal, TrendingUp, Upload,
  FileEdit, Layers, Eye, Send, Star, Sun, ArrowRight,
  GripVertical, Globe, Pin,
});
```

Usage im Template:

```html
<lucide-icon name="briefcase" [size]="16" [strokeWidth]="1.6"></lucide-icon>
```

### 2.3 Migrationen (Suche & Ersetze)

In `app-shell.component.html`:

| Alt | Neu |
|---|---|
| `<span aria-hidden="true">⊞</span>` | `<lucide-icon name="home"></lucide-icon>` |
| `<span aria-hidden="true">📄</span>` | `<lucide-icon name="file-text"></lucide-icon>` |
| `<span aria-hidden="true">🔗</span>` | `<lucide-icon name="linkedin"></lucide-icon>` |
| `<span aria-hidden="true">⚙</span>` | `<lucide-icon name="settings"></lucide-icon>` |
| `<span aria-hidden="true">→</span>` (Logout) | `<lucide-icon name="log-out"></lucide-icon>` |

In `features-grid.component.html`: alle `.feature-icon` Glyphen (⌕, ✎, ◎, ▤) → Lucide `search`, `pen-line`, `target`, `file-output`.

In `workflow-steps.component.html`: Unicode-Pfeile durch Lucide ersetzen.

In `hero.component.html`: Sterne `★★★★☆` durch Inline-SVG mit `lucide-star` + halbgefülltem letzten Stern.

---

## 3. Information Architecture — neue Routen

Komplette Neufassung von `src/app/app.routes.ts`:

```ts
import type { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';

export const routes: Routes = [
  // ── Marketing ──────────────────────────────────────────
  { path: '',          loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'preise',    loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent) },
  // /try wird DEPRECATED. Try-Flow lebt nur noch im Landing-Modal.

  // ── Auth ───────────────────────────────────────────────
  { path: 'login',           loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register',        loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password',  loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },

  // ── App ────────────────────────────────────────────────
  {
    path: 'app',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: AppShellComponent,
        children: [
          // ▼ NEU: trenne Dashboard (Übersicht) von Bewerbungsliste
          { path: '',             loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'applications', loadComponent: () => import('./features/applications/applications.component').then(m => m.ApplicationsComponent) },
          { path: 'pipeline',     loadComponent: () => import('./features/pipeline/pipeline.component').then(m => m.PipelineComponent) },
          { path: 'cvs',          loadComponent: () => import('./features/master-cvs/master-cvs.component').then(m => m.MasterCvsComponent) },
          { path: 'wizard',       loadComponent: () => import('./features/wizard/wizard.component').then(m => m.WizardComponent) },
          { path: 'linkedin',     loadComponent: () => import('./features/linkedin/linkedin.component').then(m => m.LinkedInComponent) },
          // ▼ NEU: Settings als echte Route (statt nur Modal)
          { path: 'settings',     loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
          { path: 'settings/billing',  loadComponent: () => import('./features/settings/billing.component').then(m => m.BillingComponent) },
          { path: 'settings/security', loadComponent: () => import('./features/settings/security.component').then(m => m.SecurityComponent) },
          { path: 'settings/data',     loadComponent: () => import('./features/settings/data.component').then(m => m.DataComponent) },
        ],
      },
      // Editor: full-screen, no shell
      { path: 'applications/:id', loadComponent: () => import('./features/application-editor/editor.component').then(m => m.EditorComponent) },
    ],
  },

  // ── FAQ / Legal ────────────────────────────────────────
  { path: 'faq',         loadComponent: () => import('./features/faq/faq.component').then(m => m.FaqComponent) },
  { path: 'datenschutz', loadComponent: () => import('./features/legal/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'agb',         loadComponent: () => import('./features/legal/terms.component').then(m => m.TermsComponent) },
  { path: 'impressum',   loadComponent: () => import('./features/legal/imprint.component').then(m => m.ImprintComponent) },

  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
```

### Migrationsschritte

- `try.component.*` löschen, oder behalten als Marketing-Embed unter `landing/sections/try-inline.component.*`. Route entfernen.
- `billing.component.*` → in `features/settings/billing.component.*` umziehen.
- `applications.component` (neu): zeigt Tabelle/Liste der Bewerbungen mit Filter. Übernimmt die Listen-Logik aus dem aktuellen Dashboard.
- `pipeline.component` (neu): nimmt das `lba-pipeline-board` aus dem Dashboard heraus und gibt ihm eine eigene Seite mit Toolbar.
- Dashboard wird zu reiner Übersicht (Stats + Pipeline-Preview + Reminders + Activity). Bewerbungsliste verschwindet von dort.

---

## 4. Status-Modell

### 4.1 Backend-Typen

```ts
// core/api/application.types.ts
export type ApplicationStatus =
  | 'DRAFT'        // CV/Anschreiben generiert, noch nicht versendet
  | 'APPLIED'      // versendet
  | 'INTERVIEW'    // Termin zu- oder vereinbart
  | 'OFFER'        // Angebot erhalten
  | 'REJECTED';    // Absage (durch Firma) oder zurückgezogen (durch Nutzer)
```

Backend-Migration: `OPEN` → `DRAFT`, `DONE` → bleibt mappable je nach letztem Status; default `APPLIED`. Bestehende Records bekommen ein Migrations-Script.

### 4.2 Frontend-Helper

Ersetze `shared/utils/score.utils.ts` bzw. ergänze `shared/utils/status.utils.ts`:

```ts
export const STATUS_META: Record<ApplicationStatus, {
  label: string;          // localized DE
  color: string;          // OKLCH ref
  bg: string;
  short: string;          // 3-Buchstaben für Pipeline-Header
  order: number;
}> = {
  DRAFT:     { label: 'Entwurf',   color: 'var(--status-draft)',     bg: 'var(--status-draft-bg)',     short: 'ENT', order: 0 },
  APPLIED:   { label: 'Beworben',  color: 'var(--status-applied)',   bg: 'var(--status-applied-bg)',   short: 'BEW', order: 1 },
  INTERVIEW: { label: 'Interview', color: 'var(--status-interview)', bg: 'var(--status-interview-bg)', short: 'INT', order: 2 },
  OFFER:     { label: 'Angebot',   color: 'var(--status-offer)',     bg: 'var(--status-offer-bg)',     short: 'ANG', order: 3 },
  REJECTED:  { label: 'Abgesagt',  color: 'var(--status-rejected)',  bg: 'var(--status-rejected-bg)',  short: 'ABS', order: 4 },
};

export const STATUS_ORDER: ApplicationStatus[] = ['DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];
```

### 4.3 Neue StatusPill-Komponente

`shared/components/status-pill/status-pill.component.ts`:

- Signal-Input `status: InputSignal<ApplicationStatus>`
- Größen `'sm' | 'md'`
- Renderung: 5-px-Dot + Label, padding `2px 7px` (sm) / `3px 9px` (md), border-radius 5, color/bg aus STATUS_META

Ersetzt überall die `status--open`/`status--done`-Klassen.

---

## 5. Komponenten — Spezifikation

### 5.1 Button — Konsolidierung

`btn--secondary` und `btn--accent` **entfernen** (nicht nur deprecated lassen). Migration:

```bash
# Ausführen mit ripgrep oder sed
rg -l 'btn--secondary' src/ | xargs sed -i '' 's/btn--secondary/btn--outline/g'
rg -l 'btn--accent' src/ | xargs sed -i '' 's/btn--accent/btn--cta/g'
```

Neue Sizes/Heights (gestrafft):

| Size | min-height | padding | font-size | border-radius |
|---|---|---|---|---|
| `--sm` | 28 | 5 10 | 12.5 | 6 |
| `--md` | 34 | 7 12 | 13.5 | 7 |
| `--lg` | 40 | 10 16 | 14 | 8 |

`--primary` bekommt einen subtileren Shadow:

```css
.btn--primary { background: var(--ink); color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.btn--cta { background: var(--accent); color: #fff; box-shadow: 0 1px 2px color-mix(in oklch, var(--accent) 40%, transparent); }
```

Hover-Lift `translateY(-1px)` **entfernen** — zu spielerisch für ein Pro-SaaS-Tool.

### 5.2 AppShell — neue Sidebar

Komplettes Rewrite von `shared/components/app-shell/app-shell.component.html`:

```html
<div class="shell">
  <aside class="shell__sidebar" aria-label="Hauptnavigation">
    <!-- Brand -->
    <div class="shell__brand">
      <div class="shell__logo-mark" aria-hidden="true">H</div>
      <span class="shell__logo-text">Hireflow</span>
      <span class="shell__brand-tag">BETA</span>
    </div>

    <!-- Workspace switcher -->
    <button class="shell__workspace" type="button" (click)="openWorkspaceSwitcher()">
      <div class="shell__workspace-avatar">{{ initials() }}</div>
      <div class="shell__workspace-text">
        <span class="shell__workspace-name">{{ auth.user()?.name }}</span>
        <span class="shell__workspace-meta">{{ auth.user()?.role }} · DE</span>
      </div>
      <lucide-icon name="chevron-down" [size]="14"></lucide-icon>
    </button>

    <!-- Nav -->
    <nav class="shell__nav" aria-label="App-Navigation">
      <p class="shell__group">Workspace</p>
      <a routerLink="/app" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }" class="shell__link">
        <lucide-icon name="home" [size]="18"></lucide-icon>
        <span>Dashboard</span>
      </a>
      <a routerLink="/app/applications" routerLinkActive="is-active" class="shell__link">
        <lucide-icon name="briefcase" [size]="18"></lucide-icon>
        <span>Bewerbungen</span>
        <span class="shell__count">{{ counts().applications }}</span>
      </a>
      <a routerLink="/app/pipeline" routerLinkActive="is-active" class="shell__link">
        <lucide-icon name="columns" [size]="18"></lucide-icon>
        <span>Pipeline</span>
      </a>
      <a routerLink="/app/cvs" routerLinkActive="is-active" class="shell__link">
        <lucide-icon name="file-text" [size]="18"></lucide-icon>
        <span>Lebensläufe</span>
        <span class="shell__count">{{ counts().cvs }}</span>
      </a>
      <a routerLink="/app/linkedin" routerLinkActive="is-active" class="shell__link shell__link--locked" [class.is-locked]="!isPro()">
        <lucide-icon name="linkedin" [size]="18"></lucide-icon>
        <span>LinkedIn</span>
        <span class="shell__lock" *ngIf="!isPro()">PRO</span>
      </a>
    </nav>

    <!-- Bottom: usage + settings -->
    <div class="shell__bottom">
      <div class="shell__usage" *ngIf="!isPro()">
        <div class="shell__usage-head">
          <span>Plan</span>
          <span class="num">{{ usage().used }} / {{ usage().limit }}</span>
        </div>
        <div class="shell__usage-bar"><span [style.width.%]="usage().percent"></span></div>
        <div class="shell__usage-foot">
          <span>Free</span>
          <a routerLink="/preise" class="shell__usage-cta">Upgrade →</a>
        </div>
      </div>
      <a routerLink="/app/settings" routerLinkActive="is-active" class="shell__link">
        <lucide-icon name="settings" [size]="18"></lucide-icon>
        <span>Einstellungen</span>
      </a>
    </div>
  </aside>

  <main class="shell__content">
    <lba-app-topbar [crumbs]="crumbs()" [actions]="topbarActions()" />
    <router-outlet />
  </main>
</div>
```

Styles in `app-shell.component.scss`: 240px breit, 20/12 padding, kein Lift-Hover. Active-Link bekommt 2-px-Accent-Streifen am linken Rand (über `position:absolute; left:-12px`).

### 5.3 AppTopBar — neu

Neue Komponente `shared/components/app-topbar/`. 56 px hoch, Breadcrumb links + Command-Palette-Button + Bell + slot für Aktionen.

```html
<header class="topbar">
  <div class="topbar__crumbs">
    <ng-container *ngFor="let crumb of crumbs(); let i = index; let last = last">
      <lucide-icon *ngIf="i > 0" name="chevron-right" [size]="14"></lucide-icon>
      <span [class.is-current]="last">{{ crumb.label }}</span>
    </ng-container>
  </div>

  <button class="topbar__search" type="button" (click)="openCommandPalette()">
    <lucide-icon name="search" [size]="14"></lucide-icon>
    <span>Suchen oder springen zu…</span>
    <kbd>⌘ K</kbd>
  </button>

  <button class="topbar__icon-btn" (click)="openNotifications()" aria-label="Benachrichtigungen">
    <lucide-icon name="bell" [size]="16"></lucide-icon>
    <span class="topbar__dot" *ngIf="hasUnread()"></span>
  </button>

  <ng-content></ng-content>
</header>
```

### 5.4 Command Palette — neu

Eine `lba-command-palette` Komponente mit `<dialog>`-Element. Triggert via ⌘K / Ctrl+K. Items:

- „Neue Bewerbung erstellen" → `/app/wizard`
- „Lebenslauf hochladen" → `/app/cvs?action=upload`
- „Pipeline öffnen" → `/app/pipeline`
- Alle Bewerbungen (Fuzzy-Suche nach Titel + Firma) → Editor
- Alle CVs → CVs-Page mit Highlight
- Einstellungen → Settings

Implementation: `cmdk` (https://github.com/pacocoursey/cmdk) ist React. Für Angular: `ngx-command-palette` oder eigenhändig mit `signals` + `fuse.js`.

### 5.5 StatusPill, ScoreRing, CompanyLogo — neu

Drei kleine Komponenten, alle als Standalone:

- `shared/components/status-pill/` — siehe 4.3
- `shared/components/score-ring/` — bereits vorhanden, aber **überall verwenden**, insbesondere im Editor-Topbar (heute nur Zahl)
- `shared/components/company-logo/` — neue Komponente: deterministischer Hash → Farbe + Initialen. Inputs: `name`, `size` (default 32), optional `imageUrl` falls Logo manuell hochgeladen wurde

### 5.6 Pipeline-Board — Aufrüstung

`shared/components/pipeline-board/`:

- 5 Spalten statt 2
- Spaltenheader: Status-Dot + Label + Count + „+"-Button
- Karten: CompanyLogo + Co-Name + Mono-„Wann" + Rolle + Score-Inline + optionaler Reminder-Chip
- Drag-and-Drop zwischen allen 5 Stati
- Inline-Status-Wechsel via Rechtsklick-Menü (Kontextmenü)

---

## 6. Seiten — Spezifikation

### 6.1 Dashboard — neue Übersicht

Datei: `features/dashboard/dashboard.component.html`

Struktur:

1. **Greeting** — „Guten Morgen, {name}" + Sub-Counter („5 aktiv · 2 erwarten Follow-up"). Zeitraum-Selector rechts.
2. **Stats-Strip** — 4 Karten mit **Farbcodierung pro Metrik-Typ**:

   | Metrik | Top-Bar-Farbe | Icon | Icon-bg |
   |---|---|---|---|
   | Aktive Bewerbungen | `--status-applied` (blau) | `briefcase` | `oklch(97% 0.030 240)` |
   | Antwortquote | `--status-interview` (violett) | `mail` | `oklch(97% 0.025 295)` |
   | Ø Match-Score | `--status-offer` (grün) | `target` | `oklch(97% 0.030 155)` |
   | Nächste Erinnerung | `--warn` (warm) | `bell` | `oklch(97% 0.030 60)` |

   Jede Karte hat einen 3-px-Top-Bar in der Status-Farbe, ein 26×26 Icon-Container links oben in `bg` getintet mit der Status-Farbe als Icon-Color, und die Trend/Sub-Text-Zeile unten in der Statusfarbe gefärbt (statt grau).

3. **Pipeline-Preview** — 5 Mini-Spalten:
   - Jede Spalte hat ihre Status-`bg`-Farbe als Hintergrund (`--status-{name}-bg`)
   - 2-px-Top-Band in der Status-Farbe
   - Spaltentitel + Count in Status-Farbe (statt neutral grau)
   - „Alle anzeigen →" verlinkt nach `/app/pipeline`.

4. **2-Spalten unten:** Letzte Aktivität (jede Zeile mit **3-px-Linke-Kante in Status-Farbe** zwischen Padding und Co-Logo) + Anstehend (Reminder-Liste mit farbigem Icon-Container per Typ: Mail=blau, Calendar=violett, Bell=grün).

Onboarding-Checkliste **wird Modal**, nicht Inline-Karte — öffnet sich beim ersten Login automatisch, danach via Hilfe-Menü.

### 6.2 Bewerbungen — neue Liste

Datei: `features/applications/applications.component.html`

Struktur:

1. Page-Header mit View-Toggle (Liste/Pipeline) und CTA „Neue Bewerbung".
2. Filter-Leiste: Filter-Button + Status-Chips + Suchfeld + Sortierung.
3. Datentabelle: Co-Logo, Rolle, Firma, Status-Pill, Match-Score, Erstellt, Letzte Aktion, Reminder, Aktionen-Menü.

Sortierbar nach allen Spalten. Spalten-Konfiguration in localStorage.

### 6.3 Pipeline — eigenständig

Datei: `features/pipeline/pipeline.component.html`

Reine Pipeline-Ansicht; Toolbar oben (Filter, View-Toggle, CTA). Board nimmt restlichen Viewport.

**Farbcodierung pro Spalte:**

- Spalten-Container: `background: var(--status-{name}-bg)`, `border: 1px solid {status-color}/22%`, `border-radius: 12px`
- 3-px-Top-Band der Spalte in der Status-Farbe (rounded oben matching dem Radius)
- Spalten-Header: Dot + Label + Count alle in `var(--status-{name})` (nicht grau)
- Karten innerhalb der Spalte: weißer Hintergrund + **3-px-Linke-Kante in Status-Farbe** (`border-left: 3px solid var(--status-{name})`)
- Match-Score-Chip auf der Karte: bg/color je nach Score-Schwelle (≥80 grün, ≥60 blau, sonst warn)

Empty-State pro Spalte: dezentes „Leer" in Status-Farbe @ 50% opacity.

### 6.4 Editor — neue 3-Pane-Struktur

Datei: `features/application-editor/editor.component.html`

**Header-Strip** (88 px):
- Links: CompanyLogo (44 px) + Job-Titel (h3) + Mono-Meta-Zeile (Firma · Standort · erstellt)
- Mitte: Status-Select-Button (öffnet Dropdown mit 5 Stati + „Erinnerung setzen")
- Rechts: ScoreRing (42 px) + „ATS-Match" Label + Match-Qualität („Stark · 14/16 Keywords")

**TopBar darüber**: Breadcrumb + „Gespeichert"-Indikator (mit grünem 6-px-Dot vor dem Text) + „Vorschau" + „Exportieren ▾" (Dropdown: CV PDF, Anschreiben PDF, Beide, Per E-Mail senden, ZIP)

**3-Pane-Body:**

| Pane | Breite | Inhalt |
|---|---|---|
| Outline | 220 px | Sektionen-Nav (Profil, Erfahrung, …) mit Count + Active-Streifen in `--accent` + Template-Picker unten |
| Center | flex | Sektion-Karten mit **Farbcodierung pro Sektion-Typ** (siehe unten) + Drag-Handle + Inline-Highlight für Match-Keywords |
| Right | 440 px | Tabs: Anschreiben / Analyse / Nachfassen. Anschreiben hat Sub-Tabs für 3 Varianten + Send-Footer |

**Farbcodierung der CV-Sektionen** im Center-Pane:

| Sektion | Linke 3-px-Kante | Header-bg | Header-Titel-Color |
|---|---|---|---|
| Profil | `--accent` (indigo) | `oklch(98.5% 0.014 268)` | `--accent` |
| Erfahrung | `--status-applied` (blau) | `oklch(98.5% 0.012 240)` | `--status-applied` |
| Projekte | `--status-applied` | wie Erfahrung | wie Erfahrung |
| Skills | `--status-offer` (grün) | `oklch(98.5% 0.012 155)` | `--status-offer` |
| Ausbildung | `--status-interview` (violett) | `oklch(98.5% 0.012 295)` | `--status-interview` |
| Sprachen | `--warn` | `oklch(98.5% 0.012 60)` | `--warn` |

KI-Optimiert-Badge auf dem Profil-Header: gefüllt mit `--accent` + weißer Sparkle-Icon + Text (statt soft-bg + accent-color wie aktuell).

**Anschreiben-Variant-Tabs:** segmented Buttons mit Accent-Dot auf der gewählten Variante. Wechsel updated den Preview-Text ohne Reload. „Neu generieren" als Link rechts unten.

**Send-Footer:** Empfänger-Input + „Senden"-Btn + Pin-Hinweis „PDF wird automatisch beigefügt".

### 6.5 Wizard — Sidebar-Progress

Datei: `features/wizard/wizard.component.html`

Komplettes Layout-Rework. **Keine** Top-Stepper-Leiste mehr; stattdessen 280-px-Sidebar links:

- Zurück-Link oben
- Eyebrow „NEUE BEWERBUNG" + Titel „In 3 Schritten optimieren"
- Vertikale Stepper-Liste mit Verbindungs-Linien zwischen den Step-Bullets
- Unten: Promo-Karte „Dauert ~60 Sek." mit Sparkles-Icon + Erklärtext

Main-Bereich: zentrierter Container, max-width 720. Step-Inhalt mit großzügigem Padding (40 56).

**Disabled-Tabs entfernen:** PDF/Screenshot werden zu Tabs mit „BALD"-Badge anstatt `aria-disabled`. Klick öffnet Modal „Diese Feature kommt in 2 Wochen — abonnieren?".

### 6.6 CVs — Grid mit Mini-Preview

Datei: `features/master-cvs/master-cvs.component.html`

Vom Karten-Listen-Layout zu **Grid 3 Spalten**:

- Jede Karte: 200-px-hoher Preview-Bereich (Mini-CV-Render mit echtem Inhalt, downscaled), darunter Name, Meta, Aktionen.
- 3-px-Top-Bar pro Karte in der **Template-Akzentfarbe** (siehe Tabelle unten).
- Preview-Bereich-Hintergrund (`background`) ebenfalls in der getinten Akzentfarbe (sehr hell, 96% Lightness).
- **„Primär"-Badge** (sofern Primary-CV): jetzt vollflächig in Akzentfarbe gefüllt mit weißer Schrift + Stern-Icon + Drop-Shadow (`0 2px 6px rgba(0,0,0,0.10)`) — statt outline-only.
- Letzte Tile: Plus-Karte „Neuen Lebenslauf hinzufügen".

**Template-Farbzuordnung:**

| Template | Akzentfarbe | Preview-bg |
|---|---|---|
| Modern | `--accent` (indigo) | `oklch(96% 0.025 268)` |
| Classic | `--status-offer` (grün) | `oklch(96% 0.030 155)` |
| Editorial | `--status-interview` (violett) | `oklch(96% 0.025 295)` |
| Minimal *(falls vorhanden)* | `--ink-3` (neutral) | `--surface-2` |

Mini-Preview-Logik: gleiche Render-Pipeline wie PDF-Export, aber CSS-skaliert auf ~24%.

### 6.7 Landing-Hero — typografisch & ruhig

Datei: `features/landing/sections/hero.component.html`

- Subtle radialer Akzent als Hintergrund (`radial-gradient`)
- Eyebrow als Pill mit Sparkles-Mini-Icon
- H1 60 px / -1.6 letter-spacing, mit Italic-Akzent auf einem Wort: „**zur** *Stelle*"
- Sub-Lead 17 px / max-width 500
- CTA-Pair: primary-CTA + outline
- Social-Proof-Strip mit Avatar-Stack + Rating
- Rechts: stilisierter Editor-Peek mit Score-Ring, Keyword-Tags, schwebende Anschreiben-Karte

### 6.8 Login — Split-Screen

Datei: `features/auth/login.component.html`

Layout 1:1, links Brand-Panel (dunkler Hintergrund mit Grid-Pattern + Accent-Glow + Testimonial), rechts Form.

**2FA-Feld nicht mehr dauerhaft sichtbar:** Standard zeigt nur E-Mail + Passwort. Nach Submit prüft Backend, ob 2FA aktiv ist — wenn ja, zweiter Step mit OTP-Feld erscheint inline mit Animation.

Google-OAuth Button als sekundäre Option mit Trenner „oder".

---

## 7. Komponenten-Migrations-Plan

Reihenfolge für Claude Code:

### Phase 1 — Foundation (kein Visual-Change für Endnutzer)

1. `src/styles.css` → neue Tokens schreiben
2. Lucide-Angular installieren, ICONS-Bundle anlegen
3. `shared/utils/status.utils.ts` mit neuem ApplicationStatus-Typ
4. Backend-Migration für Status-Felder einplanen
5. Bestehende Tests ausführen — alle müssen weiter laufen (Tokens sind ja noch dieselben Namen, nur andere Werte)

### Phase 2 — Komponenten-Refactor

6. `lba-status-pill` schreiben, in Dashboard + Editor + Pipeline verwenden, alte `.status--*` Klassen entfernen
7. `lba-company-logo` schreiben
8. `lba-app-topbar` schreiben
9. `lba-command-palette` schreiben (Mock-Daten initial)
10. Button-Klassen konsolidieren via sed-Migration
11. Emoji → Lucide in app-shell, hero, features-grid, workflow-steps

### Phase 3 — IA & Routing

12. Neue Routen schreiben (`/app/applications`, `/app/pipeline`, `/app/settings/*`)
13. Dashboard refaktorisieren (Listen-Block raus, Pipeline-Preview rein)
14. `applications.component` + `pipeline.component` ausgliedern
15. `/try` Route entfernen, Try-Komponente in `landing/sections/try-inline.component` umziehen
16. App-Shell-Sidebar mit neuen Einträgen

### Phase 4 — Editor & Wizard

17. Editor: 3-Pane-Layout, Outline-Rail, Right-Pane mit Tabs
18. Wizard: Sidebar-Progress statt Top-Stepper, disabled-Tabs → BALD-Tabs
19. CVs: Grid-Layout mit Mini-Preview-Render

### Phase 5 — Marketing & Auth

20. Landing-Hero typografisch überarbeiten
21. Login: Split-Screen-Layout, 2FA-conditional
22. Pricing: Free-Plan-Anker als erste Karte ergänzen

### Phase 6 — Polish

23. Onboarding aus Dashboard ausziehen, als ein-malig Modal
24. Subtile Animationen mit GSAP für Stepper/Drag/Empty-State-Transitions
25. Axe-Smoke und Playwright-Tests anpassen
26. Storybook (falls vorhanden) updaten

---

## 8. Konkrete Datei-Änderungen

### Zu löschen

- `src/app/features/try/` (komplett)
- `src/app/features/legal/legal.component.scss` (referenziert aber kein TS — wahrscheinlich tot)

### Zu erstellen

```
src/app/features/applications/
  applications.component.ts
  applications.component.html
  applications.component.scss
  applications.component.spec.ts

src/app/features/pipeline/
  pipeline.component.ts
  pipeline.component.html
  pipeline.component.scss
  pipeline.component.spec.ts

src/app/features/settings/
  settings.component.{ts,html,scss,spec.ts}
  billing.component.{ts,html,scss,spec.ts}    // aus altem features/billing umgezogen
  security.component.{ts,html,scss,spec.ts}
  data.component.{ts,html,scss,spec.ts}

src/app/shared/components/status-pill/
  status-pill.component.{ts,html,scss,spec.ts}

src/app/shared/components/company-logo/
  company-logo.component.{ts,html,scss,spec.ts}

src/app/shared/components/app-topbar/
  app-topbar.component.{ts,html,scss,spec.ts}

src/app/shared/components/command-palette/
  command-palette.component.{ts,html,scss,spec.ts}

src/app/shared/components/score-ring/
  ↑ existiert bereits — überall einsetzen, wo Score als Zahl gezeigt wird

src/app/shared/utils/
  status.utils.ts                              // STATUS_META, STATUS_ORDER
```

### Stark zu überarbeiten

```
src/app/app.routes.ts                          // siehe Sektion 3
src/styles.css                                 // Tokens komplett ersetzen
src/app/shared/components/app-shell/*          // neue Sidebar
src/app/features/dashboard/*                   // ohne Bewerbungsliste, mit Pipeline-Preview
src/app/features/master-cvs/*                  // Grid + Mini-Preview
src/app/features/wizard/*                      // Sidebar-Stepper
src/app/features/application-editor/*          // 3-Pane
src/app/features/auth/login.component.*        // Split-Screen
src/app/features/landing/sections/hero.component.*  // typografisch
src/app/shared/components/pipeline-board/*     // 5 Spalten
```

---

## 9. Migrations-Risiken

| Risiko | Severity | Mitigation |
|---|---|---|
| Status-Backend-Migration | hoch | Migrations-Script schreiben, OPEN→DRAFT/APPLIED Mapping nach `last_export_at IS NULL` |
| Bestehende E2E-Tests (Playwright) | hoch | Test-Selektoren aktualisieren parallel zu jedem Komponenten-Refactor |
| Axe-Smoke bei Command-Palette | mittel | `<dialog>` mit korrektem `role`, `aria-label`, focus-trap nutzen |
| Mini-Preview-Performance | mittel | Lazy-Render via IntersectionObserver, max 6 sichtbar gleichzeitig |
| Tailwind-Klassen vs. Tokens | niedrig | Tailwind-Theme aus `tailwind.config.ts` an OKLCH-Tokens anhängen (extend.colors) |

---

## 10. Definition of Done

### 10.1 Globale Kriterien

- [ ] Alle Routen aus Sektion 3 erreichbar
- [ ] Keine Emoji-Glyphen in App-Chrome — `grep -rE '[\\x{1F000}-\\x{1FFFF}]' src/` returnst 0 Treffer
- [ ] Keine `.btn--secondary` oder `.btn--accent` Klassen mehr — `rg 'btn--(secondary|accent)' src/` returnst 0
- [ ] Status-Pill in 5 Stati gerendert in Dashboard, Editor, Pipeline, Liste
- [ ] Score-Ring überall, wo Score als Zahl angezeigt wurde
- [ ] Command-Palette via ⌘K erreichbar von jeder App-Seite
- [ ] Axe-Smoke grün auf allen 7 Seiten der `Redesign Examples.html`-Vorlage
- [ ] Playwright-Tests laufen durch

### 10.2 Visueller Abgleich pro Seite — Screenshot-Diff

**Pflicht-Check nach jeder Seitenarbeit.** Claude Code muss diese Schritte ausführen und das Ergebnis dokumentieren, bevor eine Phase als „done" gilt.

#### Vorbereitung (einmalig pro Phase)

```bash
# Dev-Server starten
cd frontend && npm start
# Mockup-Preview parallel servieren (separates Terminal)
cd .. && npx serve -l 4000
```

#### Pro-Seite-Check

Für **jede** Seite das gleiche Rezept:

1. Echte App rendern: `http://localhost:4200/{route}` → Vollbild-Screenshot (Viewport 1440×900)
2. Mockup rendern: `http://localhost:4000/redesign/visuals/preview.html?s={screen}` → Vollbild-Screenshot
3. Beide nebeneinander anzeigen oder Diff-Tool (z.B. `pixelmatch`, [`odiff`](https://github.com/dmtrKovalenko/odiff)) verwenden
4. **Abweichungen auflisten** unter Kategorien:
   - **Layout** (Spaltenbreiten, Paddings, Reihenfolge)
   - **Farben** (Hex/OKLCH-Werte, Status-Codes, Akzente)
   - **Typografie** (Größe, Weight, Letter-Spacing)
   - **Icons** (Set, Größe, Stroke)
   - **Interaktive States** (Hover, Active, Focus)

5. Akzeptanzregel: **alle Layout-/Farbabweichungen müssen begründet sein**. Wenn Mockup sagt `padding: '14px 18px'` und Implementation `padding: 16px 20px` rendert, ist das ein Defect — entweder die Implementation anpassen oder die Spec aktualisieren (mit Notiz, warum).

#### Routen ↔ Mockup-Mapping

| Echte App-Route | Mockup-URL | Mockup-Component |
|---|---|---|
| `/` (Landing-Hero) | `preview.html?s=landing` | `LandingScreen` |
| `/login` | `preview.html?s=login` | `LoginScreen` |
| `/app` (Dashboard) | `preview.html?s=dashboard` | `DashboardScreen` |
| `/app/pipeline` | `preview.html?s=pipeline` | `PipelineScreen` |
| `/app/cvs` | `preview.html?s=cvs` | `CvsScreen` |
| `/app/wizard` (Step 2) | `preview.html?s=wizard` | `WizardScreen` |
| `/app/applications/:id` | `preview.html?s=editor` | `EditorScreen` |

#### Beispiel-Prompt an Claude Code

```
Verifiziere Phase {N} per Screenshot-Diff:

1. Starte `npm start` im frontend-Repo.
2. Starte `npx serve -l 4000` im Wurzelverzeichnis.
3. Für jede Seite aus der Routen-Tabelle (Sektion 10.2):
   a. Mach einen Screenshot von http://localhost:4200{route}
   b. Mach einen Screenshot von http://localhost:4000/redesign/visuals/preview.html?s={screen}
   c. Stelle beide nebeneinander dar und liste mir alle Abweichungen
      in den 5 Kategorien (Layout / Farben / Typografie / Icons / States).
4. Markiere jede Abweichung als „beabsichtigt + Begründung" oder „Defect".
5. Defects fixen, dann Schritt 3 wiederholen — bis keine Defects mehr übrig.

Mach keine kosmetischen Annahmen — wenn die Mockup-Farbe oklch(48% 0.17 268)
ist und du oklch(50% 0.16 260) implementiert hast, ist das ein Defect.
```

#### Akzeptanz-Schwelle

Eine Phase ist nur dann „done", wenn pro Seite:

- **0 Defects in Kategorie Farben** (exakte Token-Werte)
- **0 Defects in Kategorie Icons** (keine alten Emojis, keine fremden Icon-Sets)
- **≤ 2 minor Layout-Defects** mit Begründung in der PR-Beschreibung
- **0 Defects in Typografie** für Geist-Skala (Größe / Weight)

---

## 11. Verweise

- **Audit & Inventar:** `Design Briefing.html` (Probleme, Inkonsistenzen, Komponenten-Katalog)
- **Visuelle Mockups:** `Redesign Examples.html` (7 Screens auf Canvas: Landing, Login, Dashboard, Pipeline, CVs, Wizard, Editor)
- **Pro Screen einzeln rendern:** `redesign/visuals/preview.html?s=editor` (auch `s=dashboard | pipeline | cvs | wizard | landing | login`)
- **Canvas-Überblick:** `redesign/visuals/canvas-overview.png` (zeigt alle Screens nebeneinander)
- **Tokens-Referenz im Mockup:** `redesign/shared.jsx` — die `TOKENS`-Konstante enthält alle Werte aus Sektion 1
- **Icons-Referenz im Mockup:** `redesign/icons.jsx` — die Lucide-Auswahl, die im Mockup verwendet wird
- **Screen-Quellen:** `redesign/screens-app.jsx`, `redesign/screen-editor.jsx`, `redesign/screens-marketing.jsx`

---

## 12. So briefst du Claude Code

Damit Claude Code das Redesign **pixel-nah** umsetzt, brauchst du drei Dinge zusammen — nicht nur die Spec.

### 12.1 Was du anhängen solltest

| Artefakt | Wofür |
|---|---|
| **`Atlas Redesign Spec.md`** (dieses Dokument) | Maßgeblicher Implementations-Plan: Tokens, Routen, Komponenten, Phasen |
| **`redesign/` Ordner komplett** (`icons.jsx`, `shared.jsx`, `screens-*.jsx`, `screen-editor.jsx`) | **Visuelle Referenz auf Pixel-Ebene** — exakte Hex/OKLCH-Werte, Padding-Werte, Schriftgrößen aller Mockups |
| **`Redesign Examples.html`** | Canvas zum Aufrufen im Browser; jede Karte per Klick im Fullscreen |
| **`redesign/visuals/preview.html`** | Einzelnen Screen ohne Canvas-Chrome rendern (z.B. zum Vergleich-Screenshot machen) |
| **`Design Briefing.html`** | Audit der bestehenden Reibungspunkte (Kontext, warum was geändert wird) |
| **`frontend/` Repo** | Die Ist-Codebasis |

### 12.2 Idealer Briefing-Prompt für Claude Code

```
Ich möchte unser Frontend nach der „Atlas"-Direktion umbauen.

Quellen:
  - Atlas Redesign Spec.md   (Implementations-Plan)
  - redesign/                (React-Mockups; pixel-genaue visuelle Referenz)
  - Redesign Examples.html   (Canvas; alle Screens visuell)
  - frontend/                (aktuelle Angular-Codebasis)

Arbeitsweise:
  1. Lies die Spec vollständig.
  2. Schau dir die JSX-Mockups an — sie sind die maßgebliche Pixel-Referenz.
  3. Arbeite die Phasen aus Sektion 7 nacheinander ab (Phase 1: Tokens, Phase 2: Komponenten, ...).
  4. NACH jeder Phase: kurze Zusammenfassung + Liste der geänderten Dateien;
     warte auf meine Bestätigung, bevor du die nächste Phase startest.
  5. Wenn ein Detail unklar ist, frag — nicht raten. Der Mockup-Code ist verbindlicher
     als die Spec; bei Konflikt gewinnt der Mockup.

Starte mit Phase 1.
```

### 12.3 Fidelity-Check nach jeder Phase

Nach Komponenten- oder Seiten-Arbeit lass Claude Code so verifizieren:

1. **Component-Diff per Screenshot:**
   ```
   Starte den Dev-Server, navigiere zu /app, mach einen Screenshot,
   und vergleiche mit redesign/visuals/preview.html?s=dashboard.
   Zeige mir beide Bilder nebeneinander und liste Abweichungen.
   ```

2. **Token-Check:**
   ```
   grep für die alten Token-Namen oder -Werte in src/.
   Liste jede verbleibende Stelle auf.
   ```

3. **Smoke-Tests laufen lassen:**
   ```
   Lass Playwright + Axe-Smoke einmal komplett laufen.
   Wenn etwas rot ist, zeig den Fehler bevor du weitermachst.
   ```

### 12.4 Was Claude Code NICHT tun soll

- **Nicht improvisieren bei Farben.** Wenn ein OKLCH-Wert oder eine Hex-Farbe in `redesign/shared.jsx` `TOKENS` steht, ist das die Quelle. Keine „ähnlichen" Werte einsetzen.
- **Nicht eigene Komponenten erfinden.** Wenn die Spec nicht eindeutig ist, im JSX-Mockup nachsehen — z.B. ist die Inline-Implementierung des Status-Pills oder der Score-Ring im Mockup verbindlich.
- **Nicht alle Phasen auf einmal.** Phasen sind absichtlich klein gehalten, damit du nach jeder pausieren und QA fahren kannst.
- **Nicht das Status-Modell anfassen, bevor das Backend-Migrations-Script existiert.** Phase 1 + 2 sind UI-only; Phase 3 (Routen) und das Status-Refactor brauchen Backend-Koordination.

### 12.5 Reihenfolge der Files-of-Truth bei Konflikten

1. **Mockup-JSX** (`redesign/screens-*.jsx`) — Pixel-Layout, exakte Werte
2. **Spec-MD** (dieses Dokument) — Architektur-Entscheidungen, IA, Migrations-Schritte
3. **Audit** (`Design Briefing.html`) — Begründungen, warum etwas geändert wird

Wenn die Spec sagt „Padding 18 16" und der Mockup `padding: '14px 18px'` rendert, gewinnt der Mockup. Der Mockup ist die Live-Wahrheit, die Spec eine Zusammenfassung.
