import { describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('returns the health status from the service', async () => {
    const status = { status: 'ok' as const, checks: { database: 'ok' as const, redis: 'ok' as const } };
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: { check: jest.fn<() => Promise<typeof status>>().mockResolvedValue(status) } }],
    }).compile();

    const controller = module.get(HealthController);

    await expect(controller.check()).resolves.toEqual(status);
  });
});
