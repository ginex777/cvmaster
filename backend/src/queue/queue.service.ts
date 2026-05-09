import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

function redisUrl(): string {
  const value = process.env.REDIS_URL;
  if (!value) {
    throw new Error('REDIS_URL is required');
  }

  return value;
}

@Injectable()
export class QueueService implements OnModuleInit {
  private redis: IORedis;
  private aiQueue: Queue;

  onModuleInit() {
    this.redis = new IORedis(redisUrl(), { maxRetriesPerRequest: null });
    this.aiQueue = new Queue('ai-pipeline', { connection: this.redis });
  }

  async enqueueAiPipeline(applicationId: string) {
    await this.aiQueue.add('run', { applicationId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  }

  async enqueueRegenerateLetter(applicationId: string) {
    await this.aiQueue.add('regenerate-letter', { applicationId }, { attempts: 3 });
  }
}
