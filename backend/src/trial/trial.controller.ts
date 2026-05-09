import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { TrialService } from './trial.service';

const trialSchema = z.object({
  cvText: z.string().trim().min(40).max(50_000),
  jobText: z.string().trim().min(40).max(30_000),
});

@Controller('trial')
export class TrialController {
  constructor(private trial: TrialService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  analyze(@Body() body: unknown) {
    const result = trialSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException('CV and job text must each contain at least 40 characters.');
    }

    return this.trial.run(result.data);
  }
}
