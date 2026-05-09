import { CanActivate, ExecutionContext, Injectable, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PLAN_KEY = 'required_plan';
export const RequirePlan = (plan: 'FREE' | 'PAY_PER_APP' | 'PRO') => SetMetadata(PLAN_KEY, plan);

const PLAN_RANK: Record<string, number> = { FREE: 0, PAY_PER_APP: 1, PRO: 2 };

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(PLAN_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;
    const user = ctx.switchToHttp().getRequest().user;
    if (PLAN_RANK[user?.plan] >= PLAN_RANK[required]) return true;
    throw new ForbiddenException('Plan upgrade required');
  }
}
