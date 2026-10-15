import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { VaultService, pickUpdatableDocumentFields } from './vault.service'
import { NomineeService, pickUpdatableNomineeFields } from './nominee.service'

const OWNER = '11111111-1111-4111-8111-111111111111'
const ATTACKER = '99999999-9999-4999-8999-999999999999'

function fakeRepo<T extends object>(row: T | null) {
  return {
    findOne: jest.fn(async () => row),
    save: jest.fn(async (entity: T) => entity),
    remove: jest.fn(async (entity: T) => entity),
    find: jest.fn(async () => (row ? [row] : [])),
    create: jest.fn((v: Partial<T>) => v as T),
  }
}

describe('VaultService.updateDocument — defence in depth against mass assignment', () => {
  it('ignores userId / docId / s3Key even if they reach the service', async () => {
    const doc = { docId: 'doc-1', userId: OWNER, s3Key: `vault/${OWNER}/doc-1`, insurerName: 'Old' }
    const repo = fakeRepo(doc)
    const svc = new VaultService(repo as never)
    const saved = await svc.updateDocument(OWNER, 'doc-1', {
      insurerName: 'New',
      userId: ATTACKER,
      docId: 'doc-2',
      s3Key: `vault/${ATTACKER}/their-doc`,
    } as never)
    expect(repo.save).toHaveBeenCalledTimes(1)
    const persisted = repo.save.mock.calls[0][0] as typeof doc
    expect(persisted.insurerName).toBe('New')
    expect(persisted.userId).toBe(OWNER)
    expect(persisted.docId).toBe('doc-1')
    expect(persisted.s3Key).toBe(`vault/${OWNER}/doc-1`)
    // and the storage key is never returned to the client
    expect((saved as { s3Key?: string }).s3Key).toBeUndefined()
  })

  it('refuses to update a document owned by someone else', async () => {
    const svc = new VaultService(fakeRepo({ docId: 'doc-1', userId: OWNER }) as never)
    await expect(svc.updateDocument(ATTACKER, 'doc-1', { insurerName: 'x' })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('404s on an unknown document', async () => {
    const svc = new VaultService(fakeRepo(null) as never)
    await expect(svc.updateDocument(OWNER, 'nope', {})).rejects.toBeInstanceOf(NotFoundException)
  })

  it('confirmUpload rejects a storage key outside the caller namespace', async () => {
    const svc = new VaultService(fakeRepo({ docId: 'doc-1', userId: OWNER }) as never)
    await expect(svc.confirmUpload(OWNER, 'doc-1', `vault/${ATTACKER}/doc-1`)).rejects.toBeInstanceOf(ForbiddenException)
  })
})

describe('NomineeService.updateNominee', () => {
  it('ignores userId / nomineeId and drops a malformed aadhaarLast4', async () => {
    const nominee = { nomineeId: 'n-1', userId: OWNER, name: 'Old', aadhaarLast4: '1234' }
    const repo = fakeRepo(nominee)
    const svc = new NomineeService(repo as never)
    await svc.updateNominee(OWNER, 'n-1', { name: 'New', userId: ATTACKER, nomineeId: 'n-2', aadhaarLast4: '123456789012' } as never)
    const persisted = repo.save.mock.calls[0][0] as typeof nominee
    expect(persisted.name).toBe('New')
    expect(persisted.userId).toBe(OWNER)
    expect(persisted.nomineeId).toBe('n-1')
    expect(persisted.aadhaarLast4).toBeUndefined()
  })
})

describe('field whitelists', () => {
  it('pickUpdatableDocumentFields drops everything outside the allow-list', () => {
    expect(pickUpdatableDocumentFields({ notes: 'n', s3Key: 'x', userId: 'y', __proto__: {} } as never)).toEqual({ notes: 'n' })
  })
  it('pickUpdatableNomineeFields drops everything outside the allow-list', () => {
    expect(pickUpdatableNomineeFields({ email: 'priya@example.com', userId: 'y' } as never)).toEqual({ email: 'priya@example.com' })
  })
})
