import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../common/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    JwtModule.register({}), // signing done with Ed25519 private key in AuthService
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PrismaService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
