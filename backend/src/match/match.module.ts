import { Module } from '@nestjs/common';
import { MatchScoringService } from './match-scoring.service';

@Module({
  providers: [MatchScoringService],
  exports: [MatchScoringService],
})
export class MatchModule {}
