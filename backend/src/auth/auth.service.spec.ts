import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma.service';
import { MailService } from '../mail/mail.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  user: { create: fn(), findUnique: fn(), findUniqueOrThrow: fn(), update: fn() },
  emailVerification: { create: fn(), findUnique: fn(), delete: fn() },
  consent: { create: fn() },
  session: {
    create: fn(),
    findMany: fn(),
    findUnique: fn(),
    update: fn(),
    updateMany: fn(),
  },
};

const mockMail = { sendVerification: fn() };
const mockJwt = { signAsync: fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates user and stores email verification token in DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.de', name: 'A', plan: 'FREE' });
      mockPrisma.consent.create.mockResolvedValue({});
      mockPrisma.emailVerification.create.mockResolvedValue({});
      mockMail.sendVerification.mockResolvedValue(undefined);

      await service.register(
        { email: 'a@b.de', password: 'securepass123', name: 'A', art9Consent: true },
        '127.0.0.1',
      );

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'a@b.de' }) }),
      );
      expect(mockPrisma.emailVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u1' }) }),
      );
    });

    it('throws ConflictException when email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(
        service.register(
          { email: 'a@b.de', password: 'securepass123', name: 'A', art9Consent: true },
          '127.0.0.1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('creates EmailVerification record with ~24h expiry', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.de', name: 'A', plan: 'FREE' });
      mockPrisma.consent.create.mockResolvedValue({});
      mockPrisma.emailVerification.create.mockResolvedValue({});
      mockMail.sendVerification.mockResolvedValue(undefined);

      await service.register(
        { email: 'a@b.de', password: 'securepass123', name: 'A', art9Consent: true },
        '127.0.0.1',
      );

      const calls = mockPrisma.emailVerification.create.mock.calls as unknown as Array<[{ data: { expiresAt: Date } }]>;
      const call = calls[0][0];
      const diffHours = (call.data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThan(25);
    });

    it('sends verification email after creating user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.de', name: 'A', plan: 'FREE' });
      mockPrisma.consent.create.mockResolvedValue({});
      mockPrisma.emailVerification.create.mockResolvedValue({});
      mockMail.sendVerification.mockResolvedValue(undefined);

      await service.register(
        { email: 'a@b.de', password: 'securepass123', name: 'A', art9Consent: true },
        '127.0.0.1',
      );

      expect(mockMail.sendVerification).toHaveBeenCalledWith('a@b.de', expect.any(String));
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'x@y.de', password: 'pass' }, '127.0.0.1', 'ua'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const passwordHash = await argon2.hash('correct');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash, emailVerifiedAt: new Date() } as never);

      await expect(service.login({ email: 'x@y.de', password: 'wrong' }, '127.0.0.1', 'ua'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email not verified', async () => {
      const passwordHash = await argon2.hash('pass');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash, emailVerifiedAt: null } as never);

      await expect(service.login({ email: 'x@y.de', password: 'pass' }, '127.0.0.1', 'ua'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('returns accessToken and user on valid credentials', async () => {
      const passwordHash = await argon2.hash('validpass123');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.de', passwordHash, emailVerifiedAt: new Date(),
        plan: 'FREE', twoFactorEnabled: false,
      } as never);
      mockPrisma.session.findMany.mockResolvedValue([]);
      mockPrisma.session.create.mockResolvedValue({});
      mockJwt.signAsync.mockResolvedValue('access-token-value');

      const result = await service.login({ email: 'a@b.de', password: 'validpass123' }, '127.0.0.1', 'ua') as { accessToken: string; user: { id: string } };

      expect(result).toHaveProperty('accessToken');
      expect(result.user).toHaveProperty('id', 'u1');
    });
  });

  describe('verifyEmail', () => {
    it('marks the user as verified and removes the verification token', async () => {
      mockPrisma.emailVerification.findUnique.mockResolvedValue({
        id: 'ev1',
        userId: 'u1',
        token: 'token',
        expiresAt: new Date(Date.now() + 60_000),
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.emailVerification.delete.mockResolvedValue({});

      await service.verifyEmail('token');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
        }),
      );
      expect(mockPrisma.emailVerification.delete).toHaveBeenCalledWith({ where: { id: 'ev1' } });
    });
  });

  describe('logout', () => {
    it('does nothing when refresh token is missing', async () => {
      await service.logout('');
      expect(mockPrisma.session.updateMany).not.toHaveBeenCalled();
    });

    it('revokes the matching session', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('sometoken');

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ revokedAt: expect.any(Date) }) }),
      );
    });
  });
});
