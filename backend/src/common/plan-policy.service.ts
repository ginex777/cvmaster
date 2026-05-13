import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { PrismaService } from './prisma.service';

const APPLICATION_LIMITS: Record<Plan, number | null> = {
  FREE: 1,
  PAY_PER_APP: 2,
  PRO: null,
};

@Injectable()
export class PlanPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanCreateApplication(userId: string, plan: Plan | string): Promise<void> {
    const normalizedPlan = this.asPlan(plan);
    const limit = APPLICATION_LIMITS[normalizedPlan];
    if (limit === null) {
      return;
    }

    const applicationCount = await this.prisma.application.count({ where: { userId } });
    if (applicationCount >= limit) {
      throw new HttpException(
        { message: this.limitMessage(normalizedPlan), code: 'PLAN_LIMIT' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  private asPlan(plan: Plan | string): Plan {
    if (plan === 'PAY_PER_APP' || plan === 'PRO') {
      return plan;
    }

    return 'FREE';
  }

  private limitMessage(plan: Plan): string {
    if (plan === 'PAY_PER_APP') {
      return 'Einmal-Bewerbung bereits genutzt. Bitte upgrade auf Pro.';
    }

    return 'Kostenlose Bewerbung bereits genutzt. Bitte upgraden.';
  }
}
