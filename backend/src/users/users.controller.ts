import { Controller, Get, Patch, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  getMe(@Req() req: Request) {
    return this.users.findById((req.user as any).sub);
  }

  @Patch('me')
  updateMe(@Req() req: Request, @Body() body: unknown) {
    const data = updateSchema.parse(body);
    return this.users.update((req.user as any).sub, data);
  }

  @Delete('me')
  deleteMe(@Req() req: Request) {
    return this.users.softDelete((req.user as any).sub);
  }
}
