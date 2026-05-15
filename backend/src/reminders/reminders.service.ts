import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDueReminders(): Promise<void> {
    const now = new Date();
    const due = await this.prisma.application.findMany({
      where: {
        reminderAt: { lte: now },
        reminderSentAt: null,
        user: { deletedAt: null },
      },
      include: {
        user: { select: { email: true } },
        jobPosting: { select: { parsedJson: true } },
      },
    });

    this.logger.log(`Processing ${due.length} due reminders`);

    for (const app of due) {
      try {
        const parsed = app.jobPosting?.parsedJson;
        const hasTitle = this.hasJobTitle(parsed);
        const title = hasTitle ? parsed.title : 'Ihre Bewerbung';
        const company = hasTitle ? parsed.company : '';

        await this.mail.sendReminderNotification(app.user.email, { id: app.id, title, company });
        await this.prisma.application.update({
          where: { id: app.id },
          data: { reminderSentAt: now },
        });
      } catch (err: unknown) {
        this.logger.error(`Failed to send reminder for application ${app.id}: ${String(err)}`);
      }
    }
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
