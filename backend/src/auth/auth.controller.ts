import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ZodError } from 'zod';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  totp: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(2),
  art9Consent: z.literal(true),  // Pflicht
});

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async register(@Body() body: unknown, @Req() req: Request) {
    try {
      const data = registerSchema.parse(body);
      return await this.auth.register(data, this.clientIp(req));
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors[0]?.message ?? 'Invalid input');
      throw e;
    }
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    let data: ReturnType<typeof loginSchema.parse>;
    try {
      data = loginSchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors[0]?.message ?? 'Invalid input');
      throw e;
    }
    const result = await this.auth.login(data, this.clientIp(req), req.headers['user-agent'] || '');
    res.cookie('__Host-session', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Get('verify')
  async verify(@Query('token') token: string, @Res() res: Response) {
    if (!token) throw new BadRequestException('Verification token is required');
    await this.auth.verifyEmail(token);
    const appUrl = process.env.APP_URL ?? 'http://localhost:4200';
    return res.redirect(`${appUrl}/login?verified=1`);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies['__Host-session'];
    const result = await this.auth.refresh(token, this.clientIp(req), req.headers['user-agent'] || '');
    res.cookie('__Host-session', result.refreshToken, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies['__Host-session']);
    res.clearCookie('__Host-session');
    return { ok: true };
  }

  private clientIp(req: Request): string {
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }
}
