import { Controller, Get, Patch, Delete, Body, Req, UseGuards } from '@nestjs/common';
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

  @Patch('me')
  updateMe(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const data = updateSchema.parse(body);
    return this.users.update(req.user.sub, data);
  }

  @Delete('me')
  deleteMe(@Req() req: AuthenticatedRequest) {
    return this.users.softDelete(req.user.sub);
  }
}
