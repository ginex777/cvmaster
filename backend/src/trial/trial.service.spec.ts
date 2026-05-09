import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import { MatchScoringService } from '../match/match-scoring.service';
import { TrialService } from './trial.service';

const mockAi = {
  parseCv: jest.fn<() => Promise<unknown>>(),
  parseJob: jest.fn<() => Promise<unknown>>(),
  optimizeCv: jest.fn<() => Promise<unknown>>(),
  generateCoverLetter: jest.fn<() => Promise<unknown>>(),
};

describe('TrialService', () => {
  let service: TrialService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        TrialService,
        MatchScoringService,
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();
    service = module.get(TrialService);
  });

  it('POST /trial returns atsScore and preview text', async () => {
    mockAi.parseCv.mockResolvedValue({ name: 'Lina', skills: ['React'], experience: [], education: [] });
    mockAi.parseJob.mockResolvedValue({
      title: 'Dev',
      company: 'X',
      skills: ['React'],
      mustHaves: ['React'],
      niceToHaves: [],
      responsibilities: [],
      language: 'de',
    });
    mockAi.optimizeCv.mockResolvedValue({
      name: 'Lina',
      skills: ['React'],
      summary: 'React Erfahrung',
      experience: [],
      education: [],
      languages: [],
    });
    mockAi.generateCoverLetter.mockResolvedValue({
      formal: 'Dear hiring team, I bring strong React experience and would like to contribute to your product.',
      warm: '',
      concise: '',
    });

    const result = await service.run({
      cvText: 'CV text here with enough content to parse for the demo flow.',
      jobText: 'Job posting text here with React requirements for the demo flow.',
    });

    expect(result.atsScore).toBe(100);
    expect(result.keywords).toContain('React');
    expect(result.coverLetterPreview).toBeTruthy();
  });
});
