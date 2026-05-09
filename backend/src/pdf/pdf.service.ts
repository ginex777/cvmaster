import { Injectable } from '@nestjs/common';

export type CvLayout = 'modern' | 'clean' | 'editorial';

@Injectable()
export class PdfService {
  /**
   * Renders a CV to PDF using Puppeteer.
   * Returns raw PDF buffer — never persisted to disk (SPEC § 3).
   */
  async render(parsedCv: Record<string, unknown>, layout: CvLayout): Promise<Buffer> {
    // TODO: launch Puppeteer, render Angular SSR template for `layout`,
    // inject parsedCv data, generate PDF, return buffer
    throw new Error(`PDF rendering for layout "${layout}" not yet implemented`);
  }

  /**
   * Produces a ZIP containing the chosen layout PDF + ATS-safe Clean PDF.
   */
  async renderZip(parsedCv: Record<string, unknown>, layout: CvLayout): Promise<Buffer> {
    const [chosen, ats] = await Promise.all([
      this.render(parsedCv, layout),
      this.render(parsedCv, 'clean'),
    ]);
    // TODO: zip using archiver
    void chosen; void ats;
    throw new Error('ZIP bundling not yet implemented');
  }
}
