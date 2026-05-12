import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  jobPosting: { findFirst: fn(), create: fn() },
};
const mockAi = { parseJob: fn() };

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();
    service = module.get(JobsService);
  });

  describe('parse', () => {
    it('returns existing job posting and skips AI when same text submitted twice', async () => {
      const existing = { id: 'jp1', sourceHash: 'abc' };
      mockPrisma.jobPosting.findFirst.mockResolvedValue(existing as never);

      const result = await service.parse({ type: 'text', value: 'Frontend Developer at Stripe with React skills required...' }, 'u1');

      expect(mockPrisma.jobPosting.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u1', sourceHash: expect.any(String) },
      });
      expect(mockAi.parseJob).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('parses and stores new job posting when not yet seen', async () => {
      mockPrisma.jobPosting.findFirst.mockResolvedValue(null);
      mockAi.parseJob.mockResolvedValue({
        title: 'FE Dev', company: 'Stripe', mustHaves: [], niceToHaves: [], skills: [], responsibilities: [], language: 'de',
      } as never);
      mockPrisma.jobPosting.create.mockResolvedValue({ id: 'jp1' } as never);

      const result = await service.parse({ type: 'text', value: 'Frontend Developer at Stripe with React skills required...' }, 'u1');

      expect(mockAi.parseJob).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'jp1');
    });

    it('creates a user-owned posting for the same text submitted by another user', async () => {
      mockPrisma.jobPosting.findFirst.mockResolvedValue(null);
      mockAi.parseJob.mockResolvedValue({
        title: 'FE Dev', company: 'Stripe', mustHaves: [], niceToHaves: [], skills: [], responsibilities: [], language: 'de',
      } as never);
      mockPrisma.jobPosting.create.mockResolvedValue({ id: 'jp2', userId: 'u2' } as never);

      await service.parse({ type: 'text', value: 'Frontend Developer at Stripe with React skills required...' }, 'u2');

      expect(mockPrisma.jobPosting.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u2', sourceHash: expect.any(String) },
      });
      expect(mockPrisma.jobPosting.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 'u2', sourceHash: expect.any(String) }),
      });
    });
  });
});
