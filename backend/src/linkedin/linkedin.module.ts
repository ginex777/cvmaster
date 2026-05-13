import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { LinkedInController } from './linkedin.controller';
import { LinkedInService } from './linkedin.service';

@Module({
  imports: [AiModule],
  controllers: [LinkedInController],
  providers: [LinkedInService],
})
export class LinkedInModule {}
