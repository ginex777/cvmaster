import type { CvPdfData } from './renderers/renderer.interface';

type PdfSection = CvPdfData['sections'][number];

export function toCvPdfData(value: unknown, fallbackName = 'Lebenslauf'): CvPdfData {
  const name = objectString(value, 'name') ?? fallbackName;

  const structuredSections = sectionsFromStructuredValue(value);
  if (structuredSections.length > 0) {
    return { name, sections: structuredSections };
  }

  const editorText = objectString(value, 'text');
  if (editorText) {
    const textSections = textToSections(editorText);
    if (textSections.length > 0) return { name, sections: textSections };
  }

  const parsedCvSections = sectionsFromParsedCv(value);
  if (parsedCvSections.length > 0) {
    return { name, sections: parsedCvSections };
  }

  if (typeof value === 'string' && value.trim()) {
    const textSections = textToSections(value);
    if (textSections.length > 0) return { name, sections: textSections };
  }

  return {
    name,
    sections: [{ heading: 'Lebenslauf', lines: [fallbackLine(value)] }],
  };
}

function sectionsFromStructuredValue(value: unknown): PdfSection[] {
  if (!isRecord(value) || !Array.isArray(value.sections)) return [];
  return value.sections
    .map(sectionFromUnknown)
    .filter((section): section is PdfSection => section !== null);
}

function sectionFromUnknown(value: unknown): PdfSection | null {
  if (!isRecord(value)) return null;

  const heading = objectString(value, 'heading') ?? objectString(value, 'title') ?? 'Lebenslauf';
  const lines = [
    ...linesFromUnknown(value.lines),
    ...linesFromBullets(value.bullets),
  ];

  return lines.length > 0 ? { heading, lines } : null;
}

function sectionsFromParsedCv(value: unknown): PdfSection[] {
  if (!isRecord(value)) return [];

  const sections: PdfSection[] = [];
  const contactLines = compact([
    objectString(value, 'email'),
    objectString(value, 'phone'),
    objectString(value, 'location'),
  ]);
  if (contactLines.length > 0) sections.push({ heading: 'Kontakt', lines: contactLines });

  const summary = objectString(value, 'summary');
  if (summary) sections.push({ heading: 'Profil', lines: [summary] });

  if (Array.isArray(value.experience)) {
    for (const experience of value.experience) {
      if (!isRecord(experience)) continue;

      const role = objectString(experience, 'role');
      const company = objectString(experience, 'company');
      const heading = compact([role, company]).join(' @ ') || 'Erfahrung';
      const timeframe = compact([objectString(experience, 'start'), objectString(experience, 'end')]).join(' - ');
      const lines = [...(timeframe ? [timeframe] : []), ...linesFromBullets(experience.bullets)];
      if (lines.length > 0) sections.push({ heading, lines });
    }
  }

  if (Array.isArray(value.education)) {
    const lines = value.education
      .map(educationLine)
      .filter((line): line is string => line !== null);
    if (lines.length > 0) sections.push({ heading: 'Ausbildung', lines });
  }

  const skills = linesFromUnknown(value.skills);
  if (skills.length > 0) sections.push({ heading: 'Skills', lines: [skills.join(', ')] });

  if (Array.isArray(value.languages)) {
    const lines = value.languages
      .map(languageLine)
      .filter((line): line is string => line !== null);
    if (lines.length > 0) sections.push({ heading: 'Sprachen', lines });
  }

  const certifications = linesFromUnknown(value.certifications);
  if (certifications.length > 0) sections.push({ heading: 'Zertifikate', lines: certifications });

  return sections;
}

function textToSections(text: string): PdfSection[] {
  return text
    .split(/\n{2,}/)
    .map(block => block.split('\n').map(line => line.trim()).filter(Boolean))
    .filter(lines => lines.length > 0)
    .map(([heading = 'Lebenslauf', ...lines]) => ({
      heading,
      lines: lines.length > 0 ? lines : [heading],
    }));
}

function educationLine(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const degree = objectString(value, 'degree');
  const field = objectString(value, 'field');
  const institution = objectString(value, 'institution');
  const end = objectString(value, 'end');
  const subject = compact([degree, field]).join(' ');
  const main = compact([subject, institution]).join(' - ');
  return compact([main, end ? `bis ${end}` : null]).join(' ') || null;
}

function languageLine(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const name = objectString(value, 'name');
  const level = objectString(value, 'level');
  return compact([name, level]).join(' - ') || null;
}

function linesFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

function linesFromBullets(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === 'string') return item;
      if (isRecord(item)) return objectString(item, 'text');
      return null;
    })
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.trim());
}

function objectString(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  const raw = value[key];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

function fallbackLine(value: unknown): string {
  if (value === null || value === undefined) return 'Keine Lebenslaufdaten verfügbar.';
  if (typeof value === 'string') return value.trim() || 'Keine Lebenslaufdaten verfügbar.';
  return JSON.stringify(value);
}

function compact(values: Array<string | null | undefined>): string[] {
  return values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
