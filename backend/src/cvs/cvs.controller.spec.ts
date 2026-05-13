import { describe, expect, it, jest } from '@jest/globals';
import { CvsController } from './cvs.controller';
import type { CvsService } from './cvs.service';
import type { AuthenticatedRequest } from '../common/request.types';

const request = { user: { sub: 'u1' } } as AuthenticatedRequest;

describe('CvsController', () => {
  it('delegates quickstart CV creation to the service with the authenticated user', async () => {
    const cvs = {
      createQuickstart: jest.fn<() => Promise<unknown>>().mockResolvedValue({ id: 'cv1' }),
    } as unknown as CvsService;
    const controller = new CvsController(cvs);
    const body = {
      name: 'Lina Beispiel',
      currentRoleOrStudy: 'Studentin Wirtschaftsinformatik',
      topSkills: ['Angular', 'TypeScript', 'Testing'],
      language: 'de',
      targetRole: 'Junior Frontend Developer',
    };

    await expect(controller.createQuickstart(body, request)).resolves.toEqual({ id: 'cv1' });
    expect(cvs.createQuickstart).toHaveBeenCalledWith(body, 'u1');
  });
});
