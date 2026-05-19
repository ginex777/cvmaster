# Atlas Redesign — Complete TODO List

Generated: 2026-05-18 | Based on full screenshot audit vs. redesign JSX files

Legend: 🎨 Visual/redesign mismatch · ❌ No function · 🐛 Bug · ✅ Done

---

## 🌐 GLOBAL (alle Seiten)

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| G-01 | HIGH | ✅ **Search bar nicht funktional** — CommandPalette öffnet sich aber zeigt nichts; muss Bewerbungen/CVs durchsuchen und navigieren können | `app-topbar/`, `command-palette/` |
| G-02 | HIGH | ✅ **Notification-Bell tut nichts** — kein Dropdown, kein Panel; mind. leerer Zustand + Liste der Benachrichtigungen einbauen | `app-topbar/app-topbar.html`, neues `notifications-panel/` |
| G-03 | HIGH | ✅ **Workspace-Switcher tut nichts** — Chevron ist rein dekorativ; Dropdown mit Account-Info, Profil bearbeiten und Logout einbauen | `app-shell/app-shell.component.html`, `app-shell.component.ts` |
| G-04 | MED | ✅ **"Abmelden"-Button aus Sidebar entfernen** — Logout gehört in den Workspace-Switcher-Dropdown, nicht als fixer Sidebar-Eintrag | `app-shell/app-shell.component.html` |
| G-05 | MED | ✅ **LinkedIn-Nav-Item ist `<button>` statt `<a routerLink>`** — muss ein echter Link sein für Keyboard-Navigation und korrekten Active-State | `app-shell/app-shell.component.html` |
| G-06 | LOW | ✅ **Sidebar-Icon Pipeline** — `name="kanban"` → `name="columns"` | `app-shell/app-shell.component.html` |
| G-07 | LOW | ✅ **Sidebar-Icon Lebensläufe** — `name="file-text"` → `name="file"` | `app-shell/app-shell.component.html` |
| G-08 | HIGH | ✅ **Content-Bereich nicht full-width auf Sub-Seiten** — Settings, Billing, Security, Daten, LinkedIn, Applications haben alle ein hartes `max-width` oder fehlende `width: 100%`; Content-Wrapper anpassen | `settings/`, `data.component.scss`, `security.component.scss`, `billing.component.scss`, `linkedin.component.scss` |
| G-09 | HIGH | ✅ **Greeting zeigt falschen Namen "Lina"** — `firstName()`-Signal liest aus falscher Datenquelle; muss den tatsächlich eingeloggten User zeigen | `dashboard.component.ts` |
| G-10 | LOW | ✅ **Topbar Höhe** — Redesign gibt `height: 56px` vor; aktuell etwas höher durch Padding; auf exakt 56px fixieren | `app-topbar/app-topbar.scss` |

---

## 📊 DASHBOARD

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| D-01 | MED | ✅ **Activity-Item Company-Logo immer grau** — soll `color-mix(in oklch, statusColor 13%, transparent)` als Hintergrund haben, farbig je nach Status; nicht immer `var(--surface-2)` | `dashboard.component.html`, `dashboard.component.scss` |
| D-02 | HIGH | ✅ **More-Menu "···" zeigt nur "Öffnen"** — "Status ändern", "Erinnerung setzen…" und "Löschen" sind im Template, rufen aber nur `closeMenu()` auf; müssen echte Aktionen auslösen | `dashboard.component.html`, `dashboard.component.ts` |
| D-03 | HIGH | ✅ **"Status ändern"-Submenu ohne Funktion** — Submenu-Items müssen `onStatusChange({ id, status })` aufrufen (API-Call + Signal-Update) | `dashboard.component.ts` |
| D-04 | HIGH | ✅ **"Erinnerung setzen…" ohne Funktion** — soll Datepicker öffnen und Reminder per API speichern | `dashboard.component.ts`, evtl. neues `reminder-picker/` |
| D-05 | HIGH | ✅ **"Löschen" ohne Funktion** — soll `ConfirmDeleteModal` öffnen und bei Bestätigung Delete-API aufrufen + aus Liste entfernen | `dashboard.component.ts` |
| D-06 | MED | ✅ **Zeitraum-Filter prüfen** — Zeitraum-Dropdown öffnet sich, aber filtert es tatsächlich die `filteredApplications()`-Computed? Sicherstellen dass `loadData()` mit dem gewählten Zeitraum neu aufgerufen wird | `dashboard.component.ts` |
| D-07 | LOW | ✅ **Panel-Header Padding** — `14px 16px` → `12px 16px` (Redesign-Vorgabe) | `dashboard.component.scss` |
| D-08 | LOW | ✅ **Panel-Title Font-Size** — `14px` → `13px` | `dashboard.component.scss` |

