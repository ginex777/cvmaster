import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../common/prisma.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  user: { findUnique: fn(), update: fn() },
  masterCv: { count: fn() },
  application: { count: fn(), findMany: fn() },
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

      const result = await service.getDashboard('u1') as { cvCount: number; applicationCount: number; recentApplications: unknown[] };

      expect(result.cvCount).toBe(2);
      expect(result.applicationCount).toBe(5);
      expect(result.recentApplications).toHaveLength(1);
    });
  });
});
