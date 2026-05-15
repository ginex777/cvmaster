import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AiPipelineProcessor } from './ai-pipeline.processor';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { MatchScoringService } from '../match/match-scoring.service';
import { DiffComputerService } from '../applications/diff-computer.service';
import type { DiffEntry } from '../applications/diff-computer.service';
import type { ParsedCV, ParsedJob } from '../ai/provider';

type PipelineHarness = {
  processFullPipeline(job: {
    data: { applicationId: string };
    updateProgress(progress: number): Promise<void>;
  }): Promise<void>;
};

const mockOriginalCv: ParsedCV = {
  name: 'Anna',
  experience: [{
    id: 'exp1',
    company: 'Acme',
    role: 'Dev',
    bullets: [{ id: 'b1', text: 'Old bullet' }],
  }],
  education: [],
  skills: [],
  languages: [],
};

const mockOptimizedCv: ParsedCV = {
  name: 'Anna',
  experience: [{
    id: 'exp1',
    company: 'Acme',
    role: 'Dev',
    bullets: [{ id: 'b1', text: 'New bullet', reason: 'ATS improved' }],
  }],
  education: [],
  skills: ['TypeScript'],
  languages: [],
};

const mockJob: ParsedJob = {
  title: 'Dev',
  mustHaves: ['TypeScript'],
  niceToHaves: [],
  skills: [],
  responsibilities: [],
  language: 'de',
};

describe('AiPipelineProcessor optimizationDiff', () => {
  let processor: AiPipelineProcessor;
  let updateSpy: jest.Mock<(args: { data?: { optimizationDiff?: unknown } }) => Promise<unknown>>;
  let mockDiffComputer: jest.Mocked<Pick<DiffComputerService, 'compute'>>;

  beforeEach(async () => {
    updateSpy = jest.fn<(args: { data?: { optimizationDiff?: unknown } }) => Promise<unknown>>().mockResolvedValue({});
    const mockPrisma = {
      application: {
        findUniqueOrThrow: jest.fn<() => Promise<unknown>>().mockResolvedValue({
          id: 'app1',
          userId: 'user1',
          masterCv: { parsedJson: mockOriginalCv },
          jobPosting: { parsedJson: mockJob },
        }),
        update: updateSpy,
      },
    };
    const mockAiService: jest.Mocked<Pick<AiService, 'optimizeCv' | 'generateCoverLetter'>> = {
      optimizeCv: jest.fn<
        (cv: ParsedCV, job: ParsedJob, audit?: { userId?: string; applicationId?: string }) => Promise<ParsedCV>
      >().mockResolvedValue(mockOptimizedCv),
      generateCoverLetter: jest.fn<
        (cv: ParsedCV, job: ParsedJob, audit?: { userId?: string; applicationId?: string }) => Promise<{
          concise: string;
          warm: string;
          formal: string;
        }>
      >().mockResolvedValue({ concise: 'A', warm: 'B', formal: 'C' }),
    };
    mockDiffComputer = {
      compute: jest.fn<(originalCv: ParsedCV, optimizedCv: ParsedCV) => DiffEntry[]>().mockReturnValue([{
        section: 'Dev @ Acme',
        before: 'Old bullet',
        after: 'New bullet',
        reason: 'ATS improved',
      }]),
    };

    const module = await Test.createTestingModule({
      providers: [
        AiPipelineProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
        { provide: MatchScoringService, useClass: MatchScoringService },
        { provide: DiffComputerService, useValue: mockDiffComputer },
      ],
    }).compile();

    processor = module.get(AiPipelineProcessor);
  });

  it('persists optimizationDiff after optimizeCv completes', async () => {
    const fakeJob = {
      data: { applicationId: 'app1' },
      updateProgress: jest.fn<(progress: number) => Promise<void>>().mockResolvedValue(undefined),
    };

    await (processor as unknown as PipelineHarness).processFullPipeline(fakeJob);

    const updateCall = updateSpy.mock.calls.find(call => {
      const data = (call[0] as { data?: { optimizationDiff?: unknown } }).data;
      return data && 'optimizationDiff' in data;
    });

    expect(mockDiffComputer.compute).toHaveBeenCalledWith(mockOriginalCv, expect.objectContaining({
      experience: expect.any(Array),
    }));
    expect(updateCall).toBeDefined();
    expect((updateCall?.[0] as { data: { optimizationDiff: unknown } }).data.optimizationDiff).toEqual([
      { section: 'Dev @ Acme', before: 'Old bullet', after: 'New bullet', reason: 'ATS improved' },
    ]);
  });
});
