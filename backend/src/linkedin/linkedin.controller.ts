import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanGuard, RequirePlan } from '../common/guards/plan.guard';
import { AuthenticatedRequest } from '../common/request.types';
import { LinkedInService } from './linkedin.service';

const optimizeSchema = z.object({
  profileText: z.string().min(50).max(20_000),
  targetRole:  z.string().min(2).max(200),
});

@Controller('linkedin')
@UseGuards(JwtAuthGuard, PlanGuard)
export class LinkedInController {
  constructor(private readonly linkedin: LinkedInService) {}

  @Post('optimize')
  @HttpCode(200)
  @RequirePlan('PRO')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async optimize(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const { profileText, targetRole } = optimizeSchema.parse(body);
    return this.linkedin.optimize(profileText, targetRole, req.user.sub);
  }
}
