import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { MailService } from '../mail/mail.service';

const ARGON2_OPTIONS = { memoryCost: 65536, timeCost: 3, parallelism: 4 };
const MAX_SESSIONS = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  async register(data: { email: string; password: string; name: string; art9Consent: true }, ip: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(data.password, ARGON2_OPTIONS);
    const user = await this.prisma.user.create({
      data: { email: data.email, passwordHash, name: data.name },
    });

    await this.prisma.consent.create({
      data: { userId: user.id, type: 'art9_processing', granted: true, version: '1.0', ipHash: this.hashIp(ip) },
    });

    const verifyToken = randomBytes(32).toString('hex');
    // TODO: store verifyToken in Redis with 24h TTL, then send mail
    await this.mail.sendVerification(user.email, verifyToken);

    return { message: 'Registration successful. Please verify your email.' };
  }

  async login(data: { email: string; password: string; totp?: string }, ip: string, ua: string) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await argon2.verify(user.passwordHash, data.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerifiedAt) throw new UnauthorizedException('Email not verified');

    // TODO: TOTP check if user.twoFactorEnabled

    return this.issueTokens(user, ip, ua);
  }

  async refresh(refreshToken: string, ip: string, ua: string) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.prisma.session.findUnique({ where: { refreshHash: tokenHash } });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      // Reuse detection: revoke all sessions for the user if token was already used
      if (session) {
        await this.prisma.session.updateMany({
          where: { userId: session.userId },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    return this.issueTokens(user, ip, ua);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.session.updateMany({ where: { refreshHash: tokenHash }, data: { revokedAt: new Date() } });
  }

  private async issueTokens(user: { id: string; plan: string; emailVerifiedAt: Date | null; twoFactorEnabled: boolean }, ip: string, ua: string) {
    // Enforce max sessions
    const sessions = await this.prisma.session.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    });
    if (sessions.length >= MAX_SESSIONS) {
      await this.prisma.session.update({ where: { id: sessions[0].id }, data: { revokedAt: new Date() } });
    }

    const rawRefresh = randomBytes(32).toString('hex');
    const refreshHash = createHash('sha256').update(rawRefresh).digest('hex');
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash,
        userAgent: ua,
        ipHash: this.hashIp(ip),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const payload = { sub: user.id, plan: user.plan, ev: !!user.emailVerifiedAt, tfa: user.twoFactorEnabled };
    // @ts-expect-error EdDSA is supported by jsonwebtoken at runtime but missing from the installed type union.
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      algorithm: 'EdDSA',
      privateKey: process.env.JWT_PRIVATE_KEY,
    });

    return { accessToken, refreshToken: rawRefresh, user: { id: user.id, plan: user.plan } };
  }

  private hashIp(ip: string) {
    return createHash('sha256').update(ip + process.env.IP_SALT).digest('hex');
  }
}
