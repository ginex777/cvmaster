import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadGatewayException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import type { CvSection } from './applications.service';
import { Test } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../common/prisma.service';
import { QueueService } from '../queue/queue.service';
import { MailService } from '../mail/mail.service';
import { PdfService } from '../pdf/pdf.service';
import { PlanPolicyService } from '../common/plan-policy.service';

const fn = () => jest.fn<() => Promise<unknown>>();

const mockPrisma = {
  masterCv: { findFirst: fn() },
  jobPosting: { findFirst: fn() },
  application: { count: fn(), create: fn(), findMany: fn(), findUnique: fn(), findUniqueOrThrow: fn(), update: fn(), delete: fn() },
  user: { findUniqueOrThrow: fn() },
  auditLog: { create: fn() },
};
const mockQueue = { enqueueAiPipeline: fn(), enqueueRegenerateLetter: fn() };
const mockMail = { sendApplicationToSelf: fn() };
const mockPlanPolicy = { assertCanCreateApplication: jest.fn<() => Promise<void>>() };
const mockPdf = {
  generateCvPdf: jest.fn<() => Promise<Buffer>>(),
  generateLetterPdf: jest.fn<() => Promise<Buffer>>(),
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPlanPolicy.assertCanCreateApplication.mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
        { provide: MailService, useValue: mockMail },
        { provide: PdfService, useValue: mockPdf },
        { provide: PlanPolicyService, useValue: mockPlanPolicy },
      ],
    }).compile();
    service = module.get(ApplicationsService);
  });

  describe('create', () => {
    it('throws NotFoundException when masterCv not found or not owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      mockPrisma.jobPosting.findFirst.mockResolvedValue({ id: 'jp1' } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'FREE' } as never);
      await expect(
        service.create({ masterCvId: 'cv-bad', jobPostingId: 'jp1' }, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when job posting is not owned by the current user', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.jobPosting.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'FREE' } as never);

      await expect(
        service.create({ masterCvId: 'cv1', jobPostingId: 'foreign-jp' }, 'u1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.jobPosting.findFirst).toHaveBeenCalledWith({
        where: { id: 'foreign-jp', userId: 'u1' },
      });
      expect(mockPrisma.application.create).not.toHaveBeenCalled();
      expect(mockQueue.enqueueAiPipeline).not.toHaveBeenCalled();
    });

    it('creates application and enqueues AI pipeline when masterCv is owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.jobPosting.findFirst.mockResolvedValue({ id: 'jp1' } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'FREE' } as never);
      mockPlanPolicy.assertCanCreateApplication.mockResolvedValue(undefined);
      mockPrisma.application.create.mockResolvedValue({ id: 'app1', status: 'DRAFT' } as never);
      mockQueue.enqueueAiPipeline.mockResolvedValue(undefined);

      const result = await service.create({ masterCvId: 'cv1', jobPostingId: 'jp1' }, 'u1');

      expect(mockPrisma.application.create).toHaveBeenCalled();
      expect(mockPlanPolicy.assertCanCreateApplication).toHaveBeenCalledWith('u1', 'FREE');
      expect(mockQueue.enqueueAiPipeline).toHaveBeenCalledWith('app1');
      expect(result).toHaveProperty('id', 'app1');
    });

    it('throws 402 when a FREE user already has one application', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.jobPosting.findFirst.mockResolvedValue({ id: 'jp1' } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'FREE' } as never);
      mockPlanPolicy.assertCanCreateApplication.mockRejectedValue(new HttpException(
        { message: 'Kostenlose Bewerbung bereits genutzt. Bitte upgraden.', code: 'PLAN_LIMIT' },
        402,
      ));

      await expect(
        service.create({ masterCvId: 'cv1', jobPostingId: 'jp1' }, 'u1'),
      ).rejects.toThrow(HttpException);

      expect(mockPrisma.application.create).not.toHaveBeenCalled();
      expect(mockQueue.enqueueAiPipeline).not.toHaveBeenCalled();
    });

    it('allows PAY_PER_APP users when policy allows another application', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.jobPosting.findFirst.mockResolvedValue({ id: 'jp1' } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'PAY_PER_APP' } as never);
      mockPlanPolicy.assertCanCreateApplication.mockResolvedValue(undefined);
      mockPrisma.application.create.mockResolvedValue({ id: 'app2', status: 'DRAFT' } as never);
      mockQueue.enqueueAiPipeline.mockResolvedValue(undefined);

      const result = await service.create({ masterCvId: 'cv1', jobPostingId: 'jp1' }, 'u2');

      expect(mockPlanPolicy.assertCanCreateApplication).toHaveBeenCalledWith('u2', 'PAY_PER_APP');
      expect(result).toHaveProperty('id', 'app2');
      expect(mockQueue.enqueueAiPipeline).toHaveBeenCalledWith('app2');
    });

    it('allows PRO users when policy allows unlimited applications', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1' } as never);
      mockPrisma.jobPosting.findFirst.mockResolvedValue({ id: 'jp1' } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ plan: 'PRO' } as never);
      mockPlanPolicy.assertCanCreateApplication.mockResolvedValue(undefined);
      mockPrisma.application.create.mockResolvedValue({ id: 'app3', status: 'DRAFT' } as never);
      mockQueue.enqueueAiPipeline.mockResolvedValue(undefined);

      const result = await service.create({ masterCvId: 'cv1', jobPostingId: 'jp1' }, 'u3');

      expect(mockPlanPolicy.assertCanCreateApplication).toHaveBeenCalledWith('u3', 'PRO');
      expect(result).toHaveProperty('id', 'app3');
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
        generationProgress: true,
        generationError: true,
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
      await service.update('a1', 'u1', { status: 'APPLIED' });
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { status: 'APPLIED' },
        include: { masterCv: true, jobPosting: true },
      });
    });
  });

  describe('retryGeneration', () => {
    it('resets generation state and enqueues the full AI pipeline', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'u1' } as never);
      mockPrisma.application.update.mockResolvedValue({ id: 'a1', status: 'DRAFT' } as never);
      mockQueue.enqueueAiPipeline.mockResolvedValue(undefined);

      await expect(service.retryGeneration('a1', 'u1')).resolves.toEqual({ message: 'Generierung wurde gestartet.' });

      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { status: 'DRAFT', generationProgress: 0, generationError: null },
      });
      expect(mockQueue.enqueueAiPipeline).toHaveBeenCalledWith('a1');
    });
  });

  describe('regenerateLetter', () => {
    it('resets generation progress and error before enqueueing letter regeneration', async () => {
      mockPrisma.application.update.mockResolvedValue({ id: 'a1', generationProgress: 0 } as never);
      mockQueue.enqueueRegenerateLetter.mockResolvedValue(undefined);

      await expect(service.regenerateLetter('a1', 'u1')).resolves.toEqual({ message: 'Anschreiben wird neu generiert.' });

      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { generationProgress: 0, generationError: null },
      });
      expect(mockQueue.enqueueRegenerateLetter).toHaveBeenCalledWith('a1');
      expect(mockPrisma.application.update.mock.invocationCallOrder[0])
        .toBeLessThan(mockQueue.enqueueRegenerateLetter.mock.invocationCallOrder[0]);
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
        masterCv: { template: 'editorial' },
        jobPosting: { parsedJson: { company: 'Acme', title: 'Dev' } },
      } as never);
      mockPdf.generateCvPdf.mockResolvedValue(buffer);

      await service.exportPdf('a1', 'classic', res as never);

      expect(mockPdf.generateCvPdf).toHaveBeenCalledWith(
        { name: 'Lebenslauf_Acme_Dev', sections: [{ heading: 'Profil', lines: ['Angular'] }] },
        'editorial',
      );
      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/pdf' }));
      expect(res.send).toHaveBeenCalledWith(buffer);
    });
  });

  describe('emailToSelf', () => {
    it('renders CV and cover letter PDFs in memory and attaches them to the email', async () => {
      const cv = Buffer.from('cv-pdf');
      const letter = Buffer.from('letter-pdf');
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        optimizedCv: { text: 'Profil\nAngular' },
        coverLetter: { formal: 'Sehr geehrte Damen und Herren' },
        chosenVariant: 'formal',
        masterCv: { template: 'classic' },
        jobPosting: { parsedJson: { company: 'Acme', title: 'Dev' } },
      } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ email: 'lina@example.de' } as never);
      mockPdf.generateCvPdf.mockResolvedValue(cv);
      mockPdf.generateLetterPdf.mockResolvedValue(letter);
      mockMail.sendApplicationToSelf.mockResolvedValue(undefined);

      await expect(service.emailToSelf('a1', 'u1')).resolves.toEqual({ message: 'E-Mail wurde gesendet.' });

      expect(mockPdf.generateCvPdf).toHaveBeenCalledWith(
        { name: 'Lebenslauf_Acme_Dev', sections: [{ heading: 'Profil', lines: ['Angular'] }] },
        'classic',
      );
      expect(mockPdf.generateLetterPdf).toHaveBeenCalledWith(
        'Sehr geehrte Damen und Herren',
        'Lebenslauf_Acme_Dev',
        'classic',
      );
      expect(mockMail.sendApplicationToSelf).toHaveBeenCalledWith('lina@example.de', expect.objectContaining({ id: 'a1' }), [
        { filename: 'Lebenslauf_Acme_Dev.pdf', content: cv, contentType: 'application/pdf' },
        { filename: 'Lebenslauf_Acme_Dev_Anschreiben.pdf', content: letter, contentType: 'application/pdf' },
      ]);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          event: 'application.email_to_self',
          payload: { applicationId: 'a1', state: 'sent' },
        },
      });
    });

    it('throws a user-safe error and audits failure when email delivery fails', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        optimizedCv: { text: 'Profil\nAngular' },
        coverLetter: { formal: 'Sehr geehrte Damen und Herren' },
        chosenVariant: 'formal',
        masterCv: { template: 'classic' },
        jobPosting: { parsedJson: { company: 'Acme', title: 'Dev' } },
      } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ email: 'lina@example.de' } as never);
      mockPdf.generateCvPdf.mockResolvedValue(Buffer.from('cv-pdf'));
      mockPdf.generateLetterPdf.mockResolvedValue(Buffer.from('letter-pdf'));
      mockMail.sendApplicationToSelf.mockRejectedValue(new Error('resend down'));

      await expect(service.emailToSelf('a1', 'u1')).rejects.toThrow(BadGatewayException);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          event: 'application.email_to_self',
          payload: { applicationId: 'a1', state: 'failed' },
        },
      });
    });

    it('uses coverLetterTone when no explicit letter variant is selected', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        optimizedCv: { text: 'Profil\nAngular' },
        coverLetter: { formal: 'Formal', warm: 'Warm', concise: 'Kurz' },
        chosenVariant: null,
        coverLetterTone: 'creative',
        masterCv: { template: 'minimal' },
        jobPosting: { parsedJson: { company: 'Acme', title: 'Dev' } },
      } as never);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ email: 'lina@example.de' } as never);
      mockPdf.generateCvPdf.mockResolvedValue(Buffer.from('cv-pdf'));
      mockPdf.generateLetterPdf.mockResolvedValue(Buffer.from('letter-pdf'));
      mockMail.sendApplicationToSelf.mockResolvedValue(undefined);

      await service.emailToSelf('a1', 'u1');

      expect(mockPdf.generateLetterPdf).toHaveBeenCalledWith('Kurz', 'Lebenslauf_Acme_Dev', 'minimal');
    });
  });

  describe('updateStructuredCv', () => {
    const sections: CvSection[] = [
      { id: 's1', heading: 'Erfahrung', bullets: [{ id: 'b1', text: 'Angular-Entwicklung' }] },
    ];

    it('saves structured sections and returns updated application', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'u1', masterCv: null, jobPosting: null } as never);
      mockPrisma.application.update.mockResolvedValue({ id: 'a1', optimizedCv: { sections } } as never);
      const result = await service.updateStructuredCv('a1', 'u1', sections);
      expect(mockPrisma.application.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { optimizedCv: { sections } },
      });
      expect(result).toEqual({ id: 'a1', optimizedCv: { sections } });
    });

    it('throws ForbiddenException when application not owned by user', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'other', masterCv: null, jobPosting: null } as never);
      await expect(service.updateStructuredCv('a1', 'u1', sections)).rejects.toThrow(ForbiddenException);
    });

    it('preserves originalText and accepted fields on bullets', async () => {
      const sectionsWithMeta: CvSection[] = [
        {
          id: 's1',
          heading: 'Profil',
          bullets: [
            { id: 'b1', text: 'Überarbeiteter Text', originalText: 'KI-Original', accepted: true },
          ],
        },
      ];
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'u1', masterCv: null, jobPosting: null } as never);
      mockPrisma.application.update.mockResolvedValue({ id: 'a1', optimizedCv: { sections: sectionsWithMeta } } as never);
      await service.updateStructuredCv('a1', 'u1', sectionsWithMeta);
      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { optimizedCv: { sections: sectionsWithMeta } } }),
      );
    });
  });

  describe('updateReminder', () => {
    const mockApp = { id: 'a1', userId: 'u1', masterCv: null, jobPosting: null };

    it('sets reminderAt date', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(mockApp as never);
      mockPrisma.application.update.mockResolvedValue({ ...mockApp, reminderAt: new Date('2026-06-01') } as never);
      const date = new Date('2026-06-01');

      const result = await service.updateReminder('a1', 'u1', date);

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'a1' }, data: expect.objectContaining({ reminderAt: date }) }),
      );
      expect(result).toBeTruthy();
    });

    it('clears reminderAt and reminderSentAt when null is passed', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(mockApp as never);
      mockPrisma.application.update.mockResolvedValue({ ...mockApp, reminderAt: null, reminderSentAt: null } as never);

      await service.updateReminder('a1', 'u1', null);

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { reminderAt: null, reminderSentAt: null } }),
      );
    });

    it('throws ForbiddenException for wrong user', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ ...mockApp, userId: 'other' } as never);
      await expect(service.updateReminder('a1', 'u1', new Date())).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateTone', () => {
    const mockApp = { id: 'a1', userId: 'u1', masterCv: null, jobPosting: null };

    it('updates coverLetterTone and chosenVariant for own application', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(mockApp as never);
      mockPrisma.application.update.mockResolvedValue({ ...mockApp, coverLetterTone: 'modern', chosenVariant: 'warm' } as never);

      const result = await service.updateTone('a1', 'u1', 'modern');

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'a1' },
          data: { coverLetterTone: 'modern', chosenVariant: 'warm' },
        }),
      );
      expect(result).toBeTruthy();
    });

    it('maps creative tone to the concise generated letter', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(mockApp as never);
      mockPrisma.application.update.mockResolvedValue({ ...mockApp, coverLetterTone: 'creative', chosenVariant: 'concise' } as never);

      await service.updateTone('a1', 'u1', 'creative');

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { coverLetterTone: 'creative', chosenVariant: 'concise' } }),
      );
    });

    it('throws ForbiddenException for wrong user', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ ...mockApp, userId: 'other' } as never);
      await expect(service.updateTone('a1', 'u1', 'formal')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getFollowUpTemplates', () => {
    const appWithJob = {
      id: 'a1',
      userId: 'u1',
      masterCv: null,
      jobPosting: { parsedJson: { title: 'Frontend-Entwickler', company: 'Acme GmbH' } },
    };

    it('returns three templates with correct types', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(appWithJob as never);
      const templates = await service.getFollowUpTemplates('a1', 'u1');
      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.type)).toEqual(['reminder', 'status', 'thanks']);
    });

    it('uses job title and company in template subject', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(appWithJob as never);
      const templates = await service.getFollowUpTemplates('a1', 'u1');
      expect(templates[0].subject).toContain('Frontend-Entwickler');
      expect(templates[0].body).toContain('Acme GmbH');
    });

    it('uses fallback text when job posting has no parsed title', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'a1', userId: 'u1', masterCv: null, jobPosting: { parsedJson: {} },
      } as never);
      const templates = await service.getFollowUpTemplates('a1', 'u1');
      expect(templates[0].subject).toContain('die ausgeschriebene Stelle');
    });

    it('throws ForbiddenException for wrong user', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ ...appWithJob, userId: 'other' } as never);
      await expect(service.getFollowUpTemplates('a1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });
});
