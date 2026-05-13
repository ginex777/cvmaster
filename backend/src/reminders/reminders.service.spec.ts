import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { RemindersService } from './reminders.service';
import { PrismaService } from '../common/prisma.service';
import { MailService } from '../mail/mail.service';

const makeApp = (overrides?: object) => ({
  id: 'app-1',
  user: { email: 'user@example.de' },
  jobPosting: { parsedJson: { title: 'Developer', company: 'Acme GmbH' } },
  ...overrides,
});

describe('RemindersService', () => {
  let service: RemindersService;
  let prisma: { application: { findMany: jest.Mock<() => Promise<unknown>>; update: jest.Mock<() => Promise<unknown>> } };
  let mail: { sendReminderNotification: jest.Mock<() => Promise<void>> };

  beforeEach(async () => {
    prisma = {
      application: {
        findMany: jest.fn<() => Promise<unknown>>(),
        update: jest.fn<() => Promise<unknown>>().mockResolvedValue({}),
      },
    };
    mail = {
      sendReminderNotification: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        RemindersService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = module.get(RemindersService);
  });

  it('sends reminder email for each due application', async () => {
    prisma.application.findMany.mockResolvedValue([makeApp(), makeApp({ id: 'app-2', user: { email: 'other@example.de' } })]);

    await service.sendDueReminders();

    expect(mail.sendReminderNotification).toHaveBeenCalledTimes(2);
    expect(mail.sendReminderNotification).toHaveBeenCalledWith('user@example.de', expect.objectContaining({ id: 'app-1', title: 'Developer', company: 'Acme GmbH' }));
  });

  it('marks reminderSentAt after successful send', async () => {
    prisma.application.findMany.mockResolvedValue([makeApp()]);

    await service.sendDueReminders();

    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'app-1' }, data: expect.objectContaining({ reminderSentAt: expect.any(Date) }) }),
    );
  });

  it('does nothing when no reminders are due', async () => {
    prisma.application.findMany.mockResolvedValue([]);

    await service.sendDueReminders();

    expect(mail.sendReminderNotification).not.toHaveBeenCalled();
    expect(prisma.application.update).not.toHaveBeenCalled();
  });

  it('continues processing other reminders if one send fails', async () => {
    prisma.application.findMany.mockResolvedValue([makeApp(), makeApp({ id: 'app-2', user: { email: 'other@example.de' } })]);
    mail.sendReminderNotification
      .mockRejectedValueOnce(new Error('SMTP error'))
      .mockResolvedValueOnce(undefined);

    await service.sendDueReminders();

    expect(mail.sendReminderNotification).toHaveBeenCalledTimes(2);
    expect(prisma.application.update).toHaveBeenCalledTimes(1);
  });

  it('falls back to generic title when parsedJson has no title', async () => {
    prisma.application.findMany.mockResolvedValue([
      makeApp({ jobPosting: { parsedJson: {} } }),
    ]);

    await service.sendDueReminders();

    expect(mail.sendReminderNotification).toHaveBeenCalledWith(
      'user@example.de',
      expect.objectContaining({ title: 'Ihre Bewerbung', company: '' }),
    );
  });
});
