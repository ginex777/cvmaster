import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppStatus, Prisma } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../common/prisma.service';
import { QueueService } from '../queue/queue.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private mail: MailService,
  ) {}

  async create(data: { masterCvId: string; jobPostingId: string }, userId: string) {
    const cv = await this.prisma.masterCv.findFirst({ where: { id: data.masterCvId, userId } });
    if (!cv) throw new NotFoundException('Master-CV nicht gefunden');

    const app = await this.prisma.application.create({
      data: { userId, masterCvId: data.masterCvId, jobPostingId: data.jobPostingId, status: 'DRAFT' },
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
    // TODO: subscribe to BullMQ job events and emit SSE progress
    res.write(`data: ${JSON.stringify({ status: 'pending' })}\n\n`);
    res.end();
  }

  async regenerateLetter(id: string, _userId: string) {
    await this.queue.enqueueRegenerateLetter(id);
    return { message: 'Letter regeneration queued' };
  }

  async exportPdf(id: string, layout: string, res: Response) {
    // TODO: call PdfService, stream ZIP response
    res.status(501).json({ message: 'PDF export not yet implemented' });
  }

  async emailToSelf(id: string, userId: string) {
    const app = await this.findOne(id, userId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    // TODO: render PDFs and attach to mail
    await this.mail.sendApplicationToSelf(user.email, app);
    return { message: 'Email sent' };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.application.update({ where: { id }, data: { status: status as AppStatus } });
  }
}
