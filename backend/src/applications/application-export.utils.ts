export function applicationFileTitle(app: { jobPosting?: { parsedJson?: unknown } }): string {
  const parsed = app.jobPosting?.parsedJson;
  if (hasJobTitle(parsed)) return `Lebenslauf_${parsed.company}_${parsed.title}`;
  return 'Lebenslauf';
}

export function safeApplicationFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'Lebenslauf';
}

export function selectedLetterText(value: unknown, chosenVariant?: string | null, coverLetterTone?: string | null): string {
  const letters = hasLetters(value) ? value : {};
  const variant = chosenVariant ?? variantForTone(coverLetterTone);

  if (variant === 'brief' && typeof letters.concise === 'string') return letters.concise;
  if (variant === 'concise' && typeof letters.concise === 'string') return letters.concise;
  if (variant === 'warm' && typeof letters.warm === 'string') return letters.warm;
  if (variant === 'formal' && typeof letters.formal === 'string') return letters.formal;

  return letters.formal ?? letters.warm ?? letters.brief ?? letters.concise ?? '';
}

export function hasJobTitle(value: unknown): value is { title: string; company: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { title?: unknown }).title === 'string' &&
    typeof (value as { company?: unknown }).company === 'string'
  );
}

function hasLetters(value: unknown): value is { formal?: string; warm?: string; brief?: string; concise?: string } {
  return typeof value === 'object' && value !== null;
}

export function variantForTone(tone: string | null | undefined): 'formal' | 'warm' | 'concise' {
  if (tone === 'modern') return 'warm';
  if (tone === 'creative') return 'concise';
  return 'formal';
}
