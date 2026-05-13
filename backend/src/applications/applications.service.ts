import { BadGatewayException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

export interface CvBullet {
  id: string;
  text: string;
  originalText?: string;
  accepted?: boolean;
}

export interface CvSection {
  id: string;
  heading: string;
  bullets: CvBullet[];
}

export interface FollowUpTemplate {
  type: 'reminder' | 'status' | 'thanks';
  label: string;
  subject: string;
  body: string;
}
import { AppStatus, Prisma } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../common/prisma.service';
import { QueueService } from '../queue/queue.service';
import { MailService } from '../mail/mail.service';
import { CvLayout, CvPdfData, PdfService } from '../pdf/pdf.service';
import { PlanPolicyService } from '../common/plan-policy.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private mail: MailService,
    private pdf: PdfService,
    private planPolicy: PlanPolicyService,
  ) {}

  async create(data: { masterCvId: string; jobPostingId: string }, userId: string) {
    const [cv, jobPosting, user] = await Promise.all([
      this.prisma.masterCv.findFirst({ where: { id: data.masterCvId, userId } }),
      this.prisma.jobPosting.findFirst({ where: { id: data.jobPostingId, userId } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);
    if (!cv) throw new NotFoundException('Master-CV nicht gefunden');
    if (!jobPosting) throw new NotFoundException('Stellenanzeige nicht gefunden');

    await this.planPolicy.assertCanCreateApplication(userId, user.plan);

    const app = await this.prisma.application.create({
      data: {
        userId,
        masterCvId: data.masterCvId,
        jobPostingId: data.jobPostingId,
        status: 'DRAFT',
        generationProgress: 0,
        generationError: null,
      },
    });
    await this.queue.enqueueAiPipeline(app.id);
    return app;
  }

  async findById(id: string) {
    return this.prisma.application.findUniqueOrThrow({
      where: { id },
      include: { masterCv: true, jobPosting: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        matchScore: true,
        generationProgress: true,
        generationError: true,
        createdAt: true,
        jobPosting: { select: { parsedJson: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { masterCv: true, jobPosting: true },
    });
    if (!app) throw new NotFoundException('Bewerbung nicht gefunden');
    if (app.userId !== userId) throw new ForbiddenException('Kein Zugriff auf diese Bewerbung');
    return app;
  }

  async update(id: string, userId: string, data: Prisma.ApplicationUpdateInput) {
    await this.findOne(id, userId);
    return this.prisma.application.update({
      where: { id },
      data,
      include: { masterCv: true, jobPosting: true },
    });
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.findOne(id, userId);
    await this.prisma.application.delete({ where: { id } });
    return { message: 'Bewerbung gelÃ¶scht' };
  }

  async streamProgress(id: string, res: Response) {
    const app = await this.prisma.application.findUniqueOrThrow({
      where: { id },
      select: { status: true, generationProgress: true, generationError: true },
    });
    res.write(`data: ${JSON.stringify({
      status: app.status,
      progress: app.generationProgress,
      error: app.generationError,
    })}\n\n`);
    res.end();
  }

  async regenerateLetter(id: string, _userId: string) {
    await this.queue.enqueueRegenerateLetter(id);
    return { message: 'Letter regeneration queued' };
  }

  async retryGeneration(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.application.update({
      where: { id },
      data: { status: 'DRAFT', generationProgress: 0, generationError: null },
    });
    await this.queue.enqueueAiPipeline(id);
    return { message: 'Generation queued' };
  }

  async exportPdf(id: string, layout: string, res: Response) {
    const app = await this.findById(id);
    const title = this.fileTitle(app);
    const template = this.asLayout(app.masterCv?.template ?? layout);
    const buffer = await this.pdf.generateCvPdf(this.toPdfData(app.optimizedCv, title), template);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${this.safeFilename(title)}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  async emailToSelf(id: string, userId: string) {
    const app = await this.findOne(id, userId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const title = this.fileTitle(app);
    const safeTitle = this.safeFilename(title);
    const template = this.asLayout(app.masterCv?.template);
    const [cv, letter] = await Promise.all([
      this.pdf.generateCvPdf(this.toPdfData(app.optimizedCv, title), template),
      this.pdf.generateLetterPdf(this.selectedLetterText(app.coverLetter, app.chosenVariant), title, template),
    ]);
    try {
      await this.mail.sendApplicationToSelf(user.email, app, [
        { filename: `${safeTitle}.pdf`, content: cv, contentType: 'application/pdf' },
        { filename: `${safeTitle}_Anschreiben.pdf`, content: letter, contentType: 'application/pdf' },
      ]);
      await this.recordEmailAudit(userId, id, 'sent');
    } catch {
      await this.recordEmailAudit(userId, id, 'failed');
      throw new BadGatewayException('E-Mail konnte nicht zugestellt werden. Bitte lade die PDFs herunter und versuche es erneut.');
    }
    return { message: 'Email sent' };
  }

  async updateStatus(id: string, status: AppStatus) {
    return this.prisma.application.update({ where: { id }, data: { status } });
  }

  async updateReminder(id: string, userId: string, reminderAt: Date | null) {
    await this.findOne(id, userId);
    return this.prisma.application.update({
      where: { id },
      data: { reminderAt, reminderSentAt: reminderAt === null ? null : undefined },
    });
  }

  async updateStructuredCv(id: string, userId: string, sections: CvSection[]) {
    await this.findOne(id, userId);
    return this.prisma.application.update({
      where: { id },
      data: { optimizedCv: { sections } as unknown as Prisma.InputJsonValue },
    });
  }

  async getFollowUpTemplates(id: string, userId: string): Promise<FollowUpTemplate[]> {
    const app = await this.findOne(id, userId);
    const parsed = app.jobPosting?.parsedJson;
    const title = this.hasJobTitle(parsed) ? parsed.title : 'die ausgeschriebene Stelle';
    const company = this.hasJobTitle(parsed) ? parsed.company : 'Ihr Unternehmen';

    return [
      {
        type: 'reminder',
        label: 'Erinnerung',
        subject: `Nachfrage zu meiner Bewerbung – ${title}`,
        body: `Sehr geehrte Damen und Herren,\n\nvor einigen Tagen habe ich mich für die Position „${title}" bei ${company} beworben. Gerne möchte ich mein Interesse an der Stelle nochmals bekräftigen und fragen, ob meine Unterlagen vollständig vorliegen.\n\nFür Rückfragen stehe ich jederzeit zur Verfügung.\n\nMit freundlichen Grüßen`,
      },
      {
        type: 'status',
        label: 'Status-Anfrage',
        subject: `Statusanfrage zu meiner Bewerbung – ${title}`,
        body: `Sehr geehrte Damen und Herren,\n\nich beziehe mich auf meine Bewerbung für die Stelle „${title}" bei ${company}. Da mir die Position sehr am Herzen liegt, würde ich mich freuen zu erfahren, ob Sie bereits eine Vorauswahl getroffen haben und wann ich mit einer Rückmeldung rechnen darf.\n\nVielen Dank für Ihre Zeit.\n\nMit freundlichen Grüßen`,
      },
      {
        type: 'thanks',
        label: 'Dankesnachricht',
        subject: `Vielen Dank für das Gespräch – ${title}`,
        body: `Sehr geehrte Damen und Herren,\n\nvielen Dank für das angenehme Gespräch über die Position „${title}" bei ${company}. Die Unterhaltung hat mein Interesse an der Stelle und Ihrem Unternehmen noch weiter bestärkt.\n\nIch freue mich auf die nächsten Schritte.\n\nMit freundlichen Grüßen`,
      },
    ];
  }

  private asLayout(value: string | null | undefined): CvLayout {
    return value === 'classic' || value === 'editorial' || value === 'modern' ? value : 'modern';
  }

  private async recordEmailAudit(userId: string, applicationId: string, state: 'sent' | 'failed'): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        event: 'application.email_to_self',
        payload: { applicationId, state },
      },
    });
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

  private selectedLetterText(value: unknown, chosenVariant?: string | null): string {
    const letters = this.hasLetters(value) ? value : {};
    const variant = chosenVariant ?? 'formal';

    if (variant === 'brief' && typeof letters.concise === 'string') return letters.concise;
    if (variant === 'concise' && typeof letters.concise === 'string') return letters.concise;
    if (variant === 'warm' && typeof letters.warm === 'string') return letters.warm;
    if (variant === 'formal' && typeof letters.formal === 'string') return letters.formal;

    return letters.formal ?? letters.warm ?? letters.brief ?? letters.concise ?? '';
  }

  private hasLetters(value: unknown): value is { formal?: string; warm?: string; brief?: string; concise?: string } {
    return typeof value === 'object' && value !== null;
  }
}
