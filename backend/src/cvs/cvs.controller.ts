import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CvsService } from './cvs.service';

@Controller('cvs')
@UseGuards(JwtAuthGuard)
export class CvsController {
  constructor(private cvs: CvsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request, @Body('name') name: string) {
    if (!file) throw new BadRequestException('File required');
    return this.cvs.parseAndStore(file, name, (req.user as any).sub);
  }

  @Get()
  list(@Req() req: Request) {
    return this.cvs.listForUser((req.user as any).sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: Request, @Body() body: unknown) {
    return this.cvs.update(id, (req.user as any).sub, body as any);
  }
}
