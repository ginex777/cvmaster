import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AiPipelineProcessor } from './ai-pipeline.processor';
import { AiModule } from '../ai/ai.module';
import { PdfModule } from '../pdf/pdf.module';
import { PrismaService } from '../common/prisma.service';

@Module({
  imports: [AiModule, PdfModule],
  providers: [QueueService, AiPipelineProcessor, PrismaService],
  exports: [QueueService],
})
export class QueueModule {}
