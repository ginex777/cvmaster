import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { LetterPdfData, LetterRenderer } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const HEADER_HEIGHT = 92;
const MARGIN = 56;
const LINE_HEIGHT = 16;
const DARK = rgb(0.06, 0.09, 0.18);
const WHITE = rgb(1, 1, 1);
const ACCENT = rgb(0.22, 0.35, 0.9);
const BODY = rgb(0.2, 0.22, 0.3);

export class EditorialLetterRenderer implements LetterRenderer {
  async render(data: LetterPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = this.addPage(pdfDoc, data.title, boldFont);
    let y = PAGE_HEIGHT - HEADER_HEIGHT - 34;

    for (const paragraph of data.text.split(/\n{2,}/)) {
      for (const line of wrapText(paragraph, 82)) {
        if (y < 64) {
          page = this.addPage(pdfDoc, data.title, boldFont);
          y = PAGE_HEIGHT - HEADER_HEIGHT - 34;
        }

        page.drawText(sanitizeText(line), {
          x: MARGIN,
          y,
          font,
          size: 11,
          color: BODY,
        });
        y -= LINE_HEIGHT;
      }
      y -= LINE_HEIGHT;
    }

    return pdfDoc.save();
  }

  private addPage(pdfDoc: PDFDocument, title: string, boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>): PDFPage {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - HEADER_HEIGHT,
      width: PAGE_WIDTH,
      height: HEADER_HEIGHT,
      color: DARK,
    });
    page.drawText(sanitizeText(title || 'Anschreiben'), {
      x: MARGIN,
      y: PAGE_HEIGHT - 48,
      font: boldFont,
      size: 17,
      color: WHITE,
    });
    page.drawText('ANSCHREIBEN', {
      x: MARGIN,
      y: PAGE_HEIGHT - 68,
      font: boldFont,
      size: 8,
      color: ACCENT,
    });
    return page;
  }
}
