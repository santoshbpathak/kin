/**
 * vault.dto.ts — request bodies for the vault controller.
 *
 * Every body is a concrete class so the global ValidationPipe can enforce
 * `whitelist` + `forbidNonWhitelisted`. A `Partial<SomeDto>` type is compiled
 * to a plain `Object` by TypeScript, which makes Nest skip validation
 * entirely — that is how identity and storage-key columns (userId, docId,
 * s3Key) used to be assignable from a client body. Update DTOs are therefore
 * spelled out field by field, and the services additionally whitelist the
 * columns they copy (defence in depth).
 */
import {
  IsDateString, IsEmail, IsEnum, IsIn, IsInt, IsMobilePhone, IsNumber, IsOptional,
  IsString, IsUUID, Matches, Max, MaxLength, Min,
} from 'class-validator'
import type { DocumentType, NomineeAccessLevel } from '../../database/entities/vault-document.entity'
import type { TriggerType } from '../../database/entities/unlock-trigger.entity'

export const DOCUMENT_TYPES = [
  'term_life', 'health', 'vehicle', 'home', 'personal_accident', 'travel', 'critical_illness', 'other',
] as const
export const NOMINEE_ACCESS_LEVELS = ['full', 'policies_only', 'emergency_only'] as const
export const TRIGGER_TYPES = ['death_cert', 'deadman', 'trusted_contact', 'emergency'] as const

export class AddDocumentDto {
  @IsEnum(DOCUMENT_TYPES) docType: DocumentType
  @IsOptional() @IsString() @MaxLength(120) insurerName?: string
  @IsOptional() @IsString() @MaxLength(64) policyNumber?: string
  @IsOptional() @IsNumber() @Min(0) @Max(1e12) sumAssured?: number
  @IsOptional() @IsNumber() @Min(0) @Max(1e9) annualPremium?: number
  @IsOptional() @IsDateString() renewalDate?: string
  @IsOptional() @IsUUID() nomineeId?: string
  @IsOptional() @IsIn(NOMINEE_ACCESS_LEVELS) nomineeAccessLevel?: NomineeAccessLevel
  @IsOptional() @IsString() @MaxLength(2000) notes?: string
  @IsOptional() @IsString() @MaxLength(255) fileName?: string
}

/** Same fields as AddDocumentDto, all optional. No identity or storage columns. */
export class UpdateDocumentDto {
  @IsOptional() @IsEnum(DOCUMENT_TYPES) docType?: DocumentType
  @IsOptional() @IsString() @MaxLength(120) insurerName?: string
  @IsOptional() @IsString() @MaxLength(64) policyNumber?: string
  @IsOptional() @IsNumber() @Min(0) @Max(1e12) sumAssured?: number
  @IsOptional() @IsNumber() @Min(0) @Max(1e9) annualPremium?: number
  @IsOptional() @IsDateString() renewalDate?: string
  @IsOptional() @IsUUID() nomineeId?: string
  @IsOptional() @IsIn(NOMINEE_ACCESS_LEVELS) nomineeAccessLevel?: NomineeAccessLevel
  @IsOptional() @IsString() @MaxLength(2000) notes?: string
  @IsOptional() @IsString() @MaxLength(255) fileName?: string
}

export class AddNomineeDto {
  @IsString() @MaxLength(120) name: string
  @IsString() @MaxLength(40) relationship: string
  @IsOptional() @IsMobilePhone('en-IN') mobile?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @Matches(/^\d{4}$/, { message: 'aadhaarLast4 must be exactly 4 digits' }) aadhaarLast4?: string
  @IsOptional() @IsInt() @Min(0) @Max(100) sharePercentage?: number
  @IsOptional() @IsIn(NOMINEE_ACCESS_LEVELS) accessLevel?: string
}

/** Same fields as AddNomineeDto, all optional. No userId / nomineeId. */
export class UpdateNomineeDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string
  @IsOptional() @IsString() @MaxLength(40) relationship?: string
  @IsOptional() @IsMobilePhone('en-IN') mobile?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @Matches(/^\d{4}$/, { message: 'aadhaarLast4 must be exactly 4 digits' }) aadhaarLast4?: string
  @IsOptional() @IsInt() @Min(0) @Max(100) sharePercentage?: number
  @IsOptional() @IsIn(NOMINEE_ACCESS_LEVELS) accessLevel?: string
}

export class InitiateUnlockDto {
  @IsEnum(TRIGGER_TYPES) triggerType: TriggerType
}

export class UploadUrlDto {
  @IsOptional() @IsUUID() docId?: string
}

export class ConfirmUploadDto {
  @IsUUID() docId: string
  @IsString() @MaxLength(512) @Matches(/^vault\/[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}$/, {
    message: 's3Key must have the form vault/<userId>/<docId>',
  })
  s3Key: string
}
