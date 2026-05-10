import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../common/prisma.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  user: { findUnique: fn(), update: fn() },
  masterCv: { count: fn() },
  application: { count: fn(), findMany: fn(), aggregate: fn() },
};

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
      mockPrisma.masterCv.count.mockResolvedValue(2);
      mockPrisma.application.count.mockResolvedValue(5);
      mockPrisma.application.findMany.mockResolvedValue([
        { id: 'a1', status: 'DRAFT', matchScore: 88, createdAt: new Date(), jobPosting: { parsedJson: { title: 'FE Dev' } } },
      ]);
      mockPrisma.application.aggregate.mockResolvedValue({ _avg: { matchScore: 76.4 } });

      const result = await service.getDashboard('u1') as {
        cvCount: number;
        applicationCount: number;
        avgMatchScore: number | null;
        recentApplications: unknown[];
      };

      expect(result.cvCount).toBe(2);
      expect(result.applicationCount).toBe(5);
      expect(result.avgMatchScore).toBe(76);
      expect(result.recentApplications).toHaveLength(1);
    });

    it('returns null avgMatchScore when no application has a score', async () => {
      mockPrisma.masterCv.count.mockResolvedValue(0);
      mockPrisma.application.count.mockResolvedValue(0);
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.aggregate.mockResolvedValue({ _avg: { matchScore: null } });

      const result = await service.getDashboard('u1') as { avgMatchScore: number | null };

      expect(result.avgMatchScore).toBeNull();
    });
  });
});
