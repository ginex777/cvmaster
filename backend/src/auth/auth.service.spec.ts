import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma.service';
import { MailService } from '../mail/mail.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  user: { create: fn(), findUnique: fn(), findUniqueOrThrow: fn() },
  emailVerification: { create: fn() },
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
});
