import { Controller, Post, Get, Patch, Param, Body, Req, Res, UseGuards, Delete } from '@nestjs/common';
import { AppStatus, Prisma } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnsApplicationGuard } from '../common/guards/owns-application.guard';
import { AuthenticatedRequest } from '../common/request.types';
import { CvLayout, CvPdfData, PdfService } from '../pdf/pdf.service';
import { ApplicationsService } from './applications.service';
import type { CvSection } from './applications.service';

const createSchema = z.object({
  masterCvId:   z.string().uuid(),
  jobPostingId: z.string().uuid(),
});

const exportSchema = z.object({
  layout: z.enum(['classic', 'modern', 'editorial', 'minimal', 'executive']),
});

const toneSchema = z.object({
  tone: z.enum(['formal', 'modern', 'creative']),
});

const statusSchema = z.preprocess(
  value => typeof value === 'string' ? value.toUpperCase() : value,
  z.nativeEnum(AppStatus),
);

const updateSchema = z.object({
  optimizedCv: z.unknown().optional(),
  coverLetter: z.unknown().optional(),
  chosenVariant: z.string().optional(),
  chosenLayout: z.string().optional(),
});

const cvBulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  originalText: z.string().optional(),
  accepted: z.boolean().optional(),
});

const cvSectionsSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    heading: z.string(),
    bullets: z.array(cvBulletSchema),
  })),
});

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(
    private apps: ApplicationsService,
    private pdf: PdfService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  create(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const data = createSchema.parse(body);
    return this.apps.create(data, req.user.sub);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.apps.findAll(req.user.sub);
  }

  @Get(':id/export/cv')
  async exportCv(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const app = await this.apps.findOne(id, req.user.sub);
    const title = this.fileTitle(app);
    const buffer = await this.pdf.generateCvPdf(this.toPdfData(app.optimizedCv, title), this.cvTemplate(app));
    this.sendPdf(res, buffer, `${this.safeFilename(title)}.pdf`);
  }

  @Get(':id/export/letter')
  async exportLetter(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const app = await this.apps.findOne(id, req.user.sub);
    const title = this.fileTitle(app);
    const buffer = await this.pdf.generateLetterPdf(this.selectedLetterText(app.coverLetter, app.chosenVariant, app.coverLetterTone), title, this.cvTemplate(app));
    this.sendPdf(res, buffer, `${this.safeFilename(title)}_Anschreiben.pdf`);
  }

  @Get(':id/export/bundle')
  async exportBundle(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const app = await this.apps.findOne(id, req.user.sub);
    const title = this.fileTitle(app);
    const safeTitle = this.safeFilename(title);
    const cv = await this.pdf.generateCvPdf(this.toPdfData(app.optimizedCv, title), this.cvTemplate(app));
    const letter = await this.pdf.generateLetterPdf(this.selectedLetterText(app.coverLetter, app.chosenVariant, app.coverLetterTone), title, this.cvTemplate(app));
    const buffer = await this.pdf.generateZip([
      { filename: `${safeTitle}.pdf`, buffer: cv },
      { filename: `${safeTitle}_Anschreiben.pdf`, buffer: letter },
    ]);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeTitle}_Bewerbung.zip"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.findOne(id, req.user.sub);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const app = await this.apps.findOne(id, req.user.sub);
    const title = this.fileTitle(app);
    const buffer = await this.pdf.generateCvPdf(this.toPdfData(app.optimizedCv, title), this.cvTemplate(app));

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${this.safeFilename(title)}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const data = updateSchema.parse(body) as Prisma.ApplicationUpdateInput;
    return this.apps.update(id, req.user.sub, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.remove(id, req.user.sub);
  }

  @Get(':id/stream')
  @UseGuards(OwnsApplicationGuard)
  stream(@Param('id') id: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    return this.apps.streamProgress(id, res);
  }

  @Post(':id/regenerate-letter')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @UseGuards(OwnsApplicationGuard)
  regenerateLetter(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.regenerateLetter(id, req.user.sub);
  }

  @Post(':id/retry-generation')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @UseGuards(OwnsApplicationGuard)
  retryGeneration(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.retryGeneration(id, req.user.sub);
  }

  @Post(':id/export')
  @UseGuards(OwnsApplicationGuard)
  export(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const { layout } = exportSchema.parse(body);
    return this.apps.exportPdf(id, layout, res);
  }

  @Post(':id/email-to-self')
  @UseGuards(OwnsApplicationGuard)
  emailToSelf(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.emailToSelf(id, req.user.sub);
  }

  @Patch(':id/status')
  @UseGuards(OwnsApplicationGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: unknown) {
    const parsedStatus = statusSchema.parse(status);
    return this.apps.updateStatus(id, parsedStatus);
  }

  @Patch(':id/cv')
  @UseGuards(OwnsApplicationGuard)
  updateCv(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const { sections } = cvSectionsSchema.parse(body) as { sections: CvSection[] };
    return this.apps.updateStructuredCv(id, req.user.sub, sections);
  }

  @Patch(':id/reminder')
  @UseGuards(OwnsApplicationGuard)
  updateReminder(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const schema = z.object({ reminderAt: z.string().datetime().nullable() });
    const { reminderAt } = schema.parse(body);
    return this.apps.updateReminder(id, req.user.sub, reminderAt ? new Date(reminderAt) : null);
  }

  @Patch(':id/tone')
  @UseGuards(OwnsApplicationGuard)
  updateTone(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const { tone } = toneSchema.parse(body);
    return this.apps.updateTone(id, req.user.sub, tone);
  }

  @Get(':id/follow-up-templates')
  @UseGuards(OwnsApplicationGuard)
  getFollowUpTemplates(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.getFollowUpTemplates(id, req.user.sub);
  }

  private toPdfData(value: unknown, fallbackName: string): CvPdfData {
    if (this.hasPdfSections(value)) {
      return {
        name: typeof value.name === 'string' ? value.name : fallbackName,
        sections: value.sections,
      };
    }

    if (this.hasEditorText(value)) {
      return { name: fallbackName, sections: this.textToSections(value.text) };
    }

    if (this.hasExperience(value)) {
      return {
        name: fallbackName,
        sections: value.experience.map(section => ({
          heading: `${section.role} @ ${section.company}`,
          lines: section.bullets.map(bullet => bullet.text),
        })),
      };
    }

    return {
      name: fallbackName,
      sections: [{ heading: 'Lebenslauf', lines: [typeof value === 'string' ? value : JSON.stringify(value ?? {})] }],
    };
  }

  private textToSections(text: string): CvPdfData['sections'] {
    return text
      .split(/\n{2,}/)
      .map(block => block.split('\n').map(line => line.trim()).filter(Boolean))
      .filter(lines => lines.length > 0)
      .map(([heading, ...lines]) => ({ heading, lines }));
  }

  private fileTitle(app: { jobPosting?: { parsedJson?: unknown } }): string {
    const parsed = app.jobPosting?.parsedJson;
    if (this.hasJobTitle(parsed)) return `Lebenslauf_${parsed.company}_${parsed.title}`;
    return 'Lebenslauf';
  }

  private safeFilename(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'Lebenslauf';
  }

  private sendPdf(res: Response, buffer: Buffer, filename: string): void {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  private cvTemplate(app: { masterCv?: { template?: string | null } }): CvLayout {
    const template = app.masterCv?.template;
    return template === 'classic' || template === 'editorial' || template === 'modern' || template === 'minimal' || template === 'executive'
      ? template
      : 'modern';
  }

  private selectedLetterText(value: unknown, chosenVariant?: string | null, coverLetterTone?: string | null): string {
    const letters = this.hasLetters(value) ? value : {};
    const variant = chosenVariant ?? this.variantForTone(coverLetterTone);

    if (variant === 'brief' && typeof letters.concise === 'string') return letters.concise;
    if (variant === 'concise' && typeof letters.concise === 'string') return letters.concise;
    if (variant === 'warm' && typeof letters.warm === 'string') return letters.warm;
    if (variant === 'formal' && typeof letters.formal === 'string') return letters.formal;

    return letters.formal ?? letters.warm ?? letters.brief ?? letters.concise ?? '';
  }

  private hasLetters(value: unknown): value is { formal?: string; warm?: string; brief?: string; concise?: string } {
    return typeof value === 'object' && value !== null;
  }

  private variantForTone(tone: string | null | undefined): 'formal' | 'warm' | 'concise' {
    if (tone === 'modern') return 'warm';
    if (tone === 'creative') return 'concise';
    return 'formal';
  }

  private hasPdfSections(value: unknown): value is CvPdfData {
    return typeof value === 'object' && value !== null && Array.isArray((value as { sections?: unknown }).sections);
  }

  private hasEditorText(value: unknown): value is { text: string } {
    return typeof value === 'object' && value !== null && typeof (value as { text?: unknown }).text === 'string';
  }

  private hasExperience(value: unknown): value is {
    experience: Array<{ company: string; role: string; bullets: Array<{ text: string }> }>;
  } {
    return typeof value === 'object' && value !== null && Array.isArray((value as { experience?: unknown }).experience);
  }

  private hasJobTitle(value: unknown): value is { title: string; company: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { title?: unknown }).title === 'string' &&
      typeof (value as { company?: unknown }).company === 'string'
    );
  }
}