---

## 📋 BEWERBUNGEN (List View)

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| B-01 | HIGH | ✅ **Content nicht full-width** — Bewerbungsliste nutzt nur ~halbe Viewport-Breite; Content-Wrapper `width: 100%` setzen | `applications.component.scss` |
| B-02 | HIGH | ✅ **Kein Such-/Filterfeld** — Bewerbungsliste hat kein Text-Suchfeld; Suchfeld für Firma/Rolle/Score einbauen (kann an bestehende Filter-Logik anknüpfen) | `applications.component.html`, `applications.component.ts` |
| B-03 | HIGH | ✅ **"Löschen"-Button** — muss `ConfirmDeleteModal` öffnen, dann Delete-API aufrufen und Eintrag aus Liste entfernen | `applications.component.ts` |
| B-04 | MED | ✅ **Bewerbungskarten-Design** — zeigt rohen "Unbekannte Stelle @ Unbekannt"-Text; Redesign hat `CompanyLogo`-Komponente (farbiger Kreis) + strukturierter Firmenname + Rolle + Score-Pill rechts | `applications.component.html`, `applications.component.scss` |
| B-05 | LOW | ✅ **"Liste"/"Pipeline"-Toggle Active-State** — Active-State muss per `[class.active]` oder `routerLinkActive` gesetzt werden, nicht statisch | `applications.component.html`, `pipeline.component.html` |

---

## 🗂️ PIPELINE

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| P-01 | HIGH | ✅ **"Filter"-Button öffnet nichts** — kein Dropdown/Panel erscheint; Filter-Panel mit Status-Checkboxes und Score-Range einbauen | `pipeline-toolbar/`, `pipeline.component.ts` |
| P-02 | HIGH | ✅ **"Alle Stati"-Schnellfilter** — rendert als statischer Toggle, kein Multi-Select-Dropdown für Statusauswahl | `pipeline-toolbar/pipeline-toolbar.component.html` |
| P-03 | MED | ✅ **"Score ≥ 80"-Filter prüfen** — verifizieren dass `filteredApplications()` tatsächlich nach matchScore filtert | `pipeline.component.ts` |
| P-04 | MED | ✅ **"Mit Erinnerung"-Filter prüfen** — verifizieren dass nur Bewerbungen mit gesetzter Erinnerung angezeigt werden | `pipeline.component.ts` |
| P-05 | MED | ✅ **"+" Spalten-Button** — Klick auf `+` in Spalten-Header soll Wizard mit vorgesetztem Status öffnen oder Draft in dieser Spalte anlegen; prüfen ob verdrahtet | `pipeline-board/`, `pipeline.component.ts` |
| P-06 | HIGH | ✅ **"Abgesagt"-Spalte abgeschnitten** — 5. Spalte partiell außerhalb des Viewports; Board-Wrapper braucht `overflow-x: auto` | `pipeline.component.scss`, `pipeline-board/pipeline-board.component.scss` |
| P-07 | MED | ✅ **Pipeline-Card ohne Company-Logo** — zeigt grauen Kreis-Placeholder; soll `CompanyLogo` (28px, farbig je Status) verwenden | `pipeline-card/pipeline-card.component.html` |
| P-08 | LOW | ✅ **Kein Drag-and-Drop** — Status-Änderung nur über Card-Menü; CDK DragDrop einbauen um Karten zwischen Spalten ziehen zu können (Status-Change-Event auslösen) | `pipeline-board/` |
| P-09 | MED | ✅ **Toolbar fehlt Border-Bottom** — `.pipeline-toolbar { border-bottom: none }` → `1px solid var(--line)` | `pipeline.component.scss` |
| P-10 | HIGH | ✅ **Pipeline-Card-Klick** — Klick auf eine Karte soll Editor-Modal für diese Bewerbung öffnen (via `(applicationOpen)` Output); prüfen ob verdrahtet | `pipeline-board/`, `pipeline.component.ts` |

---

