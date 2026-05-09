import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { TrialController } from './trial.controller';
import { TrialService } from './trial.service';

@Module({
  imports: [AiModule],
  controllers: [TrialController],
  providers: [TrialService],
})
export class TrialModule {}
