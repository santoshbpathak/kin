/**
 * configuration.ts — Typed environment configuration
 * Loaded via @nestjs/config's ConfigModule.
 * All values validated at startup via Joi schema (see app.module.ts).
 */

export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    name: process.env.DATABASE_NAME ?? 'kin_db',
    user: process.env.DATABASE_USER ?? 'kin_user',
    pass: process.env.DATABASE_PASS ?? 'kin_pass',
    ssl: process.env.DATABASE_SSL === 'true',
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
  },

  partner: {
    allowedOrigins: (process.env.PARTNER_EMBED_ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    vaultMax: parseInt(process.env.VAULT_RATE_LIMIT_MAX ?? '10', 10),
  },
})