## 📄 LEBENSLÄUFE (CVs)

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| C-01 | HIGH | ✅ **Grid-Layout falsch** — Redesign: 3-Spalten-Grid; aktuell: 1 Karte links + Neue-Karte weit rechts mit riesigem Gap; CSS-Grid auf `grid-template-columns: repeat(3, 1fr)` setzen | `master-cvs.component.scss` |
| C-02 | HIGH | ✅ **"Modern ▾" Template-Dropdown ohne Funktion** — Chevron neben "Modern" soll Template-Picker öffnen (Classic, Modern, Minimal etc.); aktuell keine Aktion | `master-cvs.component.html`, `master-cvs.component.ts` |
| C-03 | HIGH | ✅ **"···" Drei-Punkte-Menü auf CV-Karte ohne Funktion** — soll Kontextmenü mit "Umbenennen", "Duplizieren", "Als primär setzen", "Löschen" öffnen | `master-cvs.component.ts` |
| C-04 | MED | ✅ **"Text einfügen"-Button** — soll Text-Paste-Flow/Modal öffnen; prüfen ob funktioniert | `master-cvs.component.ts` |
| C-05 | MED | ✅ **"Lebenslauf hochladen"-Button** — soll File-Upload-Dialog öffnen; prüfen ob funktioniert | `master-cvs.component.ts` |
| C-06 | MED | ✅ **"Anwenden"-Button** — soll CV mit aktueller/gewählter Bewerbung verknüpfen oder Auswahl-Flow öffnen; unklar was es aktuell tut | `master-cvs.component.ts` |

---

## 🧙 WIZARD (Neue Bewerbung)

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| W-01 | HIGH | ✅ **Scrollen auf Schritt 1 nötig** — "Ohne vorhandenen Lebenslauf starten"-Formular hat 5 Felder und pushed unter den Fold; Wizard soll `height: calc(100vh - 56px)` mit `overflow: hidden` sein, nur rechte Panel scrollt | `wizard.component.scss`, `wizard.component.html` |
| W-02 | HIGH | ✅ **Wizard-Layout-Struktur** — Outer-Container auf `display: flex; height: calc(100vh - 56px); overflow: hidden` setzen; linke Rail fix, rechte Content-Area `overflow-y: auto` | `wizard.component.scss` |
| W-03 | MED | ✅ **"Link"-Tab Schritt 2** — Klick auf Link-Tab soll URL-Input-Feld einblenden; prüfen ob das Rendering korrekt ist | `wizard.component.html` |
| W-04 | LOW | ✅ **"PDF" und "Screenshot" Tabs ("BALD")** — Tabs müssen `disabled` Attribut haben + `cursor: not-allowed`; keine Click-Events auslösen | `wizard.component.html`, `wizard.component.scss` |
| W-05 | HIGH | ✅ **Schritt 3 (Generieren/Ton & Optionen)** — prüfen ob dieser Schritt korrekt rendert; Tonfall-Auswahl (formell/locker) + Varianten-Optionen müssen vorhanden sein | `wizard.component.html`, `wizard.component.ts` |
| W-06 | LOW | ✅ **"Zurück zum Dashboard" Chevron-Icon** — Icon nicht vertikal mittig zum Text; `display: flex; align-items: center; gap: 6px` auf Link-Container | `wizard.component.scss` |

---

## ✏️ EDITOR MODAL

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| E-01 | HIGH | ✅ **Modal zu klein** — aktuell ~960px breites Modal; Redesign gibt **Full-Screen** 3-Panel-Layout vor: 220px Outline-Rail \| CV-Editor \| Letter+Analytics-Pane; Modal auf `width: 100vw; height: 100vh; max-width: none; border-radius: 0` | `editor-modal/editor-modal.html`, `editor-modal/editor-modal.scss` |
| E-02 | MED | ✅ **ATS-Score-Ring** — zeigt "Ausbaufähig · 0/0 Keywords" als Plain-Text; Redesign zeigt `ScoreRing`-Komponente mit zirkulärem Progress und großer Prozentzahl | `ats-panel/ats-panel.html`, evtl. neues `score-ring/` |
| E-03 | MED | ✅ **Status-Chip-Dropdown** — Klick auf "Entwurf"-Chip neben dem Score soll Status-Picker-Dropdown öffnen; prüfen ob verdrahtet | `editor.component.html`, `editor.component.ts` |
| E-04 | MED | ✅ **"Vorschau"-Button** — soll CV-Preview/Print-Modus öffnen; prüfen ob implementiert | `editor.component.ts` |
| E-05 | MED | ✅ **"Exportieren"-Button** — soll PDF-Export triggern; prüfen ob implementiert | `editor.component.ts` |
| E-06 | MED | ✅ **Letter-Varianten-Tabs** — "Format / Warm / Kurz" sollen zwischen 3 KI-generierten Anschreiben-Varianten wechseln; Tab-Switching prüfen | `editor.component.html`, `editor.component.ts` |
| E-07 | LOW | ✅ **ATS-Label Casing** — zeigt "ATS-MATCH"; Redesign: "ATS-Match" | `ats-panel/ats-panel.html` |
| E-08 | LOW | ✅ **Editor-Header Company-Logo** — Redesign: 44px `CompanyLogo` im Header-Strip; aktuell: Initialen "HF" in einfachem Quadrat | `editor.component.html` |

