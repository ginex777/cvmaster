import { BadRequestException, Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { ZodError } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/request.types';
import { JobsService } from './jobs.service';

const parseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string().min(50).max(20_000) }),
  z.object({ type: z.literal('url'), value: z.string().url().max(2048) }),
  z.object({ type: z.literal('pdf'), value: z.string().min(1).max(20_000) }),
  z.object({ type: z.literal('screenshot'), value: z.string().min(1).max(20_000) }),
]);

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Post('parse')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  parse(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    try {
      const data = parseSchema.parse(body);
      return this.jobs.parse(data, req.user.sub);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.errors[0]?.message ?? 'Invalid job input');
      }
      throw error;
    }
  }
}
