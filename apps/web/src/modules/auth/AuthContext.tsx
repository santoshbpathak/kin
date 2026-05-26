import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { setJwt } from '../../lib/apiClient'

export type AuthMethod = 'anonymous' | 'whatsapp' | 'google' | 'employer_sso'

export interface ConsentState {
  diagnosticData: boolean   // income range, dependants, life stage
  locationData: boolean     // city tier for peer benchmarks
  contactData: boolean      // WhatsApp/phone for nudges and OTP
}

export interface Session {
  sessionToken: string      // UUID — no PII until consented
  token?: string            // JWT for Authorization: Bearer when calling backend
  authMethod: AuthMethod
  consentedPii: boolean     // false until Step 9 purchase
  consent: ConsentState
  phoneNumber?: string      // only stored after WhatsApp OTP verified
}

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
  error: string | null
  startAnonymousSession: (consent: ConsentState) => Promise<void>
  startWhatsAppOtp: (phone: string) => Promise<void>
  verifyWhatsAppOtp: (otp: string) => Promise<void>
  startGoogleAuth: () => Promise<void>
  clearError: () => void
  /** Pending phone number waiting for OTP verification */
  pendingPhone: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

function generateSessionToken(): string {
  return crypto.randomUUID()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingPhone, setPendingPhone] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const startAnonymousSession = useCallback(async (consent: ConsentState) => {
    setIsLoading(true)
    setError(null)
    try {
      // Call backend to register an anonymous session
      // Falls back to local UUID if API not yet live (MVP dev mode)
      let sessionToken: string
      let jwt: string | undefined
      try {
        const res = await fetch('/api/v1/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consent }),
        })
        if (res.ok) {
          const data = await res.json()
          sessionToken = data.sessionToken
          jwt = data.token
        } else {
          sessionToken = generateSessionToken()
        }
      } catch {
        // API not available yet — use local token for dev
        sessionToken = generateSessionToken()
      }

      setSession({
        sessionToken,
        token: jwt,
        authMethod: 'anonymous',
        consentedPii: false,
        consent,
      })
      setJwt(jwt ?? null)
    } catch (err) {
      setError('Failed to start session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const startWhatsAppOtp = useCallback(async (phone: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/auth/whatsapp/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok && res.status !== 404) {
        throw new Error('Failed to send OTP')
      }
      setPendingPhone(phone)
    } catch {
      // API not live yet — simulate OTP sent for dev
      setPendingPhone(phone)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyWhatsAppOtp = useCallback(async (otp: string) => {
    if (!pendingPhone) return
    setIsLoading(true)
    setError(null)
    try {
      let sessionToken: string
      let jwt: string | undefined
      try {
        // Pass the anonymous session token (if any) so the backend upgrades it
        // in place rather than creating a duplicate user row.
        const existingSession = session?.sessionToken
        const res = await fetch('/api/v1/auth/whatsapp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: pendingPhone, otp, sessionToken: existingSession }),
        })
        if (res.ok) {
          const data = await res.json()
          sessionToken = data.sessionToken
          jwt = data.token
        } else if (res.status === 401) {
          setError('Incorrect OTP. Please try again.')
          setIsLoading(false)
          return
        } else {
          // Dev mode: accept any 6-digit OTP
          if (otp.length === 6) {
            sessionToken = generateSessionToken()
          } else {
            setError('Incorrect OTP. Please try again.')
            setIsLoading(false)
            return
          }
        }
      } catch {
        // Dev fallback
        sessionToken = generateSessionToken()
      }

      setSession({
        sessionToken,
        token: jwt,
        authMethod: 'whatsapp',
        consentedPii: false,
        consent: { diagnosticData: true, locationData: true, contactData: true },
        phoneNumber: pendingPhone,
      })
      setJwt(jwt ?? null)
      setPendingPhone(null)
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [pendingPhone, session])

  const startGoogleAuth = useCallback(async () => {
    // Redirect to Google OAuth — backend handles callback
    window.location.href = '/api/v1/auth/google'
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        error,
        pendingPhone,
        startAnonymousSession,
        startWhatsAppOtp,
        verifyWhatsAppOtp,
        startGoogleAuth,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
