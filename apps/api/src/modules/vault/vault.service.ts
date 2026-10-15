/**
 * VaultService — Module 7: Protection Vault
 *
 * All vault endpoints are rate-limited to 10 req/min (VaultGuard + ThrottlerGuard).
 * Signed URLs are 15-minute TTL; no bulk download endpoint exists.
 *
 * Security:
 *   - Storage keys are namespaced under vault/<userId>/<docId> so Supabase
 *     Storage RLS can enforce that a user can only signed-upload/download
 *     under their own prefix.
 *   - Ownership verified on every read/write/delete at the application layer too.
 *   - VaultGuard (separate JWT scope) required on all routes.
 *   - s3Key (the storage key) is NEVER returned via list endpoints. It is only
 *     surfaced internally to generate signed URLs.
 *   - When SUPABASE_URL is unset (local dev), the service falls back to a stub
 *     URL so the rest of the flow can still be exercised.
 */
import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { VaultDocument, DocumentType, NomineeAccessLevel } from '../../database/entities/vault-document.entity'
import { getSupabase, SUPABASE_VAULT_BUCKET } from '../../lib/supabase'

const SIGNED_URL_TTL_SECONDS = 900 // 15 minutes per PRD

export interface AddDocumentDto {
  docType: DocumentType
  insurerName?: string
  policyNumber?: string
  sumAssured?: number
  annualPremium?: number
  renewalDate?: string
  nomineeId?: string
  nomineeAccessLevel?: NomineeAccessLevel
  notes?: string
  fileName?: string
}

@Injectable()
export class VaultService {
  constructor(
    @InjectRepository(VaultDocument)
    private readonly docRepo: Repository<VaultDocument>,
  ) {}

  async addDocument(userId: string, dto: AddDocumentDto): Promise<VaultDocument> {
    // Copy only the mutable policy fields. userId comes from the JWT, never
    // from the body; docId and s3Key are server-assigned.
    const doc = this.docRepo.create({ ...pickUpdatableDocumentFields(dto), docType: dto.docType, userId })
    return this.docRepo.save(doc)
  }

  async getDocuments(userId: string): Promise<VaultDocument[]> {
    // We strip s3Key before returning to the client - it's never needed for
    // listing and exposing it would defeat the signed-URL gating.
    const docs = await this.docRepo.find({ where: { userId }, order: { uploadedAt: 'DESC' } })
    return docs.map(stripStorageKey)
  }

  async updateDocument(userId: string, docId: string, dto: Partial<AddDocumentDto>): Promise<VaultDocument> {
    const doc = await this.docRepo.findOne({ where: { docId } })
    if (!doc) throw new NotFoundException('Document not found')
    if (doc.userId !== userId) throw new ForbiddenException('Access denied')
    // Whitelist the mutable fields explicitly. A client body must never be
    // able to reach identity or storage-key columns (userId, docId, s3Key);
    // see docs/security/04-application-security.md, finding APP-1.
    Object.assign(doc, pickUpdatableDocumentFields(dto))
    const saved = await this.docRepo.save(doc)
    return stripStorageKey(saved)
  }

  async deleteDocument(userId: string, docId: string): Promise<{ deleted: boolean }> {
    const doc = await this.docRepo.findOne({ where: { docId } })
    if (!doc) throw new NotFoundException('Document not found')
    if (doc.userId !== userId) throw new ForbiddenException('Access denied')

    // Delete the underlying Storage object if one was uploaded.
    if (doc.s3Key) {
      const supabase = getSupabase()
      if (supabase) {
        const { error } = await supabase.storage.from(SUPABASE_VAULT_BUCKET).remove([doc.s3Key])
        if (error) {
          // Log only - don't block the row delete on storage delete failure
          // (orphaned storage objects can be swept by a cron later).
          // eslint-disable-next-line no-console
          console.warn('[vault] failed to delete storage object', { docId, error: error.message })
        }
      }
    }
    await this.docRepo.remove(doc)
    return { deleted: true }
  }

