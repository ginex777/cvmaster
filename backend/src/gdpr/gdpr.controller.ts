import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/request.types';
import { GdprService } from './gdpr.service';

@Controller('gdpr')
@UseGuards(JwtAuthGuard)
export class GdprController {
  constructor(private gdpr: GdprService) {}

  @Get('export')
  async export(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const zip = await this.gdpr.exportUserData(req.user.sub);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="daten-export.zip"');
    res.send(zip);
  }
}
