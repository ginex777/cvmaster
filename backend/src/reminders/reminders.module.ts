import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../common/prisma.service';

@Module({
  imports: [MailModule],
  providers: [RemindersService, PrismaService],
})
export class RemindersModule {}
