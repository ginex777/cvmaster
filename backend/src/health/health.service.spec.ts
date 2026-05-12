import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    ping: jest.fn<() => Promise<string>>().mockResolvedValue('PONG'),
    disconnect: jest.fn(),
  }));
});

describe('HealthService', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  afterEach(() => {
    process.env.REDIS_URL = originalRedisUrl;
    jest.clearAllMocks();
  });

  it('returns ok when database and redis respond', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    const prisma = { user: { count: jest.fn<() => Promise<number>>().mockResolvedValue(1) } };
    const service = new HealthService(prisma as never);

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'ok', redis: 'ok' },
    });
  });

  it('throws ServiceUnavailableException when database fails', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    const prisma = { user: { count: jest.fn<() => Promise<number>>().mockRejectedValue(new Error('db down')) } };
    const service = new HealthService(prisma as never);

    await expect(service.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
