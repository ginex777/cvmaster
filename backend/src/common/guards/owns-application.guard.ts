import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OwnsApplicationGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const applicationId = req.params.id;
    const userId = req.user?.sub;

    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Bewerbung nicht gefunden.');
    if (app.userId !== userId) throw new ForbiddenException('Kein Zugriff auf diese Bewerbung.');
    req.application = app;
    return true;
  }
}
