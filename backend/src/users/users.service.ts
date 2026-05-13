import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma.service';
import { verifyTotp, generateTotpSecret } from '../auth/totp';

const ARGON2_OPTIONS = { memoryCost: 65536, timeCost: 3, parallelism: 4 };

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, locale: true, plan: true, emailVerifiedAt: true, twoFactorEnabled: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: { name?: string; locale?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Account scheduled for deletion in 30 days' };
  }

  async getDashboard(userId: string) {
    const [user, cvCount, applicationCount, recentApplications, averageMatchScore] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { onboardingDismissedAt: true } }),
      this.prisma.masterCv.count({ where: { userId } }),
      this.prisma.application.count({ where: { userId } }),
      this.prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          matchScore: true,
          createdAt: true,
          jobPosting: { select: { parsedJson: true } },
        },
      }),
      this.prisma.application.aggregate({
        where: { userId, matchScore: { not: null } },
        _avg: { matchScore: true },
      }),
    ]);
    return {
      onboardingDismissed: user?.onboardingDismissedAt !== null && user?.onboardingDismissedAt !== undefined,
      cvCount,
      applicationCount,
      avgMatchScore:
        averageMatchScore._avg.matchScore !== null
          ? Math.round(averageMatchScore._avg.matchScore)
          : null,
      recentApplications,
    };
  }

  async dismissOnboarding(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingDismissedAt: new Date() },
    });
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, createdAt: true, expiresAt: true },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await argon2.verify(user.passwordHash, currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const passwordHash = await argon2.hash(newPassword, ARGON2_OPTIONS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async setupTotp(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });
    if (user.twoFactorEnabled) throw new BadRequestException('Two-factor authentication is already enabled');

    const secret = generateTotpSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });

    const uri = `otpauth://totp/${encodeURIComponent(`Lebenslauf-Agent:${user.email}`)}?secret=${secret}&issuer=Lebenslauf-Agent&algorithm=SHA1&digits=6&period=30`;
    return { secret, uri };
  }

  async enableTotp(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (user.twoFactorEnabled) throw new BadRequestException('2FA is already enabled');
    if (!verifyTotp(code, user.twoFactorSecret)) throw new BadRequestException('Invalid verification code');
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  }

  async disableTotp(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled) throw new BadRequestException('2FA is not enabled');
    if (!(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Incorrect password');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  }
}
