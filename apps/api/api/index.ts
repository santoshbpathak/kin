/**
 * Vercel function entry-point.
 *
 * Vercel auto-detects any TypeScript/JavaScript file under apps/api/api/ as a
 * Serverless Function and bundles it via @vercel/node. This file just
 * re-exports the default handler from src/serverless.ts (which is also used
 * locally during dev to expose the cached NestJS app instance).
 *
 * The accompanying vercel.json rewrites /api/* (and /*) to this single
 * function so all KIN API routes flow through one NestJS bootstrap.
 */
import 'reflect-metadata'
import handler from '../src/serverless'

export default handler

// Vercel reads this to size the function. 1 GB RAM is enough for NestJS + pg
// pool + Supabase JS. maxDuration 30s matches our vercel.json budget.
export const config = {
  memory: 1024,
  maxDuration: 30,
}
