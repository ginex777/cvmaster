import { Controller, Get, Patch, Post, Delete, Body, Req, UseGuards, Request, HttpCode, Param } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/request.types';
import { UsersService } from './users.service';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  locale: z.enum(['de', 'en']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12),
});

const totpCodeSchema = z.object({ code: z.string().length(6) });
const totpDisableSchema = z.object({ password: z.string().min(1) });

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.users.findById(req.user.sub);
  }

  @Get('me/dashboard')
  dashboard(@Request() req: AuthenticatedRequest) {
    return this.users.getDashboard(req.user.sub);
  }

  @Patch('me')
  updateMe(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const data = updateSchema.parse(body);
    return this.users.update(req.user.sub, data);
  }

  @Post('me/dismiss-onboarding')
  @HttpCode(204)
  dismissOnboarding(@Req() req: AuthenticatedRequest) {
    return this.users.dismissOnboarding(req.user.sub);
  }

  @Get('me/sessions')
  getSessions(@Req() req: AuthenticatedRequest) {
    return this.users.getSessions(req.user.sub);
  }

  @Delete('me/sessions/:id')
  @HttpCode(204)
  revokeSession(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.users.revokeSession(req.user.sub, id);
  }

  @Post('me/change-password')
  @HttpCode(204)
  changePassword(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const data = changePasswordSchema.parse(body);
    return this.users.changePassword(req.user.sub, data.currentPassword, data.newPassword);
  }

  @Post('me/totp/setup')
  setupTotp(@Req() req: AuthenticatedRequest) {
    return this.users.setupTotp(req.user.sub);
  }

  @Post('me/totp/enable')
  @HttpCode(204)
  enableTotp(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const { code } = totpCodeSchema.parse(body);
    return this.users.enableTotp(req.user.sub, code);
  }

  @Post('me/totp/disable')
  @HttpCode(204)
  disableTotp(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const { password } = totpDisableSchema.parse(body);
    return this.users.disableTotp(req.user.sub, password);
  }

  @Delete('me')
  deleteMe(@Req() req: AuthenticatedRequest) {
    return this.users.softDelete(req.user.sub);
  }
}
