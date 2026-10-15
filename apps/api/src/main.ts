/**
 * main.ts — KIN API Bootstrap
 *
 * Features:
 *   - Sentry init (before NestJS bootstrap so init errors are captured)
 *   - Global validation pipe (class-validator)
 *   - Helmet security headers
 *   - Swagger UI at /api/docs (non-prod only)
 *   - API versioning (URI: /api/v1/...)
 *   - CORS — only registered partner origins in prod
 *   - Request ID injected on every response
 *   - Graceful shutdown
 */

import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { initSentry } from './common/sentry'
import { AppModule } from './app.module'
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  // Initialise Sentry first so anything thrown during NestFactory.create is captured.
  initSentry()

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    // Keep the raw request bytes so webhook HMAC signatures can be verified.
    rawBody: true,
  })

  const config = app.get(ConfigService)
  const port = config.get<number>('port') ?? 3001
  const allowedOrigins = config.get<string[]>('partner.allowedOrigins') ?? []
  const nodeEnv = config.get<string>('nodeEnv')

  // ── Security headers (Helmet) ─────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false, // partner iframes need this off
    }),
  )

  // ── API versioning ────────────────────────────────────────────
  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

  // ── CORS ──────────────────────────────────────────────────────
  app.enableCors({
    origin: nodeEnv === 'development' ? true : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Partner-ID', 'X-Session-Token'],
    credentials: true,
  })

  // ── Global pipes / filters / interceptors ─────────────────────
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

  // ── Swagger (non-prod only) ───────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('KIN API')
      .setDescription(
        'KIN — Knowledge Intelligence Network. Financial wellness platform API.\n\n' +
        'All endpoints versioned under /api/v1/. ' +
        'Protected endpoints require Bearer JWT in Authorization header.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('partner', 'Partner session and brand token APIs')
      .addTag('auth', 'Authentication — anonymous session, WhatsApp OTP, Google OAuth')
      .addTag('diagnostic', '7-question protection diagnostic engine')
      .addTag('score', 'Protection score calculation and gap map')
      .addTag('trust', 'Recommendations, See the Math, suitability audit')
      .addTag('discovery', 'Hidden coverage discovery engine')
      .addTag('vault', 'Protection vault — documents, nominees, unlock triggers')
      .addTag('engagement', 'Streak, milestones, KIN IQ quiz')
      .addTag('content', 'KIN News Brief — weekly curated articles')
      .addTag('connect', 'Advisor booking and product bridge')
      .addTag('lifecycle', 'WhatsApp nudges, re-score triggers, notification prefs')
      .build()
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    })
  }

  app.enableShutdownHooks()

  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`KIN API running on http://localhost:${port}/api/v1`)
  if (nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`Swagger docs at http://localhost:${port}/api/docs`)
  }
}

bootstrap().catch(err => {
  // eslint-disable-next-line no-console
  console.error('[bootstrap] fatal:', err)
  process.exit(1)
})
