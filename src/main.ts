import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  const nestLogger = new NestLogger('Bootstrap');
  nestLogger.log('NestJS logger initialized');

  // Register middleware first (cookies, CORS, etc.)
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Expose request id for correlation
  app.use((req: any, res: any, next: () => void) => {
    if (req?.id) {
      res.setHeader('x-request-id', req.id);
    }
    next();
  });

  // Apply global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Handle unhandled errors
  process.on('unhandledRejection', (reason: any) => {
    const msg = reason?.stack || reason?.message || String(reason);
    nestLogger.error(`Unhandled Rejection: ${msg}`);
  });
  process.on('uncaughtException', (err: any) => {
    const msg = err?.stack || err?.message || String(err);
    nestLogger.error(`Uncaught Exception: ${msg}`);
  });

  // Configs
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') || 3000;

  await app.listen(port);
  nestLogger.log(`Server running at http://localhost:${port}`);
}

bootstrap();
