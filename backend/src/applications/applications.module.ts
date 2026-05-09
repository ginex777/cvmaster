import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../common/prisma.service';
import { AiModule } from '../ai/ai.module';
import { QueueModule } from '../queue/queue.module';
import { PdfModule } from '../pdf/pdf.module';
import { MailModule } from '../mail/mail.module';
import { OwnsApplicationGuard } from '../common/guards/owns-application.guard';

@Module({
  imports: [AiModule, QueueModule, PdfModule, MailModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, PrismaService, OwnsApplicationGuard],
})
export class ApplicationsModule {}
