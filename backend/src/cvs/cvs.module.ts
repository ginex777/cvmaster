import { Module } from '@nestjs/common';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { PrismaService } from '../common/prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [CvsController],
  providers: [CvsService, PrismaService],
  exports: [CvsService],
})
export class CvsModule {}
