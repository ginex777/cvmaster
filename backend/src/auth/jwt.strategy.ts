import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const useEdDsa = !!process.env.JWT_PUBLIC_KEY;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: useEdDsa
        ? process.env.JWT_PUBLIC_KEY
        : process.env.JWT_SECRET ?? 'local-dev-jwt-secret-change-me',
      algorithms: useEdDsa ? ['EdDSA'] : ['HS256'],
    });
  }

  validate(payload: { sub: string; plan: string; ev: boolean; tfa: boolean }) {
    if (!payload.ev) throw new UnauthorizedException('Email not verified');
    return { sub: payload.sub, plan: payload.plan, tfa: payload.tfa };
  }
}
