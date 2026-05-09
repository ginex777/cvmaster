import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaService } from '../common/prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [JobsController],
  providers: [JobsService, PrismaService],
  exports: [JobsService],
})
export class JobsModule {}
