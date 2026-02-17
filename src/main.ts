import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

function parseAllowedOrigins(): string[] {
  const raw =
    process.env.FRONTEND_ORIGINS ||
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_ORIGIN ||
    'http://localhost:5173';

  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableShutdownHooks();

  // Needed when running behind proxies (Koyeb, etc.) so secure cookies behave correctly.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigins = parseAllowedOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