---

## ⚙️ EINSTELLUNGEN

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| S-01 | HIGH | ✅ **Content-Width alle Sub-Seiten** — Abrechnung, Sicherheit, Daten haben Karten auf ~550px; auf mindestens `max-width: 720px` oder `width: 100%` erweitern | `billing.component.scss`, `security.component.scss`, `data.component.scss` |
| S-02 | MED | ✅ **Back-Button `<` Icon nicht zentriert** — Chevron-Left-Icon in "← Einstellungen"-Link ist vertikal falsch ausgerichtet; `display: flex; align-items: center; gap: 8px` auf den Container | `billing.component.scss`, `security.component.scss`, `data.component.scss` |
| S-03 | HIGH | ✅ **Plan-Inkonsistenz** — Sidebar zeigt "Free (3/5)", Abrechnung zeigt "Pro"; Plan-Daten müssen aus derselben Auth-Quelle kommen | `billing.component.ts`, `auth.service.ts` |
| S-04 | HIGH | ✅ **"Plan wechseln"-Button** — nicht an Paddle oder Pricing-Flow angebunden | `billing.component.ts` |
| S-05 | LOW | ✅ **Session User-Agent Darstellung** — zeigt rohen UA-String; soll geparst werden zu "Chrome auf Windows" o.ä. | `security.component.ts` |
| S-06 | HIGH | ✅ **"2FA einrichten"-Button** — soll TOTP-QR-Setup-Flow öffnen; prüfen ob implementiert | `security.component.ts` |
| S-07 | HIGH | ✅ **"Beenden"-Buttons (Sessions)** — müssen Session-Revoke-API-Endpoint aufrufen und Session aus Liste entfernen | `security.component.ts` |
| S-08 | HIGH | ✅ **"Passwort speichern"-Button** — muss Change-Password-API aufrufen + Success/Error-Feedback zeigen | `security.component.ts` |
| S-09 | HIGH | ✅ **"Export anfordern"-Button** — muss Daten-Export-API aufrufen + Bestätigungsmeldung anzeigen ("Du erhältst eine E-Mail mit deinen Daten") | `data.component.ts` |
| S-10 | HIGH | ✅ **"Konto löschen"-Button** — muss `ConfirmDeleteModal` öffnen, bei Bestätigung Account-Deletion-API aufrufen und zur Landing-Page weiterleiten | `data.component.ts` |

---

## 🔑 LOGIN-SEITE

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| L-01 | MED | ✅ **Button-Text "Einloggen"** → **"Anmelden"** | `auth/login.component.html` |
| L-02 | MED | ✅ **E-Mail-Label "E-Mail-Adresse"** → **"E-Mail"** | `auth/login.component.html` |
| L-03 | MED | ✅ **"Mit Google fortfahren"-Button entfernen** — Google OAuth nicht in V1-Scope | `auth/login.component.html` |
| L-04 | LOW | ✅ **Linkes Panel fehlt Grid-SVG-Overlay** — Redesign zeigt subtiles Raster-Muster auf dem dunklen Panel; als SVG oder CSS-Background ergänzen | `auth/login.component.scss` |
| L-05 | MED | ✅ **"Vergessen?"-Link** → `/auth/forgot-password` prüfen ob Route + Flow implementiert ist | `app.routes.ts`, `auth/` |

---

## 📝 REGISTRIERUNGS-SEITE

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| R-01 | LOW | ✅ **"Vollständiger Name"-Label** → **"Name"** | `auth/register.component.html` |
| R-02 | LOW | ✅ **"E-Mail-Adresse"-Label** → **"E-Mail"** | `auth/register.component.html` |
| R-03 | LOW | ✅ **"Einloggen"-Link am Ende** → **"Anmelden"** (konsistent mit Login-Page-Fix L-01) | `auth/register.component.html` |

