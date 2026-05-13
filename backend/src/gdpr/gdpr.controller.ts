import { Controller, Delete, Get, Req, Res, UseGuards } from '@nestjs/common';
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
    const data = await this.gdpr.exportData(req.user.sub);
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="meine-daten.json"',
    });
    res.json(data);
  }

  @Delete('account')
  async deleteAccount(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    await this.gdpr.deleteAccount(req.user.sub);
    res.clearCookie('__Host-session', { path: '/' });
    return { message: 'Konto und alle Daten geloescht' };
  }
}
