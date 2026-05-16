import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

describe('AuthController', () => {
  const auth = {
    verifyEmail: jest.fn<() => Promise<void>>(),
  } as unknown as AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.APP_URL;
  });

  it('redirects verified accounts back to the landing login dialog', async () => {
    process.env.APP_URL = 'http://localhost';
    jest.spyOn(auth, 'verifyEmail').mockResolvedValue({ message: 'E-Mail bestätigt' });
    const controller = new AuthController(auth);
    const res = { redirect: jest.fn() };

    await controller.verify('token-123', res as never);

    expect(auth.verifyEmail).toHaveBeenCalledWith('token-123');
    expect(res.redirect).toHaveBeenCalledWith('http://localhost/?auth=login&verified=1');
  });

  it('rejects missing verification tokens', async () => {
    const controller = new AuthController(auth);
    const res = { redirect: jest.fn() };

    await expect(controller.verify('', res as never)).rejects.toThrow(BadRequestException);
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
