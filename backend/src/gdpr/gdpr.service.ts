import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class GdprService {
  constructor(private prisma: PrismaService) {}

  async exportData(userId: string) {
    const [user, masterCvs, applications, consents, aiJobs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          locale: true,
          plan: true,
          emailVerifiedAt: true,
          twoFactorEnabled: true,
          trialUsed: true,
          createdAt: true,
        },
      }),
      this.prisma.masterCv.findMany({ where: { userId } }),
      this.prisma.application.findMany({ where: { userId } }),
      this.prisma.consent.findMany({ where: { userId } }),
      this.prisma.aiJob.findMany({
        where: { userId },
        select: {
          id: true,
          applicationId: true,
          type: true,
          state: true,
          promptVersion: true,
          modelName: true,
          provider: true,
          error: true,
          createdAt: true,
          finishedAt: true,
          retentionUntil: true,
        },
      }),
    ]);

    return { user, masterCvs, applications, consents, aiJobs, exportedAt: new Date().toISOString() };
  }

  async deleteAccount(userId: string): Promise<void> {
    const deletedAt = new Date();
    await this.prisma.user.update({ where: { id: userId }, data: { deletedAt } });
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: deletedAt },
    });
  }

  async exportUserData(userId: string): Promise<Buffer> {
    return Buffer.from(JSON.stringify(await this.exportData(userId), null, 2), 'utf8');
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
    await this.prisma.aiJob.deleteMany({
      where: {
        OR: [
          { retentionUntil: { lte: new Date() } },
          { retentionUntil: null, createdAt: { lte: cutoff } },
        ],
      },
    });
  }
}
