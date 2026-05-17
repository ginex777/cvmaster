# Hireflow Atlas — Granulare Task-Liste

**Eine Task = ein kleiner, testbarer Schritt.** Jede Komponente wird in mehrere Mikro-Tasks zerlegt — keine Task umfasst mehr als 1–2 Datei-Bereiche.

**Diese Datei ist self-contained:** jeder Coding-Agent (Claude Code, OpenAI Codex CLI, Aider, Cursor Agent, etc.) soll sie als alleinigen Input nehmen können und das Redesign Schritt für Schritt umsetzen.

---

# 📋 Sektion 0 — Setup für jeden Coding-Agent

**Vor der ersten Task** einmal durchlaufen:

## 0.1 Repository-Struktur

```
/                                  # Repo-Root
├── frontend/                      # Angular-App (Hauptarbeit hier)
│   ├── src/
│   │   ├── app/                   # Komponenten + Routen
│   │   ├── styles.css             # Globale Tokens
│   │   ├── index.html
│   │   └── ...
│   ├── public/                    # Statische Assets (Sitemap, Favicon)
│   ├── e2e/                       # Playwright + Axe
│   ├── package.json
│   └── tailwind.config.ts
├── redesign/                      # 🎯 PIXEL-VERBINDLICHE MOCKUPS
│   ├── icons.jsx                  # Lucide-Auswahl
│   ├── shared.jsx                 # TOKENS + Primitive (Btn, Sidebar, StatusPill, …)
│   ├── screens-app.jsx            # DashboardScreen, PipelineScreen, WizardScreen, CvsScreen
│   ├── screen-editor.jsx          # EditorScreen
│   ├── screens-marketing.jsx      # LandingScreen, LoginScreen
│   └── visuals/preview.html       # Per-Screen-Renderer
├── Redesign Examples.html         # Canvas mit allen 7 Screens
├── Design Briefing.html           # Audit + Probleme
├── Atlas Redesign Spec.md         # Architektur, Tokens, IA
└── Atlas Tasks.md                 # 👉 DU LIEST GERADE
```

## 0.2 Pflicht-Reading vor der ersten Task

In genau dieser Reihenfolge:

1. `Atlas Redesign Spec.md` — komplett.
2. `redesign/shared.jsx` — komplett (besonders das `TOKENS`-Objekt am Anfang).
3. `redesign/icons.jsx` — überfliegen (welche Icons existieren).
4. **Dann** den Screen-spezifischen JSX zur aktuellen Phase lesen.
5. **Browser öffnen** unter `http://localhost:4000/redesign/visuals/preview.html?s={screen}` (Setup siehe 0.4).

## 0.3 Tool-Hinweise

| Tool | Besonderheit | Empfehlung |
|---|---|---|
| **Claude Code** | Native FS-Tools, kann Tabs vorne offen halten | Standard-Modus |
| **OpenAI Codex CLI** | Headless, ohne Browser-Preview | Screenshots manuell rendern und in Prompt einbinden |
| **Aider** | Datei-fokussiert, gut für PR-Stil | Eine Task = ein Commit |
| **Cursor Agent** | IDE-integriert, sieht aktive Datei | Datei pro Task vorab öffnen |
| **GitHub Copilot Workspace** | Plant + führt aus | Spec + Tasks zusammen attachen |

**Tool-agnostische Faustregel:** Jede Task ist so geschrieben, dass sie **ohne menschliche Rückfrage** umsetzbar ist. Wenn ein Punkt unklar ist, fragt der Agent **vor** Implementierung — niemals raten.

## 0.4 Lokales Setup

**Terminal 1 — Angular App:**
```bash
cd frontend
npm install        # falls noch nicht
npm start          # http://localhost:4200
```

**Terminal 2 — Mockup-Preview-Server:**
```bash
# vom Repo-Root
npx http-server -p 4000 -c-1
# Mockup-Preview: http://localhost:4000/redesign/visuals/preview.html?s=editor
# Canvas: http://localhost:4000/Redesign%20Examples.html
```

**Terminal 3 — Tests (bei Bedarf):**
```bash
cd frontend
npm test                  # Jest unit
npm run test:e2e          # Playwright
npm run a11y              # Axe-Smoke
npm run lint
```

## 0.5 Branch- und Commit-Konventionen

- **Branch pro Phase** (nicht pro Task): `atlas/phase-a-editor`, `atlas/phase-b-pipeline`, …
- **Commit pro Task:** `feat(atlas): E-01 Status-Select 5-stufig im Editor`
- **PR pro Phase:** Reviewer prüft alle Tasks der Phase zusammen.
- **Nie direkt auf `main`/`master`** committen.

## 0.6 Tool-agnostischer Standard-Prompt

```
Implementiere {TASK-ID} aus "Atlas Tasks.md".

VORBEREITUNG:
1. Lies "Atlas Tasks.md" Sektion 0 (Setup) — einmal pro Session.
2. Lies die in der Task gelistete JSX-Datei VOLLSTÄNDIG.
3. Wenn die Task auf einen Bereich verweist (z.B. "Header-Strip"),
   lies mindestens 200 Zeilen Code um den Bereich herum.
4. Öffne die Preview-URL aus der Phase-Übersicht im Browser
   (oder rendere Screenshot wenn headless).

IMPLEMENTIERUNG:
5. Notiere dir alle exakten Werte aus dem JSX:
   - padding, margin, gap (z.B. "padding: 14px 18px 12px 22px")
   - border-radius, border-color, border-width
   - background, color (inkl. OKLCH-Tönungen wie "oklch(98.5% 0.014 268)")
   - font-size, font-weight, letter-spacing, line-height
   - SVG-Größen, stroke-width
6. Implementiere in der Angular-Komponente — alle Werte 1:1 übernehmen.

VERIFIKATION:
7. Starte `npm start` und navigiere zur betroffenen Route.
8. Mache Side-by-Side-Vergleich:
   - Echte App: http://localhost:4200{route}
   - Mockup-Preview: http://localhost:4000/redesign/visuals/preview.html?s={screen}
9. Liste Defects in 5 Kategorien auf:
   (a) Layout (Spalten, Padding, Reihenfolge)
   (b) Farben (Hex/OKLCH, Status-Codes, Akzente)
   (c) Typografie (Größe, Weight, Letter-Spacing)
   (d) Icons (Set, Größe, Stroke)
   (e) States (Hover, Active, Focus)
10. Fixe alle Defects.

REPORT:
11. Liefere am Ende:
    (a) Liste geänderter Dateien
    (b) JSX-Datei + Zeilenbereich als Quelle
    (c) Liste verbleibender Defects (akzeptiert mit Begründung)
    (d) "npm start" läuft ohne Console-Errors: ✓ / ✗
    (e) "Verifikation"-Checks aus der Task: ✓ / ✗
12. Commit mit Convention aus 0.5.

REGELN:
- Bei Konflikt zwischen Spec-MD und JSX-Mockup: JSX gewinnt.
- Bei Unklarheit: FRAG — niemals raten.
- Keine Eigeninitiative bei neuen Features außerhalb der Task.
- Keine Refactorings außerhalb des Scopes.
```

## 0.7 Was tun, wenn eine Task fehlschlägt

| Symptom | Aktion |
|---|---|
| Tests rot nach Änderung | Test-Selektoren prüfen → ggf. anpassen. Bei Logik-Bruch: Änderung rückgängig + nachfragen. |
| Lint-Errors | Sofort fixen. `npm run lint:fix` versuchen. |
| Preview & App divergieren stark | JSX nochmal lesen — wahrscheinlich Wert übersehen. |
| Build bricht (TS-Error) | Type-Fix VOR allen anderen Änderungen. Falls Typ-System nicht klar: nachfragen. |
| Backend-Endpoint fehlt | Task pausieren, nachfragen — kein Mock-Endpoint hinzufügen. |
| Konflikt mit anderer Task | Phasen-PR-Reihenfolge prüfen, ggf. Phase-Owner kontaktieren. |

## 0.8 Status-Reporting nach jeder Task

Format des Reports an den User:

```markdown
## {TASK-ID} · {Task-Titel}

**Geänderte Dateien:**
- `path/to/file.ts` (15 Zeilen)
- `path/to/file.html` (32 Zeilen)
- `path/to/file.scss` (47 Zeilen)

**JSX-Quelle:**
`redesign/screens-app.jsx` Zeilen 120–185 (`DashboardScreen` → Stats-Row)

**Defects nach Side-by-Side:**
- ✓ Layout passt
- ✓ Farben 1:1
- ⚠ Padding Stats-Card: 14px statt 16px (akzeptiert — Spec sagt 16, Mockup sagt 14, Mockup gewinnt)
- ✓ Typografie passt
- ✓ Icons passen

**Definition of Done (Sektion 0.9):**
- [x] D1 Code-Änderung umgesetzt
- [x] D2 JSX-Werte 1:1 übernommen
- [x] D3 Side-by-Side-Vergleich · 0 ungeklärte Defects
- [x] D4 `npm start` ohne Console-Errors
- [x] D5 `npm run lint` · 0 errors
- [x] D6 `npm run build` erfolgreich
- [x] D7 `npm test` für betroffene Specs · grün
- [x] D8 Spec-Test geschrieben/erweitert (für neue Komponenten)
- [x] D9 Verifikations-Schritte aus der Task · alle erfüllt
- [x] D10 ARIA / Focus / Tastatur-Nav geprüft
- [x] D11 Commit mit Convention (Sektion 0.5)
- [x] D12 Status in Übersichtstabelle gesetzt (☐ → ✅)
- [x] D13 Report nach Sektion 0.8 abgeliefert

**Commit:** `feat(atlas): E-01 Status-Select 5-stufig im Editor`
```

---

## 0.9 Definition of Done (PRO TASK PFLICHT)

**Eine Task ist erst dann erledigt, wenn ALLE 13 Punkte abgehakt sind.** Der Agent muss diese Checkliste in jedem Task-Report (Sektion 0.8) durchgehen und pro Punkt ✅ oder ❌ + Begründung liefern.

### D1 · Code-Änderung umgesetzt
Alle in der Task gelisteten Dateien wurden bearbeitet. Keine Datei vergessen.

### D2 · JSX-Werte 1:1 übernommen
Alle Pixel-Werte aus der referenzierten JSX-Datei (Padding, Border, Farbe, Font-Größe, Border-Radius) sind exakt in die Angular-Implementierung übernommen. Bei Abweichung: explizit dokumentiert mit Begründung.

### D3 · Side-by-Side-Vergleich · 0 ungeklärte Defects
Echte App (`localhost:4200`) und Mockup-Preview (`localhost:4000/redesign/visuals/preview.html?s={screen}`) wurden im Browser nebeneinander geöffnet. Alle Defects nach 5 Kategorien (Layout / Farben / Typografie / Icons / States) sind gelistet und entweder fixed oder mit Begründung akzeptiert.

### D4 · `npm start` ohne Console-Errors
```bash
cd frontend && npm start
```
Browser-DevTools-Console nach Page-Load und nach Interaktion mit dem betroffenen UI-Bereich → **0 Errors**, **0 ungeklärte Warnings**.

### D5 · `npm run lint` · 0 errors
```bash
cd frontend && npm run lint
```
ESLint-Output: 0 errors. Warnings dokumentiert wenn nicht trivial behebbar.

### D6 · `npm run build` erfolgreich
```bash
cd frontend && npm run build
```
TypeScript-Compile + Angular-Build laufen durch. Bundle-Größe nicht regression-relevant (mehr als +20 KB ungezippt → nachfragen).

### D7 · `npm test` für betroffene Specs · grün
```bash
cd frontend && npm test
```
Alle Jest-Tests laufen. Bei Änderung an Komponente X auch `X.spec.ts` grün. Snapshot-Tests akzeptiert wenn das neue Snapshot dem JSX-Mockup entspricht.

### D8 · Spec-Test geschrieben/erweitert
Bei **neuer** Komponente (z.B. StatusPill, CompanyLogo, AppTopBar): mindestens 3 Tests:
- Rendert ohne Errors
- Eingabe-Inputs werden korrekt verarbeitet
- Event-Outputs werden ausgelöst

Bei **bestehender** Komponente mit geänderter API: bestehende Tests angepasst, neuer Test für neue Funktion.

### D9 · Verifikations-Schritte aus der Task · alle erfüllt
Die `**Verifikation:**`-Bullets aus der konkreten Task wurden manuell durchgeführt. Jeder Bullet einzeln als ✅ markiert.

### D10 · ARIA / Focus / Tastatur-Nav geprüft
- Alle interaktiven Elemente erreichbar per `Tab`.
- Sichtbarer `:focus-visible`-Outline auf jedem Element.
- Dropdowns/Modals schließbar mit `Esc`.
- Aria-Labels und Roles korrekt (z.B. `role="dialog"` + `aria-modal="true"` + `aria-labelledby`).
- Bei neuen Patterns: einmaliger Browser-Axe-DevTools-Check auf der Seite → 0 Critical Issues.

### D11 · Commit mit Convention (Sektion 0.5)
Genau **ein** Commit pro Task. Format:
```
{type}(atlas): {TASK-ID} {Kurzbeschreibung}
```
Beispiel:
```
feat(atlas): E-01 Status-Select 5-stufig im Editor
fix(atlas): SH-12 Company-Logo deterministische Palette
refactor(atlas): MC-03 Template-Akzentfarben in Helper
```
Type-Liste: `feat` (neue Funktion), `fix` (Bug-Fix), `refactor` (Umbau ohne UI-Change), `style` (nur CSS), `test` (nur Tests), `docs`, `chore`.

### D12 · Status in Übersichtstabelle gesetzt
In der Übersichtstabelle am Ende der `Atlas Tasks.md` Status auf `✅` setzen:
```diff
- | E-01 | Editor: Status-Select 5-stufig | A | ☐ |
+ | E-01 | Editor: Status-Select 5-stufig | A | ✅ |
```
Diese Änderung ist Teil des Task-Commits.

### D13 · Report nach Sektion 0.8 abgeliefert
Strukturierter Report mit allen 6 Sektionen (Geänderte Dateien, JSX-Quelle, Defects, DoD-Checkliste, Commit, ggf. Notes) — als Markdown an den User.

---

### Zusätzliche Phase-DoD (gilt nach Abschluss einer Phase)

