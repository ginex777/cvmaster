import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../common/prisma.service';
import { QueueService } from '../queue/queue.service';
import { MailService } from '../mail/mail.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  masterCv: { findFirst: fn() },
  application: { create: fn(), findUniqueOrThrow: fn(), update: fn() },
  user: { findUniqueOrThrow: fn() },
};
const mockQueue = { enqueueAiPipeline: fn(), enqueueRegenerateLetter: fn() };
const mockMail = { sendApplicationToSelf: fn() };

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();
    service = module.get(ApplicationsService);
  });

  describe('create', () => {
    it('throws NotFoundException when masterCv not found or not owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ masterCvId: 'cv-bad', jobPostingId: 'jp1' }, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates application and enqueues AI pipeline when masterCv is owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.application.create.mockResolvedValue({ id: 'app1', status: 'DRAFT' } as never);
      mockQueue.enqueueAiPipeline.mockResolvedValue(undefined);

      const result = await service.create({ masterCvId: 'cv1', jobPostingId: 'jp1' }, 'u1');

      expect(mockPrisma.application.create).toHaveBeenCalled();
      expect(mockQueue.enqueueAiPipeline).toHaveBeenCalledWith('app1');
      expect(result).toHaveProperty('id', 'app1');
    });
  });
});
