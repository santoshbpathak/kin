/**
 * configuration.ts — Typed environment configuration
 * Loaded via @nestjs/config's ConfigModule.
 *
 * In production, every secret below MUST be set explicitly via the environment
 * (Vercel project env vars). Fallback dev values are intentionally weak; the
 * startup assertion at the bottom of this file throws if any required
 * production secret is missing.
 */

const REQUIRED_IN_PRODUCTION = [
  'JWT_SECRET',
  'VAULT_JWT_SECRET',
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const RECOMMENDED_IN_PRODUCTION = [
  'SENTRY_DSN',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  'WHATSAPP_APP_SECRET',
] as const

function assertProductionEnv(): void {
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return
  const missing = REQUIRED_IN_PRODUCTION.filter(k => !process.env[k] || process.env[k]?.startsWith('change-me'))
  if (missing.length) {
    throw new Error(
      `Refusing to start: required production env vars missing or using dev defaults: ${missing.join(', ')}. ` +
      `Set these in your Vercel project settings.`,
    )
  }
  const missingRecommended = RECOMMENDED_IN_PRODUCTION.filter(k => !process.env[k])
  if (missingRecommended.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[startup] Production missing recommended env vars: ${missingRecommended.join(', ')}. ` +
      `Some features (Sentry, WhatsApp) will be disabled.`,
    )
  }
  if (process.env.DATABASE_SSL === 'true' && process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'true') {
    // eslint-disable-next-line no-console
    console.warn(
      '[startup] DATABASE_SSL is on but DATABASE_SSL_REJECT_UNAUTHORIZED is not "true": the database ' +
      'TLS certificate is NOT verified. Set it to true (and DATABASE_SSL_CA if needed) to prevent MITM.',
    )
  }
  if (process.env.KIN_DEMO_MODE === 'true') {
    // eslint-disable-next-line no-console
    console.warn('[startup] KIN_DEMO_MODE=true in production: the AI layer is the scripted demo client.')
  }
}

export default () => {
  assertProductionEnv()
  return ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Demo mode: scripted AI client, no paid APIs. See docs/development.md.
  demoMode: process.env.KIN_DEMO_MODE === 'true',

  database: {
    driver: process.env.DATABASE_DRIVER ?? 'postgres',
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    name: process.env.DATABASE_NAME ?? 'kin_db',
    user: process.env.DATABASE_USER ?? 'kin_user',
    pass: process.env.DATABASE_PASS ?? 'kin_pass',
    ssl: process.env.DATABASE_SSL === 'true',
    // Verify the server certificate when DATABASE_SSL is on. Defaults to the
    // historical behaviour (false) so existing deployments keep working, but
    // production should set this to true. Optional PEM CA bundle for
    // providers that use a private CA (e.g. Supabase direct connections).
    sslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
    sslCa: process.env.DATABASE_SSL_CA || undefined,
    // Opt-in SQL query logging (prints bound parameters). Never on in production.
    logQueries: process.env.DATABASE_LOG_QUERIES === 'true',
    sqljsLocation: process.env.DATABASE_SQLJS_LOCATION ?? 'kin-local.sqlite',
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
    jwtExpiry: process.env.JWT_EXPIRY ?? '7d',
    vaultJwtSecret: process.env.VAULT_JWT_SECRET ?? 'dev-vault-secret',
    vaultJwtExpiry: process.env.VAULT_JWT_EXPIRY ?? '1h',
  },

  aws: {
    region: process.env.AWS_REGION ?? 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    s3Bucket: process.env.AWS_S3_BUCKET ?? 'kin-vault-documents',
    presignedUrlExpiry: parseInt(process.env.AWS_S3_PRESIGNED_URL_EXPIRY ?? '900', 10),
  },

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? '',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '',
    // Meta app secret used to verify X-Hub-Signature-256 on inbound webhooks.
    appSecret: process.env.WHATSAPP_APP_SECRET ?? '',
  },

  partner: {
    allowedOrigins: (process.env.PARTNER_EMBED_ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    vaultMax: parseInt(process.env.VAULT_RATE_LIMIT_MAX ?? '10', 10),
  },

  sentry: {
    dsn: process.env.SENTRY_DSN ?? '',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    environment: process.env.NODE_ENV ?? 'development',
  },

  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    vaultBucket: process.env.SUPABASE_VAULT_BUCKET ?? 'kin-vault-documents',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    modelPrimary: process.env.OPENAI_MODEL_PRIMARY ?? 'gpt-4o',
    modelEscalation: process.env.OPENAI_MODEL_ESCALATION ?? 'gpt-4o-mini',
    maxTokensDiagnostic: parseInt(process.env.OPENAI_MAX_TOKENS_DIAGNOSTIC ?? '2000', 10),
    maxTokensAdvisor: parseInt(process.env.OPENAI_MAX_TOKENS_ADVISOR ?? '1500', 10),
    maxTokensExtraction: parseInt(process.env.OPENAI_MAX_TOKENS_EXTRACTION ?? '3000', 10),
    conversationTtlSeconds: parseInt(process.env.CONVERSATION_TTL_SECONDS ?? '1800', 10),
    // Hard cap on user turns per conversation (diagnostic and advisor). Bounds
    // the LLM spend a single session can generate.
    maxConversationTurns: parseInt(process.env.MAX_CONVERSATION_TURNS ?? '40', 10),
  },
})
}
