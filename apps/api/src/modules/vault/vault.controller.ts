import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator'
import { VaultGuard } from '../../common/guards/vault.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { VaultService } from './vault.service'
import { NomineeService } from './nominee.service'
import { UnlockService } from './unlock.service'
import { DocumentType, NomineeAccessLevel } from '../../database/entities/vault-document.entity'
import type { TriggerType } from '../../database/entities/unlock-trigger.entity'

class AddDocumentDto {
  @IsEnum(['term_life','health','vehicle','home','personal_accident','travel','critical_illness','other'])
  docType: DocumentType
  @IsOptional() @IsString() insurerName?: string
  @IsOptional() @IsString() policyNumber?: string
  @IsOptional() @IsNumber() sumAssured?: number
  @IsOptional() @IsNumber() annualPremium?: number
  @IsOptional() @IsDateString() renewalDate?: string
  @IsOptional() @IsString() nomineeId?: string
  @IsOptional() @IsEnum(['full','policies_only','emergency_only']) nomineeAccessLevel?: NomineeAccessLevel
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsString() fileName?: string
}

class AddNomineeDto {
  @IsString() name: string
  @IsString() relationship: string
  @IsOptional() @IsString() mobile?: string
  @IsOptional() @IsString() email?: string
  @IsOptional() @IsString() aadhaarLast4?: string
  @IsOptional() @IsNumber() sharePercentage?: number
  @IsOptional() @IsString() accessLevel?: string
}

class InitiateUnlockDto {
  @IsEnum(['death_cert','deadman','trusted_contact','emergency'])
  triggerType: TriggerType
}

class ConfirmUploadDto {
  @IsString() docId: string
  @IsString() s3Key: string
}

@ApiTags('vault')
@ApiBearerAuth()
@UseGuards(VaultGuard)
@Controller({ path: 'vault', version: '1' })
export class VaultController {
  constructor(
    private readonly vaultService: VaultService,
    private readonly nomineeService: NomineeService,
    private readonly unlockService: UnlockService,
  ) {}

  // ── Documents ────────────────────────────────────────────────

  @Post('document')
  @ApiOperation({ summary: 'Add a policy document (manual entry or upload)' })
  addDocument(@CurrentUser() user: JwtPayload, @Body() dto: AddDocumentDto) {
    return this.vaultService.addDocument(user.sub, dto)
  }

  @Get('documents')
  @ApiOperation({ summary: 'List all vault documents for current user' })
  getDocuments(@CurrentUser() user: JwtPayload) {
    return this.vaultService.getDocuments(user.sub)
  }

  @Get('summary')
  @ApiOperation({ summary: 'Vault summary — counts, total cover, expiry alerts' })
  getSummary(@CurrentUser() user: JwtPayload) {
    return this.vaultService.getSummary(user.sub)
  }

  @Patch('document/:docId')
  @ApiOperation({ summary: 'Update document details' })
  updateDocument(
    @CurrentUser() user: JwtPayload,
    @Param('docId') docId: string,
    @Body() dto: Partial<AddDocumentDto>,
  ) {
    return this.vaultService.updateDocument(user.sub, docId, dto)
  }

  @Delete('document/:docId')
  @ApiOperation({ summary: 'Delete a vault document' })
  deleteDocument(@CurrentUser() user: JwtPayload, @Param('docId') docId: string) {
    return this.vaultService.deleteDocument(user.sub, docId)
  }

  @Post('document/upload-url')
  @ApiOperation({ summary: 'Get S3 presigned upload URL (15-min expiry)' })
  getUploadUrl(@CurrentUser() user: JwtPayload) {
    return this.vaultService.getUploadUrl(user.sub)
  }

  @Post('document/confirm-upload')
  @ApiOperation({ summary: 'Confirm document uploaded to S3' })
  confirmUpload(@CurrentUser() user: JwtPayload, @Body() dto: ConfirmUploadDto) {
    return this.vaultService.confirmUpload(user.sub, dto.docId, dto.s3Key)
  }

  // ── Nominees ─────────────────────────────────────────────────

  @Post('nominee')
  @ApiOperation({ summary: 'Add a nominee — Aadhaar last 4 digits only (DPDP compliant)' })
  addNominee(@CurrentUser() user: JwtPayload, @Body() dto: AddNomineeDto) {
    return this.nomineeService.addNominee(user.sub, dto)
  }

  @Get('nominees')
  @ApiOperation({ summary: 'List all nominees' })
  getNominees(@CurrentUser() user: JwtPayload) {
    return this.nomineeService.getNominees(user.sub)
  }

  @Patch('nominee/:nomineeId')
  @ApiOperation({ summary: 'Update nominee details' })
  updateNominee(
    @CurrentUser() user: JwtPayload,
    @Param('nomineeId') nomineeId: string,
    @Body() dto: Partial<AddNomineeDto>,
  ) {
    return this.nomineeService.updateNominee(user.sub, nomineeId, dto)
  }

  @Delete('nominee/:nomineeId')
  @ApiOperation({ summary: 'Remove a nominee' })
  deleteNominee(@CurrentUser() user: JwtPayload, @Param('nomineeId') nomineeId: string) {
    return this.nomineeService.deleteNominee(user.sub, nomineeId)
  }

  // ── Unlock triggers ──────────────────────────────────────────

  @Post('unlock/trigger')
  @ApiOperation({ summary: 'Initiate vault unlock (death cert / emergency / deadman / trusted contact)' })
  initiateUnlock(@CurrentUser() user: JwtPayload, @Body() dto: InitiateUnlockDto) {
    return this.unlockService.initiateUnlock(user.sub, dto.triggerType)
  }

  @Get('unlock/status')
  @ApiOperation({ summary: 'Get current unlock trigger status' })
  getUnlockStatus(@CurrentUser() user: JwtPayload) {
    return this.unlockService.getUnlockStatus(user.sub)
  }

  @Get('nominee-view/:unlockToken')
  @ApiOperation({ summary: 'Nominee view — accessed via unlock token' })
  getNomineeView(@Param('unlockToken') token: string) {
    return this.unlockService.getNomineeView(token)
  }
}
