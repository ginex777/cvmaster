import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JobsService } from './jobs.service';

const parseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('url'),        value: z.string().url() }),
  z.object({ type: z.literal('text'),       value: z.string().min(50) }),
  z.object({ type: z.literal('screenshot'), value: z.string() }), // base64
  z.object({ type: z.literal('pdf'),        value: z.string() }), // base64
]);

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Post('parse')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  parse(@Body() body: unknown, @Req() req: Request) {
    const data = parseSchema.parse(body);
    return this.jobs.parse(data, (req.user as any).sub);
  }
}
