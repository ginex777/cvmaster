import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { EvalService } from './eval.service';
import { AiService } from './ai.service';
import { FIXTURE_JOB } from './eval.fixtures';

const mockParsedCv = {
  name: 'Anna Schmidt',
  email: 'anna@example.de',
  location: 'Heidelberg',
  experience: [
    { id: 'exp1', company: 'Acme', role: 'Dev', bullets: [{ id: 'b1', text: 'Did stuff' }, { id: 'b2', text: 'More stuff' }] },
  ],
  education: [],
  skills: ['TypeScript'],
  languages: [],
};

const mockParsedJob = {
  title: 'Senior Frontend Developer',
  company: 'TechCorp',
  location: 'Heidelberg',
  mustHaves: ['Angular'],
  niceToHaves: [],
  skills: ['Angular'],
  responsibilities: ['Feature-Entwicklung'],
  language: 'de' as const,
};

const mockCoverLetter = { concise: 'Short.', warm: 'Warm.', formal: 'Formal.' };

describe('EvalService', () => {
  let service: EvalService;
  let aiService: jest.Mocked<AiService>;

  beforeEach(async () => {
    const mockAi = {
      parseCv: jest.fn<() => Promise<typeof mockParsedCv>>().mockResolvedValue(mockParsedCv),
      parseJob: jest.fn<() => Promise<typeof mockParsedJob>>().mockResolvedValue(mockParsedJob),
      optimizeCv: jest.fn<() => Promise<typeof mockParsedCv>>().mockResolvedValue(mockParsedCv),
      generateCoverLetter: jest.fn<() => Promise<typeof mockCoverLetter>>().mockResolvedValue(mockCoverLetter),
    };

    const module = await Test.createTestingModule({
      providers: [
        EvalService,
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get(EvalService);
    aiService = module.get(AiService) as jest.Mocked<AiService>;
  });

  it('returns a report with all fixtures passing when AI succeeds', async () => {
    const report = await service.runEval();

    expect(report.fixtures).toHaveLength(4);
    expect(report.biasFixtures).toHaveLength(3);
    expect(report.schemaFailureRate).toBe(0);
    expect(report.summary).toContain('7/7');
  });

  it('calls parseCv, parseJob, optimizeCv, generateCoverLetter', async () => {
    await service.runEval();

    expect(aiService.parseCv).toHaveBeenCalledTimes(1);
    expect(aiService.parseJob).toHaveBeenCalledTimes(1);
    expect(aiService.generateCoverLetter).toHaveBeenCalledTimes(1);
  });

  it('calls optimizeCv for main fixture + 3 bias variants', async () => {
    await service.runEval();

    expect(aiService.optimizeCv).toHaveBeenCalledTimes(4);
  });

  it('runs bias variants with different names but same CV structure', async () => {
    await service.runEval();

    const calls = aiService.optimizeCv.mock.calls;
    const biasNames = calls.slice(1).map(([cv]) => cv.name);
    expect(biasNames).toContain('Mohammed Al-Rashid');
    expect(biasNames).toContain('Li Wei');
  });

  it('sets schemaFailureRate to 1 when all fixtures fail', async () => {
    aiService.parseCv.mockRejectedValue(new Error('schema validation failed'));
    aiService.parseJob.mockRejectedValue(new Error('schema validation failed'));
    aiService.optimizeCv.mockRejectedValue(new Error('schema validation failed'));
    aiService.generateCoverLetter.mockRejectedValue(new Error('schema validation failed'));

    const report = await service.runEval();

    expect(report.schemaFailureRate).toBe(1);
    expect(report.fixtures.every(f => f.status === 'fail')).toBe(true);
    expect(report.biasFixtures.every(f => f.status === 'fail')).toBe(true);
  });

  it('marks individual fixtures as fail and includes error message', async () => {
    aiService.parseCv.mockRejectedValue(new Error('invalid JSON response'));

    const report = await service.runEval();

    const parseCvResult = report.fixtures.find(f => f.name === 'parseCv');
    expect(parseCvResult?.status).toBe('fail');
    expect(parseCvResult?.error).toContain('invalid JSON response');
  });

  it('records sectionCount and bulletCount for passing bias fixtures', async () => {
    const report = await service.runEval();

    const passingBias = report.biasFixtures.filter(f => f.status === 'pass');
    expect(passingBias).toHaveLength(3);
    for (const result of passingBias) {
      expect(result.sectionCount).toBe(1);
      expect(result.bulletCount).toBe(2);
    }
  });

  it('includes timestamp, provider, and model in report', async () => {
    const report = await service.runEval();

    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof report.provider).toBe('string');
    expect(typeof report.model).toBe('string');
  });

  it('calculates partial failure rate correctly', async () => {
    aiService.parseCv.mockRejectedValue(new Error('fail'));

    const report = await service.runEval();

    // 1 out of 7 fixtures fails
    expect(report.schemaFailureRate).toBeCloseTo(1 / 7);
  });

  it('bias fixture uses FIXTURE_JOB as the job context', async () => {
    await service.runEval();

    const biasCalls = aiService.optimizeCv.mock.calls.slice(1);
    for (const [, job] of biasCalls) {
      expect(job).toEqual(FIXTURE_JOB);
    }
  });
});
