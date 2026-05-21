import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface BrandTokens {
  primaryColor: string
  accentColor: string
  fontFamily: string
  logoUrl: string
  partnerName: string
}

const DEFAULT_BRAND: BrandTokens = {
  primaryColor: '#1B4332',
  accentColor: '#52B788',
  fontFamily: 'Inter, system-ui, sans-serif',
  logoUrl: '',
  partnerName: 'KIN',
}

const BrandContext = createContext<BrandTokens>(DEFAULT_BRAND)

interface BrandProviderProps {
  children: ReactNode
}

export function BrandProvider({ children }: BrandProviderProps) {
  const [brand, setBrand] = useState<BrandTokens>(DEFAULT_BRAND)

  useEffect(() => {
    // Read partner_id from URL params (set when embedded via iframe)
    const params = new URLSearchParams(window.location.search)
    const partnerId = params.get('partner_id')

    if (partnerId) {
      fetch(`/api/v1/partner/brand/${partnerId}`)
        .then((res) => res.json())
        .then((tokens: BrandTokens) => {
          setBrand(tokens)
        })
        .catch(() => {
          // Silently fall back to KIN default brand
        })
    }
  }, [])

  // Inject CSS variables whenever brand changes
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', brand.primaryColor)
    root.style.setProperty('--color-accent', brand.accentColor)
    root.style.setProperty('--font-family', brand.fontFamily)
    root.style.setProperty('--logo-url', brand.logoUrl ? `url(${brand.logoUrl})` : '')

    // Update theme-color meta for browser chrome
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) metaTheme.setAttribute('content', brand.primaryColor)
  }, [brand])

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
}

export function useBrand() {
  return useContext(BrandContext)
}