  /**
   * Issue a signed upload URL the client can PUT a file to directly.
   *
   * The s3Key is namespaced as vault/<userId>/<uuid> so Supabase Storage RLS
   * can scope writes/reads per user. The docId returned points at a freshly
   * created vault_documents row that the client must complete via PATCH or
   * confirm via confirmUpload.
   */
  async getUploadUrl(
    userId: string,
    docId?: string,
  ): Promise<{ uploadUrl: string; s3Key: string; expiresIn: number; docId: string }> {
    const targetDocId = docId ?? randomUUID()
    const s3Key = `vault/${userId}/${targetDocId}`

    const supabase = getSupabase()
    if (!supabase) {
      // Local dev fallback - the stub URL won't actually accept a PUT but the
      // rest of the flow (DB row creation, confirmUpload) can be tested.
      return {
        uploadUrl: `https://kin-vault-documents.local/${s3Key}?stub=true`,
        s3Key,
        docId: targetDocId,
        expiresIn: SIGNED_URL_TTL_SECONDS,
      }
    }

    const { data, error } = await supabase.storage
      .from(SUPABASE_VAULT_BUCKET)
      .createSignedUploadUrl(s3Key)

    if (error || !data) {
      throw new InternalServerErrorException(`Failed to create signed upload URL: ${error?.message ?? 'unknown'}`)
    }

    return {
      uploadUrl: data.signedUrl,
      s3Key,
      docId: targetDocId,
      expiresIn: SIGNED_URL_TTL_SECONDS,
    }
  }

  /**
   * Mark a previously uploaded file as confirmed by storing its s3Key against
   * the vault_documents row. Verifies ownership and that the s3Key lives in
   * the caller's namespace (defence-in-depth: a client cannot register an
   * arbitrary key under their own row).
   */
  async confirmUpload(userId: string, docId: string, s3Key: string): Promise<VaultDocument> {
    if (!s3Key.startsWith(`vault/${userId}/`)) {
      throw new ForbiddenException('Storage key does not belong to current user')
    }
    const doc = await this.docRepo.findOne({ where: { docId } })
    if (!doc) throw new NotFoundException('Document not found')
    if (doc.userId !== userId) throw new ForbiddenException('Access denied')
    doc.s3Key = s3Key
    const saved = await this.docRepo.save(doc)
    return stripStorageKey(saved)
  }

  /**
   * Issue a short-lived signed download URL for an uploaded vault document.
   * Used by the document detail screen and the nominee-view flow.
   */
  async getDownloadUrl(
    userId: string,
    docId: string,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    const doc = await this.docRepo.findOne({ where: { docId } })
    if (!doc) throw new NotFoundException('Document not found')
    if (doc.userId !== userId) throw new ForbiddenException('Access denied')
    if (!doc.s3Key) {
      throw new NotFoundException('No file uploaded for this document yet')
    }

    const supabase = getSupabase()
    if (!supabase) {
      return {
        downloadUrl: `https://kin-vault-documents.local/${doc.s3Key}?stub=true`,
        expiresIn: SIGNED_URL_TTL_SECONDS,
      }
    }

    const { data, error } = await supabase.storage
      .from(SUPABASE_VAULT_BUCKET)
      .createSignedUrl(doc.s3Key, SIGNED_URL_TTL_SECONDS)

    if (error || !data) {
      throw new InternalServerErrorException(`Failed to create signed download URL: ${error?.message ?? 'unknown'}`)
    }

    return { downloadUrl: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS }
  }

  async getSummary(userId: string): Promise<{
    documentCount: number
    nomineeCount: number
    totalSumAssured: number
    expiringSoon: number
  }> {
    const docs = await this.getDocuments(userId)
    const in60Days = new Date(Date.now() + 60 * 86_400_000)
    const expiringSoon = docs.filter(d => d.renewalDate && new Date(d.renewalDate) <= in60Days).length
    const totalSumAssured = docs.reduce((sum, d) => sum + Number(d.sumAssured ?? 0), 0)
    return { documentCount: docs.length, nomineeCount: 0, totalSumAssured, expiringSoon }
  }
}

/** The only vault_documents columns a client may set or change. */
export const UPDATABLE_DOCUMENT_FIELDS = [
  'docType', 'insurerName', 'policyNumber', 'sumAssured', 'annualPremium',
  'renewalDate', 'nomineeId', 'nomineeAccessLevel', 'notes', 'fileName',
] as const

export function pickUpdatableDocumentFields(dto: Partial<AddDocumentDto>): Partial<AddDocumentDto> {
  const out: Record<string, unknown> = {}
  for (const key of UPDATABLE_DOCUMENT_FIELDS) {
    const value = (dto as Record<string, unknown>)[key]
    if (value !== undefined) out[key] = value
  }
  return out as Partial<AddDocumentDto>
}

function stripStorageKey(doc: VaultDocument): VaultDocument {
  // We mutate a shallow copy so callers get a clean object - never persist
  // this stripped version back to the repo.
  const { s3Key: _omit, ...rest } = doc
  void _omit
  return rest as VaultDocument
}
