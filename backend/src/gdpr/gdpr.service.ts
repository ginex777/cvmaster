import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class GdprService {
  constructor(private prisma: PrismaService) {}

  async exportUserData(userId: string): Promise<Buffer> {
    const [user, cvs, applications, consents] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.masterCv.findMany({ where: { userId } }),
      this.prisma.application.findMany({ where: { userId } }),
      this.prisma.consent.findMany({ where: { userId } }),
    ]);

    const json = JSON.stringify({ user, cvs, applications, consents }, null, 2);
    // TODO: create real ZIP with archiver, include freshly rendered PDFs
    return Buffer.from(json, 'utf8');
  }

  /** Soft-deleted users get hard-deleted after 30 days (SPEC § 14) */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeDeletedUsers() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await this.prisma.user.deleteMany({
      where: { deletedAt: { lte: cutoff } },
    });
  }

  /** AI job prompts/responses deleted after 30 days (SPEC § 25.2) */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async purgeOldAiJobs() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await this.prisma.aiJob.deleteMany({ where: { createdAt: { lte: cutoff } } });
  }
}
