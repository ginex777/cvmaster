# Datenschutz-Folgenabschätzung (DSFA)

> Pflicht nach Art. 35 DSGVO. Vorlage BfDI. Vor Public-Launch ausfüllen, jährlich review.

## 1. Beschreibung der Verarbeitung

- **Verantwortlicher:** [Name, Adresse]
- **Verarbeitungstätigkeit:** AI-gestützte Optimierung von Lebensläufen und Anschreiben
- **Zwecke:** Bewerbungs-Optimierung für Endnutzer (Bewerber)
- **Datenkategorien:**
  - Identifikation (Name, Geburtsdatum, Adresse, E-Mail)
  - Bildungsdaten (Schule, Studium, Zertifikate)
  - Berufsdaten (Arbeitgeber, Positionen, Skills)
  - **Art. 9 DSGVO:** Bewerbungsfoto, ggf. Religion (kirchliche AG), Gewerkschaft, Gesundheit, polit. Einstellung
- **Rechtsgrundlage:**
  - Art. 6 Abs. 1 lit. b (Vertrag)
  - Art. 9 Abs. 2 lit. a (ausdrückliche Einwilligung) für Art-9-Daten
- **Speicherdauer:** s. § 14 SPEC (30d nach Inaktivität → Soft-Delete; 60d → Hard-Delete)

## 2. Notwendigkeit & Verhältnismäßigkeit
[Begründung]

## 3. Risiken für Betroffene

| Risiko | Eintrittswahrscheinlichkeit | Schadenshöhe | Gesamt |
|---|---|---|---|
| Datenleak Postgres | gering | hoch | mittel |
| AI-Halluzination → falsche Bewerbungsangaben | mittel | mittel | mittel |
| Bias durch AI-Profiling | mittel | mittel | mittel |
| Drittland-Übermittlung | sehr gering (EU-only) | hoch | gering |
| Prompt-Injection via Stellenanzeige | gering | mittel | gering |

## 4. Abhilfe-Maßnahmen
- TLS 1.3, At-Rest-Verschlüsselung Postgres
- IONOS BSI C5
- AI-Provider EU-only (Mistral FR + Aleph Alpha DE)
- Halluzinations-Guards (Schema-Validation, Citation-Check, Skill-Whitelist)
- Bias-Testing Suite
- Anonymisierungs-Toggle für Foto
- Auto-Purge AI-Prompts nach 30d
- Audit-Log
- Datenpannen-Meldeprozess Art. 33

## 5. Bewertung & Beschluss
**Restrisiko nach Maßnahmen: gering.**
Verarbeitung darf durchgeführt werden.

**Datum:** [...]   **Unterschrift Verantwortlicher:** [...]
