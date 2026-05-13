import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { lookup } from 'dns/promises';
import { JobsService } from './jobs.service';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

jest.mock('dns/promises', () => ({ lookup: jest.fn() }));

const fn = () => jest.fn<() => Promise<unknown>>();
const lookupMock = jest.mocked(lookup);

const mockPrisma = {
  jobPosting: { findFirst: fn(), create: fn() },
};
const mockAi = { parseJob: fn() };

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never);
    const module = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();
    service = module.get(JobsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    it('fetches, sanitizes, parses, and stores a job posting from a public URL', async () => {
      const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          '<html><head><style>.x{}</style></head><body><script>alert(1)</script><h1>Frontend Developer</h1><p>React skills and accessibility experience required for this position.</p></body></html>',
          { headers: { 'content-type': 'text/html', 'content-length': '180' } },
        ),
      );
      mockPrisma.jobPosting.findFirst.mockResolvedValue(null);
      mockAi.parseJob.mockResolvedValue({
        title: 'Frontend Developer',
        company: 'Example GmbH',
        mustHaves: [],
        niceToHaves: [],
        skills: ['React'],
        responsibilities: [],
        language: 'de',
      } as never);
      mockPrisma.jobPosting.create.mockResolvedValue({ id: 'jp-url' } as never);

      const result = await service.parse({ type: 'url', value: 'https://jobs.example.com/frontend' }, 'u1');

      expect(lookupMock).toHaveBeenCalledWith('jobs.example.com', { all: true, verbatim: true });
      expect(fetchMock).toHaveBeenCalledWith('https://jobs.example.com/frontend', expect.objectContaining({ redirect: 'follow' }));
      expect(mockAi.parseJob).toHaveBeenCalledWith(
        expect.stringContaining('Frontend Developer'),
        { userId: 'u1' },
      );
      expect(mockPrisma.jobPosting.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sourceType: 'url', sourceValue: 'https://jobs.example.com/frontend' }),
      });
      expect(result).toHaveProperty('id', 'jp-url');
    });

    it('rejects private URL targets before fetching', async () => {
      const fetchMock = jest.spyOn(globalThis, 'fetch');
      lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }] as never);

      await expect(service.parse({ type: 'url', value: 'https://internal.example.com/job' }, 'u1')).rejects.toBeInstanceOf(BadRequestException);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockAi.parseJob).not.toHaveBeenCalled();
    });

    it('rejects disabled PDF mode with a user-safe error', async () => {
      await expect(service.parse({ type: 'pdf', value: 'job.pdf' }, 'u1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mockAi.parseJob).not.toHaveBeenCalled();
    });
  });
});
