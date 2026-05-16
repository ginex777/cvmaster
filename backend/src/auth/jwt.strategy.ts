import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const useEdDsa = !!process.env.JWT_PUBLIC_KEY;
    // @ts-expect-error EdDSA is supported by jsonwebtoken at runtime but missing from the installed type union.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: useEdDsa
        ? process.env.JWT_PUBLIC_KEY
        : process.env.JWT_SECRET ?? 'local-dev-jwt-secret-change-me',
      algorithms: useEdDsa ? ['EdDSA'] : ['HS256'],
    });
  }

  async validate(payload: { sub: string; plan: string; ev: boolean; tfa: boolean }) {
    if (!payload.ev) throw new UnauthorizedException('E-Mail-Adresse ist noch nicht bestätigt.');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { deletedAt: true },
    });
    if (!user || user.deletedAt) throw new UnauthorizedException('Konto wurde gelöscht.');
    return { sub: payload.sub, plan: payload.plan, tfa: payload.tfa };
  }
}
