import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
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
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
          fontSrc: ['fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
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
