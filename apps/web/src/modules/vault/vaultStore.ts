/**
 * vaultStore.ts — Module 7: Protection Vault
 *
 * localStorage-based CRUD store for:
 *   - VaultDocument  (insurance policy metadata)
 *   - VaultNominee   (nominee contact details)
 *
 * DPDP Act 2023 compliance:
 *   - Only last 4 digits of Aadhaar stored (never full number)
 *   - No biometric or health data stored here
 *   - clearVault() allows full data erasure on user request
 *   - Data is device-local only in MVP — no backend sync yet
 *   - Backend sync will add encryption at rest (AES-256) in Phase 2
 *
 * Storage keys:
 *   kin_vault_documents   → VaultDocument[]
 *   kin_vault_nominees    → VaultNominee[]
 */

// ── Document types ─────────────────────────────────────────────
export type DocumentType =
  | 'term_life'
  | 'health'
  | 'personal_accident'
  | 'vehicle'
  | 'home_loan'
  | 'epfo_edli'
  | 'group_term'
  | 'other'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  term_life: 'Term Life Insurance',
  health: 'Health / Mediclaim',
  personal_accident: 'Personal Accident',
  vehicle: 'Vehicle Insurance',
  home_loan: 'Home Loan / MRTA',
  epfo_edli: 'EPFO / EDLI',
  group_term: 'Employer Group Term',
  other: 'Other',
}

export const DOCUMENT_TYPE_EMOJI: Record<DocumentType, string> = {
  term_life: '🛡️',
  health: '🏥',
  personal_accident: '🦺',
  vehicle: '🚗',
  home_loan: '🏠',
  epfo_edli: '🏛️',
  group_term: '🏢',
  other: '📄',
}

export type VaultDocument = {
  id: string
  type: DocumentType
  insurer: string
  policyNumber: string
  sumAssured: number          // in rupees
  annualPremium: number       // in rupees
  renewalDate: string         // ISO date string YYYY-MM-DD, '' if unknown
  nomineeId: string | null    // links to VaultNominee.id
  notes: string
  addedAt: string             // ISO timestamp
  fileName: string            // display name only — no actual file stored in MVP
}

// ── Nominee types ───────────────────────────────────────────────
export type Relationship =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'other'

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  spouse: 'Spouse',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other',
}

export type VaultNominee = {
  id: string
  name: string
  relationship: Relationship
  phone: string               // stored as-is for display; no validation beyond UI
  email: string
  aadhaarLast4: string        // DPDP: only last 4 digits of Aadhaar
  addedAt: string             // ISO timestamp
}

// ── Storage keys ────────────────────────────────────────────────
const DOCS_KEY = 'kin_vault_documents'
const NOMINEES_KEY = 'kin_vault_nominees'

// ── Helpers ─────────────────────────────────────────────────────
function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage quota exceeded — fail silently in MVP
  }
}

function uid(): string {
  return crypto.randomUUID()
}

// ── Document CRUD ───────────────────────────────────────────────
export function getDocuments(): VaultDocument[] {
  return load<VaultDocument>(DOCS_KEY)
}

export function addDocument(doc: Omit<VaultDocument, 'id' | 'addedAt'>): VaultDocument {
  const docs = getDocuments()
  const newDoc: VaultDocument = { ...doc, id: uid(), addedAt: new Date().toISOString() }
  save(DOCS_KEY, [...docs, newDoc])
  return newDoc
}

export function updateDocument(id: string, patch: Partial<VaultDocument>): void {
  const docs = getDocuments().map(d => d.id === id ? { ...d, ...patch } : d)
  save(DOCS_KEY, docs)
}

export function deleteDocument(id: string): void {
  save(DOCS_KEY, getDocuments().filter(d => d.id !== id))
}

// ── Nominee CRUD ─────────────────────────────────────────────────
export function getNominees(): VaultNominee[] {
  return load<VaultNominee>(NOMINEES_KEY)
}

export function addNominee(nominee: Omit<VaultNominee, 'id' | 'addedAt'>): VaultNominee {
  const nominees = getNominees()
  const newNominee: VaultNominee = { ...nominee, id: uid(), addedAt: new Date().toISOString() }
  save(NOMINEES_KEY, [...nominees, newNominee])
  return newNominee
}

export function updateNominee(id: string, patch: Partial<VaultNominee>): void {
  const nominees = getNominees().map(n => n.id === id ? { ...n, ...patch } : n)
  save(NOMINEES_KEY, nominees)
}

export function deleteNominee(id: string): void {
  // Also clear nominee references in documents
  const docs = getDocuments().map(d =>
    d.nomineeId === id ? { ...d, nomineeId: null } : d
  )
  save(DOCS_KEY, docs)
  save(NOMINEES_KEY, getNominees().filter(n => n.id !== id))
}

// ── Full vault wipe (DPDP right to erasure) ─────────────────────
export function clearVault(): void {
  localStorage.removeItem(DOCS_KEY)
  localStorage.removeItem(NOMINEES_KEY)
}

// ── Summary stats ───────────────────────────────────────────────
export type VaultSummary = {
  documentCount: number
  nomineeCount: number
  totalSumAssured: number
  expiringSoon: VaultDocument[]   // renewal within 60 days
}

export function getVaultSummary(): VaultSummary {
  const docs = getDocuments()
  const nominees = getNominees()
  const now = new Date()
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const expiringSoon = docs.filter(d => {
    if (!d.renewalDate) return false
    const renewal = new Date(d.renewalDate)
    return renewal >= now && renewal <= in60Days
  })

  return {
    documentCount: docs.length,
    nomineeCount: nominees.length,
    totalSumAssured: docs.reduce((sum, d) => sum + (d.sumAssured || 0), 0),
    expiringSoon,
  }
}