---

## 💼 LINKEDIN-SEITE

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| LI-01 | LOW | ✅ **Formular-Breite** — auf `max-width: 800px` oder breiter setzen damit es auf großen Screens nicht zu schmal wirkt | `linkedin/linkedin.component.scss` |
| LI-02 | MED | ✅ **"Profil optimieren" Ergebnis** — nach Absenden: wo erscheint das Ergebnis? Result-Panel unterhalb des Formulars oder Navigation zu Ergebnis-View einbauen | `linkedin/linkedin.component.html`, `linkedin/linkedin.component.ts` |

---

---

## 🏠 LANDING PAGE

> **Kurzfazit**: Die Landing Page weicht stark vom Redesign ab. Das Hero-Panel (rechte Seite) ist ein sehr spezifischer "Product Peek" mit überlagerter Anschreiben-Karte und Social-Proof-Reihe. Diese Elemente sind entweder gar nicht vorhanden oder visuell falsch.

### Hero-Sektion

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| LP-01 | HIGH | ✅ **Radiales Akzent-Glühen fehlt** — Redesign hat `radial-gradient(circle, accentSoft 0%, transparent 60%)` als absolut positioniertes Element oben-mittig (`top: -120px`, 800×800px); gibt der Seite Tiefe | `landing/sections/hero.component.html`, `hero.component.scss` |
| LP-02 | HIGH | ✅ **Social-Proof-Reihe fehlt komplett** — Redesign zeigt unter den CTAs: 5 farbige Avatar-Kreise (gestapelt, -8px Overlap) + "4.900+ Bewerbungen optimiert" + "★★★★★ 4,7 / 5 · 312 Bewertungen" | `landing/sections/hero.component.html` |
| LP-03 | HIGH | ✅ **Product-Peek-Karte fehlt `rotate(0.4deg)`** — die Editor-Vorschau-Karte soll leicht geneigt sein; aktuell gerade | `landing/sections/hero.component.scss` |
| LP-04 | HIGH | ✅ **Floating Anschreiben-Karte fehlt** — Redesign hat eine zweite, schwebende Karte (`position: absolute; bottom: -40px; left: -60px; rotate(-2deg)`) über der Editor-Karte mit "Anschreiben · Formal · 3 Varianten" und einem Textausschnitt | `landing/sections/hero.component.html`, `hero.component.scss` |
| LP-05 | MED | ✅ **Product-Peek Inhalte** — die rechte Editor-Karte soll zeigen: CV-Text mit farbig markierten Keywords + rechte Spalte mit `ScoreRing (88%)` + Treffer/Lücken-Tags + Vorschlags-Box; aktuell wahrscheinlich ein generischer Screenshot | `landing/sections/hero.component.html` |
| LP-06 | MED | ✅ **Hero H1** — Redesign: `fontSize: 60, fontWeight: 600, letterSpacing: -1.6, lineHeight: 1.04`; prüfen und anpassen | `landing/sections/hero.component.scss` |
| LP-07 | MED | ✅ **Hero CTA-Buttons** — "Bewerbung optimieren" soll `btn--cta` sein (blauer Akzent); "So funktioniert's" soll `btn--default` sein (grau); aktuell: `btn--cta` + `btn--outline` | `landing/sections/hero.component.html` |
| LP-08 | LOW | ✅ **Navbar "Kostenlos starten"** — Redesign: `variant="primary"`; aktuell `btn--primary` — prüfen ob korrekt | `shared/components/navbar.component.html` |

### Login-Seite

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| LP-09 | HIGH | ✅ **Linkes Panel: Grid-SVG-Muster fehlt** — Redesign hat ein `<svg>` mit `<pattern id="grid">` als `position: absolute; inset: 0; opacity: 0.04`; subtiles Raster-Muster auf dem dunklen Panel | `auth/login.component.html`, `login.component.scss` |
| LP-10 | HIGH | ✅ **Linkes Panel: Accent-Glow fehlt** — Redesign hat `position: absolute; top: -100px; right: -100px; width/height: 400px; background: accent; filter: blur(120px); opacity: 0.4`; blaues Glühen oben rechts | `auth/login.component.html`, `login.component.scss` |
| LP-11 | MED | ✅ **Button-Text "Einloggen"** → **"Anmelden"** | `auth/login.component.html` |
| LP-12 | MED | ✅ **E-Mail-Label "E-Mail-Adresse"** → **"E-Mail"** (12.5px, fontWeight 500, color ink2) | `auth/login.component.html` |
| LP-13 | LOW | ✅ **"Kostenlos registrieren"-Link** — Redesign-Text: "Noch keinen Account? Kostenlos registrieren"; aktuell: "Noch kein Account? Registrieren" | `auth/login.component.html` |

