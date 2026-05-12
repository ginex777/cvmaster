import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import IORedis from 'ioredis';
import { PrismaService } from '../common/prisma.service';

export interface HealthStatus {
  status: 'ok';
  checks: {
    database: 'ok';
    redis: 'ok';
  };
}

function redisUrl(): string {
  const value = process.env.REDIS_URL;
  if (!value) {
    throw new ServiceUnavailableException('REDIS_URL is required');
  }

  return value;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    if (!database || !redis) {
      throw new ServiceUnavailableException('Health check failed');
    }

    return {
      status: 'ok',
      checks: {
        database: 'ok',
        redis: 'ok',
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.user.count({ where: { deletedAt: null } });
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    const redis = new IORedis(redisUrl(), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1_000,
    });

    try {
      await redis.connect();
      return await redis.ping() === 'PONG';
    } catch {
      return false;
    } finally {
      redis.disconnect();
    }
  }
}
