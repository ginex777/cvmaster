import type { PDFDocument, PDFPage } from 'pdf-lib';

export function sanitizeText(value: string): string {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '-')
    .slice(0, 1000);
}

export function wrapText(value: string, maxLength: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export function addPageIfNeeded(
  pdfDoc: PDFDocument,
  page: PDFPage,
  y: number,
  threshold: number,
  resetY = 800,
): { page: PDFPage; y: number } {
  if (y < threshold) {
    return { page: pdfDoc.addPage([595, 842]), y: resetY };
  }

  return { page, y };
}
