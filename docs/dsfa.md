# Datenschutz-Folgenabschaetzung (DSFA) - Arbeitsfassung

Status: fachlich vorbereitet, vor Public-Launch durch Verantwortlichen und Rechtsberatung zu pruefen.

## 1. Verarbeitung

- Verantwortlicher: offen, vor Launch einzutragen.
- Verarbeitungstaetigkeit: KI-gestuetzte Optimierung von Lebenslaeufen und Anschreiben.
- Zweck: Nutzer laden CV-Inhalte und Stellenanzeigen hoch/ein, erhalten strukturierte CV-Daten, Match-Report, optimierten Lebenslauf und Anschreiben.
- Betroffene: Bewerberinnen und Bewerber, die den Dienst aktiv nutzen.
- Rechtsgrundlagen: Art. 6 Abs. 1 lit. b DSGVO fuer Vertragserfuellung; Art. 9 Abs. 2 lit. a DSGVO fuer ausdruecklich eingewilligte besondere Kategorien, soweit CV-Inhalte solche Daten enthalten.
- Datenminimierung: Uploads werden RAM-only verarbeitet; Originaldateien und generierte PDFs werden nicht dauerhaft gespeichert.
- Speicherfristen: Accountdaten bis Loeschung; Soft-Delete mit Hard-Purge nach 30 Tagen; AI-Job-Auditdaten maximal 30 Tage.

## 2. Datenkategorien

- Account: E-Mail, Name, Passwort-Hash, Plan, Session-Metadaten.
- CV: Name, Kontakt, Ausbildung, Berufserfahrung, Skills, Sprachen, Zertifikate.
- Potenzielle Art.-9-Daten: Foto, Gesundheitsdaten, Religion, Gewerkschaft, politische Hinweise oder sonstige besondere Kategorien, sofern im CV enthalten.
- Stellenanzeigen: eingegebene Anzeigen-Texte und daraus strukturierte Anforderungen.
- Bewerbungen: optimierte CV-Daten, Anschreiben, Match-Score, Match-Report, Status.
- Zahlungsdaten: nur Paddle-Merchant-of-Record-Daten, keine direkte Kartenverarbeitung im System.

## 3. Risiken

| Risiko | Eintritt | Schaden | Bewertung |
|---|---:|---:|---:|
| Unbefugter Zugriff auf Bewerbungsdaten | niedrig | hoch | mittel |
| Fehlerhafte KI-Ergaenzungen oder Halluzinationen | mittel | mittel | mittel |
| Prompt-Injection ueber Stellenanzeige | niedrig | mittel | niedrig-mittel |
| Unklare Loesch-/Session-Zustaende | niedrig | hoch | mittel |
| Drittanbieter-Ausfall oder Fehlkonfiguration | mittel | mittel | mittel |

## 4. Massnahmen

- TLS und Caddy/Helmet-Sicherheitsheader.
- Passwort-Hashing mit Argon2id.
- JWT + Refresh-Session-Modell mit Session-Revocation.
- TOTP-Unterstuetzung.
- Resource-Owner-Checks fuer nutzerbezogene Ressourcen.
- Zod-Validierung fuer Eingaben und LLM-Ausgaben.
- KI-Ausgabe-Sanitizing, Skill-Filter und Match-Scoring ohne direkte User-Schreibrechte auf Score/Report.
- Soft-Delete plus automatische Hard-Purge nach 30 Tagen.
- RAM-only Upload/PDF-Verarbeitung.
- Redis-basierte Rate-Limits auf kritischen Endpunkten.
- CSP fuer App und Paddle Checkout.

## 5. Restrisiko

Restrisiko nach aktuellen technischen Massnahmen: mittel bis niedrig. Vor Public-Launch muessen reale Provider, AVV-Nachweise, Verantwortlicher, Hosting-Regionen, Backup-Prozesse und Incident-Prozess final bestaetigt werden.

## 6. Freigabe

- Verantwortlicher: offen
- Rechtspruefung: offen
- Datum: offen
- Naechster Review: vor Public-Launch und danach jaehrlich
