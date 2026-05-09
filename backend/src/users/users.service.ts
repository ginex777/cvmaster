import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, locale: true, plan: true, emailVerifiedAt: true, twoFactorEnabled: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: { name?: string; locale?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Account scheduled for deletion in 30 days' };
  }
}
