import { describe, expect, it, jest } from '@jest/globals';
import { ZodError } from 'zod';
import { ApplicationsController } from './applications.controller';
import type { ApplicationsService } from './applications.service';
import type { PdfService } from '../pdf/pdf.service';
import type { AuthenticatedRequest } from '../common/request.types';

const request = { user: { sub: 'u1' } } as AuthenticatedRequest;

describe('ApplicationsController', () => {
  const apps = {
    update: jest.fn(),
    updateStatus: jest.fn(),
    updateTone: jest.fn(),
  } as unknown as ApplicationsService;

  const pdf = {} as PdfService;

  it('strips server-owned score, report, and status fields from general updates', async () => {
    const controller = new ApplicationsController(apps, pdf);
    const update = jest.spyOn(apps, 'update').mockReturnValue({ id: 'a1' } as never);

    await controller.update('a1', {
      matchScore: 99,
      matchReport: { summary: 'forged' },
      status: 'DONE',
      chosenVariant: 'warm',
    }, request);

    expect(update).toHaveBeenCalledWith('a1', 'u1', { chosenVariant: 'warm' });
  });

  it('validates dedicated status updates against the 5 canonical statuses', async () => {
    const controller = new ApplicationsController(apps, pdf);
    const updateStatus = jest.spyOn(apps, 'updateStatus').mockReturnValue({ id: 'a1', status: 'APPLIED' } as never);

    await controller.updateStatus('a1', 'applied');
    expect(updateStatus).toHaveBeenCalledWith('a1', 'APPLIED');

    expect(() => controller.updateStatus('a1', 'DONE')).toThrow(ZodError);
    expect(() => controller.updateStatus('a1', 'OPEN')).toThrow(ZodError);
    expect(() => controller.updateStatus('a1', 'SCORE_100')).toThrow(ZodError);
  });

  it('validates and persists cover letter tone through the dedicated endpoint', async () => {
    const controller = new ApplicationsController(apps, pdf);
    const updateTone = jest.spyOn(apps, 'updateTone').mockReturnValue({ id: 'a1', coverLetterTone: 'creative' } as never);

    await controller.updateTone('a1', { tone: 'creative' }, request);

    expect(updateTone).toHaveBeenCalledWith('a1', 'u1', 'creative');
    expect(() => controller.updateTone('a1', { tone: 'playful' }, request)).toThrow(ZodError);
  });
});
