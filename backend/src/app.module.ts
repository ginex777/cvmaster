import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CvsModule } from './cvs/cvs.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { AiModule } from './ai/ai.module';
import { PdfModule } from './pdf/pdf.module';
import { PaymentsModule } from './payments/payments.module';
import { MailModule } from './mail/mail.module';
import { GdprModule } from './gdpr/gdpr.module';
import { QueueProducerModule } from './queue/queue-producer.module';
import { TrialModule } from './trial/trial.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    UsersModule,
    CvsModule,
    JobsModule,
    ApplicationsModule,
    AiModule,
    PdfModule,
    PaymentsModule,
    MailModule,
    GdprModule,
    QueueProducerModule,
    TrialModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