### Register-Seite

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| LP-14 | LOW | ✅ **"Vollständiger Name"-Label** → **"Name"** | `auth/register.component.html` |
| LP-15 | LOW | ✅ **"E-Mail-Adresse"-Label** → **"E-Mail"** | `auth/register.component.html` |
| LP-16 | LOW | ✅ **"Einloggen"-Link am Ende** → **"Anmelden"** | `auth/register.component.html` |

---

## 🧙 WIZARD — Restrukturierung (Neue Bewerbung)

> **Problem**: Schritt 1 hat zwei Bereiche übereinander (CV-Picker + Quickstart-Formular mit 5 Feldern), was dazu führt, dass die Seite scrollt. Schritt 2 ist kurz. Die Höhe der Seite springt zwischen den Schritten.
>
> **Lösung**: Wizard als `height: calc(100vh - 56px)`-Container mit `overflow: hidden` umbauen. Nur das rechte Panel scrollt intern. Das Quickstart-Formular auf 2 Pflichtfelder reduzieren (Name + Sprache) — der Rest wird im Editor ergänzt.

| ID | Priorität | Beschreibung | Datei(en) |
|----|-----------|--------------|-----------|
| WR-01 | HIGH | ✅ **Wizard-Container auf Viewport-Höhe fixieren** — `height: calc(100vh - 56px); overflow: hidden; display: flex` auf den äußersten Container; rechtes Panel `overflow-y: auto` | `wizard.component.scss` |
| WR-02 | HIGH | ✅ **Quickstart-Formular ("CV-Gerüst erstellen") kürzen** — "Aktuelle Rolle", "Top-Skills" und "Zielrolle" aus dem Quickstart entfernen; nur Name + Sprache sind nötig um ein Gerüst zu erstellen — alles andere trägt der User im Editor ein | `wizard.component.html`, `wizard.component.ts` |
| WR-03 | MED | ✅ **Quickstart-Sektion anfangs einklappen** — "Ohne vorhandenen Lebenslauf starten" als aufklappbaren Bereich darstellen (initial geschlossen, öffnet sich bei Klick); verhindert visuelle Überfüllung auf Schritt 1 | `wizard.component.html`, `wizard.component.scss` |
| WR-04 | MED | ✅ **Schritt-Übergänge animieren** — beim Wechsel zwischen Schritt 1/2/3 eine kurze Fade- oder Slide-Animation einsetzen damit der Sprung nicht abrupt wirkt | `wizard.component.scss` |
| WR-05 | LOW | ✅ **"CV-Gerüst erstellen"-Button-Label** — der Begriff "Gerüst" ist technisch; umbenennen in **"Leerer Lebenslauf erstellen"** oder **"Neu beginnen"** für bessere UX | `wizard.component.html` |

---

## 🚦 Prioritäts-Übersicht

### HIGH (sofort angehen)
G-01, G-02, G-03, G-08, G-09, D-02, D-03, D-04, D-05, B-01, B-02, B-03, P-01, P-06, P-10, C-01, C-02, C-03, W-01, W-02, W-05, WR-01, WR-02, E-01, S-01, S-03, S-04, S-06, S-07, S-08, S-09, S-10, LP-01, LP-02, LP-03, LP-04, LP-09, LP-10

### MEDIUM (zweite Iteration)
G-04, G-05, D-01, D-06, B-04, P-02, P-05, P-07, P-09, C-04, C-05, C-06, W-03, WR-03, WR-04, E-02, E-03, E-04, E-05, E-06, S-02, LP-05, LP-06, LP-07, LP-11, LP-12, LI-02

### LOW (polish)
G-06, G-07, G-10, D-07, D-08, B-05, P-03, P-04, P-08, W-04, W-06, WR-05, E-07, E-08, S-05, LP-08, LP-13, LP-14, LP-15, LP-16, LI-01

---

## 📊 Statistik

| Typ | Anzahl |
|-----|--------|
| ❌ Keine Funktion / kaputt | 24 |
| ❌ Prüfung nötig | 14 |
| 🎨 Visual / Redesign-Abweichung | 37 |
| 🐛 Bug | 4 |
| **Gesamt** | **79** |
