import { Controller, Post, Get, Patch, Param, Body, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnsApplicationGuard } from '../common/guards/owns-application.guard';
import { AuthenticatedRequest } from '../common/request.types';
import { ApplicationsService } from './applications.service';

const createSchema = z.object({
  masterCvId:   z.string().uuid(),
  jobPostingId: z.string().uuid(),
});

const exportSchema = z.object({
  layout: z.enum(['modern', 'clean', 'editorial']),
});

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private apps: ApplicationsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  create(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const data = createSchema.parse(body);
    return this.apps.create(data, req.user.sub);
  }

  @Get(':id')
  @UseGuards(OwnsApplicationGuard)
  findOne(@Param('id') id: string) {
    return this.apps.findById(id);
  }

  @Get(':id/stream')
  @UseGuards(OwnsApplicationGuard)
  stream(@Param('id') id: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    return this.apps.streamProgress(id, res);
  }

  @Post(':id/regenerate-letter')
  @UseGuards(OwnsApplicationGuard)
  regenerateLetter(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.regenerateLetter(id, req.user.sub);
  }

  @Post(':id/export')
  @UseGuards(OwnsApplicationGuard)
  export(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const { layout } = exportSchema.parse(body);
    return this.apps.exportPdf(id, layout, res);
  }

  @Post(':id/email-to-self')
  @UseGuards(OwnsApplicationGuard)
  emailToSelf(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.emailToSelf(id, req.user.sub);
  }

  @Patch(':id/status')
  @UseGuards(OwnsApplicationGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.apps.updateStatus(id, status);
  }
}
