import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AiPipelineProcessor } from './ai-pipeline.processor';
import { AiModule } from '../ai/ai.module';
import { PdfModule } from '../pdf/pdf.module';
import { MatchModule } from '../match/match.module';
import { PrismaService } from '../common/prisma.service';

@Module({
  imports: [AiModule, PdfModule, MatchModule],
  providers: [QueueService, AiPipelineProcessor, PrismaService],
  exports: [QueueService],
})
export class QueueModule {}
