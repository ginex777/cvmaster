import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  jobPosting: { findUnique: fn(), create: fn() },
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
      mockPrisma.jobPosting.findUnique.mockResolvedValue(existing as never);

      const result = await service.parse({ type: 'text', value: 'Frontend Developer at Stripe with React skills required...' }, 'u1');

      expect(mockAi.parseJob).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('parses and stores new job posting when not yet seen', async () => {
      mockPrisma.jobPosting.findUnique.mockResolvedValue(null);
      mockAi.parseJob.mockResolvedValue({
        title: 'FE Dev', company: 'Stripe', mustHaves: [], niceToHaves: [], skills: [], responsibilities: [], language: 'de',
      } as never);
      mockPrisma.jobPosting.create.mockResolvedValue({ id: 'jp1' } as never);

      const result = await service.parse({ type: 'text', value: 'Frontend Developer at Stripe with React skills required...' }, 'u1');

      expect(mockAi.parseJob).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'jp1');
    });
  });
});
