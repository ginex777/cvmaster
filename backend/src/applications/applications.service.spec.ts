import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../common/prisma.service';
import { QueueService } from '../queue/queue.service';
import { MailService } from '../mail/mail.service';
import { PdfService } from '../pdf/pdf.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  masterCv: { findFirst: fn() },
  application: { count: fn(), create: fn(), findMany: fn(), findUnique: fn(), findUniqueOrThrow: fn(), update: fn(), delete: fn() },
  user: { findUniqueOrThrow: fn() },
};
const mockQueue = { enqueueAiPipeline: fn(), enqueueRegenerateLetter: fn() };
const mockMail = { sendApplicationToSelf: fn() };
const mockPdf = { generateCvPdf: jest.fn<() => Promise<Buffer>>() };

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
        { provide: PdfService, useValue: mockPdf },
      ],
    }).compile();
    service = module.get(ApplicationsService);
  });

  describe('create', () => {
    it('throws NotFoundException when masterCv not found or not owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'FREE' } as never);
      await expect(
        service.create({ masterCvId: 'cv-bad', jobPostingId: 'jp1' }, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates application and enqueues AI pipeline when masterCv is owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'FREE' } as never);
      mockPrisma.application.count.mockResolvedValue(0);
      mockPrisma.application.create.mockResolvedValue({ id: 'app1', status: 'DRAFT' } as never);
      mockQueue.enqueueAiPipeline.mockResolvedValue(undefined);

      const result = await service.create({ masterCvId: 'cv1', jobPostingId: 'jp1' }, 'u1');

      expect(mockPrisma.application.create).toHaveBeenCalled();
      expect(mockQueue.enqueueAiPipeline).toHaveBeenCalledWith('app1');
      expect(result).toHaveProperty('id', 'app1');
    });

    it('throws 402 when a FREE user already has one application', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'FREE' } as never);
      mockPrisma.application.count.mockResolvedValue(1);

      await expect(
        service.create({ masterCvId: 'cv1', jobPostingId: 'jp1' }, 'u1'),
      ).rejects.toThrow(HttpException);

      expect(mockPrisma.application.create).not.toHaveBeenCalled();
      expect(mockQueue.enqueueAiPipeline).not.toHaveBeenCalled();
    });

    it('allows PRO users to create beyond the free limit', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'PRO' } as never);
      mockPrisma.application.create.mockResolvedValue({ id: 'app2', status: 'DRAFT' } as never);
      mockQueue.enqueueAiPipeline.mockResolvedValue(undefined);

      const result = await service.create({ masterCvId: 'cv1', jobPostingId: 'jp1' }, 'u2');

      expect(mockPrisma.application.count).not.toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'app2');
      expect(mockQueue.enqueueAiPipeline).toHaveBeenCalledWith('app2');
    });
  });

  describe('findOne', () => {
    it('throws ForbiddenException when application belongs to another user', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'other' } as never);
      await expect(service.findOne('a1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.findOne('a1', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns applications for the current user ordered newest first', async () => {
      mockPrisma.application.findMany.mockResolvedValue([{ id: 'a1' }] as never);

      await expect(service.findAll('u1')).resolves.toEqual([{ id: 'a1' }]);
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          matchScore: true,
          createdAt: true,
          jobPosting: { select: { parsedJson: true } },
        },
      });
    });
  });

  describe('update', () => {
    it('calls prisma.application.update with merged data', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'u1' } as never);
      mockPrisma.application.update.mockResolvedValue({ id: 'a1' } as never);
      await service.update('a1', 'u1', { status: 'SENT' });
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { status: 'SENT' },
        include: { masterCv: true, jobPosting: true },
      });
    });
  });

  describe('remove', () => {
    it('deletes an application after ownership check', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'u1' } as never);
      mockPrisma.application.delete.mockResolvedValue({ id: 'a1' } as never);
      await service.remove('a1', 'u1');
      expect(mockPrisma.application.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
    });
  });

  describe('exportPdf', () => {
    it('renders a PDF response for the legacy export route', async () => {
      const res = {
        set: jest.fn(),
        send: jest.fn(),
      };
      const buffer = Buffer.from('pdf');
      mockPrisma.application.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        optimizedCv: { text: 'Profil\nAngular' },
        jobPosting: { parsedJson: { company: 'Acme', title: 'Dev' } },
      } as never);
      mockPdf.generateCvPdf.mockResolvedValue(buffer);

      await service.exportPdf('a1', 'classic', res as never);

      expect(mockPdf.generateCvPdf).toHaveBeenCalledWith(
        { name: 'Lebenslauf_Acme_Dev', sections: [{ heading: 'Profil', lines: ['Angular'] }] },
        'classic',
      );
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/pdf' }));
      expect(res.send).toHaveBeenCalledWith(buffer);
    });
  });
});
