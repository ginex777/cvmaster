import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/request.types';
import { CvsService } from './cvs.service';

@Controller('cvs')
@UseGuards(JwtAuthGuard)
export class CvsController {
  constructor(private cvs: CvsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: AuthenticatedRequest, @Body('name') name: string) {
    if (!file) throw new BadRequestException('Bitte lade eine Datei hoch.');
    return this.cvs.parseAndStore(file, name, req.user.sub);
  }

  @Post('quickstart')
  createQuickstart(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    return this.cvs.createQuickstart(body, req.user.sub);
  }

  @Post('text')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  createFromText(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    return this.cvs.createFromText(body, req.user.sub);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.cvs.listForUser(req.user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.cvs.update(id, req.user.sub, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.cvs.remove(id, req.user.sub);
  }
}
