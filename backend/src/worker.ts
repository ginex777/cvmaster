import { NestFactory } from '@nestjs/core';
import { QueueModule } from './queue/queue.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(QueueModule);
  await app.init();
  console.warn('AI pipeline worker started');
}

void bootstrap();
