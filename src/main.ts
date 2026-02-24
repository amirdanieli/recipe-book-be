import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

function parseAllowedOrigins(): string[] {
  const raw =
    process.env.FRONTEND_ORIGINS ||
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_ORIGIN ||
    'http://localhost:5173';

  return raw
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);
}

function parseAllowedOriginRegexes(): RegExp[] {
  const raw = process.env.FRONTEND_ORIGIN_REGEX;
  if (!raw) return [];

  return raw
    .split(',')
    .map((pattern: string) => pattern.trim())
    .filter((pattern: string) => pattern.length > 0)
    .map((pattern: string) => {
      try {
        return new RegExp(pattern);
      } catch {
        return null;
      }
    })
    .filter((rx: RegExp | null): rx is RegExp => rx !== null);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableShutdownHooks();

  // Needed when running behind proxies (Koyeb, etc.) so secure cookies behave correctly.
  app.set('trust proxy', 1);

  const apiPrefix = (process.env.API_PREFIX || 'api').replace(/^\/+|\/+$/g, '');
  app.setGlobalPrefix(apiPrefix);

  // Back-compat / frontend convenience: if the client calls routes without the prefix
  // (e.g. /auth/admin/login) rewrite them to /<prefix>/auth/admin/login.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const prefixWithSlash = `/${apiPrefix}`;
    if (req.url.startsWith(prefixWithSlash)) {
      next();
      return;
    }

    const shouldRewrite =
      req.url.startsWith('/auth') ||
      req.url.startsWith('/recipes') ||
      req.url.startsWith('/categories') ||
      req.url.startsWith('/images');

    if (shouldRewrite) {
      req.url = `${prefixWithSlash}${req.url}`;
    }

    next();
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigins = parseAllowedOrigins();
  const allowedOriginRegexes = parseAllowedOriginRegexes();
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

      if (allowedOriginRegexes.some((rx) => rx.test(origin))) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
