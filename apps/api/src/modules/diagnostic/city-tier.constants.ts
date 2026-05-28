/**
 * City tier lookup. Hardcoded list per KIN Engineering Brief v1.4 §1.7.
 * DO NOT call OpenAI to determine tier - this is a deterministic map.
 *
 * Returned values use the canonical 'T1' | 'T2' | 'T3' casing that the
 * UserProfile entity expects. (The shared-types package uses lowercase
 * 't1' | 't2' | 't3' for the public API contract; the upper-case form
 * is the internal DB value.)
 */

export type InternalCityTier = 'T1' | 'T2' | 'T3'

export const CITY_TIER_MAP: Record<string, InternalCityTier> = {
  // T1
  mumbai: 'T1', delhi: 'T1', new_delhi: 'T1', bangalore: 'T1', bengaluru: 'T1',
  hyderabad: 'T1', chennai: 'T1', kolkata: 'T1', pune: 'T1',
  ahmedabad: 'T1', navi_mumbai: 'T1', gurgaon: 'T1', gurugram: 'T1', noida: 'T1',
  // T2
  jaipur: 'T2', lucknow: 'T2', kanpur: 'T2', nagpur: 'T2',
  indore: 'T2', bhopal: 'T2', patna: 'T2', agra: 'T2',
  vadodara: 'T2', surat: 'T2', coimbatore: 'T2', kochi: 'T2',
  visakhapatnam: 'T2', nashik: 'T2', rajkot: 'T2', chandigarh: 'T2',
  thiruvananthapuram: 'T2', vijayawada: 'T2', mysore: 'T2', mysuru: 'T2',
  ludhiana: 'T2', amritsar: 'T2', varanasi: 'T2', meerut: 'T2',
  faridabad: 'T2', ghaziabad: 'T2', thane: 'T2',
  // Everything else falls through to T3
}

export function getCityTier(city: string): InternalCityTier {
  if (!city) return 'T3'
  const normalised = city.trim().toLowerCase().replace(/\s+/g, '_')
  return CITY_TIER_MAP[normalised] ?? 'T3'
}
