/**
 * vault.guard.ts — Elevated JWT scope required for all /vault endpoints.
 * Vault JWTs are signed with a separate secret (VAULT_JWT_SECRET)
 * and have shorter expiry (1h).
 */
import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class VaultGuard extends AuthGuard('vault-jwt') {}
