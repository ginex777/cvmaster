import { Injectable } from '@nestjs/common';
import archiver from 'archiver';
import { ClassicRenderer } from './renderers/classic.renderer';
import { ClassicLetterRenderer } from './renderers/classic-letter.renderer';
import { ExecutiveRenderer } from './renderers/executive.renderer';
import { EditorialRenderer } from './renderers/editorial.renderer';
import { EditorialLetterRenderer } from './renderers/editorial-letter.renderer';
import { MinimalRenderer } from './renderers/minimal.renderer';
import { ModernRenderer } from './renderers/modern.renderer';
import { ModernLetterRenderer } from './renderers/modern-letter.renderer';
import type { CvLayout, CvPdfData, CvRenderer, LetterRenderer } from './renderers/renderer.interface';
export type { CvLayout, CvPdfData } from './renderers/renderer.interface';

@Injectable()
export class PdfService {
  async generateCvPdf(data: CvPdfData, template: CvLayout = 'modern'): Promise<Buffer> {
    return Buffer.from(await this.getRenderer(template).render(data));
  }

  async generateLetterPdf(text: string, recipientName: string, template: CvLayout = 'modern'): Promise<Buffer> {
    return Buffer.from(await this.getLetterRenderer(template).render({
      title: recipientName || 'Anschreiben',
      text,
    }));
  }

  async generateZip(files: Array<{ filename: string; buffer: Buffer }>): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    for (const file of files) {
      archive.append(file.buffer, { name: file.filename });
    }

    await archive.finalize();
    return Buffer.concat(chunks);
  }

  async render(parsedCv: Record<string, unknown>, _layout: CvLayout): Promise<Buffer> {
    return this.generateCvPdf(this.recordToPdfData(parsedCv), _layout);
  }

  async renderZip(parsedCv: Record<string, unknown>, layout: CvLayout): Promise<Buffer> {
    return this.render(parsedCv, layout);
  }

  private getRenderer(template: CvLayout): CvRenderer {
    switch (template) {
      case 'classic':
        return new ClassicRenderer();
      case 'editorial':
        return new EditorialRenderer();
      case 'minimal':
        return new MinimalRenderer();
      case 'executive':
        return new ExecutiveRenderer();
      case 'modern':
      default:
        return new ModernRenderer();
    }
  }

  private getLetterRenderer(template: CvLayout): LetterRenderer {
    switch (template) {
      case 'classic':
        return new ClassicLetterRenderer();
      case 'editorial':
        return new EditorialLetterRenderer();
      case 'minimal':
      case 'executive':
        return new ModernLetterRenderer();
      case 'modern':
      default:
        return new ModernLetterRenderer();
    }
  }

  private recordToPdfData(parsedCv: Record<string, unknown>): CvPdfData {
    const name = typeof parsedCv['name'] === 'string' ? parsedCv['name'] : 'Lebenslauf';
    const sections = Array.isArray(parsedCv['sections'])
      ? parsedCv['sections'].filter(this.isSection)
      : [{ heading: 'Lebenslauf', lines: [JSON.stringify(parsedCv)] }];

    return { name, sections };
  }

  private isSection(value: unknown): value is { heading: string; lines: string[] } {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { heading?: unknown }).heading === 'string' &&
      Array.isArray((value as { lines?: unknown }).lines)
    );
  }
}
