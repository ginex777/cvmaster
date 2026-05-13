import { Controller, Get, Patch, Post, Delete, Body, Req, UseGuards, Request, HttpCode } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/request.types';
import { UsersService } from './users.service';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  locale: z.enum(['de', 'en']).optional(),
});

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

  @Delete('me')
  deleteMe(@Req() req: AuthenticatedRequest) {
    return this.users.softDelete(req.user.sub);
  }
}
