/**
 * serverless.ts — Vercel function entry point.
 *
 * NestJS is bootstrapped lazily (per-cold-start). The app instance is cached
 * so warm invocations skip the bootstrap cost. Sentry is initialised once
 * per cold start before NestFactory.create.
 *
 * In-memory state inside services has been migrated to DB tables, so a fresh
 * function instance is fully functional.
 */

import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import type { Request, Response } from 'express'
import { initSentry } from './common/sentry'
import { AppModule } from './app.module'
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

let cachedApp: INestApplication | null = null

async function getApp(): Promise<INestApplication> {
  if (cachedApp) return cachedApp

  initSentry()

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })
  const config = app.get(ConfigService)
  const allowedOrigins = config.get<string[]>('partner.allowedOrigins') ?? []

  app.use(
    helmet({
      contentSecurityPolicy: undefined,
      crossOriginEmbedderPolicy: false,
    }),
  )

  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Partner-ID', 'X-Session-Token'],
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new RequestIdInterceptor())

  await app.init()
  cachedApp = app
  return app
}

export default async function handler(req: Request, res: Response) {
  const app = await getApp()
  const httpAdapter = app.getHttpAdapter().getInstance() as (req: Request, res: Response) => void
  return httpAdapter(req, res)
}