Wenn alle Tasks einer Phase (z.B. Phase A „Editor") ✅ sind, vor Merge:

- [ ] **P1** Alle 8 Tasks der Phase haben ✅ in der Übersichtstabelle
- [ ] **P2** Full-Test-Suite grün: `npm test && npm run test:e2e && npm run a11y`
- [ ] **P3** Build-Bundle-Size-Check: keine unerwarteten Regressionen (>5 % zu Phase-Start)
- [ ] **P4** Screenshot-Diff der Phase-Seite gegen Mockup-Preview-URL: ≤ 5 % Pixeldifferenz
- [ ] **P5** PR erstellt mit Phase-Name (`atlas/phase-a-editor`)
- [ ] **P6** PR-Beschreibung enthält: Liste aller Tasks, Screenshot-Diff-Bilder, manuelle Klick-Tour-Notizen
- [ ] **P7** Reviewer-Approval erhalten
- [ ] **P8** Squash-Merge auf Hauptbranch (oder Release-Branch)

---

# 🎯 Die JSX-Mockups sind die verbindliche Quelle der Wahrheit

**Claude Code, Codex, Aider und Cursor müssen diese Dateien lesen UND visuell anzeigen, BEVOR sie eine Task umsetzen.**

Jede Mikro-Task referenziert eine konkrete React-Komponente (oder Bereich davon). Pixel, Farben, Padding, Border-Radien, Font-Größen aus dem JSX sind **bindend** — die Angular-Implementierung muss visuell identisch aussehen.

### JSX-Datei-Inventar

| JSX-Datei | Enthält | Wird gerendert in |
|---|---|---|
| `redesign/icons.jsx` | Lucide-Icon-Set (`I.Home`, `I.Briefcase`, etc.) — exakte SVG-Pfade als Referenz | überall |
| `redesign/shared.jsx` | `TOKENS` (alle Farb-/Spacing-/Font-Werte), `Frame`, `Sidebar`, `AppTopBar`, `Btn`, `StatusPill`, `ScorePill`, `ScoreRing`, `Panel`, `CompanyLogo`, `STATUS_MAP` | überall |
| `redesign/screens-app.jsx` | `DashboardScreen`, `PipelineScreen`, `WizardScreen`, `CvsScreen` | `preview.html?s={dashboard,pipeline,wizard,cvs}` |
| `redesign/screen-editor.jsx` | `EditorScreen` (gesamter Editor inkl. Header-Strip, Outline, Center, Right-Pane) | `preview.html?s=editor` |
| `redesign/screens-marketing.jsx` | `LandingScreen`, `LoginScreen` | `preview.html?s={landing,login}` |
| `Redesign Examples.html` | `<DesignCanvas>` mit allen 7 Screens nebeneinander | direkt im Browser öffnen |
| `redesign/visuals/preview.html` | Per-Screen-Renderer mit URL-Param `?s=` | direkt im Browser öffnen |

### Pflicht-Workflow vor jeder Mikro-Task

1. **Mockup-Quelle öffnen** und mindestens 200 Zeilen Code um den relevanten Bereich lesen:
   ```bash
   # Beispiel für Editor-Task:
   read_file redesign/screen-editor.jsx
   ```
2. **Preview im Browser öffnen** und visuell betrachten:
   ```
   http://localhost:4000/redesign/visuals/preview.html?s=editor
   ```
3. **Pixel- und Werte-Vergleich:** Padding, Border, Farben aus dem JSX-Code übernehmen (Style-Objekt-Werte sind verbindlich, NICHT „ähnlich genug").
4. **Implementieren** in Angular HTML/SCSS.
5. **Side-by-Side-Vergleich:**
   - Links: `http://localhost:4200{route}` (echte App)
   - Rechts: `http://localhost:4000/redesign/visuals/preview.html?s={screen}` (Mockup)
6. **Defects auflisten** in 5 Kategorien (Layout, Farben, Typografie, Icons, States) — fixen bis keine mehr.

### Standard-Prompt (Copy-Paste pro Task) — verschärft

> Siehe **Sektion 0.6** oben für den vollständigen tool-agnostischen Prompt.

Kurzversion für erfahrene Agents:

```
Implementiere {TASK-ID} aus "Atlas Tasks.md". JSX-Mockup ist Pixel-Wahrheit.
Side-by-Side-Vergleich gegen preview.html?s={screen}. Defects nach 5 Kategorien
auflisten + fixen. Report nach Format aus Sektion 0.8.
```

---

# ⚠️ Status der Arbeit (Stand: Mai 2026)

Diese Phasen sind bereits **teilweise umgesetzt** — die Tasks unten reflektieren den heutigen Zustand und definieren nur noch die Delta-Arbeit.

| Bereich | Stand |
|---|---|
| Tokens, Lucide, Status-Utils, Buttons | ✅ größtenteils da |
| Shared-Komponenten (Status-Pill, Score-Ring, AppShell, AppTopBar, Command-Palette) | ✅ existieren, brauchen Schliff |
| Pipeline-Board | ⚠️ alte Logik mit Move-Buttons + Date-Input — komplett-Rewrite nötig |
| Editor | ⚠️ Grundstruktur da, Status-Select ist nur 2-Wege-Toggle, CV-Sektion-Farbcodes fehlen |
| Master-CVs | ⚠️ Grid existiert, Mini-Previews sind generisch (nicht Template-spezifisch) |
| Login | ❌ einspaltig — Split-Screen fehlt komplett, 2FA dauerhaft sichtbar |
| Hero | ❌ alte Preview-Struktur — Editor-Peek im Mockup-Stil fehlt |
| Pricing | ❌ 2 Karten statt 3 (Free-Anker fehlt) |
| Backend Status-Migration | ❌ noch nicht ausgeführt |
| Onboarding-Modal | ❌ noch nicht extrahiert |

---

# PHASE A — Editor (P-23 in vorheriger Version)

**📐 Verbindliche Quelle:** `redesign/screen-editor.jsx`, Komponente `EditorScreen` (gesamte Datei).
**🖼️ Preview:** `http://localhost:4000/redesign/visuals/preview.html?s=editor`

Die wichtigste Seite. In **acht** Mikro-Tasks zerlegt.

## ✅ E-01 · Editor: Status-Select 5-stufig

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → Header-Strip Bereich (suche `Status select`-Kommentar). Im Mockup ist es ein Button mit `<StatusPill status="interview">` + ChevronDown.
- **Dateien:**
  - `frontend/src/app/features/application-editor/editor.component.ts`
  - `frontend/src/app/features/application-editor/editor.component.html` (Header-Strip)
  - `frontend/src/app/features/application-editor/editor.component.scss`
- **Aktueller Zustand:** Button cycelt nur zwischen `OPEN ↔ DONE`.
- **Aufgabe:**
  1. Signal `statusMenuOpen` einführen (default false).
  2. `editor__status-btn` Button öffnet Dropdown (statt zu cyclen). Click outside schließt.
  3. Dropdown-Menü zeigt alle 5 Stati aus `STATUS_ORDER`, jeder Item als Row mit:
     - Status-Dot (5 px, in Status-Farbe)
     - Label
     - Aktueller Status hat `check`-Icon rechts
  4. Klick auf Item → `setStatus(status)` + Dropdown schließen.
  5. Trennlinie + zusätzliches Item „Erinnerung setzen…" unten (öffnet Reminder-Picker — siehe E-08).
- **Verifikation:**
  - Editor öffnen → Status-Button zeigt Pill in aktueller Farbe + Chevron
  - Klick öffnet Menü mit 5 Stati + Reminder-Item
  - Klick auf „Interview" → Pill wird violett, Pipeline aktualisiert sich

## ✅ E-02 · Editor: Score-Widget Layout

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → Header-Strip Bereich, `ATS score` Block. Im Mockup ist es `<ScoreRing score={88} size={42}>` + zwei Zeilen Text in einem getinten Container.
- **Dateien:** `editor.component.html` + `.scss`
- **Aktueller Zustand:** `<lba-score-ring>` + Label nebeneinander, aber kein expliziter Hintergrund.
- **Aufgabe:** Score-Widget umbauen in genau das Mockup-Pattern:
  - Container: `padding: 6px 14px 6px 8px`, `background: var(--surface-2)`, `border: 1px solid var(--line-2)`, `border-radius: 10px`, `display: flex; align-items: center; gap: 12px`
  - Links: ScoreRing 42 px
  - Rechts: 2 Zeilen
    - oben Mono-Eyebrow „ATS-MATCH" in `--ink-3`, font-size 11, letter-spacing 0.06em, uppercase
    - unten Match-Quality-Text: „Stark · 14/16 Keywords" — Farbe je nach Score-Schwelle (≥80 `--good`, ≥60 `--ink`, sonst `--warn`)
- **Verifikation:** Editor → Score-Widget rechts in Header-Strip sieht aus wie `preview.html?s=editor` Bereich rechts-oben.

## ✅ E-03 · Editor: TopBar `Exportieren ▾`-Dropdown

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → AppTopBar `actions`-Prop. Im Mockup: zwei Buttons („Vorschau" + „Exportieren") mit ChevronDown.
- **Dateien:** `editor.component.html` + `.ts` + `.scss`
- **Aktueller Zustand:** Button öffnet direkt `downloadBundle()`. Kein Dropdown.
- **Aufgabe:**
  1. Signal `exportMenuOpen`.
  2. Klick öffnet Dropdown rechts-oben mit Items:
     - „Beide herunterladen (ZIP)" → `downloadBundle()`
     - Trennlinie
     - „Lebenslauf als PDF" → `downloadCvPdf()`
     - „Anschreiben als PDF" → `downloadLetterPdf()`
     - Trennlinie
     - „Per E-Mail senden…" → fokussiert Empfänger-Input im Send-Footer
  3. Jeder Item-Row hat führendes Lucide-Icon (`file-text`, `mail`, `download`).
- **Verifikation:** Click „Exportieren ▾" öffnet Menü, alle 4 Aktionen klickbar.

## ✅ E-04 · Editor: CV-Section-Editor Farbcodierung

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → `CV editor center` Bereich. Drei Beispiel-Sektionen (Profil indigo, Erfahrung blau, Skills grün) mit exakten OKLCH-Werten im Style-Object.
- **Dateien:** `frontend/src/app/shared/components/cv-section-editor/cv-section-editor.component.{ts,html,scss}`
- **Aktueller Zustand:** Sections rendern in einheitlichem Stil ohne Farbe.
- **Aufgabe:**
  1. Helper-Funktion `sectionStyle(heading: string): { color: string; bg: string; stripe: string }`:
     ```ts
     const map = {
       profil: { color: 'var(--accent)', bg: 'oklch(98.5% 0.014 268)', stripe: 'var(--accent)' },
       erfahrung: { color: 'var(--status-applied)', bg: 'oklch(98.5% 0.012 240)', stripe: 'var(--status-applied)' },
       projekte: { color: 'var(--status-applied)', bg: 'oklch(98.5% 0.012 240)', stripe: 'var(--status-applied)' },
       skills: { color: 'var(--status-offer)', bg: 'oklch(98.5% 0.012 155)', stripe: 'var(--status-offer)' },
       ausbildung: { color: 'var(--status-interview)', bg: 'oklch(98.5% 0.012 295)', stripe: 'var(--status-interview)' },
       sprachen: { color: 'var(--warn)', bg: 'oklch(98.5% 0.012 60)', stripe: 'var(--warn)' },
     };
     return map[heading.toLowerCase()] ?? { color: 'var(--ink-2)', bg: 'var(--surface-2)', stripe: 'var(--line)' };
     ```
  2. Jede Section-Card bekommt `position: relative` + Pseudo-Element `::before` mit `left: 0; top: 0; bottom: 0; width: 3px; background: var(--stripe)`.
  3. Section-Header (`<h3>`): `background: var(--bg); padding-left: 22px; color: var(--color)`.
  4. Drag-Handle (`grip-vertical`-Icon) immer ganz links im Header.
- **Verifikation:** Editor mit CV → Profil ist indigo, Erfahrung blau, Skills grün — wie `preview.html?s=editor`.

## ✅ E-05 · Editor: „KI-optimiert"-Badge auf Profil

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → Profil-Section Header, `KI-optimiert`-Span (gefüllt in Accent, weiße Schrift, mit Sparkles-Icon).
- **Dateien:** `cv-section-editor.component.html` + `.scss`
- **Aktueller Zustand:** Badge wahrscheinlich fehlend.
- **Aufgabe:** Auf der Profil-Section (nur dort) Badge rechts im Header:
  - Inhalt: `<lucide-icon name="sparkles" [size]="10">` + „KI-optimiert"
  - Style: `background: var(--accent); color: #fff; font-weight: 500; font-size: 11px; padding: 2px 8px; border-radius: 4px; display: inline-flex; gap: 4px`
- **Verifikation:** Profil-Section zeigt Badge in Accent-Fill.

## ☐ E-06 · Editor: Letter-Variant-Pro-Lock

- **📐 JSX-Quelle:** kein direkter Mockup — Pro-Lock-Pattern siehe `redesign/shared.jsx` Sidebar (`shell__lock`-Span).
- **Dateien:** `editor.component.html` + `.ts`
- **Aktueller Zustand:** Alle 3 Varianten frei wählbar.
- **Aufgabe (Falls Pro-Gate gewünscht — bestätigen mit User vorher):**
  - Wenn Free-User: nur die im Wizard gewählte Tone-Variante aktiv. Andere zwei mit `lock`-Icon-Pill + Tooltip „Pro-Feature".
  - Klick auf gelockte Variante öffnet `<lba-upgrade-modal>`.
- **Verifikation:** Free-User sieht 1 aktive Variante + 2 gelockte mit Schloss.

## ✅ E-07 · Editor: Send-Footer Variant-Indikator

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → `Send row` Footer-Bereich am Ende des Right-Pane.
- **Dateien:** `editor.component.html` (Send-Footer)
- **Aufgabe:** Im Send-Footer Meta-Zeile ergänzen:
  - Aktuell: „PDF-Anhang wird automatisch beigefügt" + Neu-generieren-Link
  - Neu zusätzlich: Mono-Tag mit aktiver Variante: `{{ variantLabel(selectedLetter()) }}` als kleiner Chip in Mono-Font (z.B. `<span class="send-row__variant-tag">Formal-Variante</span>`)
- **Verifikation:** Send-Footer zeigt eindeutig welche Variante gesendet wird.

## ✅ E-08 · Editor: Reminder-Picker im Status-Menü

- **📐 JSX-Quelle:** kein expliziter Mockup — folgt Status-Dropdown-Pattern aus E-01.
- **Dateien:** `editor.component.ts` + `.html`
- **Aktueller Zustand:** Reminder nur in Pipeline-Karten setzbar.
- **Aufgabe:** Im Status-Dropdown unten „Erinnerung setzen…" Klick öffnet:
  - Mini-Popover mit Date-Input + Zeit-Input + „Übernehmen"-Button
  - Aktuelle Reminder wird angezeigt, kann via X gelöscht werden
  - Speichert via `setReminder(date)` Methode (Backend-Call vorhanden — Reuse aus Pipeline)
- **Verifikation:** Aus Editor heraus kann ein Reminder gesetzt werden, Dashboard-Reminder-Panel zeigt ihn.

---

# PHASE B — Pipeline-Board (S-26)

**📐 Verbindliche Quelle:** `redesign/screens-app.jsx`, Komponente `PipelineScreen` (gesamtes Board).
**🖼️ Preview:** `http://localhost:4000/redesign/visuals/preview.html?s=pipeline`

Komplett-Rewrite. **Sechs** Mikro-Tasks.

## ✅ PB-01 · Pipeline-Board: 5-Spalten-Config

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `PipelineScreen` → `data`-Objekt am Anfang (5 Status-Keys mit Beispiel-Bewerbungen).
- **Dateien:** `frontend/src/app/shared/components/pipeline-board/pipeline-board.ts`
- **Aktueller Zustand:** `columns` als 2-Wege-Array `[OPEN, DONE]`.
- **Aufgabe:**
  1. Import `STATUS_ORDER`, `STATUS_META` aus `status.utils`.
  2. `columns` computed signal: returnst Array mit 5 Einträgen, je mit `{ key, label, color, bg, accent }`.
  3. `appsForColumn(col)` filtert `applications` nach `legacyToStatus(app.status) === col.key`.
- **Verifikation:** Board rendert 5 leere Spalten.

## ✅ PB-02 · Pipeline-Board: Spalten-Container-Style

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `PipelineScreen` → der äußere `<div>` pro Spalte mit `background: s.bg`, `border: 1px solid {s.color}22`, `borderRadius: 12`, `padding: 0 8px 8px`, Top-Band als 3-px-Pseudo-Element.
- **Dateien:** `pipeline-board.html` + `.scss`
- **Aufgabe:**
  1. Spalten-Container (`.pipeline__col`):
     - `background: var(--col-bg)` (gesetzt via inline style aus STATUS_META.bg)
     - `border: 1px solid color-mix(in oklch, var(--col-color) 13%, transparent)`
     - `border-radius: 12px`
     - `padding: 0 8px 8px`
     - `min-height: 320px`
     - `position: relative`
  2. Vor dem Header ein 3-px-Top-Band:
     ```scss
     &::before {
       content: ''; position: absolute; top: 0; left: 0; right: 0;
       height: 3px; background: var(--col-color);
       border-radius: 12px 12px 0 0;
     }
     ```
  3. `--col-bg` und `--col-color` aus dem `appsForColumn`-Loop als inline style.
- **Verifikation:** 5 Spalten haben jeweils unterschiedliche getintete Hintergründe + bunte Top-Bars.

## ✅ PB-03 · Pipeline-Board: Spalten-Header

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `PipelineScreen` → Header pro Spalte (Dot + Label + Count + Plus-Btn, alles in Status-Farbe).
- **Dateien:** `pipeline-board.html` + `.scss`
- **Aufgabe:**
  1. Header (`.pipeline__col-heading`):
     - `padding: 12px 6px 12px`
     - `border-bottom: 1px solid color-mix(in oklch, var(--col-color) 25%, transparent)`
     - `margin-bottom: 10px`
     - `display: flex; align-items: center; gap: 8px`
  2. Inhalte (in dieser Reihenfolge):
     - 7×7-Dot in `var(--col-color)` (statt früheres ●-Glyph)
     - Label in `var(--col-color)`, `font-weight: 600; font-size: 12.5px`
     - Count in `var(--col-color)`, `opacity: 0.7`, `font-family: Mono`, `font-size: 11px`
     - Plus-Button (`lucide-icon plus`, size 14) ganz rechts mit `margin-left: auto; opacity: 0.7`
- **Verifikation:** Header pro Spalte zeigt farbigen Dot + farbiges Label + Count + Plus-Btn.

## ✅ PB-04 · Pipeline-Board: Karten-Layout

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `PipelineScreen` → innerer Karten-`<div>` mit `borderLeft: 3px solid {s.color}`, CompanyLogo, Co-Name, When, Role, Score-Pill, Reminder-Pill.
- **Dateien:** `pipeline-board.html` + `.scss`
- **Aktueller Zustand:** Karten haben „Move-To"-Buttons-Group.
- **Aufgabe:** Karten-Template komplett neu:
  ```html
  <li class="pipeline__card" [style.--card-color]="col.color">
    <div class="pipeline__card-head">
      <lba-company-logo [name]="company(app)" [size]="28" />
      <div class="pipeline__card-head-text">
        <div class="pipeline__card-co">{{ company(app) }}</div>
        <div class="pipeline__card-when">{{ app.createdAt | date:'dd. MMM' }}</div>
      </div>
    </div>
    <div class="pipeline__card-role">{{ jobTitle(app) }}</div>
    <div class="pipeline__card-meta">
      @if (app.matchScore !== null) {
        <span class="pipeline__card-score" [class]="scoreClass(app.matchScore!)">
          <lucide-icon name="target" [size]="10"></lucide-icon>
          {{ app.matchScore }}%
        </span>
      }
      @if (hasReminder(app)) {
        <span class="pipeline__card-reminder">
          <lucide-icon name="bell" [size]="10"></lucide-icon>
          {{ app.reminderAt | date:'dd.MM.' }}
        </span>
      }
    </div>
  </li>
  ```
- **Styles:**
  - Card: `background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 12px; border-left: 3px solid var(--card-color); box-shadow: 0 1px 2px rgba(15,18,32,0.03); cursor: grab;`
  - Head: `display: flex; gap: 9px; margin-bottom: 9px;`
  - Co-Name: `font-weight: 600; font-size: 12.5px; color: var(--ink)`
  - When: `font-size: 10.5px; color: var(--ink-3); font-family: Mono; letter-spacing: 0.04em`
  - Role: `font-size: 12px; color: var(--ink-2); margin-bottom: 10px`
  - Score-Pill: `display: inline-flex; gap: 4px; font-size: 11px; padding: 1px 7px; border-radius: 4px; font-weight: 500` + Farbe via `scoreClass()`:
    - `≥80` → `color: var(--status-offer); background: oklch(95% 0.04 155)`
    - `≥60` → `color: var(--status-applied); background: oklch(95% 0.025 240)`
    - sonst → `color: var(--warn); background: oklch(96% 0.03 60)`
  - Reminder-Pill: `color: var(--warn); background: oklch(95% 0.025 60)`
- **Verifikation:** Karten haben Logo, Co-Name, Datum mono, Rolle, Score-Chip in Schwellenfarbe.

## ✅ PB-05 · Pipeline-Board: Drag & Drop (CDK)

- **📐 JSX-Quelle:** Mockup-Karten haben `cursor: 'grab'` — Verhalten muss in Angular via CDK gebaut werden. Mockup zeigt keine Drag-Animation, aber Spalten müssen Drop-Targets sein.
- **Dateien:** `pipeline-board.ts` + `.html` + Modul-Imports
- **Aufgabe:**
  1. `@angular/cdk/drag-drop` Modul importieren.
  2. Spalten als `cdkDropList` mit `[cdkDropListConnectedTo]` zu allen anderen Spalten-IDs.
  3. Karten als `cdkDrag`.
  4. `(cdkDropListDropped)` Handler emittiert `statusChange({ id, newStatus })`.
  5. Drag-Preview: gleiche Karte mit `box-shadow: var(--shadow-lg); transform: rotate(2deg)`.
  6. Drop-Placeholder: dashed border in Status-Farbe.
- **Verifikation:** Karte kann zwischen allen 5 Spalten gezogen werden, Status persistiert.

## ✅ PB-06 · Pipeline-Board: Empty-State pro Spalte

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `PipelineScreen` → leere `rejected`-Spalte mit Text „Leer" in opacity 50% Status-Farbe.
- **Dateien:** `pipeline-board.html` + `.scss`
- **Aktueller Zustand:** Empty zeigt nur `–`.
- **Aufgabe:** `<li class="pipeline__empty">` mit:
  - Text: „Leer"
  - Style: `color: var(--col-color); opacity: 0.5; font-size: 11.5px; padding: 4px 0; text-align: center`
- **Verifikation:** Spalten ohne Karten zeigen dezentes „Leer" in der Spaltenfarbe.

---

# PHASE C — Master-CVs (P-21)

**📐 Verbindliche Quelle:** `redesign/screens-app.jsx`, Komponente `CvsScreen`.
**🖼️ Preview:** `http://localhost:4000/redesign/visuals/preview.html?s=cvs`

**Sechs** Mikro-Tasks.

## ✅ MC-01 · CVs: Text-Form als Inline-Expandable

- **📐 JSX-Quelle:** Im Mockup gibt es kein separates Text-Form-Layout — sie sollte als zusätzliche Grid-Karte erscheinen (analog zur Plus-Tile am Ende).
- **Dateien:** `master-cvs.component.html` + `.scss`
- **Aktueller Zustand:** Text-Form als großer Block über Grid.
- **Aufgabe:**
  1. Text-Form Card-Style wie eine reguläre CV-Karte rendern (selbe Breite wie Grid-Spalte).
  2. Statt vollbreitig: erscheint als **erste Grid-Spalte** wenn `textFormOpen()`, andere Karten rutschen nach hinten.
  3. Schließen-Button (X-Icon oben rechts) statt „Schließen"-Btn unten.
- **Verifikation:** Click „Text einfügen" → Form erscheint als Karten-Tile in Grid (nicht als Block-Banner darüber).

## ✅ MC-02 · CVs: Template-spezifische Mini-Preview Wiring

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `CvsScreen` → Preview-Block pro Karte (Mini-CV-Layout mit Name, Rolle, Sections — wird per Mock im JSX hartkodiert, in Angular pro Template ausgelagert).
- **Dateien:** `master-cvs.component.html` + `.ts`
- **Aktueller Zustand:** Statische Generic-Preview (Erfahrung-Linien) für alle.
- **Aufgabe:**
  1. Per Karte: switch auf `cv.template`:
     ```html
     @switch (cv.template) {
       @case ('modern') { <lba-cv-mini-preview-modern [cv]="cv" /> }
       @case ('classic') { <lba-cv-mini-preview-classic [cv]="cv" /> }
       @case ('editorial') { <lba-cv-mini-preview-editorial [cv]="cv" /> }
       @case ('executive') { <lba-cv-mini-preview-executive [cv]="cv" /> }
       @case ('minimal') { <lba-cv-mini-preview-minimal [cv]="cv" /> }
       @default { <lba-cv-mini-preview-modern [cv]="cv" /> }
     }
     ```
- **Verifikation:** Template-Wechsel auf einer Karte ändert Mini-Preview-Stil sofort.

## ✅ MC-03 · CVs: Template-Akzentfarben

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `CvsScreen` → `cvs`-Array oben mit `accent` + `accentBg` pro Template (Modern indigo, Classic grün, Editorial violett).
- **Dateien:** `master-cvs.component.ts` (cvAccentColor, cvAccentBg)
- **Aufgabe:** Methoden umschreiben auf Template-basierte Zuordnung statt index-basiert:
  ```ts
  cvAccentColor(cv: Cv): string {
    return {
      modern: 'var(--accent)',
      classic: 'var(--status-offer)',
      editorial: 'var(--status-interview)',
      executive: 'var(--status-applied)',
      minimal: 'var(--ink-3)',
    }[cv.template] ?? 'var(--accent)';
  }
  cvAccentBg(cv: Cv): string {
    return {
      modern: 'oklch(96% 0.025 268)',
      classic: 'oklch(96% 0.030 155)',
      editorial: 'oklch(96% 0.025 295)',
      executive: 'oklch(96% 0.025 240)',
      minimal: 'var(--surface-2)',
    }[cv.template] ?? 'oklch(96% 0.025 268)';
  }
  ```
- **Verifikation:** Template-Wechsel auf einer Karte ändert Top-Bar-Farbe + Preview-bg-Tönung passend.

## ✅ MC-04 · CVs: Primär-Badge in Accent gefüllt

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `CvsScreen` → Primary-Badge mit `background: cv.accent`, `color: '#fff'`, `boxShadow`.
- **Dateien:** `master-cvs.component.html` + `.scss`
- **Aktueller Zustand:** Badge ist outline mit Accent-Text + weißem Hintergrund.
- **Aufgabe:** Style auf:
  - `background: var(--cv-accent)` (gefüllt, nicht outline)
  - `color: #fff`
  - `font-weight: 600`
  - `box-shadow: 0 2px 6px rgba(0,0,0,0.10)`
  - `padding: 3px 8px`
- **Verifikation:** Erste Karte (Primär) zeigt vollflächig getintete Badge.

## ✅ MC-05 · CVs: Logik „Primär" persistieren

- **📐 JSX-Quelle:** kein expliziter Mockup für Action, nur visuell die Badge (siehe MC-04).
- **Dateien:** `master-cvs.component.ts`
- **Aktueller Zustand:** Primär = `index === 0` (zufällig).
- **Aufgabe:**
  1. CV-Type mit Flag `isPrimary: boolean` ergänzen (oder Backend `primaryCvId`).
  2. Aktion „Als Primär festlegen" im More-Menü pro Karte.
  3. Primary-Karte zuerst gerendert + Badge.
- **Verifikation:** Aktion auf Karte 3 → Badge wandert zu Karte 3, sie steht jetzt vorne.

## ✅ MC-06 · CVs: Action-Row Buttons

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `CvsScreen` → Action-Row unten („Bearbeiten" als `default`, „Anwenden" als `primary` mit Sparkles-Icon).
- **Dateien:** `master-cvs.component.html`
- **Aktueller Zustand:** „Bearbeiten" startet Rename (verwirrend). „Anwenden" mit Sparkles.
- **Aufgabe:**
  1. Linker Button: „Bearbeiten" → öffnet CV im CV-Section-Editor (eigene neue Route `/app/cvs/:id/edit` oder Modal). Label bleibt „Bearbeiten".
  2. Rename via Doppel-Klick auf Titel ODER Pencil-Icon im More-Menü.
  3. Rechter Button: bleibt „Anwenden" mit Sparkles-Icon — navigiert zu Wizard mit vorausgewähltem CV.
- **Verifikation:** Klick „Bearbeiten" → CV-Editor lädt. Doppel-Klick auf Titel → Inline-Rename.

---

# PHASE D — Login + Auth (P-13/14/15/16)

**📐 Verbindliche Quelle:** `redesign/screens-marketing.jsx`, Komponente `LoginScreen` (gesamte Datei).
**🖼️ Preview:** `http://localhost:4000/redesign/visuals/preview.html?s=login`

**Fünf** Mikro-Tasks.

## ✅ AU-01 · Login: Split-Screen-Layout

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LoginScreen` → äußerer `<div>` mit `display: grid; gridTemplateColumns: '1fr 1fr'; height: '100%'`.
- **Dateien:** `login.component.html` + `.scss`
- **Aktueller Zustand:** Single-column auf weißem Hintergrund.
- **Aufgabe:**
  1. Root-Layout `display: grid; grid-template-columns: 1fr 1fr; height: 100vh`.
  2. Links: dark-Panel — kommt in AU-02.
  3. Rechts: Form-Container — `display: flex; align-items: center; justify-content: center; padding: 48px`. Inner-Container `max-width: 380px; width: 100%`.
  4. Mobile-Breakpoint (≤768 px): nur rechte Spalte, Brand-Panel ausgeblendet.
- **Verifikation:** Desktop zeigt 50/50, Mobile zeigt nur Form.

## ✅ AU-02 · Login: Brand-Panel

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LoginScreen` → linker Block (`background: TOKENS.ink` + SVG-Grid-Pattern + Accent-Glow + Testimonial-Quote). Alle Werte (font-size 22, letter-spacing -0.4, max-width 440) im JSX.
- **Dateien:** `login.component.html` + `.scss`
- **Aufgabe:** Links rendern:
  ```html
  <aside class="auth-brand" aria-hidden="true">
    <svg class="auth-brand__grid"><!-- SVG-Grid-Pattern 32×32 mit 0.5 stroke, opacity 0.04 --></svg>
    <div class="auth-brand__glow"></div>
    <div class="auth-brand__logo">
      <div class="auth-brand__mark">H</div>
      <span>Hireflow</span>
    </div>
    <blockquote class="auth-brand__quote">
      <p class="auth-brand__kicker">Was unsere Nutzer sagen</p>
      <p class="auth-brand__text">„In 90 Sekunden hatte ich eine Bewerbung, für die ich sonst zwei Stunden gebraucht hätte. Der Match-Report ist Gold wert."</p>
      <footer class="auth-brand__author">
        <div class="auth-brand__avatar">LB</div>
        <div>
          <div>Lina Bachmann</div>
          <small>Frontend Developer · jetzt bei Stripe</small>
        </div>
      </footer>
    </blockquote>
  </aside>
  ```
- **Styles:**
  - Container: `background: var(--ink); color: #fff; padding: 48px; position: relative; overflow: hidden; display: flex; flex-direction: column`
  - `auth-brand__grid`: `position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.04`
  - `auth-brand__glow`: `position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; border-radius: 50%; background: var(--accent); filter: blur(120px); opacity: 0.4`
  - Quote: `font-size: 22px; line-height: 1.35; letter-spacing: -0.4px; font-weight: 500; max-width: 440px; margin-top: auto`
  - Kicker: Mono, 11 px, uppercase, opacity 0.6
  - Author: 36px round Avatar in Accent + Name + Sub
- **Verifikation:** Linke Hälfte zeigt dunklen Hintergrund + Grid-Pattern + Glow + Testimonial.

## ✅ AU-03 · Login: Form-Inhalte modernisieren

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LoginScreen` → rechter Block. H1 28 px, Inputs height 40, „Vergessen?"-Link, Submit primary mit ArrowRight, Google-Btn unterhalb.
- **Dateien:** `login.component.html` + `.scss` + `.ts`
- **Aktueller Zustand:** Schlichte Form mit dauerhaftem 2FA-Feld.
- **Aufgabe:**
  1. H1 „Willkommen zurück" 28 px, sub „Melde dich an, um deine Bewerbungen zu verwalten." in `--ink-3`.
  2. E-Mail-Feld + Passwort-Feld: Height 40, padding 0 12, font 13.5, `var(--line)` border.
  3. Passwort-Label rechts „Vergessen?" als Accent-Link.
  4. Submit-Btn: full-width, lg, `btn--primary`, mit Arrow-Right-Icon rechts.
  5. **2FA-Feld entfernen** aus initialer Render. Nur conditional:
     ```ts
     requiresTotp = signal(false);
     ```
     erst nach Submit + Server-Antwort `requires2fa: true` zweiter Step.
- **Verifikation:** Login ohne 2FA-User: nie ein OTP-Feld sichtbar. Login mit 2FA-User: nach Submit erscheint OTP-Feld als zweiter Step.

## ✅ AU-04 · Login: Google-OAuth-Btn (visuell)

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LoginScreen` → Trenner-Zeile mit „oder" + Google-Button mit inline Multi-Color-SVG.
- **Dateien:** `login.component.html` + `.scss`
- **Aufgabe:**
  1. Nach Submit-Btn Trenner-Zeile: dünner `--line`-Strich links + Text „oder" + Strich rechts. Style: Flex mit Gap, Lines via `flex: 1; height: 1px; background: var(--line)`.
  2. Google-Btn: `btn--default`, full-width, mit inline Google-SVG (multi-color) links, Text „Mit Google fortfahren".
  3. Click-Handler: vorerst `console.log` (OAuth-Flow ist nicht Teil dieser Task).
- **Verifikation:** Trenner + Google-Btn erscheinen unter Submit.

## ✅ AU-05 · Register/Forgot/Reset Token-Update

- **📐 JSX-Quelle:** Für Register: analog `LoginScreen`-Split. Für Forgot/Reset: kein Mockup, single-column max-width 380 nach Spec.
- **Dateien:**
  - `register.component.html` + `.scss`
  - `forgot-password.component.html` + `.scss`
  - `reset-password.component.html` + `.scss`
- **Aufgabe:**
  1. **Register:** Split-Screen analog Login (AU-01/02). Form-Felder: Name, E-Mail, Passwort (≥12 Hinweis), Consent-Checkbox.
  2. **Forgot/Reset:** Single-column (kein Brand-Panel) — sind kurze Flows. Zentriert, max-width 380. Token-Update.
- **Verifikation:** Register hat Split, F/R sind schlicht und zentriert.

---

# PHASE E — Hero / Landing (P-02)

**📐 Verbindliche Quelle:** `redesign/screens-marketing.jsx`, Komponente `LandingScreen` (gesamte Datei).
**🖼️ Preview:** `http://localhost:4000/redesign/visuals/preview.html?s=landing`

**Fünf** Mikro-Tasks.

## ✅ HE-01 · Hero: Background-Glow

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LandingScreen` → erster `<div>` mit `radial-gradient` (Subtle radial accent-Kommentar).
- **Dateien:** `landing/sections/hero.component.html` + `.scss`
- **Aufgabe:** Nach `<section class="hero">` ein radialer Glow:
  ```html
  <div class="hero__glow" aria-hidden="true"></div>
  ```
  Style: `position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle, var(--accent-soft) 0%, transparent 60%); pointer-events: none; opacity: 0.7; z-index: 0`. Hero-Inner braucht `position: relative; z-index: 1`.
- **Verifikation:** Hero hat dezenten violett-blauen Glow oben mittig.

## ✅ HE-02 · Hero: Eyebrow-Pill

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LandingScreen` → Eyebrow-Div mit Sparkles-Capsule (18×18) und Text „KI-Bewerbungsagent · Beta".
- **Dateien:** `hero.component.html` + `.scss`
- **Aktueller Zustand:** Eyebrow ist nur Text.
- **Aufgabe:**
  ```html
  <div class="hero__eyebrow">
    <span class="hero__eyebrow-icon"><lucide-icon name="sparkles" [size]="11"></lucide-icon></span>
    KI-Bewerbungsagent · Beta
  </div>
  ```
- **Styles:** `display: inline-flex; gap: 8px; padding: 5px 12px 5px 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; font-size: 12.5px; color: var(--ink-2); box-shadow: 0 1px 2px rgba(0,0,0,0.03)`. Icon-Wrap: 18×18 rounded, `background: var(--accent-soft); color: var(--accent)`.
- **Verifikation:** Eyebrow ist eine Pill mit Sparkles-Icon-Capsule.

## ✅ HE-03 · Hero: H1 Italic-Akzent

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LandingScreen` → H1 mit fontSize 60, letterSpacing -1.6, fontWeight 600. `<span>` im H1 mit `color: TOKENS.accent`, `fontStyle: italic`, `fontWeight: 500`. Zeilenumbruch mit `<br>`.
- **Dateien:** `hero.component.html` + `.scss`
- **Aktueller Zustand:** H1 hat `<em>Stelle</em>` aber Style noch nicht passend.
- **Aufgabe:**
  - H1: `font-size: clamp(40px, 5vw, 60px); font-weight: 600; letter-spacing: -1.6px; line-height: 1.04`
  - `<em>` darin: `font-style: italic; font-weight: 500; color: var(--accent)`
  - Text in zwei Zeilen umbrechen (mit `<br>` zwischen „Bewerbungen," und „die zur"): „Bewerbungen,<br>die zur _Stelle_ passen."
- **Verifikation:** H1 zeigt italic blau-violetten Akzent auf „Stelle".

## ✅ HE-04 · Hero: Editor-Peek (Komplett-Ersatz Right-Side)

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LandingScreen` → kompletter rechter Bereich (`Right: stylized product peek`-Kommentar). Enthält: Editor-Card mit Tab-Bar (macOS-Dots), Body-Grid mit Profil + Score-Side-Panel, Floating Anschreiben-Card unten links.
- **Dateien:** `hero.component.html` + `.scss`
- **Aktueller Zustand:** Komplexer 3-Spalten-Mock (Sidebar/Doc/Panel).
- **Aufgabe:** Komplett-Ersatz mit Mockup-Editor-Peek (siehe `redesign/screens-marketing.jsx` LandingScreen Right):
  1. Container: weiße Card, `border-radius: 16px`, `box-shadow: 0 30px 60px -25px rgba(15,18,32,0.18), 0 8px 24px -8px rgba(15,18,32,0.10)`, leicht rotiert `transform: rotate(0.4deg)`.
  2. **Tab-Bar oben** mit 3 macOS-Style-Dots (rot/gelb/grün) + Tab-Title „Stripe — Frontend Developer" + ATS-Pill rechts.
  3. **Body Grid 1fr / 200px**:
     - Links: Profil-Abschnitt mit Mono-Eyebrow „PROFIL" + 3 highlighted Keywords (React/TypeScript/Accessibility) als `<mark>` in Green-bg. Darunter „ERFAHRUNG" mit Mediahaus-Eintrag.
     - Rechts (200px): bg `var(--surface-2)`. Score-Ring 42px oben. Mono-Eyebrows „TREFFER" / „LÜCKEN" mit Tags. Vorschlag-Card unten.
  4. **Floating Anschreiben-Card** unten links: `position: absolute; bottom: -40px; left: -60px; width: 280px; transform: rotate(-2deg)`. Inhalt: Mail-Icon + „Anschreiben · Formal" + 3 Varianten-Hint + erster Letter-Absatz.
- **Verifikation:** Hero-Right sieht aus wie `preview.html?s=landing` Right-Bereich, mit Floating-Card darunter links.

## ✅ HE-05 · Hero: Buttons & Proof-Strip

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LandingScreen` → CTA-Pair (`Btn variant="cta"` + `Btn variant="default"`) und Proof-Strip mit Avatar-Stack (5 Avatars, margin-left -8) + zweizeiliger Text.
- **Dateien:** `hero.component.html` + `.scss`
- **Aufgabe:**
  1. CTAs: Linker ist `btn--cta btn--lg` mit Arrow-Right-Icon rechts. Rechter ist `btn--outline btn--lg`.
  2. Proof-Strip: 5 Avatars (gestackt, `margin-left: -8px`), darunter zweizeilig: oben „4.900+ Bewerbungen optimiert" in `--ink` 13px Bold, unten Stars + „4,7 / 5 · 312 Bewertungen" in `--ink-3` 12.5px.
- **Verifikation:** CTAs neu gestylt; Proof-Strip kompakt zweizeilig.

---

# PHASE F — Pricing (P-10)

**📐 Verbindliche Quelle:** **kein direkter Mockup** — Pricing nutzt das `Btn`- und `Panel`-System aus `redesign/shared.jsx`. Layout-Pattern aus `Atlas Redesign Spec.md` §6 + Karten-Styling konsistent mit `CvsScreen`-Karten.

**Drei** Mikro-Tasks.

## ✅ PR-01 · Pricing: Free-Anker-Karte hinzufügen

- **📐 JSX-Quelle:** kein direkter Mockup. Karten-Styling-Pattern: siehe `Panel` aus `redesign/shared.jsx`.
- **Dateien:** `pricing.component.html` + `.scss`
- **Aktueller Zustand:** 2 Karten (Pay-per-App, Pro).
- **Aufgabe:** 3-Spalten-Grid. Erste neue Karte „Anonym testen":
  - Header: Plan-Name „Free / Anonym"
  - Preis: „0 €" / „ohne Account"
  - Features-Liste:
    - „1 Test-Bewerbung"
    - „Match-Score-Vorschau"
    - „Kein Account nötig"
    - „Kein PDF-Export"
  - CTA: `btn--outline btn--md`, Text „Jetzt testen →", Link öffnet Try-Modal auf Landing (oder navigiert zu `/` mit Hash `#try`).
  - **Kein Badge** (nicht „Empfohlen").
- **Verifikation:** `/preise` zeigt 3 Karten, links Free, mittig Pay-per-App, rechts Pro (Empfohlen).

## ✅ PR-02 · Pricing: Plan-Toggle als Segmented

- **Dateien:** `pricing.component.html` + `.scss`
- **Aufgabe:** Plan-Toggle (Monatlich/Jährlich) auf Pro neu stylen:
  - Container: `background: var(--surface-2); border: 1px solid var(--line-2); border-radius: 8px; padding: 3px`
  - Active-Option: `background: var(--surface); box-shadow: 0 1px 2px rgba(0,0,0,0.04); color: var(--ink); font-weight: 500`
  - Inactive: `color: var(--ink-3)`
  - Beide: `padding: 4px 10px; border: none; cursor: pointer; font-family: inherit; border-radius: 5px`
- **Verifikation:** Toggle hat klar segmented Look.

## ✅ PR-03 · Pricing: Empfohlen-Badge & Featured-Card

- **Dateien:** `pricing.component.html` + `.scss`
- **Aufgabe:**
  1. Featured-Card (Pro): `border: 2px solid var(--accent); box-shadow: var(--shadow-md)`.
  2. Badge: `position: absolute; top: -12px; right: 24px; background: var(--accent); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600`
- **Verifikation:** Pro-Karte hat Accent-Border + Float-Badge oben rechts.

---

# PHASE G — Dashboard (P-17)

**📐 Verbindliche Quelle:** `redesign/screens-app.jsx`, Komponente `DashboardScreen` (gesamte Datei).
**🖼️ Preview:** `http://localhost:4000/redesign/visuals/preview.html?s=dashboard`

**Drei** Mikro-Tasks. (Dashboard-Layout existiert schon — nur Feinschliff.)

## ✅ DB-01 · Dashboard: Echte Daten in Stats-Karten

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `DashboardScreen` → Stats-Row mit 4 Karten (k/v/d-Schlüssel + tone-Farben).
- **Dateien:** `dashboard.component.ts` + `.html`
- **Aktueller Zustand:** „Antwortquote"-Karte zeigt CV-Count (falsch).
- **Aufgabe:**
  1. `responseRate()` computed: prozentualer Anteil der Bewerbungen mit Status ≠ DRAFT und ≠ APPLIED (also wenigstens Interview erreicht).
  2. Karte „Antwortquote" zeigt `{{ responseRate() }}%` + Sub „{{ interviewedCount }} von {{ appliedCount }}".
  3. Karte „Nächste Erinnerung" Logik: nimmt frühesten Reminder aus `recentApplications`. Wenn vorhanden: Wochentag + Uhrzeit + Sub „{Firma} nachfassen". Wenn keiner: „—" + „Keine ausstehend".
- **Verifikation:** Karten zeigen sinnvolle Werte aus echten Daten.

## ✅ DB-02 · Dashboard: Activity-Item More-Menü

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `DashboardScreen` → `Letzte Aktivität`-Panel, More-Button am Ende jeder Zeile (Mockup zeigt nur den Btn, kein Popover — bauen wir aus dem Sidebar-Pattern).
- **Dateien:** `dashboard.component.html`
- **Aktueller Zustand:** Click auf More öffnet direkt Editor.
- **Aufgabe:** More-Button öffnet Popover-Menü mit Items:
  - „Öffnen" → `selectedAppId.set(app.id)` (öffnet Modal)
  - „Status ändern" → öffnet Status-Submenü mit 5 Stati
  - „Erinnerung setzen…"
  - Trennlinie
  - „Löschen" (in Danger-Rot)
- **Verifikation:** More-Click zeigt Popover statt direktem Editor.

## ✅ DB-03 · Dashboard: Greeting-Period-Selector

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `DashboardScreen` → „Letzte 30 Tage"-Dropdown-Button rechts neben Greeting.
- **Dateien:** `dashboard.component.html` + `.ts`
- **Aktueller Zustand:** Button-Style da, aber kein Dropdown.
- **Aufgabe:**
  1. Signal `period: 'today'|'7d'|'30d'|'all'`.
  2. Click öffnet Dropdown mit 4 Optionen.
  3. Stats werden anhand `period` gefiltert (mindestens UI-seitig, Backend kann später folgen).
- **Verifikation:** Wechsel Zeitraum filtert sichtbare Zahlen.

---

# PHASE H — Wizard (P-20)

**📐 Verbindliche Quelle:** `redesign/screens-app.jsx`, Komponente `WizardScreen` (gesamte Datei).
**🖼️ Preview:** `http://localhost:4000/redesign/visuals/preview.html?s=wizard`

**Zwei** kleine Mikro-Tasks. (Wizard ist visuell schon fast da.)

## ✅ WZ-01 · Wizard: CV-Auswahl-Cards Mini-Preview

- **📐 JSX-Quelle:** kein expliziter Mockup für Step 1 — Pattern siehe `CvsScreen`-Mini-Preview, runter-skaliert auf 80×100.
- **Dateien:** `wizard.component.html` + `.scss`
- **Aktueller Zustand:** Cards nur mit Name + Meta.
- **Aufgabe:** Pro CV-Karte links eine kleine 80×100-Mini-Preview (z.B. `<lba-cv-mini-preview-modern>` skaliert). Layout: flex row, Preview links, Text rechts.
- **Verifikation:** Step 1 zeigt Cards mit visuellem Mini-Preview pro CV.

## ✅ WZ-02 · Wizard: Step 2 Keyword-Erkannt-Hinweis

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `WizardScreen` → Job-Input-Card-Footer mit `Sparkles`-Icon + „**14 Keywords** erkannt · React, TypeScript, Accessibility, +11".
- **Dateien:** `wizard.component.html` + `.ts`
- **Aufgabe:** Im Job-Input-Card-Footer (wenn Text genug Länge hat) Live-Anzeige:
  - `<lucide-icon name="sparkles">` + „**14 Keywords** erkannt · React, TypeScript, Accessibility, +11"
  - Helper-Methode `extractKeywords(text): string[]` (vereinfacht: regex auf Capital-Words mit Min-Länge 3, top 14 by frequency).
- **Verifikation:** Nach Paste eines Job-Texts erscheint Keyword-Count + erste 3 + „+N".

---

# PHASE I — Shared-Komponenten Schliff

**📐 Verbindliche Quelle:** `redesign/shared.jsx` für Tokens und Primitive (`StatusPill`, `ScoreRing`, `Btn`, `CompanyLogo`, `Sidebar`, `AppTopBar`, `Panel`).

## ✅ SH-01 · Status-Pill: Dot-Größe & Padding

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `StatusPill`-Komponente (Dot 5×5, Padding `2px 7px` sm / `3px 9px` md, Radius 5).
- **Dateien:** `status-pill.component.{html,scss}`
- **Aufgabe:** Dot auf 5×5 px, Pill-Padding `2px 7px` für sm, `3px 9px` für md, `border-radius: 5px`, `font-weight: 500`, `font-size: 11px` (sm) / `12px` (md).
- **Verifikation:** Pill-Größe und Dot passen zum Mockup.

## ✅ SH-02 · Score-Ring: Stroke-Cap & Schwellen

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `ScoreRing`-Komponente (strokeLinecap round, Track in `var(--line)`, Center-Text mit tabular-nums).
- **Dateien:** `score-ring.component.{ts,html,scss}`
- **Aufgabe:**
  1. SVG-Stroke-Linecap: `round`.
  2. Stroke-Width: `4` (bei Size ≥ 50), `3` (bei Size < 50).
  3. Color je nach Score:
     - `≥80`: `var(--status-offer)`
     - `≥60`: `var(--status-applied)`
     - sonst: `var(--warn)`
  4. Track (Hintergrund-Kreis): `var(--line)`.
  5. Center-Text: `font-weight: 600`, `font-variant-numeric: tabular-nums`. Size-Anpassung: 14 px für ≥50, 12 px für <50.
- **Verifikation:** ScoreRing 88 → grüner Ring + 88. ScoreRing 55 → warmer Ring + 55.

## ✅ SH-03 · AppShell: Plan-Usage-Bar zwei Stellen entdoppeln

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `Sidebar` → Plan-Usage-Karte (Plan-Label nur 1× oben, unten nur „Free" + Upgrade-Link).
- **Dateien:** `app-shell.component.html`
- **Aktueller Zustand:** Plan-Label erscheint zweimal (oben und unten in Usage-Block).
- **Aufgabe:** Plan-Label nur einmal (oben). Unten nur „Free" + Upgrade-Link bzw. wegfallen wenn nicht Free.
- **Verifikation:** Sidebar-Bottom zeigt Plan-Label nur einmal.

## ✅ SH-04 · AppShell: Workspace-Switcher Avatar-Farbe

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `Sidebar` → Workspace-Switcher-Avatar (im Mockup hartkodiert Accent, in Echtform deterministischer Hash). Palette: gleich wie `CompanyLogo` in `shared.jsx`.
- **Dateien:** `app-shell.component.scss`
- **Aufgabe:** Avatar-Background = deterministischer Hash der `auth.user()?.name` (gleiche Palette wie CompanyLogo). Aktuell ist es einheitlich Accent.
- **Verifikation:** Verschiedene User-Logins zeigen verschiedene Avatar-Farben.

## ✅ SH-05 · AppTopBar: Crumb-Trennzeichen

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `AppTopBar` → Crumbs-Loop mit ChevronRight (size 14) zwischen Crumbs.
- **Dateien:** `app-topbar.{html,scss}`
- **Aufgabe:**
  1. Zwischen Crumbs: `chevron-right` Lucide-Icon, size 14, `color: var(--ink-4)`.
  2. Letzter Crumb: `color: var(--ink); font-weight: 500`.
  3. Vorherige Crumbs: `color: var(--ink-3); font-weight: 400`.
- **Verifikation:** Auf `/app/applications` zeigt TopBar „Workspace › Bewerbungen" mit Chevron + letztem Crumb in voller Schwärze.

## ✅ SH-06 · Command-Palette: Dynamische App+CV-Suche

- **📐 JSX-Quelle:** kein expliziter Mockup. Pattern: `<dialog>` mit Fuzzy-Suche, Items in zwei Sektionen.
- **Dateien:** `command-palette.{ts,html}`
- **Aktueller Zustand:** Nur statische Items.
- **Aufgabe:**
  1. Inject `ApplicationService` und `CvService`.
  2. Bei Input-Change Fuzzy-Search über alle Bewerbungen (`{co} {role}`) und CVs (`name`).
  3. Ergebnisse als zwei Sektionen: „Bewerbungen" und „Lebensläufe", maximal 5 pro Sektion.
  4. Klick auf Bewerbung → öffnet Editor-Modal mit App-ID. Klick auf CV → navigiert `/app/cvs?highlight={id}`.
- **Verifikation:** ⌘K → „str" → zeigt Stripe-Bewerbung in „Bewerbungen"-Sektion.

## ✅ SH-07 · Pipeline-Toolbar: Filter-Chips

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `PipelineScreen` → Filter-Strip oben (Filter-Btn + Chips „Alle Stati", „Score ≥ 80", „Mit Erinnerung" + Count rechts).
- **Dateien:** `pipeline-toolbar.{html,ts,scss}`
- **Aufgabe:**
  1. Filter-Btn links (mit `filter`-Icon).
  2. Quick-Filter-Chips:
     - „Score ≥ 80"
     - „Mit Erinnerung"
     - „Letzte 7 Tage"
  3. Aktive Chips bekommen Accent-Background, inaktive Surface-2.
  4. Suchfeld rechts (mit `search`-Icon).
  5. Count-Anzeige ganz rechts: „{n} Bewerbungen".
- **Verifikation:** Chip-Klick filtert Board sichtbar.

## ✅ SH-08 · Cover-Letter-Tone-Picker

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → `EditorScreen` → Letter-Variant-Tabs (3 Cards: Formal/Warm/Kurz, Selected mit Accent-Border + Dot oben rechts).
- **Dateien:** `cover-letter-tone-picker.{html,scss,ts}`
- **Aufgabe:** 3 Cards segmented:
  - Jede Card: Tone-Name (h4) + Mini-Beispiel-Text (3 Zeilen)
  - Selected: `border: 2px solid var(--accent)`, kleine Dot oben rechts in Accent
  - Klick wechselt Tone
- **Verifikation:** 3 visuell unterschiedliche Cards (Formal/Warm/Kurz), Auswahl markiert eine.

## ✅ SH-09 · CV-Mini-Preview-Components

- **📐 JSX-Quelle:** `redesign/screens-app.jsx` → `CvsScreen` → Preview-Block (Mockup zeigt Modern-Style; Classic/Editorial/Executive/Minimal sind Varianten davon).
- **Dateien:** je `cv-mini-preview-{modern,classic,editorial,executive,minimal}.{html,scss,ts}`
- **Aufgabe:** Pro Template:
  1. Input Signal `cv: Cv`.
  2. Skalierte CV-Render mit echten Daten:
     - Modern: Sans-serif, einspaltig, dezente Trennlinien
     - Classic: Serif-Hint, zentrierte Headlines mit Linien drum
     - Editorial: Große Section-Headlines (24 px relativ), reichlich Whitespace
     - Executive: Zweispaltig, links sidebar mit Skills/Kontakt
     - Minimal: minimale Trennung, kompakte Typografie
  3. Container: `background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-radius: 3px; padding: 12px 14px; font-size: 6.5px; line-height: 1.5`.
- **Verifikation:** Master-CVs-Seite zeigt 5 visuell deutlich unterscheidbare Templates.

## ✅ SH-10 · ATS-Panel Tab-Inhalt

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LandingScreen` → Editor-Peek Right-Pane (Score-Ring 42 + Treffer-Tags grün + Lücken-Tags rot + Vorschlag-Card). Vollformat-Version für Editor: gleiche Bausteine in größer.
- **Dateien:** `ats-panel.{html,scss,ts}`
- **Aufgabe:** Tab-Content für Editor-Right-Pane „Analyse":
  1. Großer ScoreRing oben (size 88) mit Caption „Match-Score".
  2. Sektion „Treffer" mit Keyword-Pills in Green-Tint.
  3. Sektion „Lücken" mit Keyword-Pills in Red-Tint.
  4. Sektion „Vorschläge" mit aufklappbaren Vorschlag-Cards.
  5. Diff-View (vorhanden) bekommt klare Vorher/Nachher-Spalten in `--ink-3` / `--good`.
- **Verifikation:** Editor → Analyse-Tab zeigt vollständigen Match-Report.

## ✅ SH-11 · KeywordBar Lucide-Check

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → `EditorScreen` → Skills-Section mit Match-Pills (Check-Icon + Label) + Miss-Pills + Plus-Add-Btn mit dashed Border.
- **Dateien:** `keyword-bar.component.{html,scss}`
- **Aufgabe:** Match-Pill links bekommt `<lucide-icon name="check" [size]="11">`. Miss-Pill: kein Icon. Plus-Add-Btn am Ende mit dashed Border in `--line`.
- **Verifikation:** Keyword-Bar mit gemischten match/miss zeigt Checks nur auf Matches.

## ✅ SH-12 · Company-Logo deterministische Palette

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `CompanyLogo`-Komponente (Palette + Hash-Logik).
- **Dateien:** `company-logo.{ts,html,scss}`
- **Aufgabe:**
  1. Palette: `['#5B6CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899']`.
  2. Hash-Funktion: `name.length` modulo palette.length (deterministisch).
  3. Background: `{color}22` (Alpha-Suffix für 13% Opacity). Color für Initialen: `{color}`.
  4. Initialen: max 2 Letters, uppercase.
- **Verifikation:** Stripe → blau/violett, Figma → orange-ish, Notion → magenta-pink etc. Konsistent zwischen Refreshs.

## ✅ SH-13 · Confirm-Delete-Modal Icon

- **📐 JSX-Quelle:** kein Mockup, einfaches Modal-Pattern.
- **Dateien:** `confirm-delete-modal.{html,scss}`
- **Aufgabe:** Vor dem Title ein `<lucide-icon name="alert-circle" [size]="24">` in `--bad`-Color. Confirm-Btn als `btn--danger`.
- **Verifikation:** Löschen-Modal zeigt Warn-Icon + roten Confirm-Btn.

## ✅ SH-14 · Upgrade-Modal Polish

- **📐 JSX-Quelle:** kein Mockup. Pattern: Sparkles-Capsule + Check-Bullets + Accent-Glow oben + CTA `btn--cta btn--lg`.
- **Dateien:** `upgrade-modal.{html,scss}`
- **Aufgabe:**
  1. Oben Accent-Hintergrund-Glow.
  2. Sparkles-Icon-Capsule (60×60) in Accent zentriert.
  3. Bullet-Liste der Pro-Features mit Check-Icons in `--good`.
  4. CTA `btn--cta btn--lg` full-width „Pro starten".
- **Verifikation:** Modal sieht aus wie eine kleine Pricing-Card.

## ✅ SH-15 · Einstellungen-Modal Slim

- **📐 JSX-Quelle:** kein Mockup.
- **Dateien:** `einstellungen-modal.component.{html,scss,ts}`
- **Aufgabe:** Inhalte reduzieren auf:
  - Profile-Section (Name, Email — readonly Anzeige)
  - „Alle Einstellungen öffnen" Link → `/app/settings`
  - „Abmelden" Button (Danger)
- **Verifikation:** Sidebar-Profil-Klick öffnet schlankes Modal.

## ✅ SH-16 · CV-Template-Picker Visual

- **📐 JSX-Quelle:** `redesign/screen-editor.jsx` → `EditorScreen` → Outline-Rail-Bottom Template-Section (20×26 Mini-Thumbnail + Name + Sub + ChevronDown).
- **Dateien:** `cv-template-picker.{html,scss,ts}`
- **Aufgabe:**
  1. Trigger-Btn: 20×26 Mini-Thumbnail + Template-Name + ChevronDown.
  2. Dropdown: Grid 2×3 mit Thumbnails. Jeder Slot:
     - 80×100 Mini-Thumbnail (skalierte Mini-Preview)
     - Template-Name darunter
     - Selected: 2px Accent-Border + Check-Dot oben rechts
- **Verifikation:** Click auf Picker zeigt visuelle Auswahl mit Thumbnails.

## ✅ SH-17 · Editor-Modal Größe

- **📐 JSX-Quelle:** kein Mockup, Standard-Modal-Pattern.
- **Dateien:** `editor-modal.{html,scss}`
- **Aufgabe:**
  - Size: `width: 95vw; height: 92vh; max-width: 1440px`.
  - Close: `X`-Icon oben rechts (sticky), ESC schließt.
  - Inhalt: `<lba-editor-component [isModal]="true">` füllt komplett.
  - Backdrop: `background: rgba(15, 18, 32, 0.5); backdrop-filter: blur(8px)`.
- **Verifikation:** Modal nimmt fast Viewport, Backdrop blurt Dashboard.

## ✅ SH-18 · Consent-Banner Refresh

- **📐 JSX-Quelle:** kein Mockup. Pattern: schwebende Card unten zentriert.
- **Dateien:** `consent-banner/consent-banner/consent-banner.{html,scss}`
- **Aufgabe:**
  1. Position: `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); max-width: 720px; width: calc(100% - 40px)`.
  2. Style: `background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 16px 20px; box-shadow: var(--shadow-md)`.
  3. Inhalt: Title + Body + Btn-Pair (Outline + Primary).
  4. Lucide `cookie` oder `shield-check` Icon links als Capsule.
- **Verifikation:** Banner schwebt unten, schließt nach Akzept.

## ✅ SH-19 · Navbar Scroll-State

- **📐 JSX-Quelle:** `redesign/screens-marketing.jsx` → `LandingScreen` → Header-Bereich oben (Brand + Links + Login/Register-Buttons).
- **Dateien:** `navbar.component.{html,scss,ts}`
- **Aufgabe:**
  1. Default: transparent.
  2. Scroll > 50px: `background: var(--surface)/95% backdrop-filter blur; border-bottom: 1px solid var(--line)`.
  3. Brand-Logo-Mark links mit Gradient.
- **Verifikation:** Landing scrollen → Navbar fadet zu opak.

## ✅ SH-20 · Footer Tokenize

- **📐 JSX-Quelle:** kein Mockup.
- **Dateien:** `footer.component.{html,scss}`
- **Aufgabe:** Alle hex-Werte ersetzen durch CSS-Variablen. Sektionen-Headlines in `--ink-3` Mono. Links in `--ink-2` hover `--ink`.
- **Verifikation:** Footer auf Landing/Pricing/FAQ konsistent.

## ✅ SH-21 · Card-Component Token-Padding

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `Panel`-Komponente (Header + padding-Variable).
- **Dateien:** `card.component.{html,scss,ts}`
- **Aufgabe:** Inputs: `padding?: 'sm'|'md'|'lg'` (= 14 / 20 / 28 px). Default `md`. `title?` rendert Header mit Border-Bottom.
- **Verifikation:** Card mit Title rendert Header + Padding-Steuerung.

## ✅ SH-22 · Button-Component Loading-State

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `Btn`-Komponente (alle Varianten + Größen). Loading-State ist kein direkter Mockup, Standard-Spinner-Pattern.
- **Dateien:** `button.component.{html,scss,ts}`
- **Aufgabe:**
  1. Input `loading: boolean`.
  2. Wenn loading: Text wird ersetzt durch Loader-Spinner (CSS-only mit `lucide-icon name="loader-2"` + `animation: spin 1s linear infinite`).
  3. Button auto-disabled.
- **Verifikation:** `[loading]="true"` zeigt Spinner statt Text.

## ✅ SH-23 · Pill-Component Variant-Erweiterung

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `StatusPill` + `ScorePill` als Referenz für Pill-Pattern.
- **Dateien:** `pill.component.{html,scss,ts}`
- **Aufgabe:** Variant-Liste: `neutral | accent | success | warn | danger | pro`. `pro` = Mono-Style mit `--warn`-Farbe + `lock`-Icon optional.
- **Verifikation:** Alle 6 Variants visuell unterscheidbar.

---

# PHASE J — Landing-Sections Polish

**📐 Verbindliche Quelle:** `redesign/screens-marketing.jsx`, `LandingScreen` (für Hero-Bereich) + Pattern aus übrigen Sections aus dem Bestand. Sections unter Hero haben **keine** direkten JSX-Mockups — wir nutzen die `Btn`/`Panel`/Token-Werte aus `redesign/shared.jsx` als Styling-Basis.

## ☐ LS-01 · Logo-Bar Token-Update

- **Dateien:** `landing/sections/logo-bar.component.{html,scss}`
- **Aufgabe:** Logos in `--ink-3`. Hover bringt sie auf `--ink`. Container `padding: 32px 0`, `border-top: 1px solid var(--line-2)`, `border-bottom: 1px solid var(--line-2)`.
- **Verifikation:** Logo-Bar erscheint dezent grau, Hover zeigt Logos in Voll-Schwärze.

## ☐ LS-02 · Features-Grid Icon-Container

- **Dateien:** `landing/sections/features-grid.component.{html,scss}`
- **Aktueller Zustand:** Icons mit `feature-icon--{blue,yellow,green,purple}` Klassen — vermutlich CSS basiert.
- **Aufgabe:**
  1. Icon-Container 56×56 rounded-12, Background getintet pro Farbe (Blau / Gelb / Grün / Lila), Lucide-Icon darin in voller Sättigung.
  2. Card-Padding 24, gap 12.
  3. Hover-State: leichter `--shadow-md`.
- **Verifikation:** 4 farbig variierte Cards, Icons in Capsule-Containern.

## ☐ LS-03 · Workflow-Steps Card-Style

- **Dateien:** `landing/sections/workflow-steps.component.{html,scss}`
- **Aufgabe:**
  1. Step-Badge: 28×28 round, `background: var(--accent); color: #fff; font-weight: 600`.
  2. Card: `background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 24px`.
  3. Mock-Dropzone / Code-Preview / File-List bleiben aber mit Token-Padding/Borders.
- **Verifikation:** 3 Step-Cards, jede mit großer Accent-Number oben.

## ☐ LS-04 · Before/After-Vergleich

- **Dateien:** `landing/sections/before-after.component.{html,scss}`
- **Aufgabe:**
  1. 2-Spalten-Grid.
  2. Linke Spalte „Vorher": `border-left: 3px solid var(--ink-3)`, getintete `--surface-2` bg.
  3. Rechte Spalte „Nachher": `border-left: 3px solid var(--accent)`, `--accent-soft` bg.
  4. Sub-Labels Mono Eyebrows in „VORHER" / „NACHHER".
- **Verifikation:** Klarer Kontrast zwischen den Spalten.

## ☐ LS-05 · Testimonials Cards

- **Dateien:** `landing/sections/testimonials.component.{html,scss}`
- **Aufgabe:**
  1. 3 Cards in Grid.
  2. Pro Card: großes „❝"-Quote-Mark in `--accent` oben (Lucide `quote`).
  3. Body in `--ink-2`.
  4. Footer: 36×36-Avatar mit deterministischer Farbe + Name (`--ink`) + Rolle (`--ink-3`).
- **Verifikation:** Testimonials sehen wie 3 elegante Karten aus.

## ☐ LS-06 · Pricing-Inline Strip

- **Dateien:** `landing/sections/pricing-inline.component.{html,scss}`
- **Aufgabe:** 3-Spalten kompakter Pricing-Block. Selber Code wie `/preise` aber kompakter (padding kleiner, kein Header).
- **Verifikation:** Inline-Pricing zeigt 3 Pläne.

## ☐ LS-07 · CTA-Band Final

- **Dateien:** `landing/sections/cta-band.component.{html,scss}`
- **Aufgabe:**
  1. Container: `background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff; padding: 64px; border-radius: 22px; margin: 80px var(--pad)`.
  2. Headline (h2, 32 px) + Sub + 2 Buttons (Primary in `#fff bg; var(--accent) color`; Outline in `--accent-ink` border).
  3. Optional dezent grain-Texture-Overlay.
- **Verifikation:** Final-CTA zeigt großen Accent-Gradient-Block.

---

# PHASE K — Sonstige Seiten Polish

**📐 Verbindliche Quelle:** keine direkten JSX-Mockups — Styling-Pattern aus `redesign/shared.jsx` (Tokens + Btn + Panel) übernehmen.

## ☐ OT-01 · Settings-Übersicht

- **Dateien:** `features/settings/settings.component.{html,scss}`
- **Aufgabe:**
  1. Page-Header „Einstellungen".
  2. 3 Tiles als Grid:
     - Abrechnung (Icon: `credit-card`, Link: `/app/settings/billing`)
     - Sicherheit (Icon: `lock`, Link: `/app/settings/security`)
     - Daten & Konto (Icon: `database`, Link: `/app/settings/data`)
  3. Tile-Style: Card mit Icon-Capsule + Title + Beschreibung + Chevron-Right rechts.
- **Verifikation:** `/app/settings` zeigt 3 Tiles, jede navigiert.

## ☐ OT-02 · Settings-Billing umziehen

- **Dateien:**
  - Quelle: `features/billing/billing.component.{ts,html,scss}`
  - Ziel: `features/settings/billing.component.{ts,html,scss}` (existiert bereits ggf. leer)
  - Löschen am Ende: `features/billing/`
- **Aufgabe:** Inhalt vom alten Billing rüberkopieren. Page-Header bekommt Breadcrumb-Anweisung „Einstellungen / Abrechnung".
- **Verifikation:** `/app/settings/billing` zeigt Plan-Karte + Paddle-Link.

## ☐ OT-03 · Settings-Security

- **Dateien:** `features/settings/security.component.{html,scss,ts}`
- **Aufgabe:** 3 Sektionen:
  1. Passwort ändern (Current + New + Confirm + Button).
  2. 2FA: Toggle + QR-Code-Reveal + Backup-Codes.
  3. Aktive Sessions: Liste mit Device + Last-Active + Revoke-Button.
- **Verifikation:** `/app/settings/security` zeigt alle 3 Sektionen.

## ☐ OT-04 · Settings-Data

- **Dateien:** `features/settings/data.component.{html,scss,ts}`
- **Aufgabe:** 3 Sektionen:
  1. Daten exportieren (Btn löst JSON-Download).
  2. Consent-Übersicht (Liste der Einwilligungen mit Edit-Btn).
  3. Konto löschen (Danger-Sektion mit zweistufiger Bestätigung).
- **Verifikation:** Export funktioniert, Lösch-Flow erfordert doppelte Bestätigung.

## ☐ OT-05 · Security alt LÖSCHEN

- **Dateien:** `features/security/` (gesamt)
- **Aufgabe:** Inhalt nach OT-03 übernommen → komplettes Verzeichnis löschen. Route `/app/security` aus Routes entfernen.
- **Verifikation:** `rg "features/security" frontend/src/app/` returnst 0.

## ☐ OT-06 · LinkedIn-Page

- **Dateien:** `features/linkedin/linkedin.component.{html,scss,ts}`
- **Aufgabe:**
  1. Wenn Free-User: gesperrte Vorschau mit Blur-Overlay + großer Pro-Lock-Card mit `lock`-Icon + Upgrade-CTA.
  2. Wenn Pro: Profile-URL-Input + Optimize-Btn + Result-Panel mit Vorschlägen als getintete Cards.
- **Verifikation:** Free: gesperrt. Pro: nutzbar.

## ☐ OT-07 · FAQ Akkordeon

- **Dateien:** `features/faq/faq.component.{html,scss,ts}`
- **Aufgabe:**
  1. Frage-Items als Cards.
  2. Header: Frage-Text + Chevron-Down rechts.
  3. Klick expandiert (CSS `details/summary` oder Signal).
  4. Expanded: rotate Chevron 180°.
- **Verifikation:** FAQ ist navigierbar mit Akkordeon.

## ☐ OT-08 · Not-Found

- **Dateien:** `features/not-found/not-found.component.{html,scss}`
- **Aufgabe:**
  1. Zentriert (flex column).
  2. Großes „404" in `--accent`, font-size 96, weight 600.
  3. Headline „Seite nicht gefunden" (24px).
  4. Sub „Die Seite, die du suchst, existiert nicht oder wurde verschoben."
  5. 2 Aktionen: `btn--cta` zur Startseite, `btn--outline` „Zurück".
- **Verifikation:** Falsche URL → schöne 404.

## ☐ OT-09 · Legal-Seiten Type-Scale

- **Dateien:**
  - `features/legal/privacy.component.{html,scss}`
  - `features/legal/terms.component.{html,scss}`
  - `features/legal/imprint.component.{html,scss}`
- **Aufgabe:**
  1. Container max-width 720, padding 64px var(--pad).
  2. H1 — H4 type-scale aus Tokens.
  3. Body line-height 1.65 für Lesbarkeit.
  4. Links in `--accent`.
- **Verifikation:** Alle 3 Legal-Seiten gut lesbar.

## ☐ OT-10 · Onboarding-Modal extrahieren

- **Dateien (NEU):** `shared/components/onboarding-modal/onboarding-modal.{ts,html,scss}`
- **Aufgabe:**
  1. 3-Schritte-Checkliste (CV / Bewerbung / Export).
  2. Auto-Open beim ersten Login (Backend-Flag `onboardingShown`).
  3. „Nicht mehr anzeigen" Button speichert Flag.
  4. Erreichbar im AppShell via Help-Menü oder Settings-Hilfe-Sektion.
- **Verifikation:** Erste Anmeldung zeigt Modal, Refresh zeigt's nicht mehr.

## ☐ OT-11 · /try Route entfernen

- **Dateien:**
  - `app.routes.ts` (Route-Eintrag löschen)
  - `features/try/` (gesamt löschen)
- **Aufgabe:** Komplett-Entfernung. Try-Flow lebt nur im Landing-Modal.
- **Verifikation:** `/try` → 404. Try-Modal von Landing funktioniert.

## ☐ OT-12 · Pro-Lock Einheitliches Pattern

- **Dateien:** `shared/components/pro-lock/pro-lock.{ts,html,scss}` (NEU)
- **Aufgabe:**
  1. Standalone-Component.
  2. Inputs: `mode: 'pill'|'overlay'`, `tooltip: string` (default „Upgrade auf Pro nötig").
  3. Pill-Mode: kleiner Lock-Icon + „PRO"-Text in `--warn`-bg.
  4. Overlay-Mode: blurted Hintergrund + zentrierte Lock-Card mit Upgrade-CTA.
  5. Click triggert `<lba-upgrade-modal>` via `UpgradeService`.
- **Verifikation:** Sidebar-LinkedIn + Editor-Letter-Varianten + LinkedIn-Page nutzen dasselbe Pattern.

## ☐ OT-13 · Legal-Component.scss tot

- **Dateien:** `features/legal/legal.component.scss`
- **Aufgabe:** Datei hat kein TS-Pendant — entweder löschen oder Inhalt in privacy/terms/imprint integrieren.
- **Verifikation:** `legal.component.scss` existiert nicht mehr oder wird verwendet.

---

# PHASE L — Routing & Integration

## ☐ R-01 · app.routes.ts vollständig

- **Dateien:** `frontend/src/app/app.routes.ts`
- **Aufgabe:** Verify alle Routen aus Spec §3 vorhanden:
  - `/`, `/preise`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/faq`, `/datenschutz`, `/agb`, `/impressum`, `/**`
  - `/app`, `/app/applications`, `/app/pipeline`, `/app/cvs`, `/app/wizard`, `/app/linkedin`, `/app/settings`, `/app/settings/billing`, `/app/settings/security`, `/app/settings/data`, `/app/applications/:id`
  - `/try`, `/app/billing`, `/app/security` **fehlen**
- **Verifikation:** Alle obigen Routen erreichbar, alte 404 / nicht definiert.

## ☐ R-02 · CommandPalette in app.component

- **Dateien:** `app.component.{html,ts}`
- **Aufgabe:** `<lba-command-palette>` außerhalb `<router-outlet>` mounten. Global ⌘K / Ctrl+K Listener im AppComponent.
- **Verifikation:** ⌘K öffnet Palette von jeder Seite (auch Landing).

## ☐ R-03 · Status-Mapper-Layer

- **Dateien:** `shared/utils/status.utils.ts`
- **Aufgabe:** Helper `legacyToStatus(s: 'OPEN'|'DONE'|ApplicationStatus): ApplicationStatus`:
  - `'OPEN'` und CV nie exportiert → `'DRAFT'`
  - `'OPEN'` und CV exportiert → `'APPLIED'`
  - `'DONE'` → `'APPLIED'` (User kann später re-klassifizieren)
  - Sonst pass-through
- **Verifikation:** Bestehende Daten aus Backend zeigen sinnvolle neue Stati.

---

# PHASE M — Backend

## ☐ BE-01 · Status-Migration Script

- **Dateien:** Backend-Migration (außerhalb `frontend/`)
- **Aufgabe:**
  1. Migrations-Skript schreiben (SQL oder ORM-Migration je nach Stack).
  2. Mapping:
     - `OPEN` + `last_exported_at IS NULL` → `DRAFT`
     - `OPEN` + `last_exported_at IS NOT NULL` → `APPLIED`
     - `DONE` → `APPLIED` (User kann re-klassifizieren)
  3. API-Endpoints akzeptieren neue 5 Status-Werte.
- **Verifikation:** Staging-Migration läuft fehlerfrei, alle Records haben gültigen neuen Status.

## ☐ BE-02 · API-Validierung

- **Dateien:** Backend-DTO + Validation
- **Aufgabe:** `PATCH /applications/:id` akzeptiert `status: 'DRAFT'|'APPLIED'|'INTERVIEW'|'OFFER'|'REJECTED'`. Andere Werte → 400 Bad Request.
- **Verifikation:** API-Tests grün.

## ☐ BE-03 · Reminder-API

- **Dateien:** Backend-Endpoints
- **Aufgabe:** `PATCH /applications/:id/reminder` mit `{ reminderAt: ISO-String | null }`. Wenn null → reminder removed.
- **Verifikation:** Curl-Test setzt + entfernt Reminder.

---

# PHASE N — Test & QA

## ☐ QA-01 · Axe-Smoke erweitern

- **Dateien:** `frontend/e2e/authenticated-a11y.spec.ts`
- **Aufgabe:** Routen-Liste erweitern auf:
  - `/`, `/preise`, `/login`, `/register`, `/faq`
  - `/app`, `/app/applications`, `/app/pipeline`, `/app/cvs`, `/app/wizard`, `/app/applications/:id`
  - `/app/settings`, `/app/settings/billing`, `/app/settings/security`, `/app/settings/data`
  - `/app/linkedin`
- **Verifikation:** `npm run a11y` grün auf allen.

## ☐ QA-02 · Playwright-Selektoren

- **Dateien:** alle `frontend/e2e/*.spec.ts`
- **Aufgabe:**
  1. Suche nach `.btn--secondary`, `.btn--accent`, `.status--open`, `.status--done` → ersetzen.
  2. Status-Texte: „Offen" → „Beworben" / „Entwurf", „Erledigt" → „Angebot" / „Abgesagt" je nach Test-Szenario.
  3. Neue Status-Pill-Selektor: `[data-status="APPLIED"]` (data-attribute zur Komponente ergänzen).
- **Verifikation:** `npm run test:e2e` grün.

## ☐ QA-03 · Jest Component-Tests

- **Dateien:** alle `frontend/src/**/*.spec.ts`
- **Aufgabe:** Pro umgebauter Komponente Spec ergänzen:
  - StatusPill: rendert alle 5 Stati
  - ScoreRing: rendert Schwellen-Farben
  - Sidebar: zeigt korrekte Active-Links
  - Pipeline-Board: drag&drop emittiert statusChange
  - Status-Utils: legacyToStatus mapt korrekt
- **Verifikation:** `npm test` grün, Coverage steigt nicht ab.

## ☐ QA-04 · Visual-Regression (optional)

- **Dateien:** `frontend/visual-regression/` (NEU)
- **Aufgabe:**
  1. Backstop oder Loki installieren.
  2. Baseline-Screenshots aus `redesign/visuals/preview.html?s={screen}` ziehen.
  3. Test-Skript pro Seite vergleicht echte App vs Baseline (≤ 5 % Pixeldifferenz).
- **Verifikation:** Test-PR mit absichtlicher Änderung schlägt fehl, ohne Änderung grün.

---

# PHASE Y — Globale Konfiguration & Marketing-Hygiene

Häufig übersehene Dateien, die zum Redesign mit angepasst werden müssen.

## ☐ Y-01 · `tailwind.config.ts` aktualisieren

- **📐 JSX-Quelle:** `redesign/shared.jsx` → `TOKENS`-Konstante.
- **Datei:** `frontend/tailwind.config.ts`
- **Aktueller Zustand:** Verwendet **alte** Token-Werte (Accent in `oklch(58% 0.20 255)` statt neuem `oklch(48% 0.17 268)`). Fehlen: `--line-2`, `--ink-4`, `--surface-2`, alle Status-Farben, gestraffte Radii.
- **Aufgabe:** Komplett-Rewrite mit allen Tokens aus Spec §1:
  ```ts
  extend: {
    colors: {
      bg:        'var(--bg)',
      surface:   'var(--surface)',
      'surface-2': 'var(--surface-2)',
      ink:       'var(--ink)',
      'ink-2':   'var(--ink-2)',
      'ink-3':   'var(--ink-3)',
      'ink-4':   'var(--ink-4)',
      line:      'var(--line)',
      'line-2':  'var(--line-2)',
      accent:    'var(--accent)',
      'accent-2':'var(--accent-2)',
      'accent-soft': 'var(--accent-soft)',
      'status-draft':     'var(--status-draft)',
      'status-applied':   'var(--status-applied)',
      'status-interview': 'var(--status-interview)',
      'status-offer':     'var(--status-offer)',
      'status-rejected':  'var(--status-rejected)',
      good: 'var(--good)',
      warn: 'var(--warn)',
      bad:  'var(--bad)',
    },
    fontFamily: { /* unverändert */ },
    borderRadius: {
      xs: '4px', sm: '6px', DEFAULT: '10px', md: '10px', lg: '14px', xl: '20px', full: '9999px',
    },
    boxShadow: {
      xs: 'var(--shadow-xs)',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      popover: 'var(--shadow-popover)',
    },
  },
  ```
- **Verifikation:** `tailwind` Klassen wie `bg-accent` oder `border-line` rendern korrekt mit neuen OKLCH-Werten.

## ☐ Y-02 · `index.html` Meta-Tags + Favicon

- **Datei:** `frontend/src/index.html`
- **Aktueller Zustand:** Title, OG-Tags vorhanden — alle auf altem Branding („Lebenslauf-Agent" / Hireflow-Mix).
- **Aufgabe:**
  1. `<title>` einheitlich „Hireflow AI — KI-Bewerbungsagent".
  2. `<meta name="description">` aktualisieren: „Bewerbungen, die zur Stelle passen. KI-optimierter Lebenslauf, polishedes Anschreiben, ATS-tauglich. In 60 Sekunden."
  3. `<meta name="theme-color" content="oklch(48% 0.17 268)">` — für Mobile Browser-Bar.
  4. `<meta property="og:image" content="https://hireflow.ai/og-image.png">` + `<meta property="og:image:width" content="1200">` + `<meta property="og:image:height" content="630">`.
  5. **OG-Image:** als `frontend/public/og-image.png` ablegen (1200×630, Hero-Screenshot aus `redesign/visuals/preview.html?s=landing` — manuell rendern und speichern).
  6. `<link rel="icon">` SVG bleibt; zusätzlich `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">` für ältere Browser. Favicon-SVG ggf. mit neuem Indigo-Akzent rendern.
- **Verifikation:**
  - DevTools Network → `og-image.png` lädt 200.
  - Twitter/LinkedIn Card-Preview-Tool zeigt korrekt.

## ☐ Y-03 · `sitemap.xml` ergänzen

- **Datei:** `frontend/public/sitemap.xml`
- **Aktueller Zustand:** Listet nur `/`, `/preise`, `/faq`, Legal.
- **Aufgabe:**
  1. Domain auf `https://hireflow.ai/` aktualisieren (statt `lebenslauf-agent.de`) — falls Domain-Switch noch nicht passiert: mit User klären, sonst alten Wert belassen.
  2. App-Routen sind authentifiziert → **nicht** in Sitemap.
  3. `priority` neu kalibrieren: `/` = 1.0, `/preise` = 0.9, `/faq` = 0.6, Legal = 0.3.
  4. `<lastmod>{ISO-Date}</lastmod>` pro URL ergänzen.
- **Verifikation:** Sitemap-Validator (z.B. xml-sitemaps.com) returnst grün.

## ☐ Y-04 · `score.utils.ts` mit Token-Farben

- **Datei:** `frontend/src/app/shared/utils/score.utils.ts`
- **Aktueller Zustand:** `scoreClass()` returnst `'score--high|mid|low'`-Strings.
- **Aufgabe:**
  1. Bestehende `scoreClass()`-Funktion beibehalten.
  2. **Ergänzen:** `scoreColor(score: number): string` → returnst CSS-Variable-Token (`'var(--status-offer)' | 'var(--status-applied)' | 'var(--warn)'`).
  3. **Ergänzen:** `scoreBg(score: number): string` → returnst Tinted-Background-OKLCH (`'oklch(95% 0.04 155)' | 'oklch(95% 0.025 240)' | 'oklch(96% 0.03 60)'`).
  4. **Ergänzen:** `scoreLabel(score: number): 'Stark' | 'Gut' | 'Verbesserbar'`.
  5. Helper im Editor-Score-Widget und Pipeline-Karten verwenden.
- **Verifikation:** Spec-Test `score.utils.spec.ts` deckt 4 Funktionen ab.

## ☐ Y-05 · Mobile-Responsive Breakpoints prüfen

- **📐 JSX-Quelle:** Mockups sind Desktop-first (1280–1440). Mobile-Breakpoint pro Seite explizit nachziehen.
- **Dateien:**
  - `app-shell.component.scss` — Sidebar wird zu Bottom-Bar oder Drawer ≤ 768 px
  - `dashboard.component.scss` — Stat-Grid: 4 Spalten → 2 Spalten ≤ 768 px → 1 Spalte ≤ 480 px
  - `pipeline-board.scss` — 5 Spalten → horizontal-scroll ≤ 1024 px
  - `master-cvs.component.scss` — Grid 3 → 2 → 1 Spalten je nach Breite
  - `editor.component.scss` — 3-Pane wird Stack ≤ 1024 px (Tabs zum Wechseln zwischen Outline/CV/Right)
  - `login.component.scss` — Split-Screen → Single ≤ 768 px (Brand-Panel weg)
  - `hero.component.scss` — 2-Spalten-Grid → Stack ≤ 880 px
- **Aufgabe:** Pro Datei oben dokumentieren bei welcher Breakpoint-Schwelle das Layout umbricht, Media-Queries für die Schwellen ergänzen.
- **Verifikation:** Chrome DevTools Responsive-Modus durchklicken bei iPhone 13 (390 px) und iPad (768 px) → kein horizontal Scroll, alle CTAs erreichbar.

## ☐ Y-06 · Toast-Notification-Service (optional)

- **📐 JSX-Quelle:** kein Mockup — aktuell nutzt App nur Inline-`role="alert"`-Banner.
- **Dateien (NEU):**
  - `frontend/src/app/shared/services/toast.service.ts`
  - `frontend/src/app/shared/components/toast-host/toast-host.{ts,html,scss}`
- **Aufgabe:**
  1. Service mit `success(msg)`, `error(msg)`, `info(msg)` Methoden.
  2. Toast-Host: schwebt unten rechts, max 3 sichtbar, auto-dismiss nach 4 s (Error: 8 s).
  3. Style: Card mit Status-Farben (Status-Pill-Pattern), Lucide-Icon links, X zum Schließen.
  4. ARIA-Live-Region für Screen-Reader.
  5. Verwendung: nach Save (Editor), nach Status-Wechsel (Pipeline), nach Export (CV-PDF).
- **Verifikation:** Action im Editor löst Toast aus, dieser verschwindet nach 4 s.

## ☐ Y-07 · Print-Stylesheet für CV-PDF-Export

- **📐 JSX-Quelle:** kein Mockup — Print-CSS für PDF-Export.
- **Datei (NEU):** `frontend/src/app/features/application-editor/print.scss` (oder als `@media print` Block)
- **Aufgabe:**
  1. Bei PDF-Export sollen App-Chrome (Sidebar, TopBar, Right-Pane) ausgeblendet werden.
  2. Nur CV-Section-Editor-Inhalt sichtbar in Print-Format.
  3. Schriftgrößen für A4 angepasst: H1 18 pt, H2 14 pt, Body 10 pt.
  4. Section-Akzentfarben **nicht** mit Hintergrund-Tint drucken (Tinten in Print kaum lesbar) — nur 3-px-Stripe links bleibt.
  5. Page-Break-Avoid für Section-Karten.
- **Verifikation:** Browser-Print-Preview zeigt sauberes 1- oder 2-Seiten-CV ohne UI-Chrome.

## ☐ Y-08 · `app.component` Reveal-Init

- **Datei:** `frontend/src/app/app.component.ts`
- **Aufgabe:** Sicherstellen dass `RevealDirective` weiterhin auf neuen Landing-Sections funktioniert. Bei Mocks mit explizitem `style="opacity:1"` (z.B. im neuen Hero-Editor-Peek) keine Reveal-Animation überlagern lassen.
- **Verifikation:** Scroll auf Landing zeigt sanfte Reveal-Animationen für Hero/Features/Workflow.

## ☐ Y-09 · `404.html` für SSR-Fallback

- **Datei (NEU):** `frontend/src/404.html` oder Nginx-Config
- **Aufgabe:** Bei direktem Aufruf von z.B. `/app/applications` (SPA-Route) muss SSR oder Server-Konfiguration auf `index.html` zurückfallen — sonst sieht der Benutzer eine generische 404 statt der App.
- **Verifikation:** Direkter Browser-Aufruf `https://staging.../app/pipeline` lädt die App (nicht generisches 404).

---

# PHASE Z — Finale Verifikation (Definition of Done)

**Erst ausführen, wenn alle anderen Tasks ☑ sind.**

## ☐ Z-01 · Grep-Liste

Diese Greps müssen **alle 0 Treffer** liefern:

```bash
cd frontend
rg 'btn--(secondary|accent)' src/
rg "status--(open|done)" src/
rg '[\x{1F000}-\x{1FFFF}]' src/
rg 'oklch\(58% 0\.20 255\)' src/         # alter Accent
rg "features/try" .
rg "features/billing" src/app/
rg "features/security" src/app/
rg "'OPEN'|'DONE'" src/                  # alte Status-Strings ausser Migration-Helper
```

**Verifikation:** alle 8 Greps returnst 0.

## ☐ Z-02 · Build + Lint + TS

```bash
cd frontend
npm ci
npm run lint
npm run build
```

**Verifikation:** Build erfolgreich, 0 lint errors, 0 ts errors.

## ☐ Z-03 · Tests vollständig

```bash
npm test
npm run test:e2e
npm run a11y
```

**Verifikation:** alle 3 Suites grün.

## ☐ Z-04 · Screenshot-Diff pro Seite

Pro Route Screenshot vs Mockup vergleichen. Akzeptanz: 0 Defects bei Farben/Icons/Typografie, ≤ 2 minor Layout-Defects mit Begründung.

| Route | Mockup-Preview |
|---|---|
| `/` | `preview.html?s=landing` |
| `/login` | `preview.html?s=login` |
| `/register` | (analog Login) |
| `/preise` | (3 Karten, visuell prüfen) |
| `/app` | `preview.html?s=dashboard` |
| `/app/applications` | (Tabelle, visuell prüfen) |
| `/app/pipeline` | `preview.html?s=pipeline` |
| `/app/cvs` | `preview.html?s=cvs` |
| `/app/wizard` (Step 2) | `preview.html?s=wizard` |
| `/app/applications/:id` | `preview.html?s=editor` |

## ☐ Z-05 · Manuelle Klick-Tour (PM-Sicht)

21-Schritt-Tour einmal komplett:

1. ☐ Landing laden → Hero-CTA → Try-Modal
2. ☐ Login-Modal → 2FA nur conditional
3. ☐ Registrieren → Mail-Hinweis
4. ☐ Login → Dashboard → Onboarding-Modal
5. ☐ Dashboard → „Neue Bewerbung" → Wizard
6. ☐ Wizard Step 1 → 2 → 3 → Generate
7. ☐ Editor öffnet sich (Modal über Dashboard)
8. ☐ Editor: Sektion editieren, Variante wechseln, ATS-Tab, Nachfassen-Tab
9. ☐ Editor: Status auf „Interview" → Pipeline aktualisiert sich
10. ☐ Editor: Exportieren-Dropdown → ZIP, CV, Anschreiben
11. ☐ Dashboard zeigt Bewerbung in Interview-Spalte (Preview)
12. ☐ `/app/pipeline` → Drag Karte nach „Angebot" → persistiert
13. ☐ `/app/applications` → Filter / Sort / Suche funktioniert
14. ☐ `/app/cvs` → Upload + Text-Form + Template wechseln + Mini-Preview rendert
15. ☐ `/app/linkedin` Free: Lock; Pro: Funktion
16. ☐ ⌘K von jeder Seite → Palette + Navigation
17. ☐ Sidebar: Plan-Usage-Bar zeigt Stand, Upgrade-Link → Pricing
18. ☐ `/app/settings/billing` → Plan-Wechsel-Flow
19. ☐ `/app/settings/security` → 2FA aktivieren/deaktivieren
20. ☐ `/app/settings/data` → Export funktioniert
21. ☐ Logout → Login

**Verifikation:** alle 21 Schritte ohne Console-Error.

## ☐ Z-06 · Performance Lighthouse

```bash
npm run build
npx serve dist/...
```

Lighthouse auf `/` und `/app` (Mobile + Desktop):
- LCP < 2.5 s
- CLS < 0.1
- INP < 200 ms
- Performance ≥ 90

**Verifikation:** alle 4 Schwellen erreicht.

## ☐ Z-07 · A11y-Manueller-Check

- ☐ Tab-Navigation komplett durch Editor (komplexeste Seite). Jedes interaktive Element hat sichtbaren Focus-Style.
- ☐ Sidebar komplett mit Tastatur navigierbar (Tab + Enter).
- ☐ Modals schließbar mit Esc.
- ☐ Axe-DevTools (Browser-Extension) auf allen 10 Hauptseiten → 0 Critical Issues.

## ☐ Z-08 · README

- **Dateien:** `frontend/README.md`
- **Aufgabe:** Sektion „Design System" ergänzen:
  - Link zu `Atlas Redesign Spec.md`
  - Link zu `Redesign Examples.html`
  - Liste der neuen Komponenten
  - Status-Modell (5 Stati)
  - Lucide-Icon-Convention
- **Verifikation:** README enthält Sektion.

---

# Übersicht — Fortschritt

| ID | Task | Phase | Status |
|---|---|---|---|
| E-01 | Editor: Status-Select 5-stufig | A | ✅ |
| E-02 | Editor: Score-Widget Layout | A | ✅ |
| E-03 | Editor: Exportieren-Dropdown | A | ✅ |
| E-04 | Editor: CV-Section Farbcodierung | A | ✅ |
| E-05 | Editor: KI-optimiert-Badge | A | ✅ |
| E-06 | Editor: Letter-Variant Pro-Lock | A | ☐ |
| E-07 | Editor: Send-Footer Variant-Tag | A | ✅ |
| E-08 | Editor: Reminder-Picker | A | ✅ |
| PB-01 | Pipeline-Board: 5-Spalten-Config | B | ✅ |
| PB-02 | Pipeline-Board: Spalten-Container-Style | B | ✅ |
| PB-03 | Pipeline-Board: Spalten-Header | B | ✅ |
| PB-04 | Pipeline-Board: Karten-Layout | B | ✅ |
| PB-05 | Pipeline-Board: Drag&Drop (CDK) | B | ✅ |
| PB-06 | Pipeline-Board: Empty-State | B | ✅ |
| MC-01 | CVs: Text-Form Inline | C | ☐ |
| MC-02 | CVs: Template-Mini-Preview Wiring | C | ☐ |
| MC-03 | CVs: Template-Akzentfarben | C | ☐ |
| MC-04 | CVs: Primär-Badge gefüllt | C | ☐ |
| MC-05 | CVs: Primär-Logik persistieren | C | ☐ |
| MC-06 | CVs: Action-Buttons | C | ☐ |
| AU-01 | Login: Split-Screen | D | ☐ |
| AU-02 | Login: Brand-Panel | D | ☐ |
| AU-03 | Login: Form-Modernisieren + 2FA conditional | D | ☐ |
| AU-04 | Login: Google-OAuth visuell | D | ☐ |
| AU-05 | Register/Forgot/Reset | D | ☐ |
| HE-01 | Hero: Background-Glow | E | ✅ |
| HE-02 | Hero: Eyebrow-Pill | E | ✅ |
| HE-03 | Hero: H1 Italic-Akzent | E | ✅ |
| HE-04 | Hero: Editor-Peek | E | ✅ |
| HE-05 | Hero: Buttons & Proof-Strip | E | ✅ |
| PR-01 | Pricing: Free-Anker-Karte | F | ✅ |
| PR-02 | Pricing: Plan-Toggle | F | ✅ |
| PR-03 | Pricing: Featured-Badge | F | ✅ |
| DB-01 | Dashboard: Echte Daten | G | ✅ |
| DB-02 | Dashboard: Activity-More-Menü | G | ✅ |
| DB-03 | Dashboard: Period-Selector | G | ✅ |
| WZ-01 | Wizard: CV-Mini-Preview | H | ✅ |
| WZ-02 | Wizard: Keyword-Hint | H | ✅ |
| SH-01 | StatusPill Polish | I | ☐ |
| SH-02 | ScoreRing Schwellen | I | ☐ |
| SH-03 | AppShell Usage-Bar | I | ☐ |
| SH-04 | AppShell Workspace-Avatar | I | ☐ |
| SH-05 | AppTopBar Crumb-Trenn | I | ☐ |
| SH-06 | CommandPalette Suche | I | ☐ |
| SH-07 | Pipeline-Toolbar Chips | I | ☐ |
| SH-08 | Cover-Letter-Tone-Picker | I | ☐ |
| SH-09 | CV-Mini-Previews × 5 | I | ☐ |
| SH-10 | ATS-Panel Tab | I | ☐ |
| SH-11 | KeywordBar Check | I | ☐ |
| SH-12 | CompanyLogo Palette | I | ☐ |
| SH-13 | Confirm-Delete Modal | I | ☐ |
| SH-14 | Upgrade-Modal Polish | I | ☐ |
| SH-15 | Einstellungen-Modal Slim | I | ☐ |
| SH-16 | CV-Template-Picker Visual | I | ☐ |
| SH-17 | Editor-Modal Größe | I | ☐ |
| SH-18 | Consent-Banner Refresh | I | ☐ |
| SH-19 | Navbar Scroll-State | I | ☐ |
| SH-20 | Footer Tokenize | I | ☐ |
| SH-21 | Card-Component Padding | I | ☐ |
| SH-22 | Button-Component Loading | I | ☐ |
| SH-23 | Pill-Component Variants | I | ☐ |
| LS-01 | Logo-Bar | J | ☐ |
| LS-02 | Features-Grid | J | ☐ |
| LS-03 | Workflow-Steps | J | ☐ |
| LS-04 | Before/After | J | ☐ |
| LS-05 | Testimonials | J | ☐ |
| LS-06 | Pricing-Inline | J | ☐ |
| LS-07 | CTA-Band | J | ☐ |
| OT-01 | Settings-Übersicht | K | ☐ |
| OT-02 | Settings-Billing umziehen | K | ☐ |
| OT-03 | Settings-Security | K | ☐ |
| OT-04 | Settings-Data | K | ☐ |
| OT-05 | Security alt LÖSCHEN | K | ☐ |
| OT-06 | LinkedIn-Page | K | ☐ |
| OT-07 | FAQ Akkordeon | K | ☐ |
| OT-08 | Not-Found | K | ☐ |
| OT-09 | Legal-Type-Scale | K | ☐ |
| OT-10 | Onboarding-Modal | K | ☐ |
| OT-11 | /try löschen | K | ☐ |
| OT-12 | Pro-Lock Pattern | K | ☐ |
| OT-13 | legal.component.scss tot | K | ☐ |
| R-01 | app.routes vollständig | L | ☐ |
| R-02 | CommandPalette wiring | L | ☐ |
| R-03 | Status-Mapper | L | ☐ |
| BE-01 | Status-Migration | M | ☐ |
| BE-02 | API-Validierung | M | ☐ |
| BE-03 | Reminder-API | M | ☐ |
| QA-01 | Axe-Smoke | N | ☐ |
| QA-02 | Playwright | N | ☐ |
| QA-03 | Jest | N | ☐ |
| QA-04 | Visual-Regression | N | ☐ |
| Z-01 | Grep-Check | Z | ☐ |
| Z-02 | Build | Z | ☐ |
| Z-03 | Tests | Z | ☐ |
| Z-04 | Screenshot-Diff | Z | ☐ |
| Z-05 | Klick-Tour (21 Schritte) | Z | ☐ |
| Z-06 | Performance | Z | ☐ |
| Z-07 | A11y | Z | ☐ |
| Z-08 | README | Z | ☐ |

**Total: 102 atomare Tasks**

---

## Anhang — Nachgereichte Tasks (Phase Y)

| ID | Task | Bereich |
|---|---|---|
| Y-01 | tailwind.config.ts aktualisieren | Config |
| Y-02 | index.html Meta-Tags + Favicon | Marketing |
| Y-03 | sitemap.xml ergänzen | SEO |
| Y-04 | score.utils.ts mit Token-Farben | Utils |
| Y-05 | Mobile-Responsive prüfen | Layout |
| Y-06 | Toast-Notification-Service | Shared |
| Y-07 | Print-Stylesheet für CV-PDF | Editor |
| Y-08 | app.component Reveal-Init | App |
| Y-09 | 404.html für SSR-Fallback | Server |
