/**
 * Regression tests for finding APP-1 (mass assignment on vault PATCH routes).
 * The global ValidationPipe runs class-validator with whitelist +
 * forbidNonWhitelisted; these tests prove the update DTOs reject identity and
 * storage columns and that the add DTOs still accept legitimate bodies.
 */
import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  AddDocumentDto, UpdateDocumentDto, AddNomineeDto, UpdateNomineeDto, ConfirmUploadDto, UploadUrlDto,
} from './vault.dto'

const PIPE_OPTIONS = { whitelist: true, forbidNonWhitelisted: true }

async function errorsFor<T extends object>(cls: new () => T, body: Record<string, unknown>) {
  const errors = await validate(plainToInstance(cls, body) as object, PIPE_OPTIONS)
  return errors.map(e => e.property)
}

describe('vault DTOs — identity and storage columns are not client-assignable', () => {
  it('UpdateDocumentDto rejects userId, docId and s3Key', async () => {
    const props = await errorsFor(UpdateDocumentDto, {
      insurerName: 'Demo Insurer',
      userId: '11111111-1111-4111-8111-111111111111',
      docId: '22222222-2222-4222-8222-222222222222',
      s3Key: 'vault/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222',
    })
    expect(props).toEqual(expect.arrayContaining(['userId', 'docId', 's3Key']))
    expect(props).not.toContain('insurerName')
  })

  it('UpdateDocumentDto accepts a legitimate partial update', async () => {
    expect(await errorsFor(UpdateDocumentDto, { insurerName: 'Demo Insurer', sumAssured: 5_000_000 })).toEqual([])
  })

  it('UpdateNomineeDto rejects userId and nomineeId', async () => {
    const props = await errorsFor(UpdateNomineeDto, { name: 'Priya Sharma', userId: 'x', nomineeId: 'y' })
    expect(props).toEqual(expect.arrayContaining(['userId', 'nomineeId']))
  })

  it('AddDocumentDto still requires a valid docType', async () => {
    expect(await errorsFor(AddDocumentDto, { docType: 'ulip' })).toContain('docType')
    expect(await errorsFor(AddDocumentDto, { docType: 'term_life', sumAssured: 1_000_000 })).toEqual([])
  })

  it('AddNomineeDto enforces aadhaarLast4 = exactly 4 digits and a 0–100 share', async () => {
    expect(await errorsFor(AddNomineeDto, { name: 'Priya Sharma', relationship: 'spouse', aadhaarLast4: '123456789012' }))
      .toContain('aadhaarLast4')
    expect(await errorsFor(AddNomineeDto, { name: 'Priya Sharma', relationship: 'spouse', sharePercentage: 150 }))
      .toContain('sharePercentage')
    expect(await errorsFor(AddNomineeDto, { name: 'Priya Sharma', relationship: 'spouse', aadhaarLast4: '1234', sharePercentage: 50 }))
      .toEqual([])
  })

  it('ConfirmUploadDto only accepts keys of the form vault/<uuid>/<uuid>', async () => {
    const good = {
      docId: '22222222-2222-4222-8222-222222222222',
      s3Key: 'vault/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222',
    }
    expect(await errorsFor(ConfirmUploadDto, good)).toEqual([])
    expect(await errorsFor(ConfirmUploadDto, { ...good, s3Key: '../../etc/passwd' })).toContain('s3Key')
    expect(await errorsFor(ConfirmUploadDto, { ...good, s3Key: 'vault/other-user/doc' })).toContain('s3Key')
  })

  it('UploadUrlDto rejects a non-UUID docId', async () => {
    expect(await errorsFor(UploadUrlDto, { docId: 'not-a-uuid' })).toContain('docId')
    expect(await errorsFor(UploadUrlDto, {})).toEqual([])
  })
})
