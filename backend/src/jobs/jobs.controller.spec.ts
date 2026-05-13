import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

const mockJobsService = {
  parse: jest.fn(),
};

describe('JobsController', () => {
  let controller: JobsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: mockJobsService }],
    }).compile();

    controller = module.get(JobsController);
  });

  it('passes text job input to the service for the authenticated user', () => {
    mockJobsService.parse.mockResolvedValue({ id: 'job1' } as never);

    void controller.parse(
      { type: 'text', value: 'Frontend Developer role with Angular and accessibility requirements.' },
      { user: { sub: 'user1', email: 'user@example.com', plan: 'FREE' } },
    );

    expect(mockJobsService.parse).toHaveBeenCalledWith(
      { type: 'text', value: 'Frontend Developer role with Angular and accessibility requirements.' },
      'user1',
    );
  });

  it('passes URL job input to the service for the authenticated user', () => {
    mockJobsService.parse.mockResolvedValue({ id: 'job-url' } as never);

    void controller.parse(
      { type: 'url', value: 'https://example.com/jobs/frontend' },
      { user: { sub: 'user1', email: 'user@example.com', plan: 'FREE' } },
    );

    expect(mockJobsService.parse).toHaveBeenCalledWith(
      { type: 'url', value: 'https://example.com/jobs/frontend' },
      'user1',
    );
  });

  it('throws BadRequestException for invalid job input', () => {
    expect(() => controller.parse({ type: 'url', value: 'not-a-url' }, { user: { sub: 'user1', email: 'user@example.com', plan: 'FREE' } })).toThrow(BadRequestException);
    expect(mockJobsService.parse).not.toHaveBeenCalled();
  });
});
