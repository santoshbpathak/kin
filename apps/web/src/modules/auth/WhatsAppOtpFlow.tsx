import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Button, NavHeader, PrivacyLine } from '@/components/ui'
import { IconChat, IconMobile } from '@/components/ui/icons'

interface WhatsAppOtpFlowProps {
  onBack: () => void
}

export function WhatsAppOtpFlow({ onBack }: WhatsAppOtpFlowProps) {
  const { pendingPhone, isLoading, error, startWhatsAppOtp, verifyWhatsAppOtp, clearError } = useAuth()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (pendingPhone) {
      // Focus first OTP box when OTP screen appears
      otpRefs.current[0]?.focus()
    }
  }, [pendingPhone])

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return
    await startWhatsAppOtp('+91' + digits.slice(-10))
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    otpRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    await verifyWhatsAppOtp(otp.join(''))
  }

  // -- OTP verification screen ----------------------------------------------
  if (pendingPhone) {
    return (
      <div className="flex flex-col">
        <NavHeader title="Verify code" onBack={onBack} />

        <div className="px-6 py-8 flex flex-col">
          <IconChat size={32} className="text-navy mb-3" />
          <h2 className="t-h2 text-navy mb-1">Check WhatsApp</h2>
          <p className="t-body-sm text-muted mb-8">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate">{pendingPhone}</span>
          </p>

          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6">
            {/* OTP boxes */}
            <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={[
                    'w-12 h-14 text-center text-xl font-bold rounded-md border-[1.5px] outline-none transition-colors bg-surface',
                    digit && !error
                      ? 'border-teal text-navy'
                      : error
                        ? 'border-coral'
                        : 'border-hairline-strong text-navy',
                    'focus:border-teal',
                  ].join(' ')}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            {error && <p className="t-body-sm text-coral -mt-2">{error}</p>}

            <Button
              type="submit"
              fullWidth
              disabled={otp.join('').length < 6 || isLoading}
            >
              {isLoading ? 'Verifying…' : 'Verify Code'}
            </Button>

            <button
              type="button"
              onClick={() => startWhatsAppOtp(pendingPhone)}
              disabled={isLoading}
              className="t-body-sm text-teal-deep underline text-center disabled:opacity-40"
            >
              Resend code
            </button>
          </form>

          <PrivacyLine className="mt-8">
            Your number is never shared with third parties
          </PrivacyLine>
        </div>
      </div>
    )
  }

  // -- Phone number entry screen --------------------------------------------
  return (
    <div className="flex flex-col">
      <NavHeader title="Sign in" onBack={onBack} />

      <div className="px-6 py-8 flex flex-col">
        <IconMobile size={32} className="text-navy mb-3" />
        <h2 className="t-h2 text-navy mb-1">Your WhatsApp number</h2>
        <p className="t-body-sm text-muted mb-8">
          We'll send a one-time code to verify. Your number is never shared with the host app.
        </p>

        <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
          <div
            className="flex rounded-md border-[1.5px] border-hairline-strong overflow-hidden focus-within:border-teal transition-colors bg-surface"
          >
            <div className="flex items-center px-3 bg-sand-deep border-r border-hairline t-body-sm text-slate font-semibold shrink-0">
              🇮🇳 +91
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="flex-1 px-3 py-3.5 t-body text-navy outline-none bg-transparent placeholder:text-muted"
              autoFocus
              autoComplete="tel-national"
            />
          </div>

          {error && <p className="t-body-sm text-coral">{error}</p>}

          <Button
            type="submit"
            fullWidth
            disabled={phone.replace(/\D/g, '').length < 10 || isLoading}
          >
            {isLoading ? 'Sending…' : 'Send Code via WhatsApp'}
          </Button>
        </form>

        <PrivacyLine className="mt-8">
          Your number is never shared with third parties
        </PrivacyLine>
      </div>
    </div>
  )
}
