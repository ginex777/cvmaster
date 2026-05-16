import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { LinkedInService } from './linkedin.service';
import { AiService } from '../ai/ai.service';
import type { LinkedInOptimization } from '../ai/provider';

const mockResult: LinkedInOptimization = {
  headline: 'Senior Frontend Developer | Angular | TypeScript',
  about: 'Experienced developer building scalable web apps.',
  experience: [
    { role: 'Dev', company: 'Acme', improvedBullets: ['Delivered X', 'Built Y'] },
  ],
};

describe('LinkedInService', () => {
  let service: LinkedInService;
  let ai: jest.Mocked<Pick<AiService, 'optimizeLinkedIn'>>;

  beforeEach(async () => {
    ai = { optimizeLinkedIn: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        LinkedInService,
        { provide: AiService, useValue: ai },
      ],
    }).compile();
    service = module.get(LinkedInService);
  });

  it('calls optimizeLinkedIn with profileText, targetRole, and userId', async () => {
    (ai.optimizeLinkedIn as jest.MockedFunction<typeof ai.optimizeLinkedIn>).mockResolvedValue(mockResult);
    const result = await service.optimize('Mein Profil...', 'Frontend Developer', 'u1');
    expect(ai.optimizeLinkedIn).toHaveBeenCalledWith('Mein Profil...', 'Frontend Developer', { userId: 'u1' });
    expect(result).toEqual(mockResult);
  });

  it('propagates AI errors to caller', async () => {
    (ai.optimizeLinkedIn as jest.MockedFunction<typeof ai.optimizeLinkedIn>).mockRejectedValue(new BadRequestException('KI-Eingabe ist zu groß.'));
    await expect(service.optimize('x'.repeat(100), 'Dev', 'u1')).rejects.toThrow(BadRequestException);
  });
});
