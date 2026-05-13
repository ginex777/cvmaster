import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

function validateEnv() {
  const required = ['DATABASE_URL', 'REDIS_URL', 'APP_URL', 'AI_PROVIDER'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  const provider = process.env.AI_PROVIDER;
  if (provider === 'mistral' && !process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is required when AI_PROVIDER=mistral');
  }
  if (provider === 'claude' && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=claude');
  }
  if (provider === 'groq' && !process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required when AI_PROVIDER=groq');
  }
  if (provider !== 'mistral' && provider !== 'claude' && provider !== 'groq') {
    throw new Error(`AI_PROVIDER must be "mistral", "claude", or "groq", got "${provider}"`);
  }

  if (!process.env.JWT_PRIVATE_KEY && !process.env.JWT_SECRET) {
    console.warn('[warn] Neither JWT_PRIVATE_KEY nor JWT_SECRET is set — using insecure dev default');
  }
  if (!process.env.IP_SALT) {
    console.warn('[warn] IP_SALT is not set — IP hashing will be weak');
  }
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('RESEND_API_KEY is required in production');
  }
  if (!process.env.MAIL_DOMAIN) {
    throw new Error('MAIL_DOMAIN is required');
  }
}

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  // Sicherheit (siehe SPEC § 23)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://cdn.paddle.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
          fontSrc: ['fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https://*.paddle.com'],
          connectSrc: ["'self'", 'https://*.paddle.com'],
          frameSrc: ['https://*.paddle.com'],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    })
  );
  app.use(cookieParser());

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.APP_URL,
    credentials: true,
  });

  await app.listen(3000);
}
void bootstrap();
