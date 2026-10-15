import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { VaultGuard } from '../../common/guards/vault.guard'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { VaultService } from './vault.service'
import { NomineeService } from './nominee.service'
import { UnlockService } from './unlock.service'
import {
  AddDocumentDto, UpdateDocumentDto, AddNomineeDto, UpdateNomineeDto,
  InitiateUnlockDto, UploadUrlDto, ConfirmUploadDto,
} from './vault.dto'

// Vault routes carry the most sensitive data, so they get a tighter per-IP
// budget than the global limit (PRD: 10 req/min). Read at module load so the
// decorator can use it; see VAULT_RATE_LIMIT_MAX in .env.example.
const VAULT_RATE_LIMIT_MAX = parseInt(process.env.VAULT_RATE_LIMIT_MAX ?? '10', 10)

@ApiTags('vault')
@ApiBearerAuth()
// @Public() opts this controller out of the *global* standard-JWT guard;
// VaultGuard then enforces the separate vault-scoped JWT on every route.
@Public()
@UseGuards(VaultGuard)
@Throttle({ default: { limit: VAULT_RATE_LIMIT_MAX, ttl: 60_000 } })
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
    @Param('docId', new ParseUUIDPipe()) docId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.vaultService.updateDocument(user.sub, docId, dto)
  }

  @Delete('document/:docId')
  @ApiOperation({ summary: 'Delete a vault document' })
  deleteDocument(@CurrentUser() user: JwtPayload, @Param('docId', new ParseUUIDPipe()) docId: string) {
    return this.vaultService.deleteDocument(user.sub, docId)
  }

  @Post('document/upload-url')
  @ApiOperation({ summary: 'Get Supabase Storage signed upload URL (15-min expiry)' })
  getUploadUrl(@CurrentUser() user: JwtPayload, @Body() dto: UploadUrlDto) {
    return this.vaultService.getUploadUrl(user.sub, dto?.docId)
  }

  @Post('document/confirm-upload')
  @ApiOperation({ summary: 'Confirm document uploaded to Supabase Storage' })
  confirmUpload(@CurrentUser() user: JwtPayload, @Body() dto: ConfirmUploadDto) {
    return this.vaultService.confirmUpload(user.sub, dto.docId, dto.s3Key)
  }

  @Get('document/:docId/download-url')
  @ApiOperation({ summary: 'Get a short-lived signed download URL for the uploaded vault document' })
  getDownloadUrl(@CurrentUser() user: JwtPayload, @Param('docId', new ParseUUIDPipe()) docId: string) {
    return this.vaultService.getDownloadUrl(user.sub, docId)
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
    @Param('nomineeId', new ParseUUIDPipe()) nomineeId: string,
    @Body() dto: UpdateNomineeDto,
  ) {
    return this.nomineeService.updateNominee(user.sub, nomineeId, dto)
  }

  @Delete('nominee/:nomineeId')
  @ApiOperation({ summary: 'Remove a nominee' })
  deleteNominee(@CurrentUser() user: JwtPayload, @Param('nomineeId', new ParseUUIDPipe()) nomineeId: string) {
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
  getNomineeView(@Param('unlockToken', new ParseUUIDPipe()) token: string) {
    return this.unlockService.getNomineeView(token)
  }
}
