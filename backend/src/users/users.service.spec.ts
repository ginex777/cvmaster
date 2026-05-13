import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';
import { PrismaService } from '../common/prisma.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  user: { findUnique: fn(), findUniqueOrThrow: fn(), update: fn() },
  masterCv: { count: fn() },
  application: { count: fn(), findMany: fn(), aggregate: fn() },
  session: { findMany: fn(), findUnique: fn(), update: fn() },
};

const mockDashboardUser = (onboardingDismissedAt: Date | null) =>
  mockPrisma.user.findUnique.mockResolvedValue({ onboardingDismissedAt });

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findById', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboard', () => {
    it('returns cvCount, applicationCount, recentApplications', async () => {
      mockDashboardUser(null);
      mockPrisma.masterCv.count.mockResolvedValue(2);
      mockPrisma.application.count.mockResolvedValue(5);
      mockPrisma.application.findMany.mockResolvedValue([
        { id: 'a1', status: 'DRAFT', matchScore: 88, createdAt: new Date(), jobPosting: { parsedJson: { title: 'FE Dev' } } },
      ]);
      mockPrisma.application.aggregate.mockResolvedValue({ _avg: { matchScore: 76.4 } });

      const result = await service.getDashboard('u1') as {
        onboardingDismissed: boolean;
        cvCount: number;
        applicationCount: number;
        avgMatchScore: number | null;
        recentApplications: unknown[];
      };

      expect(result.cvCount).toBe(2);
      expect(result.applicationCount).toBe(5);
      expect(result.avgMatchScore).toBe(76);
      expect(result.recentApplications).toHaveLength(1);
      expect(result.onboardingDismissed).toBe(false);
    });

    it('returns onboardingDismissed true when field is set', async () => {
      mockDashboardUser(new Date());
      mockPrisma.masterCv.count.mockResolvedValue(1);
      mockPrisma.application.count.mockResolvedValue(1);
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.aggregate.mockResolvedValue({ _avg: { matchScore: null } });

      const result = await service.getDashboard('u1') as { onboardingDismissed: boolean };
      expect(result.onboardingDismissed).toBe(true);
    });

    it('returns null avgMatchScore when no application has a score', async () => {
      mockDashboardUser(null);
      mockPrisma.masterCv.count.mockResolvedValue(0);
      mockPrisma.application.count.mockResolvedValue(0);
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.aggregate.mockResolvedValue({ _avg: { matchScore: null } });

      const result = await service.getDashboard('u1') as { avgMatchScore: number | null };

      expect(result.avgMatchScore).toBeNull();
    });
  });

  describe('dismissOnboarding', () => {
    it('updates onboardingDismissedAt on the user', async () => {
      mockPrisma.user.update.mockResolvedValue({});
      await service.dismissOnboarding('u1');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: expect.objectContaining({ onboardingDismissedAt: expect.any(Date) }),
      });
    });
  });

  describe('getSessions', () => {
    it('returns active sessions for user', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 1000 * 60 * 60);
      mockPrisma.session.findMany.mockResolvedValue([
        { id: 's1', userAgent: 'Chrome', createdAt: now, expiresAt: future },
      ]);
      const result = await service.getSessions('u1') as unknown[];
      expect(result).toHaveLength(1);
      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ userId: 'u1', revokedAt: null }),
      }));
    });
  });

  describe('revokeSession', () => {
    it('revokes a session owned by the user', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({ id: 's1', userId: 'u1' });
      mockPrisma.session.update.mockResolvedValue({});
      await service.revokeSession('u1', 's1');
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      });
    });

    it('throws NotFoundException when session does not belong to user', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({ id: 's1', userId: 'other-user' });
      await expect(service.revokeSession('u1', 's1')).rejects.toThrow(NotFoundException);
    });
  });
});
