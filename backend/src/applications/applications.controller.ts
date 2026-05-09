import { Controller, Post, Get, Patch, Param, Body, Req, Res, UseGuards, Delete } from '@nestjs/common';
import { AppStatus, Prisma } from '@prisma/client';
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

const statusSchema = z.preprocess(
  value => typeof value === 'string' ? value.toUpperCase() : value,
  z.nativeEnum(AppStatus),
);

const updateSchema = z.object({
  optimizedCv: z.unknown().optional(),
  coverLetter: z.unknown().optional(),
  matchReport: z.unknown().optional(),
  matchScore: z.number().int().min(0).max(100).nullable().optional(),
  chosenVariant: z.string().optional(),
  chosenLayout: z.string().optional(),
  status: statusSchema.optional(),
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
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const data = updateSchema.parse(body) as Prisma.ApplicationUpdateInput;
    return this.apps.update(id, req.user.sub, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.apps.remove(id, req.user.sub);
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
