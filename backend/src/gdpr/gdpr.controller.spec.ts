import { describe, expect, it, jest } from '@jest/globals';
import { GdprController } from './gdpr.controller';
import type { AuthenticatedRequest } from '../common/request.types';
import type { GdprService } from './gdpr.service';

describe('GdprController', () => {
  it('clears the refresh cookie after account deletion', async () => {
    const gdpr = {
      deleteAccount: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    } as unknown as GdprService;
    const response = {
      clearCookie: jest.fn(),
    };
    const controller = new GdprController(gdpr);

    await expect(controller.deleteAccount(
      { user: { sub: 'u1' } } as AuthenticatedRequest,
      response as never,
    )).resolves.toEqual({ message: 'Konto und alle Daten gelöscht' });

    expect(gdpr.deleteAccount).toHaveBeenCalledWith('u1');
    expect(response.clearCookie).toHaveBeenCalledWith('__Host-session', { path: '/' });
  });
});
