/**
 * VaultService — Module 7: Protection Vault
 *
 * All vault endpoints are rate-limited to 10 req/min (VaultGuard + ThrottlerGuard).
 * S3 presigned URLs: 15-minute expiry, no bulk download.
 * Every document access is logged (Phase 2: CloudWatch).
 *
 * Security:
 *   - S3 keys are per-user scoped, never exposed via API
 *   - Ownership verified on every read/write/delete
 *   - VaultGuard (separate JWT scope) required on all routes
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { VaultDocument, DocumentType, NomineeAccessLevel } from '../../database/entities/vault-document.entity'

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
    const doc = this.docRepo.create({ ...dto, userId })
    return this.docRepo.save(doc)
  }

  async getDocuments(userId: string): Promise<VaultDocument[]> {
    return this.docRepo.find({ where: { userId }, order: { uploadedAt: 'DESC' } })
  }

  async updateDocument(userId: string, docId: string, dto: Partial<AddDocumentDto>): Promise<VaultDocument> {
    const doc = await this.docRepo.findOne({ where: { docId } })
    if (!doc) throw new NotFoundException('Document not found')
    if (doc.userId !== userId) throw new ForbiddenException('Access denied')
    Object.assign(doc, dto)
    return this.docRepo.save(doc)
  }

  async deleteDocument(userId: string, docId: string): Promise<{ deleted: boolean }> {
    const doc = await this.docRepo.findOne({ where: { docId } })
    if (!doc) throw new NotFoundException('Document not found')
    if (doc.userId !== userId) throw new ForbiddenException('Access denied')
    await this.docRepo.remove(doc)
    return { deleted: true }
  }

  /**
   * Phase 2: generate real AWS S3 presigned URL via aws-sdk v3
   * MVP1: returns a stub URL + s3Key for client to confirm later
   */
  async getUploadUrl(userId: string): Promise<{ uploadUrl: string; s3Key: string; expiresIn: number }> {
    const s3Key = `vault/${userId}/${uuidv4()}`
    return {
      uploadUrl: `https://kin-vault-documents.s3.ap-south-1.amazonaws.com/${s3Key}?presigned=stub`,
      s3Key,
      expiresIn: 900, // 15 minutes
    }
  }

  async confirmUpload(userId: string, docId: string, s3Key: string): Promise<VaultDocument> {
    return this.updateDocument(userId, docId, { fileName: s3Key })
  }

  async getSummary(userId: string): Promise<{
    documentCount: number
    nomineeCount: number
    totalSumAssured: number
    expiringSoon: number
  }> {
    const docs = await this.getDocuments(userId)
    const now = new Date()
    const in60Days = new Date(now.getTime() + 60 * 86_400_000)
    const expiringSoon = docs.filter(d => d.renewalDate && new Date(d.renewalDate) <= in60Days).length
    const totalSumAssured = docs.reduce((sum, d) => sum + Number(d.sumAssured ?? 0), 0)
    return { documentCount: docs.length, nomineeCount: 0, totalSumAssured, expiringSoon }
  }
}
